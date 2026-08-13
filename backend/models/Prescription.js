const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  dosage:       { type: String, default: '' },   // e.g. "500mg"
  frequency:    { type: String, default: '' },   // e.g. "twice daily" (human-readable)
  timesPerDay:  { type: Number, default: null }, // e.g. 2 — used to build reminder times
  durationDays: { type: Number, default: null }, // e.g. 5
  instructions: { type: String, default: '' }    // e.g. "after food"
}, { _id: false });

const PrescriptionSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rawText:    { type: String, default: '' },   // raw OCR output, kept for audit/debugging
  doctorName: { type: String, default: '' },
  medicines:  [MedicineSchema],
  notes:      { type: String, default: '' },   // free-text notes the AI couldn't structure
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);