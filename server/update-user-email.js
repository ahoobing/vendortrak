const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function updateUserEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendortrak');
    console.log('Connected to MongoDB');
    
    // Find the existing user
    const user = await User.findOne({ email: 'andyhoobing@gmail.com' });
    if (!user) {
      console.log('User andyhoobing@gmail.com not found');
      return;
    }
    
    console.log('Current user:', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions
    });
    
    // Update the email address
    user.email = 'andy.hoobing@gmail.com';
    await user.save();
    
    console.log('User email updated successfully!');
    console.log('New email:', user.email);
    console.log('User still has admin role and permissions');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateUserEmail();
