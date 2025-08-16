const mongoose = require('mongoose');
const User = require('./models/User');
const Tenant = require('./models/Tenant');
const bcrypt = require('bcryptjs');

// Test configuration
const TEST_TENANT = {
  name: 'Test Tenant',
  domain: 'test.com',
  subdomain: 'test'
};

const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin'
};

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendortrak');
    console.log('Connected to MongoDB');

    // Check if test tenant already exists
    let testTenant = await Tenant.findOne({ subdomain: TEST_TENANT.subdomain });
    
    if (!testTenant) {
      // Create test tenant
      testTenant = new Tenant({
        name: TEST_TENANT.name,
        domain: TEST_TENANT.domain,
        subdomain: TEST_TENANT.subdomain,
        contactInfo: {
          email: TEST_USER.email
        }
      });
      await testTenant.save();
      console.log('Test tenant created');
    } else {
      console.log('Test tenant already exists');
    }

    // Check if test user already exists
    let testUser = await User.findOne({ email: TEST_USER.email });
    
    if (!testUser) {
      // Create test user (password will be hashed by the User model's pre-save middleware)
      testUser = new User({
        tenantId: testTenant._id,
        email: TEST_USER.email,
        password: TEST_USER.password, // Plain text password - will be hashed by middleware
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        role: TEST_USER.role,
        emailVerified: true
      });
      await testUser.save();
      console.log('Test user created');
    } else {
      console.log('Test user already exists');
    }

    console.log('\n=== Test Account Details ===');
    console.log('Email:', TEST_USER.email);
    console.log('Password:', TEST_USER.password);
    console.log('Role:', TEST_USER.role);
    console.log('Tenant:', testTenant.name);
    console.log('============================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

// Run the script
createTestUser();
