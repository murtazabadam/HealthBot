const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender:    { type: String, enum: ['user', 'bot'], required: true },
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages:  [MessageSchema],

  // Running symptom-gathering state for the current topic — built up turn
  // by turn by the AI-driven conversation flow in routes/chat.js, cleared
  // once the user confirms (via /confirm-symptoms) or starts a new topic.
  // activeSymptomIds holds only IDs from the fixed ML vocabulary (see
  // /symptom-options); symptomNotes holds free-text detail the AI captured
  // that didn't map onto a known symptom, kept for context/display but
  // never sent to the ML model.
  activeSymptomIds: { type: [String], default: [] },
  symptomNotes:      { type: String, default: '' },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', ConversationSchema);