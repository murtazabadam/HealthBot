const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const https      = require('https');
const { Server } = require('socket.io');
const session    = require('express-session');
const passport   = require('./config/passport');

dotenv.config();

// Trust Render's proxy — required for OAuth to work correctly
app.set('trust proxy', 1);

const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(session({
  secret: process.env.SESSION_SECRET || 'healthbot_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 10 * 60 * 1000,  // 10 minutes
    secure: false,             // keep false for Render free tier
    httpOnly: true
  }
}));

// ── Session ────────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'healthbot_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 10 * 60 * 1000, secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

// ── Root ───────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'HealthBot API is running!', status: 'ok' });
});

// ── MongoDB ────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('DB Error:', err));

// ── Socket.IO ──────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  socket.on('disconnect', () => {});
});

// ── Keep-alive ping (prevents Render free tier from sleeping) ──────────────────
const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || '';
if (BACKEND_URL) {
  setInterval(() => {
    https.get(`${BACKEND_URL}/`, res => {
      console.log(`Keep-alive ping: ${res.statusCode}`);
    }).on('error', () => {});
  }, 10 * 60 * 1000);
}

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
