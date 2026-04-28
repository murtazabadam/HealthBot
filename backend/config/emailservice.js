const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection
transporter.verify((error) => {
  if (error) console.log('Email service error:', error);
  else console.log('Email service ready!');
});

const sendVerificationEmail = async (email, name, token) => {
  const verifyURL = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your HealthBot account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; }
          .logo { text-align: center; font-size: 32px; color: #38bdf8; font-weight: bold; margin-bottom: 8px; }
          .title { text-align: center; color: #e2e8f0; font-size: 22px; margin-bottom: 16px; }
          .text { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
          .btn { display: block; width: fit-content; margin: 0 auto; background: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 32px; }
          .divider { border: none; border-top: 1px solid #334155; margin: 24px 0; }
          .token-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; color: #38bdf8; font-size: 13px; word-break: break-all; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">⚕️ HealthBot</div>
          <div class="title">Verify Your Email Address</div>
          <hr class="divider">
          <p class="text">Hello <strong style="color:#e2e8f0">${name}</strong>,</p>
          <p class="text">Thank you for registering with HealthBot. Please click the button below to verify your email address and activate your account.</p>
          <a href="${verifyURL}" class="btn">Verify Email Address</a>
          <hr class="divider">
          <p class="text" style="font-size:13px">If the button does not work, copy and paste this link into your browser:</p>
          <div class="token-box">${verifyURL}</div>
          <p class="text" style="font-size:13px">This link will expire in <strong style="color:#e2e8f0">24 hours</strong>.</p>
          <div class="footer">
            If you did not create a HealthBot account, you can safely ignore this email.<br>
            © 2026 HealthBot. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
  });
};

const sendForgotPasswordEmail = async (email, name, token) => {
  const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset your HealthBot password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; }
          .logo { text-align: center; font-size: 32px; color: #38bdf8; font-weight: bold; margin-bottom: 8px; }
          .title { text-align: center; color: #e2e8f0; font-size: 22px; margin-bottom: 16px; }
          .text { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
          .btn { display: block; width: fit-content; margin: 0 auto; background: #ef4444; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 32px; }
          .divider { border: none; border-top: 1px solid #334155; margin: 24px 0; }
          .warning { background: #431407; border: 1px solid #ef4444; border-radius: 8px; padding: 12px 16px; color: #fca5a5; font-size: 13px; margin: 16px 0; }
          .token-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; color: #38bdf8; font-size: 13px; word-break: break-all; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">⚕️ HealthBot</div>
          <div class="title">Reset Your Password</div>
          <hr class="divider">
          <p class="text">Hello <strong style="color:#e2e8f0">${name}</strong>,</p>
          <p class="text">We received a request to reset the password for your HealthBot account. Click the button below to set a new password.</p>
          <a href="${resetURL}" class="btn">Reset My Password</a>
          <hr class="divider">
          <p class="text" style="font-size:13px">If the button does not work, copy and paste this link into your browser:</p>
          <div class="token-box">${resetURL}</div>
          <div class="warning">⚠️ This link will expire in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email — your password will not be changed.</div>
          <div class="footer">
            © 2026 HealthBot. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
  });
};

module.exports = { sendVerificationEmail, sendForgotPasswordEmail };