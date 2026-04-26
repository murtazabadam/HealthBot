const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
<<<<<<< HEAD
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ googleId: profile.id });

    if (user) return done(null, user);

    // Check if email already registered normally
    user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      // Link Google account to existing user
=======
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://healthbot-production-3c7d.up.railway.app/api/auth/google/callback',
  proxy: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
>>>>>>> d8ecbfa7c56d4f4aeab0f91858c713d32dfbf017
      user.googleId = profile.id;
      user.avatar = profile.photos[0].value;
      await user.save();
      return done(null, user);
    }

<<<<<<< HEAD
    // Create new user
=======
>>>>>>> d8ecbfa7c56d4f4aeab0f91858c713d32dfbf017
    user = new User({
      googleId:  profile.id,
      name:      profile.displayName,
      email:     profile.emails[0].value,
      avatar:    profile.photos[0].value,
      password:  'google-oauth-no-password'
    });

    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;