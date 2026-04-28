const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', ConversationSchema);