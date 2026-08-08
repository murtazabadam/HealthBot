const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:                { type: String, required: true },
  email:               { type: String, required: true, unique: true },
  password:            { type: String, default: null },
  googleId:            { type: String, default: null },
  avatar:              { type: String, default: null },
  authType:            { type: String, enum: ['local', 'google'], default: 'local' },

  // Health profile
  age:                 { type: String, default: '' },
  gender:              { type: String, default: '' },
  bloodGroup:          { type: String, default: '' },
  address:             { type: String, default: '' },
  phoneNumber:         { type: String, default: '' },

  // Emergency contact (added to Profile rather than registration, so signup stays short)
  emergencyContactName:  { type: String, default: '' },
  emergencyContactPhone: { type: String, default: '' },
  emergencyContactEmail: { type: String, default: '' },

  // Verification
  isVerified:          { type: Boolean, default: false },
  verificationOTP:     { type: String,  default: null },
  verificationExpires: { type: Date,    default: null },

  // Password reset
  resetOTP:            { type: String,  default: null },
  resetOTPExpires:     { type: Date,    default: null },

  createdAt:           { type: Date,    default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);