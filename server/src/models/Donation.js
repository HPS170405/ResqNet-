import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    default: 'Anonymous',
  },
  amount: {
    type: Number, // Amount in minor units (e.g. cents, paisa)
    required: true,
  },
  currency: {
    type: String,
    default: 'usd',
  },
  campaignId: {
    type: String, // e.g., 'flood_relief_2026', 'medical_supplies_camp'
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending',
  },
  stripeSessionId: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
