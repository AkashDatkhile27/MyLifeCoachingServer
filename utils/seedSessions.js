const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Session = require('../models/Session');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sessions = [
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

  // --- RECORDED SESSIONS (Add your Firebase URLs here) ---
  {
    dayNumber: 2,
    title: "Sparkling Noise in My head",
    type: "Recorded",
    mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_2_HERE", 
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
    mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_5_HERE",
    contextPoints: [
      "Empty the Present",
      "Awareness of unbeatable Past or its impact on everything"
    ]
  },
  {
    dayNumber: 7,
    title: "Healing Relationship Beyond Anger",
    type: "Recorded",
    mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_7_HERE",
    contextPoints: [
      "Inner Peace in Relations",
      "Healthier Relations"
    ]
  },
  {
    dayNumber: 8,
    title: "Realistic Dreams",
    type: "Recorded",
    mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_8_HERE",
    contextPoints: [
      "Creating Magical Life",
      "Realtime creation of future in Present"
    ]
  },
  {
    dayNumber: 9,
    title: "Self-Pity",
    type: "Recorded",
    mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_9_HERE",
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
    mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_14_HERE",
    contextPoints: [
      "Ability to handle Emotions"
    ]
  },
  {
    dayNumber: 15,
    title: "How to maintain Consistency",
    type: "Recorded",
    mediaUrl: "INSERT_FIREBASE_URL_FOR_DAY_15_HERE",
    contextPoints: [
      "Generating happiness",
      "Practicing happiness"
    ]
  }
];

const seedDB = async () => {
  try {
    // Clear existing sessions
    await Session.deleteMany();
    console.log('Sessions Cleared...');

    // Insert new ones
    await Session.insertMany(sessions);
    console.log('Data Imported Successfully!');
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();