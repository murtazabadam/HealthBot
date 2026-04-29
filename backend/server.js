const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const session = require('express-session');
const passport = require('./config/passport');

const app = express(); // MUST COME BEFORE app.use()

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const cors = require('cors');
app.use(cors({ origin: 'https://healthbotsc.vercel.app' }));

/* Session + Passport */
app.use(session({
  secret: process.env.SESSION_SECRET || 'healthbot_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

/* Middleware */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());

/* Routes */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

/* Test Route */
app.get('/', (req, res) => {
  res.json({ message: 'HealthBot API is running!' });
});

/* MongoDB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('DB Error:', err));

/* Socket.IO */
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => console.log('User disconnected'));
});

/* Start Server */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));