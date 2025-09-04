const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./server/models/User');

async function updateUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendortrak');
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'andy.hoobing@gmail.com' });
    if (!user) {
      console.log('User andy.hoobing@gmail.com not found');
      return;
    }
    
    console.log('Current user:', {
      email: user.email,
      role: user.role,
      permissions: user.permissions
    });
    
    // Update to admin role
    user.role = 'admin';
    await user.save();
    
    console.log('User updated successfully to admin role');
    console.log('New permissions:', user.permissions);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateUser();
