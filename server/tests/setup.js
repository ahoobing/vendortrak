const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Setup MongoDB Memory Server
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Disconnect any existing connection first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(uri);
}, 30000);

// Clean up after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      try {
        await collection.deleteMany({});
      } catch (error) {
        // Ignore cleanup errors
        console.warn(`Cleanup warning for collection ${key}:`, error.message);
      }
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.CLIENT_URL = 'http://localhost:3000';