const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const newsRoutes = require('../../routes/news');
const { authenticateToken } = require('../../middleware/auth');
const { createTestTenant, createTestUser, createTestVendor, generateTestToken } = require('../utils/testUtils');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/news', authenticateToken, newsRoutes);

describe('News Routes', () => {
  let testTenant;
  let testUser;
  let testVendor;
  let authToken;

  beforeEach(async () => {
    testTenant = await createTestTenant();
    testUser = await createTestUser({ 
      role: 'admin',
      email: `admin${Date.now()}@example.com`
    }, testTenant._id);
    testVendor = await createTestVendor({}, testTenant._id, testUser._id);
    authToken = generateTestToken(testUser._id);
  });

  describe('GET /api/news/vendors', () => {
    it('should return vendor news', async () => {
      const response = await request(app)
        .get('/api/news/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.news).toBeDefined();
      expect(Array.isArray(response.body.news)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(response.body.limit).toBeDefined();
      expect(response.body.offset).toBeDefined();
    });

    it('should filter by vendor ID', async () => {
      const response = await request(app)
        .get(`/api/news/vendors?vendorId=${testVendor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.news).toBeDefined();
      expect(Array.isArray(response.body.news)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/news/vendors?category=security')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.news).toBeDefined();
      expect(Array.isArray(response.body.news)).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/news/vendors?limit=5&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.limit).toBe(5);
      expect(response.body.offset).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/news/vendors')
        .expect(401);
    });
  });

  describe('GET /api/news/industry', () => {
    it('should return industry news', async () => {
      const response = await request(app)
        .get('/api/news/industry')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.news).toBeDefined();
      expect(Array.isArray(response.body.news)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(response.body.limit).toBeDefined();
      expect(response.body.offset).toBeDefined();
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/news/industry?limit=3&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.limit).toBe(3);
      expect(response.body.offset).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/news/industry')
        .expect(401);
    });
  });

  describe('GET /api/news/security-alerts', () => {
    it('should return security alerts', async () => {
      const response = await request(app)
        .get('/api/news/security-alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.alerts).toBeDefined();
      expect(Array.isArray(response.body.alerts)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(response.body.limit).toBeDefined();
      expect(response.body.offset).toBeDefined();
    });

    it('should filter by severity', async () => {
      const response = await request(app)
        .get('/api/news/security-alerts?severity=critical')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.alerts).toBeDefined();
      expect(Array.isArray(response.body.alerts)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/news/security-alerts')
        .expect(401);
    });
  });

  describe('GET /api/news/vendors/:vendorId', () => {
    it('should return vendor-specific news', async () => {
      const response = await request(app)
        .get(`/api/news/vendors/${testVendor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.news).toBeDefined();
      expect(Array.isArray(response.body.news)).toBe(true);
      expect(response.body.vendor).toBeDefined();
      expect(response.body.vendor.id).toBe(testVendor._id.toString());
      expect(response.body.vendor.name).toBe(testVendor.name);
    });

    it('should return 404 for non-existent vendor', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/news/vendors/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/news/vendors/${testVendor._id}`)
        .expect(401);
    });
  });

  describe('GET /api/news/stats', () => {
    it('should return news statistics', async () => {
      const response = await request(app)
        .get('/api/news/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalNewsItems).toBeDefined();
      expect(response.body.stats.securityAlerts).toBeDefined();
      expect(response.body.stats.criticalIssues).toBeDefined();
      expect(response.body.stats.highRiskIssues).toBeDefined();
      expect(response.body.stats.mediumRiskIssues).toBeDefined();
      expect(response.body.stats.lowRiskIssues).toBeDefined();
      expect(response.body.stats.vendorsWithNews).toBeDefined();
      expect(response.body.stats.lastUpdated).toBeDefined();
      expect(response.body.stats.newsSources).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/news/stats')
        .expect(401);
    });
  });
});
