require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Routes
const authRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/coursesRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <-- Import Admin Routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


// Route Middleware
app.use('/api/auth', authRoutes);       
app.use('/api/course', courseRoutes); 
app.use('/api/admin', adminRoutes); // <-- Mount Admin Routes

const seedSuperAdmin = require('./utils/seedSuperAdmin'); // <-- Import Seeder
// Database Connection
let isConnected = false;
 async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    // Seed Super Admin if not exists
    await seedSuperAdmin();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
 }
// Base Route
app.get('/', (req, res) => {
  res.send('Life Coaching API is running...');
});

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
module.exports = app