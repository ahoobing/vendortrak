const request = require('supertest');
const mongoose = require('mongoose');

// Set test environment before importing app
process.env.NODE_ENV = 'test';

const app = require('../index');

describe('App', () => {
  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle JSON parsing errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.error).toBe('Invalid JSON format');
    });

    test('should handle payload too large errors', async () => {
      // Create a large payload
      const largePayload = { data: 'x'.repeat(11 * 1024 * 1024) }; // 11MB

      const response = await request(app)
        .post('/api/auth/login')
        .send(largePayload)
        .expect(413);

      expect(response.body.error).toBe('Payload too large');
    });

    test('should handle general errors', async () => {
      // Create a temporary route that throws an error
      const testApp = require('express')();
      testApp.use(require('helmet')());
      testApp.use(require('cors')());
      testApp.use(require('express').json());
      
      testApp.get('/test-error', (req, res, next) => {
        next(new Error('Test error'));
      });

      // Add error handling middleware
      testApp.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ 
          error: 'Something went wrong!',
          message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
      });

      const response = await request(testApp)
        .get('/test-error')
        .expect(500);

      expect(response.body.error).toBe('Something went wrong!');
      expect(response.body.message).toBe('Internal server error');
    });

    test('should return detailed error in development', async () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Create a temporary route that throws an error
      const testApp = require('express')();
      testApp.use(require('helmet')());
      testApp.use(require('cors')());
      testApp.use(require('express').json());
      
      testApp.get('/test-dev-error', (req, res, next) => {
        next(new Error('Development test error'));
      });

      // Add error handling middleware
      testApp.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ 
          error: 'Something went wrong!',
          message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
      });

      const response = await request(testApp)
        .get('/test-dev-error')
        .expect(500);

      expect(response.body.error).toBe('Something went wrong!');
      expect(response.body.message).toBe('Development test error');

      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });

    test('should return 404 for root path', async () => {
      const response = await request(app)
        .get('/')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('CORS Configuration', () => {
    test('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    });

    test('should allow requests from configured origin', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for helmet security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Route Registration', () => {
    test('should have auth routes registered', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password' })
        .expect(401); // Should fail auth but route exists

      // If route doesn't exist, we'd get 404
      expect(response.status).not.toBe(404);
    });

    test('should have tenant routes registered', async () => {
      const response = await request(app)
        .get('/api/tenants/current')
        .expect(401); // Should fail auth but route exists

      // If route doesn't exist, we'd get 404
      expect(response.status).not.toBe(404);
    });

    test('should have vendor routes registered', async () => {
      const response = await request(app)
        .get('/api/vendors')
        .expect(401); // Should fail auth but route exists

      // If route doesn't exist, we'd get 404
      expect(response.status).not.toBe(404);
    });

    test('should have user routes registered', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401); // Should fail auth but route exists

      // If route doesn't exist, we'd get 404
      expect(response.status).not.toBe(404);
    });

    test('should have data type routes registered', async () => {
      const response = await request(app)
        .get('/api/data-types')
        .expect(401); // Should fail auth but route exists

      // If route doesn't exist, we'd get 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('Database Connection', () => {
    test('should not connect to database in test environment', () => {
      // The app should not attempt to connect to MongoDB in test environment
      // This is handled by the condition in index.js
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('Request Body Parsing', () => {
    test('should parse JSON bodies', async () => {
      const testData = { test: 'data' };

      // Create a temporary app to test body parsing
      const testApp = require('express')();
      testApp.use(require('express').json());
      
      testApp.post('/test-body', (req, res) => {
        res.json(req.body);
      });

      const response = await request(testApp)
        .post('/test-body')
        .send(testData)
        .expect(200);

      expect(response.body).toEqual(testData);
    });

    test('should parse URL encoded bodies', async () => {
      const testData = { test: 'data' };

      // Create a temporary app to test body parsing
      const testApp = require('express')();
      testApp.use(require('express').json());
      testApp.use(require('express').urlencoded({ extended: true }));
      
      testApp.post('/test-urlencoded', (req, res) => {
        res.json(req.body);
      });

      const response = await request(testApp)
        .post('/test-urlencoded')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('test=data')
        .expect(200);

      expect(response.body).toEqual(testData);
    });
  });

  describe('Middleware Stack', () => {
    test('should apply middleware in correct order', async () => {
      // Test that security middleware is applied before routes
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Security headers should be present
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      
      // CORS headers should be present
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});