const User = require('../models/User'); 
const Session = require('../models/Session');
const Reflection = require('../models/Reflection'); // Added to support submitReflection
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

// --- ENCRYPTION HELPER ---
// This function dynamically encrypts the link so plain text never leaves the server
const encryptLink = (text) => {
  if (!text) return null;
  // Use a secure key from environment variables, or a fallback for dev
  const secret = process.env.MEDIA_SECRET_KEY || 'my_super_secure_secret_key_12345'; 
  const algorithm = 'aes-256-cbc';
  // UPDATE: Switched to SHA-256 to match frontend crypto-js logic easily
  // This generates a 32-byte key from the secret string
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(16); // Random Initialization Vector
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  // Return format: IV:EncryptedData
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// 1. Get Sessions 
exports.getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let sessions = await Session.find().sort({ dayNumber: 1 });

    // --- AUTO-SEED FAILSAFE ---
    if (sessions.length === 0) {
    const sessionData = [
        // --- ONE : ONE SESSIONS ---
        {
          dayNumber: 1,
          title: "Reviling",
          type: "One:One",
          contextPoints: [
            "Reviling what they consider themselves (Blind spot)",
            "Showing them by default context which they made for themselves",
            "Impact of it",
            "Make them face it and make them understand that it is harmless fear"
          ]
        },
        {
          dayNumber: 3,
          title: "Live Simply Unreasonable Life",
          type: "One:One",
          contextPoints: [
            "To live Courageous life",
            "To get present, how past impacting Decisions",
            "To live a Present and reason free or unreasonable Life"
          ]
        },
        {
          dayNumber: 4,
          title: "4 Power tools for Powerful Life",
          type: "One:One",
          contextPoints: [
            "Proving 4 tools to make Life easy",
            "Key of success – Discipline",
            "Registration of Possibility – Shared Vision",
            "Team Work – Family & friend",
            "Keep Possibility alive – Life For"
          ]
        },
        {
          dayNumber: 6,
          title: "Winning and Losing Qualities",
          type: "One:One",
          contextPoints: [
            "Awareness of winning and losing factor",
            "Expansion of Strength"
          ]
        },

        // --- RECORDED SESSIONS ---
        {
          dayNumber: 2,
          title: "Sparkling Noise in My head",
          type: "Recorded",
          mediaUrl: "https://www.youtube.com/watch?v=ZhhBlQC_5N8&list=RDZhhBlQC_5N8&start_radio=1", 
          contextPoints: [
            "Realtime Navigation of life",
            "Getting present to clutter of thoughts",
            "Creating space for Focus"
          ]
        },
        {
          dayNumber: 5,
          title: "Reality of Right Now",
          type: "Recorded",
          mediaUrl: "https://www.youtube.com/watch?v=y5ud-mQaLyg",
          contextPoints: [
            "Empty the Present",
            "Awareness of unbeatable Past or its impact on everything"
          ]
        },
        {
          dayNumber: 7,
          title: "Healing Relationship Beyond Anger",
          type: "Recorded",
          mediaUrl: "https://www.youtube.com/watch?v=y5ud-mQaLyg",
          contextPoints: [
            "Inner Peace in Relations",
            "Healthier Relations"
          ]
        },
        {
          dayNumber: 8,
          title: "Realistic Dreams",
          type: "Recorded",
          mediaUrl: "https://www.youtube.com/watch?v=ZhhBlQC_5N8&list=RDZhhBlQC_5N8&start_radio=1",
          contextPoints: [
            "Creating Magical Life",
            "Realtime creation of future in Present"
          ]
        },
        {
          dayNumber: 9,
          title: "Self-Pity",
          type: "Recorded",
          mediaUrl: "https://www.youtube.com/watch?v=ZhhBlQC_5N8&list=RDZhhBlQC_5N8&start_radio=1",
          contextPoints: [
            "Real reason for Dependency",
            "Reason of laziness and freedom"
          ]
        },
        {
          dayNumber: 10,
          title: "Sehajta (Simplicity)",
          type: "Recorded",
          mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_10_HERE",
          contextPoints: [
            "Release the Triggers",
            "Get peace of mind"
          ]
        },
        {
          dayNumber: 11,
          title: "Assumptions of Life",
          type: "Recorded",
          mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_11_HERE",
          contextPoints: [
            "Freedom from Social agreements",
            "Clarity in life"
          ]
        },
        {
          dayNumber: 12,
          title: "Overthinking",
          type: "Recorded",
          mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_12_HERE",
          contextPoints: [
            "Don’t take yourself seriously",
            "Confidence vs overconfidence"
          ]
        },
        {
          dayNumber: 13,
          title: "Child Within You",
          type: "Recorded",
          mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_13_HERE",
          contextPoints: [
            "Connection with childhood",
            "Freedom from the past"
          ]
        },
        {
          dayNumber: 14,
          title: "Santulan – The art of Balance",
          type: "Recorded",
          mediaUrl: "https://www.youtube.com/watch?v=y5ud-mQaLyg",
          contextPoints: [
            "Ability to handle Emotions"
          ]
        },
        {
          dayNumber: 15,
          title: "How to maintain Consistency",
          type: "Recorded",
          mediaUrl: "https://www.youtube.com/watch?v=y5ud-mQaLyg",
          contextPoints: [
            "Generating happiness",
            "Practicing happiness"
          ]
        }
      ];

      await Session.insertMany(sessionData);
      sessions = await Session.find().sort({ dayNumber: 1 });
    }

    // --- MIDNIGHT LOGIC ---
    const today = new Date();
    const joinedDate = new Date(user.createdAt);
    const todayMidnight = new Date(today.setHours(0, 0, 0, 0));
    const joinedMidnight = new Date(joinedDate.setHours(0, 0, 0, 0));
    const daysSinceJoined = Math.floor((todayMidnight - joinedMidnight) / (1000 * 60 * 60 * 24)) + 1;

    const completedList = Array.isArray(user.completedSessions) 
      ? user.completedSessions.map(id => id.toString()) 
      : [];
      
    // Helper: Check for Special 24h Access
    const checkSpecialAccess = (sessionId) => {
        if (!user.specialAccess || user.specialAccess.length === 0) return false;
        
        const access = user.specialAccess.find(sa => sa.sessionId.toString() === sessionId.toString());
        if (!access) return false;
        
        // Check expiry: Now < ExpiresAt
        return new Date() < new Date(access.expiresAt);
    };

    // --- ADMIN CHECK ---
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    const sessionsWithStatus = sessions.map(session => {
      const secureSession = session.toObject();
      const isCompleted = completedList.includes(session._id.toString());
      
      // 1. Is Day Arrived?
      let isDayArrived = false;
      if (isAdmin) {
          isDayArrived = true; // Admins always have access
      } else if (session.dayNumber === 1) {
          isDayArrived = true;
      } else if (user.hasPaid) {
          isDayArrived = session.dayNumber <= daysSinceJoined;
      }
      
      // 2. Check Special Access override
      const hasSpecialAccess = checkSpecialAccess(session._id);

      // 3. Is Expired? (Past the 24h window)
      // Only check expiry if NOT an admin
      const isExpired = !isAdmin && session.dayNumber < daysSinceJoined;

      // 4. Media Access Logic:
      let hasMediaAccess = false;
      
      if (isAdmin) {
         hasMediaAccess = true; // Admins always access media
      } else if (hasSpecialAccess) {
         hasMediaAccess = true; // Special access overrides all
         isDayArrived = true;   // Treat as arrived so content shows
      } else if (isDayArrived) {
         // Normal logic
         if (!isExpired || isCompleted) {
           hasMediaAccess = true;
         }
      }

      // 5. Content Visibility Logic
      if (!isDayArrived) {
        // Locked Future Session
        secureSession.mediaUrl = null;
        if (user.hasPaid) {
           secureSession.contextPoints = [`This content unlocks on Day ${session.dayNumber} of your journey.`];
        } else {
           secureSession.contextPoints = ["Locked Content. Please register to access."];
        }
      } else {
        // Unlocked / Completed / Expired / Special Access
        if (!hasMediaAccess) {
            secureSession.mediaUrl = null; 
        } else {
            // Encrypt Media URL if access is granted
            if (secureSession.mediaUrl) {
                secureSession.mediaUrl = encryptLink(secureSession.mediaUrl);
            }
        }
      }

      return {
        ...secureSession,
        isLocked: !hasMediaAccess, 
        isCompleted: isCompleted,
        hasSpecialAccess: hasSpecialAccess 
      };
    });

    res.json(sessionsWithStatus);

  } catch (err) {
    res.status(500).send('Server Error');
  }
};
// 2. Submit Reflection
exports.submitReflection = async (req, res) => {
  try {
    const { sessionId, takeaways } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.hasPaid) {
      return res.status(403).json({ message: 'Premium feature.' });
    }

    let reflection = await Reflection.findOne({ user: req.user.id, session: sessionId });

    if (reflection) {
      reflection.takeaways = takeaways;
      reflection.createdAt = Date.now();
      await reflection.save();
    } else {
      reflection = new Reflection({
        user: req.user.id,
        session: sessionId,
        takeaways
      });
      await reflection.save();
    }
    res.json({ success: true, message: 'Reflection Saved' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// 3. Mock Payment
exports.processPayment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.hasPaid = true;
    await user.save();
    res.json({ success: true, message: 'Payment Successful. Course Unlocked.' });
  } catch (err) {
    
    res.status(500).send('Server Error');
  }
};

// 4. Mark Session as Complete (With Data Repair)
// Route: PUT /api/course/sessions/:id/complete
exports.isSessionComplete = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    // Try standard atomic update
    try {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $addToSet: { completedSessions: sessionId } }, // Only adds if unique
          { new: true, upsert: false }
        );
        
        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        return res.json({ 
            message: "Session marked as complete", 
            completedSessions: updatedUser.completedSessions 
        });

    } catch (mongoError) {
        // If "Cannot apply $addToSet to non-array field" error occurs (e.g., corrupted data)
        if (mongoError.code === 2 || mongoError.message.includes("non-array") || mongoError.message.includes("Plan executor error")) {
            
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { completedSessions: [sessionId] }, // Force overwrite with new array
                { new: true }
            );
            
            return res.json({ 
                message: "Session marked as complete (Data Repaired)", 
                completedSessions: updatedUser.completedSessions 
            });
        }
        
        throw mongoError; // Rethrow other errors
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};