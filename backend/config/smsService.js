const axios = require('axios');

/**
 * Sends an SMS via Fast2SMS's "Quick SMS" (route=q) transactional route.
 * Meant for OTP/alert-style messages — no DLT template registration
 * required, but delivery to DND-registered numbers isn't guaranteed.
 */
async function sendSMS(toNumber, message) {
  if (!toNumber) return false;

  // Fast2SMS expects a bare 10-digit Indian mobile number, no +91 / leading 0.
  const cleaned = toNumber.replace(/\D/g, '').slice(-10);
  if (cleaned.length !== 10) {
    console.error('SMS error: invalid phone number', toNumber);
    return false;
  }

  if (!process.env.FAST2SMS_API_KEY) {
    console.log('SMS: FAST2SMS_API_KEY not set — skipping SMS');
    return false;
  }

  try {
    const res = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        route: 'q',
        message,
        flash: 0,
        numbers: cleaned,
      },
      headers: { 'cache-control': 'no-cache' },
    });

    if (res.data?.return === true) {
      console.log(`SMS sent to ${cleaned}`);
      return true;
    }
    console.error('SMS error:', res.data);
    return false;
  } catch (err) {
    console.error('SMS error:', err.response?.data || err.message);
    return false;
  }
}

module.exports = { sendSMS };