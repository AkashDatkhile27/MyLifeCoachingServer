const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// Routes
const authRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/coursesRoutes');
const adminRoutes = require('./routes/adminRoutes');


const seedSuperAdmin = require('./utils/seedSuperAdmin');

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔑 MongoDB Connection (Singleton pattern for Vercel)
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('✅ MongoDB connected');
    await seedSuperAdmin();
  } catch (error) {
    console.error('❌ MongoDB error:', error);
    throw error;
  }
}

// ⛳ Important: connect DB on every request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/admin', adminRoutes);



// Base route
app.get('/', (req, res) => {
  res.send('Life Coaching API is running...');
});





