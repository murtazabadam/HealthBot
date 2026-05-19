const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:                 { type: String, required: true },
  email:                { type: String, required: true, unique: true },
  password:             { type: String, required: false },
  googleId:             { type: String, default: null },
  avatar:               { type: String, default: null },
  authType:             { type: String, enum: ['local', 'google'], default: 'local' },

  // Profile fields
  age:                  { type: String, default: "" },
  gender:               { type: String, default: "" },
  bloodGroup:           { type: String, default: "" },
  address:              { type: String, default: "" },
  phoneNumber:          { type: String, default: "" },

  // Verification fields
  isVerified:           { type: Boolean, default: false },
  verificationOTP:      { type: String, default: null },
  verificationExpires:  { type: Date, default: null },

  // Password reset fields
  resetOTP:             { type: String, default: null },
  resetOTPExpires:      { type: Date, default: null },

  createdAt:            { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);