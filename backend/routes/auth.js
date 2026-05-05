const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOTPEmail } = require('../config/emailService');
const passport = require('passport');
require('../config/passport');

//temporary section
router.get('/test-email', async (req, res) => {
  try {
    const { sendOTPEmail } = require('../config/emailService');
    await sendOTPEmail(
      process.env.EMAIL_USER,
      'Test',
      '123456',
      'verification'
    );
    res.json({ message: 'Test email sent successfully!' });
  } catch (err) {
    res.json({ message: 'Email failed', error: err.message });
  }
});
//end of temporary section

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── SEND OTP (for registration) ───────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
  const email = req.body.email?.trim().toLowerCase();
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

// ── VERIFY REGISTRATION OTP ────────────────────────────────────────────────────
router.post('/verify-registration-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const safeEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: safeEmail });

    if (!user) {
      return res.status(400).json({ message: 'Please request an OTP first' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified. Please login.' });
    }

    if (!user.verificationOTP) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    if (user.verificationOTP !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    if (user.verificationExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Mark OTP as verified but don't complete registration yet
    // Just confirm OTP is valid — registration happens on form submit
    res.json({ message: 'OTP verified successfully!', verified: true });

  } catch (err) {
    console.error('Verify registration OTP error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
  name, password, otp,
  age, gender, bloodGroup, address, phoneNumber
} = req.body;
const email = req.body.email?.trim().toLowerCase();

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
const authMiddleware = require('../middleware/auth');

// ── GET PROFILE ────────────────────────────────────────────────────────────────
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -verificationOTP -resetOTP');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── UPDATE PROFILE ─────────────────────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, age, gender, bloodGroup, address, phoneNumber } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (age !== undefined) user.age = age;
    if (gender) user.gender = gender;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (address !== undefined) user.address = address;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    await user.save();

    // Update localStorage user data
    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    };

    res.json({
      message: 'Profile updated successfully!',
      user: updatedUser,
      profile: {
        name: user.name, email: user.email,
        age: user.age, gender: user.gender,
        bloodGroup: user.bloodGroup, address: user.address,
        phoneNumber: user.phoneNumber, avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────────
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;