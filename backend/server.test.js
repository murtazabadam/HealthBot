const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.get('/', (req, res) => res.json({ message: 'HealthBot API is running!' }));

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
}, 15000);

afterAll(async () => {
  await mongoose.connection.close();
}, 15000);

describe('HealthBot API Tests', () => {
  let token = '';
  const testEmail = `test${Date.now()}@healthbot.com`;

  test('GET / should return API running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('HealthBot API is running!');
  }, 10000);

  test('POST /api/auth/register should create a user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User', email: testEmail, password: 'password123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  }, 10000);

  test('POST /api/auth/login should return token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail, password: 'password123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  }, 10000);

  test('POST /api/auth/login with wrong password should fail', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail, password: 'wrongpassword'
    });
    expect(res.statusCode).toBe(400);
  }, 10000);
});