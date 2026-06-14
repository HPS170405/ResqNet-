import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';
import { sendEmail } from '../config/email.js';

const router = express.Router();

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'resqnet_jwt_secret_token_key_123', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role, skills, coordinates } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const loc = coordinates && coordinates.length === 2 
      ? { type: 'Point', coordinates: [coordinates[0], coordinates[1]] } 
      : { type: 'Point', coordinates: [0, 0] };

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'volunteer',
      skills: skills || [],
      location: loc,
      status: 'offline',
    });

    if (user) {
      await AuditLog.create({
        action: 'USER_REGISTERED',
        performedBy: user._id,
        details: { name: user.name, email: user.email, role: user.role },
      });

      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.isFirstLogin) {
        user.isFirstLogin = false;
        sendEmail({
          to: user.email,
          subject: 'Welcome to ResqNet Disaster Relief Operations!',
          text: `Hi ${user.name},\n\nWelcome to ResqNet! Thank you for joining our disaster response network as a ${user.role}. Your account has been successfully configured.\n\nBest regards,\nThe ResqNet Command Team`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #ea580c;">Welcome to ResqNet, ${user.name}!</h2>
            <p>Thank you for joining our disaster relief coordination platform. You have logged in for the very first time as a <strong>${user.role}</strong>.</p>
            <p>We are excited to work together to deploy real-time AI agents, track rescue routes, and coordinate supply logistics to save lives.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">This email was sent automatically by the ResqNet Platform. Please do not reply directly.</p>
          </div>`
        }).catch(err => console.error('Error sending welcome email on first login:', err.message));
      }

      user.status = 'active';
      await user.save();

      await AuditLog.create({
        action: 'USER_LOGIN',
        performedBy: user._id,
        details: { email: user.email, role: user.role },
      });

      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        location: user.location,
        status: user.status,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @desc    Update volunteer / responder coordinates
// @route   PUT /api/auth/location
// @access  Private
router.put('/location', protect, async (req, res) => {
  const { longitude, latitude, status } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (longitude !== undefined && latitude !== undefined) {
      user.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    if (status) {
      user.status = status;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Location updated successfully',
      location: user.location,
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
