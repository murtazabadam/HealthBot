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

  // The original upload, kept so the user can view/re-check it against what
  // the AI read. Stored as a data URL (data:image/...;base64,... or
  // data:application/pdf;base64,...) directly in the document — this app
  // has no separate file storage (S3, etc.) set up, and prescription
  // uploads are small enough that this is a reasonable tradeoff for now.
  // Worth revisiting if usage grows: Mongo documents cap at 16MB, and a
  // free-tier Atlas cluster has limited total storage.
  image:      { type: String, default: '' },
  fileType:   { type: String, enum: ['image', 'pdf', ''], default: '' },

  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);