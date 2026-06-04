const axios = require('axios');

async function sendOTPEmail(toEmail, toName, otp, type = 'verification') {
  const subject = type === 'reset'
    ? 'HealthBot — Password Reset OTP'
    : 'HealthBot — Email Verification OTP';

  const body = type === 'reset'
    ? `Hello ${toName},\n\nYour password reset OTP is: ${otp}\n\nThis OTP expires in 10 minutes.\n\nIf you did not request this, ignore this email.\n\n— HealthBot Team`
    : `Hello ${toName},\n\nYour HealthBot verification OTP is: ${otp}\n\nThis OTP expires in 10 minutes.\n\nEnter this code to complete your registration.\n\n— HealthBot Team`;

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender:    { name: 'HealthBot', email: process.env.EMAIL_FROM || 'noreply@healthbot.com' },
        to:        [{ email: toEmail, name: toName }],
        subject,
        textContent: body,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <h2 style="color:#0d9488;">HealthBot</h2>
            <p>Hello <strong>${toName}</strong>,</p>
            <p>${type === 'reset' ? 'Your password reset OTP is:' : 'Your verification OTP is:'}</p>
            <div style="background:#f0fdfa;border:2px solid #0d9488;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
              <h1 style="color:#0d9488;letter-spacing:8px;font-size:36px;margin:0;">${otp}</h1>
            </div>
            <p>This OTP expires in <strong>10 minutes</strong>.</p>
            <p style="color:#888;font-size:12px;">If you did not request this, please ignore this email.</p>
            <p>— HealthBot Team</p>
          </div>
        `
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`OTP email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('Email error:', err.response?.data || err.message);
    return false;
  }
}

module.exports = { sendOTPEmail };
