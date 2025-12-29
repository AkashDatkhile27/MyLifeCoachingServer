const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true,
    unique: true // Ensures you don't have two "Day 1"s
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['One:One', 'Recorded'], // Restricts values to these two types
    required: true
  },
  contextPoints: [{
    type: String // Stores the bullet points for the session context
  }],
  mediaUrl: {
    type: String, // Stores the Firebase Download URL for audio files
    default: ''
  }
});

module.exports = mongoose.model('Session', SessionSchema);