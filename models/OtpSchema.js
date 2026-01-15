const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Automatically delete this document after 600 seconds (10 minutes)
  }
});

module.exports = mongoose.model('Otp', OtpSchema);