const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  Name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true 
  },
  phone: { 
    type: String, 
    required: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  profilePicture: { 
    type: String, 
    default: '' 
  },
  hasPaid: { 
    type: Boolean, 
    default: false 
  }, // Set to true on registration in this specific flow
  completedSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }, // Critical for Drip Feed logic
  role: {
    type: String,
    enum: ['user', 'admin','superadmin'],
    default: 'user'
  },
  // --- TEMPORARY ACCESS (Granted by Admin) ---
  // Stores which sessions have been manually unlocked and until when
  specialAccess: [{
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    grantedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  }],
  
  // --- NEW: ACCESS REQUESTS ---
  // Tracks user requests to enforce the limit (Max 3) and status
  accessRequests: [{
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
  }],

  // --- NEW: NOTIFICATIONS ---
  // Stores system messages for the user
  notifications: [{
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['info', 'success', 'warning', 'error'], 
      default: 'info' 
    },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', UserSchema);