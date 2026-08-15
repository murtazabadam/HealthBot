// Reminder times arrive from the frontend as plain "HH:mm" local-time
// strings (from <input type="time">) with no timezone info at all — the
// reminder scheduler compares them directly against the server's wall
// clock. Cloud hosts default to UTC absent an explicit TZ, which would
// silently fire every reminder 5.5 hours off from what a Kashmir-based
// user actually intended. Must be set before any Date object is created.
process.env.TZ = 'Asia/Kolkata';

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const https      = require('https');
const { Server } = require('socket.io');
const session    = require('express-session');
const passport   = require('./config/passport');
const { startReminderScheduler } = require('./config/reminderScheduler');

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

// ── Session ────────────────────────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'healthbot_secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 10 * 60 * 1000, secure: false, httpOnly: true }
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
app.use(express.json({ limit: '10mb' }));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

// ── Root ───────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'HealthBot API is running!', status: 'ok' });
});

// ── MongoDB ────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    startReminderScheduler();
  })
  .catch(err => console.log('DB Error:', err));

// ── Socket.IO ──────────────────────────────────────────────────────────────────
io.on('connection', () => {});

// ── Keep-alive ping ────────────────────────────────────────────────────────────
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