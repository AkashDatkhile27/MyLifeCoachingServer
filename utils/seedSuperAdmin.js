const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    // 1. Check if ENV variables are set
    if (!email || !password) {
      console.log('⚠️  Skipping Super Admin Seed: SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env');
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if Super Admin already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // Optional: Check if role is correct, if not, fix it? 
      if (existingUser.role !== 'superadmin') {
          console.log('⚠️  User exists but is not superadmin. Updating role...');
          existingUser.role = 'superadmin';
          await existingUser.save();
          console.log('✅  User promoted to Super Admin.');
      } else {
          // console.log('✅  Super Admin already exists.');
      }
      return;
    }

    // 3. Create Super Admin
    console.log('🌱  Creating Super Admin from .env...');
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const superAdmin = new User({
      Name: 'Super Admin',
      email: normalizedEmail,
      password: hashedPassword,
      phone: '0000000000', // Dummy phone
      role: 'superadmin',  // Critical role
      hasPaid: true,       // Auto-unlock content
      completedSessions: [],
      profilePicture: ''
    });

    await superAdmin.save();
    console.log('✨  Super Admin created successfully!');

  } catch (error) {
    console.error('❌  Super Admin Seeding Failed:', error.message);
  }
};

module.exports = seedSuperAdmin;