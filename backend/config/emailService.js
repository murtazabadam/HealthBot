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

// ── Emergency alert email ────────────────────────────────────────────────────
async function sendEmergencyAlertEmail(toEmail, contactName, userName, mapsUrl, userPhone) {
  const subject = `URGENT: ${userName} may need help — HealthBot Emergency Alert`;
  const phoneLine = userPhone ? `Their phone number: ${userPhone}\n\n` : '';
  const body = `Hi ${contactName || 'there'},\n\n${userName} triggered an emergency alert on HealthBot and may need immediate help.\n\n${phoneLine}${mapsUrl ? `Their location: ${mapsUrl}\n\n` : ''}Please call them right away. If you cannot reach them, contact local emergency services immediately.\n\n— HealthBot`;

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender:    { name: 'HealthBot', email: process.env.EMAIL_FROM || 'noreply@healthbot.com' },
        to:        [{ email: toEmail, name: contactName || 'Emergency Contact' }],
        subject,
        textContent: body,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <div style="background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:20px;margin-bottom:20px;">
              <h2 style="color:#dc2626;margin:0 0 10px 0;">⚠️ Emergency Alert</h2>
              <p style="margin:0;font-size:16px;"><strong>${userName}</strong> may need immediate help.</p>
            </div>
            <p>Hi ${contactName || 'there'},</p>
            <p>${userName} triggered an emergency alert on HealthBot. Please call them right away — every minute counts.</p>
            ${userPhone ? `<p style="margin:16px 0;"><a href="tel:${userPhone}" style="display:inline-block;background:#dc2626;color:#fff;font-weight:bold;padding:12px 20px;border-radius:8px;text-decoration:none;">📞 Call ${userName}: ${userPhone}</a></p>` : ''}
            ${mapsUrl ? `<p><a href="${mapsUrl}" style="color:#0d9488;font-weight:bold;">View their location on Google Maps</a></p>` : ''}
            <p style="color:#888;font-size:12px;margin-top:20px;">If you cannot reach them, please contact local emergency services (108) immediately.</p>
          </div>
        `,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`Emergency alert email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('Emergency email error:', err.response?.data || err.message);
    return false;
  }
}

module.exports = { sendOTPEmail, sendEmergencyAlertEmail, sendReminderEmail };

// ── Medicine reminder email ──────────────────────────────────────────────────
async function sendReminderEmail(toEmail, toName, medicineName, instructions) {
  const subject = `⏰ HealthBot Reminder: ${medicineName}`;
  const body = `Hello ${toName},\n\nTime to take: ${medicineName}${instructions ? `\nInstructions: ${instructions}` : ''}\n\nStay healthy!\n— The HealthBot Team`;

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender:      { name: 'HealthBot', email: process.env.EMAIL_FROM || 'noreply@healthbot.com' },
        to:          [{ email: toEmail, name: toName }],
        subject,
        textContent: body,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <h2 style="color:#0d9488;">⏰ HealthBot Reminder</h2>
            <p>Hello <strong>${toName}</strong>,</p>
            <div style="background:#f0fdfa;border:2px solid #0d9488;border-radius:8px;padding:20px;margin:20px 0;">
              <p style="margin:0;font-size:18px;font-weight:bold;">${medicineName}</p>
              ${instructions ? `<p style="margin:8px 0 0 0;color:#555;">${instructions}</p>` : ''}
            </div>
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
    console.log(`Reminder email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('Reminder email error:', err.response?.data || err.message);
    return false;
  }
}