const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) console.log('Email service error:', error);
  else console.log('Email service ready!');
});

const sendOTPEmail = async (email, name, otp, purpose = 'verification') => {
  const isReset = purpose === 'reset';
  const subject = isReset
    ? 'Reset Your HealthBot Password'
    : 'Verify Your HealthBot Email';
  const title = isReset ? 'Password Reset OTP' : 'Email Verification OTP';
  const message = isReset
    ? 'Use this OTP to reset your HealthBot password.'
    : 'Use this OTP to verify your email and complete registration.';
  const color = isReset ? '#ef4444' : '#0ea5e9';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; }
          .logo { text-align: center; font-size: 32px; color: #38bdf8; font-weight: bold; margin-bottom: 8px; }
          .title { text-align: center; color: #e2e8f0; font-size: 22px; margin-bottom: 16px; font-weight: bold; }
          .text { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
          .otp-box { text-align: center; margin: 32px 0; }
          .otp { display: inline-block; background: #0f172a; border: 2px solid ${color}; border-radius: 12px; padding: 16px 40px; font-size: 42px; font-weight: bold; color: ${color}; letter-spacing: 12px; }
          .divider { border: none; border-top: 1px solid #334155; margin: 24px 0; }
          .warning { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px 16px; color: #64748b; font-size: 13px; margin: 16px 0; text-align: center; }
          .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">⚕️ HealthBot</div>
          <div class="title">${title}</div>
          <hr class="divider">
          <p class="text">Hello <strong style="color:#e2e8f0">${name || 'there'}</strong>,</p>
          <p class="text">${message}</p>
          <div class="otp-box">
            <div class="otp">${otp}</div>
          </div>
          <div class="warning">
            ⏱ This OTP will expire in <strong>10 minutes</strong>.<br>
            Do not share this OTP with anyone.
          </div>
          <div class="footer">
            If you did not request this, please ignore this email.<br>
            © 2026 HealthBot. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
  });
};

module.exports = { sendOTPEmail };