const mongoose = require('mongoose');

// Sub-schema for individual messages (used for both user content and admin replies)
const MessageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // Disable automatic _id for subdocs to keep data clean

const ReflectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  // The user's journal content - Array for chat history
  content: {
    type: [MessageSchema], 
    default: [] 
  },
  // Admin/Coach feedback - Now an array to support multiple replies
  adminReply: {
    type: [MessageSchema],
    default: []
  },
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'replied', 'viewed'],
    default: 'pending'
  },
  // Timestamps for sorting the session list
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate documents for the same session by the same user
// This ensures all thoughts for "Session 1" go into one document array
ReflectionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

// Check if model exists to prevent overwrite error during hot reloads/tests
const Reflection = mongoose.models.Reflection || mongoose.model('Reflection', ReflectionSchema);

module.exports = Reflection;