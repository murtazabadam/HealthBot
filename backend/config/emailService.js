const https = require('https');

const sendOTPEmail = async (email, name, otp, purpose = 'verification') => {
  const isReset = purpose === 'reset';
  const subject = isReset
    ? 'Reset Your HealthBot Password'
    : 'Verify Your HealthBot Email';
  const color = isReset ? '#ef4444' : '#0ea5e9';
  const title = isReset ? 'Password Reset OTP' : 'Email Verification OTP';
  const message = isReset
    ? 'Use this OTP to reset your HealthBot password. Valid for 10 minutes.'
    : 'Use this OTP to verify your email and complete your registration.';

  const emailData = JSON.stringify({
    sender: { name: 'HealthBot', email: 'murtazabadam@gmail.com' },
    to: [{ email, name: name || 'User' }],
    subject,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background:#0f172a; margin:0; padding:20px; }
          .wrap { max-width:600px; margin:0 auto; background:#1e293b; border-radius:16px; padding:40px; }
          .logo { text-align:center; font-size:28px; color:#38bdf8; font-weight:bold; margin-bottom:4px; }
          .tagline { text-align:center; color:#64748b; font-size:13px; margin-bottom:24px; }
          .title { text-align:center; color:#e2e8f0; font-size:20px; font-weight:bold; margin-bottom:16px; }
          .divider { border:none; border-top:1px solid #334155; margin:20px 0; }
          .text { color:#94a3b8; font-size:14px; line-height:1.7; margin-bottom:16px; }
          .otp-wrap { text-align:center; margin:32px 0; }
          .otp { display:inline-block; background:#0f172a; border:2px solid ${color}; border-radius:12px; padding:18px 48px; font-size:48px; font-weight:bold; color:${color}; letter-spacing:14px; }
          .warning { background:#0f172a; border:1px solid #334155; border-radius:8px; padding:14px; color:#64748b; font-size:13px; text-align:center; margin:20px 0; }
          .footer { text-align:center; color:#475569; font-size:11px; margin-top:28px; line-height:1.6; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="logo">⚕️ HealthBot</div>
          <div class="tagline">AI Medical Assistant</div>
          <div class="title">${title}</div>
          <hr class="divider">
          <p class="text">Hello <strong style="color:#e2e8f0">${name || 'there'}</strong>,</p>
          <p class="text">${message}</p>
          <div class="otp-wrap">
            <div class="otp">${otp}</div>
          </div>
          <div class="warning">
            ⏱ This OTP expires in <strong style="color:#e2e8f0">10 minutes</strong>.<br>
            Never share this code with anyone.
          </div>
          <hr class="divider">
          <div class="footer">
            If you did not request this, you can safely ignore this email.<br>
            © 2026 HealthBot. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(emailData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Email sent successfully to:', email);
          resolve(true);
        } else {
          console.error('Brevo error:', data);
          reject(new Error(`Email failed: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('Email request error:', err);
      reject(err);
    });

    req.write(emailData);
    req.end();
  });
};

module.exports = { sendOTPEmail };