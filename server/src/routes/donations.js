import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Donation from '../models/Donation.js';
import AuditLog from '../models/AuditLog.js';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import { sendEmail } from '../config/email.js';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id_123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key_123',
});

// Helper to notify Socket.IO
let ioInstance;
export const setDonationIoInstance = (io) => {
  ioInstance = io;
};

// @desc    Get total donations raised per campaign
// @route   GET /api/donations/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await Donation.aggregate([
      { $match: { paymentStatus: 'succeeded' } },
      {
        $group: {
          _id: '$campaignId',
          totalAmount: { $sum: '$amount' },
          donorsCount: { $sum: 1 },
        },
      },
    ]);

    // Format output
    const campaignStats = {};
    stats.forEach(item => {
      campaignStats[item._id] = {
        raised: item.totalAmount / 100, // convert back from paisa
        donors: item.donorsCount
      };
    });

    res.json({ success: true, stats: campaignStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create Razorpay Order
// @route   POST /api/donations/create-checkout-session
// @access  Private
router.post('/create-checkout-session', protect, async (req, res) => {
  const { amount, campaignId, donorName } = req.body; // Amount in INR (e.g. 500)

  if (!amount || !campaignId) {
    return res.status(400).json({ success: false, message: 'Please provide amount and campaignId' });
  }

  const amountInPaisa = Math.round(amount * 100);

  try {
    const options = {
      amount: amountInPaisa,
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(2, 15),
      notes: {
        donorName: donorName || 'Anonymous',
        campaignId,
      }
    };

    // Create Razorpay Order
    const order = await razorpay.orders.create(options);

    // Save pending donation to database
    await Donation.create({
      donorName: donorName || 'Anonymous',
      amount: amountInPaisa,
      currency: 'INR',
      campaignId,
      paymentStatus: 'pending',
      stripeSessionId: order.id, // storing Razorpay order id in this field
    });

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/donations/verify
// @access  Public
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = req.body;

  try {
    // Generate signature payload
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key_123')
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature verification' });
    }

    // Find pending donation and update status
    const donation = await Donation.findOne({ stripeSessionId: razorpay_order_id });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Order ID not found in database' });
    }

    if (donation.paymentStatus !== 'succeeded') {
      donation.paymentStatus = 'succeeded';
      await donation.save();

      await AuditLog.create({
        action: 'DONATION_SUCCESS',
        details: {
          donorName: donation.donorName,
          amount: donation.amount,
          campaignId: donation.campaignId,
          stripeSessionId: donation.stripeSessionId
        }
      });

      // Emit socket event to update dashboards in real-time
      if (ioInstance) {
        ioInstance.emit('donation-received', {
          donorName: donation.donorName,
          amount: donation.amount / 100,
          campaignId: donation.campaignId,
        });
      }

      // Send email receipt directly
      sendEmail({
        to: email || 'donor@example.com',
        subject: `Thank you for your donation to ${donation.campaignId.replace(/_/g, ' ').toUpperCase()}!`,
        text: `Hi ${donation.donorName},\n\nThank you for your generous contribution of ₹${donation.amount / 100} to our relief efforts.\n\nYour contribution will make a significant impact on our operations.\n\nTransaction ID: ${razorpay_payment_id || 'MOCK_TXN_ID'}\n\nWarm regards,\nThe ResqNet Command Team`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #22c55e;">Donation Receipt Confirmation</h2>
          <p>Hi <strong>${donation.donorName}</strong>,</p>
          <p>Thank you for your generous contribution of <strong>₹${donation.amount / 100}</strong> to support our <strong>${donation.campaignId.replace(/_/g, ' ').toUpperCase()}</strong> campaign.</p>
          <p>Your support directly enables rescue operations, provides supply kits, and supports emergency dispatch efforts.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <div style="font-size: 13px; color: #475569; margin-bottom: 5px;">Transaction Reference:</div>
            <div style="font-family: monospace; font-weight: 700; color: #1e293b;">${razorpay_payment_id || 'MOCK_TXN_ID'}</div>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This email was sent automatically by the ResqNet Platform. Thank you for your support.</p>
        </div>`
      }).catch(err => console.error('Error sending donation thank you email:', err.message));

      // Trigger n8n webhook to send email receipt
      const n8nReceiptUrl = process.env.N8N_RECEIPT_WEBHOOK_URL || 'http://localhost:5678/webhook-test/donation-receipt';
      axios.post(n8nReceiptUrl, {
        donorName: donation.donorName,
        email: email || 'donor@example.com',
        amount: donation.amount / 100,
        campaignId: donation.campaignId,
        transactionId: razorpay_payment_id,
        timestamp: new Date()
      }).catch(err => console.warn('n8n donation webhook failed:', err.message));
    }

    res.json({ success: true, message: 'Payment verified successfully', donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Mock Checkout Success trigger (for fallback dev tests)
// @route   POST /api/donations/mock-success
// @access  Public
router.post('/mock-success', async (req, res) => {
  const { sessionId } = req.body;
  try {
    const donation = await Donation.findOne({ stripeSessionId: sessionId });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Session ID not found' });
    }

    if (donation.paymentStatus !== 'succeeded') {
      donation.paymentStatus = 'succeeded';
      await donation.save();

      // Emit socket event
      if (ioInstance) {
        ioInstance.emit('donation-received', {
          donorName: donation.donorName,
          amount: donation.amount / 100,
          campaignId: donation.campaignId,
        });
      }

      // Send email receipt directly
      sendEmail({
        to: req.body.email || 'donor@example.com',
        subject: `Thank you for your donation to ${donation.campaignId.replace(/_/g, ' ').toUpperCase()}!`,
        text: `Hi ${donation.donorName},\n\nThank you for your generous contribution of ₹${donation.amount / 100} to our relief efforts.\n\nYour contribution will make a significant impact on our operations.\n\nTransaction ID: ${donation.stripeSessionId || 'MOCK_TXN_ID'}\n\nWarm regards,\nThe ResqNet Command Team`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #22c55e;">Donation Receipt Confirmation</h2>
          <p>Hi <strong>${donation.donorName}</strong>,</p>
          <p>Thank you for your generous contribution of <strong>₹${donation.amount / 100}</strong> to support our <strong>${donation.campaignId.replace(/_/g, ' ').toUpperCase()}</strong> campaign.</p>
          <p>Your support directly enables rescue operations, provides supply kits, and supports emergency dispatch efforts.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <div style="font-size: 13px; color: #475569; margin-bottom: 5px;">Transaction Reference:</div>
            <div style="font-family: monospace; font-weight: 700; color: #1e293b;">${donation.stripeSessionId || 'MOCK_TXN_ID'}</div>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This email was sent automatically by the ResqNet Platform. Thank you for your support.</p>
        </div>`
      }).catch(err => console.error('Error sending donation thank you email:', err.message));

      // Trigger n8n
      const n8nReceiptUrl = process.env.N8N_RECEIPT_WEBHOOK_URL || 'http://localhost:5678/webhook-test/donation-receipt';
      axios.post(n8nReceiptUrl, {
        donorName: donation.donorName,
        email: req.body.email || 'donor@example.com',
        amount: donation.amount / 100,
        campaignId: donation.campaignId,
        transactionId: donation.stripeSessionId,
        timestamp: new Date()
      }).catch(err => console.warn('n8n webhook failed:', err.message));
    }

    res.json({ success: true, message: 'Mock success logged', donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
