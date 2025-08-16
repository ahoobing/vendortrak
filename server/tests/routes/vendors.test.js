const request = require('supertest');
const express = require('express');
const vendorRoutes = require('../../routes/vendors');
const { authenticateToken } = require('../../middleware/auth');
const { createTestTenant, createTestUser, createTestVendor, generateTestToken } = require('../utils/testUtils');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/vendors', authenticateToken, vendorRoutes);

describe('Vendor Routes', () => {
  let testTenant;
  let testUser;
  let authToken;

  beforeEach(async () => {
    testTenant = await createTestTenant();
    testUser = await createTestUser({ 
      role: 'admin',
      email: `admin${Date.now()}@example.com`
    }, testTenant._id);
    authToken = generateTestToken(testUser._id);
  });

  describe('GET /api/vendors', () => {
    test('should get all vendors for tenant', async () => {
      // Create test vendors
      const vendor1 = await createTestVendor({ 
        name: 'Vendor 1',
        email: 'vendor1@example.com'
      }, testTenant._id, testUser._id);
      const vendor2 = await createTestVendor({ 
        name: 'Vendor 2',
        email: 'vendor2@example.com'
      }, testTenant._id, testUser._id);

      const response = await request(app)
        .get('/api/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.vendors).toBeDefined();
      expect(response.body.vendors.length).toBe(2);
      expect(response.body.pagination.total).toBe(2);
    });

    test('should filter vendors by status', async () => {
      const activeVendor = await createTestVendor({ 
        status: 'active',
        email: 'active@example.com'
      }, testTenant._id, testUser._id);
      const inactiveVendor = await createTestVendor({ 
        status: 'inactive',
        email: 'inactive@example.com'
      }, testTenant._id, testUser._id);

      const response = await request(app)
        .get('/api/vendors?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.vendors.length).toBe(1);
      expect(response.body.vendors[0].status).toBe('active');
    });

    test('should search vendors by name', async () => {
      const vendor1 = await createTestVendor({ 
        name: 'ABC Company',
        email: 'abc@example.com'
      }, testTenant._id, testUser._id);
      const vendor2 = await createTestVendor({ 
        name: 'XYZ Corp',
        email: 'xyz@example.com'
      }, testTenant._id, testUser._id);

      const response = await request(app)
        .get('/api/vendors?search=ABC')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.vendors.length).toBe(1);
      expect(response.body.vendors[0].name).toBe('ABC Company');
    });

    test('should paginate results', async () => {
      // Create multiple vendors
      for (let i = 1; i <= 15; i++) {
        await createTestVendor({ 
          name: `Vendor ${i}`,
          email: `vendor${i}@example.com`
        }, testTenant._id, testUser._id);
      }

      const response = await request(app)
        .get('/api/vendors?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.vendors.length).toBe(10);
      expect(response.body.pagination.total).toBe(15);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/vendors')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/vendors/:id', () => {
    test('should get vendor by ID', async () => {
      const vendor = await createTestVendor({
        email: 'testvendor@example.com'
      }, testTenant._id, testUser._id);

      const response = await request(app)
        .get(`/api/vendors/${vendor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.vendor).toBeDefined();
      expect(response.body.vendor._id).toBe(vendor._id.toString());
      expect(response.body.vendor.name).toBe(vendor.name);
    });

    test('should return 404 for non-existent vendor', async () => {
      const nonExistentId = new (require('mongoose').Types.ObjectId)();

      const response = await request(app)
        .get(`/api/vendors/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Vendor not found');
    });

    test('should return 404 for vendor from different tenant', async () => {
      const otherTenant = await createTestTenant({ subdomain: 'other' });
      const otherUser = await createTestUser({
        email: 'other@example.com'
      }, otherTenant._id);
      const otherVendor = await createTestVendor({
        email: 'othervendor@example.com'
      }, otherTenant._id, otherUser._id);

      const response = await request(app)
        .get(`/api/vendors/${otherVendor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Vendor not found');
    });
  });

  describe('POST /api/vendors', () => {
    test('should create new vendor', async () => {
      const vendorData = {
        name: 'New Vendor',
        email: 'newvendor@example.com',
        phone: '123-456-7890',
        industry: 'Technology',
        address: '123 New St',
        city: 'New City',
        state: 'NC',
        zipCode: '54321',
        country: 'USA'
      };

      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vendorData)
        .expect(201);

      expect(response.body.vendor).toBeDefined();
      expect(response.body.vendor.name).toBe(vendorData.name);
      expect(response.body.vendor.email).toBe(vendorData.email);
      expect(response.body.vendor.tenantId).toBe(testTenant._id.toString());
    });

    test('should return 400 for invalid vendor data', async () => {
      const vendorData = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid email format
        phone: '123-456-7890'
      };

      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(vendorData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });


  });

  describe('PUT /api/vendors/:id', () => {
    test('should update vendor', async () => {
      const vendor = await createTestVendor({
        email: 'updatevendor@example.com'
      }, testTenant._id, testUser._id);

      const updateData = {
        name: 'Updated Vendor',
        email: 'updated@example.com',
        phone: '987-654-3210'
      };

      const response = await request(app)
        .put(`/api/vendors/${vendor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.vendor).toBeDefined();
      expect(response.body.vendor.name).toBe(updateData.name);
      expect(response.body.vendor.email).toBe(updateData.email);
      expect(response.body.vendor.phone).toBe(updateData.phone);
    });

    test('should return 404 for non-existent vendor', async () => {
      const nonExistentId = new (require('mongoose').Types.ObjectId)();

      const updateData = {
        name: 'Updated Vendor',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put(`/api/vendors/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Vendor not found');
    });

    test('should return 400 for invalid update data', async () => {
      const vendor = await createTestVendor({
        email: 'invalidupdate@example.com'
      }, testTenant._id, testUser._id);

      const updateData = {
        name: '', // Invalid: empty name
        email: 'invalid-email' // Invalid email format
      };

      const response = await request(app)
        .put(`/api/vendors/${vendor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/vendors/:id', () => {
    test('should delete vendor', async () => {
      const vendor = await createTestVendor({
        email: 'deletevendor@example.com'
      }, testTenant._id, testUser._id);

      const response = await request(app)
        .delete(`/api/vendors/${vendor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Vendor deleted successfully');

      // Verify vendor is deleted
      const getResponse = await request(app)
        .get(`/api/vendors/${vendor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should return 404 for non-existent vendor', async () => {
      const nonExistentId = new (require('mongoose').Types.ObjectId)();

      const response = await request(app)
        .delete(`/api/vendors/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Vendor not found');
    });
  });


});