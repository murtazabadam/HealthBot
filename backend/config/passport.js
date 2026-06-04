const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User           = require('../models/User');

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
    'https://healthbot-backend-ezxv.onrender.com/api/auth/google/callback',
  proxy: true  // ← important for Render (sits behind a proxy)
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      user.googleId   = profile.id;
      user.authType   = 'google';
      user.isVerified = true;
      if (!user.avatar) user.avatar = profile.photos[0]?.value || null;
      await user.save();
      return done(null, user);
    }

    user = new User({
      googleId:   profile.id,
      name:       profile.displayName,
      email:      profile.emails[0].value,
      avatar:     profile.photos[0]?.value || null,
      authType:   'google',
      isVerified: true
    });
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done)       => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await User.findById(id));
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;