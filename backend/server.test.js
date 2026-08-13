const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.get('/', (req, res) => res.json({ message: 'HealthBot API is running!' }));

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
}, 15000);

afterAll(async () => {
  // Clean up the test user so repeated runs don't collide on the unique
  // email index, then close the connection.
  await User.deleteMany({ email: /^test\d+@healthbot\.com$/ });
  await mongoose.connection.close();
}, 15000);

describe('HealthBot API Tests', () => {
  const testEmail = `test${Date.now()}@healthbot.com`;
  const testPassword = 'password123';

  test('GET / should return API running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('HealthBot API is running!');
  }, 10000);

  test('POST /api/auth/send-otp should issue a verification OTP', async () => {
    const res = await request(app).post('/api/auth/send-otp').send({
      name: 'Test User', email: testEmail,
    });
    expect(res.statusCode).toBe(200);
  }, 10000);

  test('POST /api/auth/register should create a user given a valid OTP', async () => {
    // Registration requires a valid OTP (see routes/auth.js). Rather than
    // parsing a real email, read the OTP straight out of the DB — it was
    // just written by the /send-otp call above.
    const pending = await User.findOne({ email: testEmail });
    expect(pending).not.toBeNull();
    const otp = pending.verificationOTP;
    expect(otp).toBeTruthy();

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: testEmail,
      password: testPassword,
      otp,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  }, 10000);

  test('POST /api/auth/login should return token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail, password: testPassword,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  }, 10000);

  test('POST /api/auth/login with wrong password should fail', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail, password: 'wrongpassword',
    });
    expect(res.statusCode).toBe(400);
  }, 10000);
});