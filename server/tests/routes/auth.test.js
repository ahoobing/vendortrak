const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const { createTestTenant, createTestUser, generateTestToken } = require('../utils/testUtils');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    test('should register new tenant and admin user successfully', async () => {
      const registerData = {
        tenant: {
          name: 'Test Company',
          domain: 'testcompany.com',
          subdomain: 'testcompany'
        },
        user: {
          email: 'admin@testcompany.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Admin'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.message).toBe('Tenant and admin user created successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.tenant).toBeDefined();
      expect(response.body.user.tenant.name).toBe(registerData.tenant.name);
    });

    test('should return 400 for invalid tenant data', async () => {
      const registerData = {
        tenant: {
          name: 'T', // Too short
          domain: 'testcompany.com',
          subdomain: 'testcompany'
        },
        user: {
          email: 'admin@testcompany.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Admin'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should return 400 for invalid user data', async () => {
      const registerData = {
        tenant: {
          name: 'Test Company',
          domain: 'testcompany.com',
          subdomain: 'testcompany'
        },
        user: {
          email: 'invalid-email',
          password: '123', // Too short
          firstName: '',
          lastName: 'Admin'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should return 400 when tenant already exists', async () => {
      const existingTenant = await createTestTenant({
        domain: 'existing.com',
        subdomain: 'existing'
      });

      const registerData = {
        tenant: {
          name: 'Test Company',
          domain: 'existing.com', // Already exists
          subdomain: 'testcompany'
        },
        user: {
          email: 'admin@testcompany.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Admin'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.error).toBe('Tenant with this domain or subdomain already exists');
    });

    test('should return 400 when user email already exists', async () => {
      const existingUser = await createTestUser({
        email: 'existing@example.com'
      });

      const registerData = {
        tenant: {
          name: 'Test Company',
          domain: 'testcompany.com',
          subdomain: 'testcompany'
        },
        user: {
          email: 'existing@example.com', // Already exists
          password: 'password123',
          firstName: 'John',
          lastName: 'Admin'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.error).toBe('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let testTenant;
    let testUser;

    beforeEach(async () => {
      testTenant = await createTestTenant();
      testUser = await createTestUser({
        email: 'test@example.com',
        password: 'password123'
      }, testTenant._id);
    });

    test('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.tenant).toBeDefined();
    });

    test('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should return 401 for inactive user', async () => {
      const inactiveUser = await createTestUser({
        email: 'inactive@example.com',
        password: 'password123',
        status: 'inactive'
      }, testTenant._id);

      const loginData = {
        email: 'inactive@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('User account is not active');
    });

    test('should return 401 for inactive tenant', async () => {
      const inactiveTenant = await createTestTenant({ status: 'inactive' });
      const userInInactiveTenant = await createTestUser({
        email: 'inactive@example.com',
        password: 'password123'
      }, inactiveTenant._id);

      const loginData = {
        email: 'inactive@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Tenant account is not active');
    });

    test('should return 400 for missing email', async () => {
      const loginData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 for missing password', async () => {
      const loginData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/auth/profile', () => {
    let testTenant;
    let testUser;
    let authToken;

    beforeEach(async () => {
      testTenant = await createTestTenant();
      testUser = await createTestUser({}, testTenant._id);
      authToken = generateTestToken(testUser._id);
    });

    test('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(testUser._id.toString());
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.tenant).toBeDefined();
      expect(response.body.user.tenant._id).toBe(testTenant._id.toString());
    });

    test('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });



  describe('POST /api/auth/logout', () => {
    let testTenant;
    let testUser;
    let authToken;

    beforeEach(async () => {
      testTenant = await createTestTenant();
      testUser = await createTestUser({}, testTenant._id);
      authToken = generateTestToken(testUser._id);
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });

    test('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });
});