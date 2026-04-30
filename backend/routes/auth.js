const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOTPEmail } = require('../config/emailService');
const passport = require('passport');
require('../config/passport');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── SEND OTP (for registration) ───────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Check if already registered and verified
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser) {
      // Update existing unverified user OTP
      existingUser.verificationOTP = otp;
      existingUser.verificationExpires = expires;
      await existingUser.save();
    } else {
      // Store OTP temporarily — will create full user on register
      // Use a temp placeholder user or just send email
      // We store it in a pending user record
      await User.findOneAndUpdate(
        { email },
        {
          email,
          name: 'pending',
          password: 'pending',
          verificationOTP: otp,
          verificationExpires: expires,
          isVerified: false
        },
        { upsert: true, new: true }
      );
    }

    await sendOTPEmail(email, '', otp, 'verification');
    res.json({ message: 'OTP sent successfully! Check your email.' });

  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, otp,
      age, gender, bloodGroup, address, phoneNumber
    } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Name, email, password and OTP are required' });
    }

    // Find user with matching OTP
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Please request an OTP first' });
    }

    // Verify OTP
    if (user.verificationOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    if (user.verificationExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user with full details
    user.name = name;
    user.password = hashedPassword;
    user.age = age || null;
    user.gender = gender || null;
    user.bloodGroup = bloodGroup || null;
    user.address = address || null;
    user.phoneNumber = phoneNumber || null;
    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── LOGIN ──────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check if verified
    if (!user.isVerified) {
      return res.status(401).json({
        message: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── FORGOT PASSWORD — SEND OTP ─────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isVerified: true });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If this email is registered, an OTP has been sent.' });
    }

    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendOTPEmail(email, user.name, otp, 'reset');
    res.json({ message: 'OTP sent to your email successfully.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── VERIFY RESET OTP ───────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (user.resetOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    if (user.resetOTPExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Generate a temp token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetOTP = null;
    user.resetOTPExpires = null;
    // Reuse resetOTP field to store reset token temporarily
    user.resetOTP = resetToken;
    user.resetOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min to set new password
    await user.save();

    res.json({ message: 'OTP verified!', resetToken });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── RESET PASSWORD ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (user.resetOTP !== resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (user.resetOTPExpires < new Date()) {
      return res.status(400).json({ message: 'Reset session expired. Please start again.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now login.' });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── RESEND OTP ─────────────────────────────────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

    const otp = generateOTP();
    user.verificationOTP = otp;
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, user.name, otp, 'verification');
    res.json({ message: 'OTP resent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GOOGLE OAUTH ───────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  async (req, res) => {
    try {
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const user = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      };
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`
      );
    } catch (err) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

module.exports = router;