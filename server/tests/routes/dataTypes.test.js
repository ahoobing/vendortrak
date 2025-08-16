const request = require('supertest');
const mongoose = require('mongoose');

// Set test environment before importing app
process.env.NODE_ENV = 'test';

const app = require('../../index');
const { createTestTenant, createTestUser, createTestDataType } = require('../utils/testUtils');

describe('Data Types Routes', () => {
  let testTenant, testUser, testDataType, authToken;

  beforeEach(async () => {
    testTenant = await createTestTenant();
    testUser = await createTestUser({ role: 'admin' }, testTenant._id);
    testDataType = await createTestDataType({}, testTenant._id, testUser._id);

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/data-types/classifications', () => {
    test('should return all available classifications', async () => {
      const response = await request(app)
        .get('/api/data-types/classifications')
        .expect(200);

      expect(response.body.classifications).toEqual([
        'Personal Data',
        'Sensitive Personal Data',
        'Financial Data',
        'Health Data',
        'Business Data',
        'Technical Data',
        'Legal Data',
        'Other'
      ]);
    });
  });

  describe('GET /api/data-types/available', () => {
    test('should return all active data types', async () => {
      const response = await request(app)
        .get('/api/data-types/available')
        .expect(200);

      expect(response.body.dataTypes).toBeDefined();
      expect(Array.isArray(response.body.dataTypes)).toBe(true);
      expect(response.body.dataTypes.length).toBeGreaterThan(0);
      
      const dataType = response.body.dataTypes[0];
      expect(dataType).toHaveProperty('_id');
      expect(dataType).toHaveProperty('name');
      expect(dataType).toHaveProperty('description');
      expect(dataType).toHaveProperty('classification');
      expect(dataType).toHaveProperty('riskLevel');
    });
  });

  describe('GET /api/data-types', () => {
    test('should return data types with pagination', async () => {
      const response = await request(app)
        .get('/api/data-types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.dataTypes).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    test('should filter by search query', async () => {
      const response = await request(app)
        .get('/api/data-types?search=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.dataTypes).toBeDefined();
      expect(response.body.dataTypes.length).toBeGreaterThan(0);
    });

    test('should filter by classification', async () => {
      const response = await request(app)
        .get('/api/data-types?classification=Personal Data')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.dataTypes).toBeDefined();
    });

    test('should filter by risk level', async () => {
      const response = await request(app)
        .get('/api/data-types?riskLevel=Medium')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.dataTypes).toBeDefined();
    });

    test('should filter by active status', async () => {
      const response = await request(app)
        .get('/api/data-types?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.dataTypes).toBeDefined();
    });

    test('should sort data types', async () => {
      const response = await request(app)
        .get('/api/data-types?sortBy=name&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.dataTypes).toBeDefined();
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/data-types')
        .expect(401);
    });
  });

  describe('GET /api/data-types/stats', () => {
    test('should return data type statistics', async () => {
      const response = await request(app)
        .get('/api/data-types/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.total).toBeGreaterThan(0);
      expect(response.body.stats.active).toBeGreaterThan(0);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/data-types/stats')
        .expect(401);
    });
  });

  describe('POST /api/data-types', () => {
    test('should create a new data type', async () => {
      const newDataType = {
        name: `Test Data Type ${Date.now()}`, // Make name unique
        description: 'Test description',
        classification: 'Personal Data',
        riskLevel: 'Medium',
        complianceRequirements: ['GDPR'],
        retentionPeriod: 12,
        isActive: true
      };

      const response = await request(app)
        .post('/api/data-types')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newDataType)
        .expect(201);
      expect(response.body.dataType).toBeDefined();
      expect(response.body.dataType.name).toBe(newDataType.name);
      expect(response.body.dataType.description).toBe(newDataType.description);
      expect(response.body.dataType.classification).toBe(newDataType.classification);
      expect(response.body.dataType.riskLevel).toBe(newDataType.riskLevel);
    });

    test('should return 400 for invalid data', async () => {
      const invalidDataType = {
        name: '', // Invalid: empty name
        description: 'Test description',
        classification: 'Invalid Classification', // Invalid classification
        riskLevel: 'Invalid Risk' // Invalid risk level
      };

      const response = await request(app)
        .post('/api/data-types')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDataType)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/data-types')
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('GET /api/data-types/:id', () => {
    test('should return a specific data type', async () => {
      const response = await request(app)
        .get(`/api/data-types/${testDataType._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.dataType).toBeDefined();
      expect(response.body.dataType._id).toBe(testDataType._id.toString());
    });

    test('should return 404 for non-existent data type', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/data-types/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/data-types/${testDataType._id}`)
        .expect(401);
    });
  });

  describe('PUT /api/data-types/:id', () => {
    test('should update a data type', async () => {
      const updateData = {
        name: 'Updated Data Type',
        description: 'Updated description',
        classification: 'Personal Data',
        riskLevel: 'High',
        isActive: true
      };

      const response = await request(app)
        .put(`/api/data-types/${testDataType._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.dataType).toBeDefined();
      expect(response.body.dataType.name).toBe(updateData.name);
      expect(response.body.dataType.description).toBe(updateData.description);
      expect(response.body.dataType.riskLevel).toBe(updateData.riskLevel);
    });

    test('should return 404 for non-existent data type', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/data-types/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'Updated',
          description: 'Updated description',
          classification: 'Personal Data',
          riskLevel: 'Medium',
          isActive: true
        })
        .expect(404);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .put(`/api/data-types/${testDataType._id}`)
        .send({ name: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/data-types/:id', () => {
    test('should delete a data type', async () => {
      await request(app)
        .delete(`/api/data-types/${testDataType._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's deleted
      await request(app)
        .get(`/api/data-types/${testDataType._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should return 404 for non-existent data type', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/data-types/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .delete(`/api/data-types/${testDataType._id}`)
        .expect(401);
    });
  });
});