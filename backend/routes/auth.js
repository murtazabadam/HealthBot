const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const User     = require('../models/User');
const Conversation = require('../models/Conversation');
const auth     = require('../middleware/auth');
const { sendOTPEmail } = require('../config/emailService');

// ── Helpers ────────────────────────────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
function userResponse(user) {
  return {
    id:          user._id,
    name:        user.name,
    email:       user.email,
    avatar:      user.avatar,
    authType:    user.authType,
    age:         user.age         || '',
    gender:      user.gender      || '',
    bloodGroup:  user.bloodGroup  || '',
    address:     user.address     || '',
    phoneNumber: user.phoneNumber || '',
    isVerified:  user.isVerified,
    createdAt:   user.createdAt
  };
}

// ── Send OTP ───────────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const name  = req.body.name?.trim() || 'User';
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existing = await User.findOne({ email, isVerified: true });
    if (existing)
      return res.status(400).json({ message: 'Email already registered. Please login.' });

    const otp     = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    let user = await User.findOne({ email });
    if (!user) user = new User({ name, email });
    user.verificationOTP     = otp;
    user.verificationExpires = expires;
    await user.save();

    const sent = await sendOTPEmail(email, name, otp, 'verification');
    if (!sent) return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    res.json({ message: 'OTP sent successfully. Check your email.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Verify Registration OTP ────────────────────────────────────────────────────
router.post('/verify-registration-otp', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp   = req.body.otp?.trim();
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Please request an OTP first' });
    if (user.verificationOTP !== otp)
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    if (user.verificationExpires < new Date())
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });

    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Register ───────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      name, email: rawEmail, password, otp,
      age, gender, bloodGroup, address, phoneNumber
    } = req.body;
    const email = rawEmail?.trim().toLowerCase();

    if (!name || !email || !password || !otp)
      return res.status(400).json({ message: 'Name, email, password and OTP are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Please request an OTP first' });
    if (user.verificationOTP !== otp.trim())
      return res.status(400).json({ message: 'Invalid OTP' });
    if (user.verificationExpires < new Date())
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });

    const salt           = await bcrypt.genSalt(10);
    user.name            = name;
    user.password        = await bcrypt.hash(password, salt);
    user.age             = age         || '';
    user.gender          = gender      || '';
    user.bloodGroup      = bloodGroup  || '';
    user.address         = address     || '';
    user.phoneNumber     = phoneNumber || '';
    user.isVerified      = true;
    user.verificationOTP = null;
    user.verificationExpires = null;
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ token, user: userResponse(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Login ──────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const email    = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    if (!user.isVerified) {
      return res.status(400).json({
        message:              'Email not verified. Please verify your email first.',
        requiresVerification: true,
        email:                user.email
      });
    }

    if (user.authType === 'google' && !user.password) {
      return res.status(400).json({
        message:         'This account uses Google Sign-In. Please click "Continue with Google".',
        isGoogleAccount: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);
    res.json({ token, user: userResponse(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Forgot Password ────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email, isVerified: true });
    if (!user)
      return res.status(400).json({ message: 'No verified account found with this email' });

    if (user.authType === 'google' && !user.password) {
      return res.status(400).json({
        message:         'This account uses Google Sign-In. Please use "Continue with Google" to login.',
        isGoogleAccount: true
      });
    }

    const otp = generateOTP();
    user.resetOTP        = otp;
    user.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const sent = await sendOTPEmail(email, user.name, otp, 'reset');
    if (!sent) return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    res.json({ message: 'Reset OTP sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Verify Reset OTP ───────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp   = req.body.otp?.trim();
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user || user.resetOTP !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });
    if (user.resetOTPExpires < new Date())
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ message: 'OTP verified', resetToken, email });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Reset Password ─────────────────────────────────────────────────────────────
// Flow 1: { resetToken, newPassword }
// Flow 2: { email, otp, newPassword }
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, email, otp } = req.body;

    if (!newPassword)
      return res.status(400).json({ message: 'New password is required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    let user = null;

    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        user = await User.findById(decoded.id);
        if (!user) return res.status(400).json({ message: 'User not found' });
      } catch {
        return res.status(400).json({ message: 'Reset token expired. Please request a new OTP.' });
      }
    } else if (email && otp) {
      const cleanEmail = email.trim().toLowerCase();
      user = await User.findOne({ email: cleanEmail });
      if (!user || user.resetOTP !== otp.trim())
        return res.status(400).json({ message: 'Invalid OTP or email' });
      if (user.resetOTPExpires < new Date())
        return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    } else {
      return res.status(400).json({
        message: 'Provide either resetToken or email+OTP along with newPassword'
      });
    }

    const salt    = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Get Profile ────────────────────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      '-password -verificationOTP -verificationExpires -resetOTP -resetOTPExpires'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(userResponse(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Update Profile ─────────────────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, age, gender, bloodGroup, address, phoneNumber } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name)              user.name        = name;
    if (age         !== undefined) user.age         = age;
    if (gender      !== undefined) user.gender      = gender;
    if (bloodGroup  !== undefined) user.bloodGroup  = bloodGroup;
    if (address     !== undefined) user.address     = address;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    await user.save();

    res.json({ message: 'Profile updated successfully!', user: userResponse(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Change Password ────────────────────────────────────────────────────────────
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.authType === 'google' && !user.password) {
      return res.status(400).json({
        message:         'Google account has no password. Use Set Password instead.',
        isGoogleAccount: true
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const salt    = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Set Password for Google OAuth users ───────────────────────────────────────
router.post('/set-password', auth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const salt    = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: 'Password set! You can now also login with email and password.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Resend Verification OTP ────────────────────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const user  = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'No account found with this email' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

    const otp = generateOTP();
    user.verificationOTP     = otp;
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const sent = await sendOTPEmail(email, user.name, otp, 'verification');
    if (!sent) return res.status(500).json({ message: 'Failed to send OTP' });
    res.json({ message: 'OTP resent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Delete Account ─────────────────────────────────────────────────────────────
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    await Conversation.findOneAndDelete({ userId });
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Account and all chat history deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Google OAuth ───────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      session:         false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`
    })(req, res, next);
  },
  (req, res) => {
    try {
      if (!req.user)
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
      const token       = generateToken(req.user._id);
      const frontendUrl = process.env.FRONTEND_URL || 'https://healthbotsc.vercel.app';
      const userData    = encodeURIComponent(JSON.stringify(userResponse(req.user)));
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userData}`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);

// ── Test Routes (remove before final submission) ───────────────────────────────
router.get('/test-groq', async (req, res) => {
  try {
    const { getGeminiResponse } = require('../config/gemini');
    const reply = await getGeminiResponse(
      'I have fever and headache',
      'Top prediction: Common Cold (45%). Severity: Mild.',
      'TestUser', []
    );
    res.json({ working: !!reply, response: reply || 'null — check GROQ_API_KEY' });
  } catch (err) {
    res.json({ working: false, error: err.message });
  }
});

router.get('/test-email', async (req, res) => {
  const { sendOTPEmail } = require('../config/emailService');
  const sent = await sendOTPEmail(
    process.env.EMAIL_FROM, 'Test', '123456', 'verification'
  );
  res.json({ sent, emailFrom: process.env.EMAIL_FROM || 'NOT SET' });
});

module.exports = router;