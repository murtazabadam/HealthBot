const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:                 { type: String, required: true },
  email:                { type: String, required: true, unique: true },
  password:             { type: String, required: true },
  googleId:             { type: String, default: null },
  avatar:               { type: String, default: null },
  authType:             { type: String, enum: ['local', 'google'], default: 'local' },
  age:                  { type: String, default: null },
  gender:               { type: String, default: null },
  bloodGroup:           { type: String, default: null },
  address:              { type: String, default: null },
  phoneNumber:          { type: String, default: null },

  // Email verification
  isVerified:           { type: Boolean, default: false },
  verificationOTP:      { type: String, default: null },
  verificationExpires:  { type: Date, default: null },

  // Password reset
  resetOTP:             { type: String, default: null },
  resetOTPExpires:      { type: Date, default: null },

  createdAt:            { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);