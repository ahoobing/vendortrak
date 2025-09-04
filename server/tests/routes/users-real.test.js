const request = require('supertest');
const express = require('express');
const userRoutes = require('../../routes/users-debug');
const authMiddleware = require('../../middleware/auth-debug');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const { createTestTenant, createTestUser, generateTestToken } = require('../utils/testUtils');

describe('User Management - Real Server Tests', () => {
  let app;
  let testTenant, adminUser, regularUser, adminToken, regularToken;

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Tenant.deleteMany({});

    // Create test app with real middleware
    app = express();
    app.use(express.json());
    
    // Use real authentication middleware
    app.use('/api/users', authMiddleware.authenticateToken, userRoutes);

    // Create test data
    testTenant = await createTestTenant();
    
    adminUser = await createTestUser({
      role: 'admin',
      tenantId: testTenant._id,
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User'
    });
    adminToken = generateTestToken(adminUser._id);
    
    regularUser = await createTestUser({
      role: 'regular',
      tenantId: testTenant._id,
      email: 'regular@test.com',
      firstName: 'Regular',
      lastName: 'User'
    });
    regularToken = generateTestToken(regularUser._id);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Tenant.deleteMany({});
  });

  describe('GET /api/users', () => {
    test('should get users successfully with admin permissions', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('should allow regular user to view users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/users/:id', () => {
    test('should get user by ID successfully with admin permissions', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user._id).toBe(regularUser._id.toString());
    });

    test('should allow regular user to view user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user._id).toBe(adminUser._id.toString());
    });
  });

  describe('POST /api/users', () => {
    test('should create new user successfully with admin permissions', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'regular',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    test('should return 403 for non-admin user', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'regular',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(userData)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user successfully with admin permissions', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.firstName).toBe(updateData.firstName);
    });

    test('should return 403 for non-admin user', async () => {
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user successfully with admin permissions', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
    });

    test('should delete user successfully (including own account)', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
    });

    test('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/users/stats', () => {
    test('should get user statistics successfully with admin permissions', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.active).toBeDefined();
    });

    test('should allow regular user to view stats', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.total).toBeDefined();
    });
  });

  describe('GET /api/users/permissions', () => {
    test('should get user permissions successfully', async () => {
      const response = await request(app)
        .get('/api/users/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.permissions).toBeDefined();
      expect(response.body.permissions.canManageUsers).toBe(true);
    });

    test('should return permissions for regular user', async () => {
      const response = await request(app)
        .get('/api/users/permissions')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.permissions).toBeDefined();
      expect(response.body.permissions.canManageUsers).toBe(false);
    });
  });
});
