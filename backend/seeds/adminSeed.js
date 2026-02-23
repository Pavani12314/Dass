const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'Felicity',
      email: 'admin@felicity.iiit.ac.in',
      password: 'admin123', // This will be hashed by the pre-save hook
      role: 'admin',
      isActive: true,
      onboardingCompleted: true
    });

    console.log('Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('\nPlease change the password after first login.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
