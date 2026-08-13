const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:           { type: String, required: true },  // e.g. "Amoxicillin (500mg)"
  instructions:   { type: String, default: '' },      // e.g. "after food"

  // 24h "HH:mm" strings, e.g. ["09:00", "21:00"]. The scheduler matches the
  // server clock's current HH:mm against this array every minute.
  times:          [{ type: String, required: true }],

  startDate:      { type: Date, required: true },
  endDate:        { type: Date, default: null },  // null = runs indefinitely (manual reminders)
  active:         { type: Boolean, default: true },

  source:         { type: String, enum: ['manual', 'prescription'], default: 'manual' },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', default: null },

  // Guards against double-sending if the cron tick overlaps a minute boundary.
  lastSentAt:     { type: Date, default: null },

  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reminder', ReminderSchema);