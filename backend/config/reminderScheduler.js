const cron     = require('node-cron');
const Reminder = require('../models/Reminder');
const User     = require('../models/User');
const { sendReminderEmail } = require('./emailService');
const { sendSMS }           = require('./smsService');

function pad(n) {
  return n.toString().padStart(2, '0');
}

/**
 * Starts a once-a-minute job that finds every active reminder whose
 * time-of-day matches right now and whose date range covers today, then
 * emails (and, if a phone number is on file, texts) the user.
 *
 * This replaces relying on the browser's setInterval — reminders now fire
 * even if no tab is open, which matters for a medicine reminder feature.
 */
function startReminderScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const due = await Reminder.find({
        active: true,
        times: hhmm,
        startDate: { $lte: now },
        $or: [{ endDate: null }, { endDate: { $gte: startOfToday } }],
      });

      for (const reminder of due) {
        // Guard against double-sending if a slow tick overlaps the next minute.
        if (reminder.lastSentAt && now - reminder.lastSentAt < 55 * 1000) continue;

        const user = await User.findById(reminder.userId);
        if (!user) continue;

        await sendReminderEmail(user.email, user.name, reminder.name, reminder.instructions);
        if (user.phoneNumber) {
          await sendSMS(
            user.phoneNumber,
            `HealthBot: time for ${reminder.name}${reminder.instructions ? ' — ' + reminder.instructions : ''}`
          );
        }

        reminder.lastSentAt = now;
        await reminder.save();
      }
    } catch (err) {
      console.error('Reminder scheduler error:', err.message);
    }
  });

  console.log('Reminder scheduler started (checks every minute)');
}

module.exports = { startReminderScheduler };