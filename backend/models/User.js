const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:                  { type: String, required: true },
  email:                 { type: String, required: true, unique: true },
  password:              { type: String, required: true },
  googleId:              { type: String, default: null },
  avatar:                { type: String, default: null },
  authType:              { type: String, enum: ['local', 'google'], default: 'local' },

  // Email verification
  isVerified:            { type: Boolean, default: false },
  verificationToken:     { type: String, default: null },
  verificationExpires:   { type: Date, default: null },

  // Password reset
  resetPasswordToken:    { type: String, default: null },
  resetPasswordExpires:  { type: Date, default: null },

  createdAt:             { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);