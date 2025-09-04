const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin, requirePermission } = require('../../middleware/auth-debug');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const { createTestTenant, createTestUser, createMockRequest, createMockResponse, createMockNext } = require('../utils/testUtils');

describe('Authentication Middleware - Comprehensive Tests', () => {
  let testTenant, adminUser, regularUser, auditorUser;

  beforeEach(async () => {
    testTenant = await createTestTenant();
    
    adminUser = await createTestUser({
      role: 'admin',
      tenantId: testTenant._id,
      email: 'admin@test.com'
    });
    
    regularUser = await createTestUser({
      role: 'regular',
      tenantId: testTenant._id,
      email: 'regular@test.com'
    });
    
    auditorUser = await createTestUser({
      role: 'auditor',
      tenantId: testTenant._id,
      email: 'auditor@test.com'
    });
  });

  describe('authenticateToken', () => {
    test('should authenticate valid token successfully', async () => {
      const token = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(adminUser._id.toString());
      expect(req.user.email).toBe(adminUser.email);
    });

    test('should return 401 for missing token', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 for invalid token format', async () => {
      const req = createMockRequest({
        headers: {
          authorization: 'InvalidToken'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 for expired token', async () => {
      const token = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '-1h' } // Expired token
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 for invalid token signature', async () => {
      const token = jwt.sign(
        { userId: adminUser._id },
        'wrong-secret-key',
        { expiresIn: '24h' }
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 for non-existent user', async () => {
      const token = jwt.sign(
        { userId: '507f1f77bcf86cd799439011' }, // Non-existent user ID
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should populate tenant information', async () => {
      const token = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(req.user.tenantId).toBeDefined();
      expect(req.tenant).toBeDefined();
      expect(req.tenant._id.toString()).toBe(testTenant._id.toString());
    });

    test('should handle inactive tenant', async () => {
      // Create an inactive tenant
      const inactiveTenant = await createTestTenant({ status: 'inactive' });
      const userInInactiveTenant = await createTestUser({
        role: 'admin',
        tenantId: inactiveTenant._id
      });

      const token = jwt.sign(
        { userId: userInInactiveTenant._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tenant is inactive' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle suspended user', async () => {
      const suspendedUser = await createTestUser({
        role: 'admin',
        tenantId: testTenant._id,
        status: 'suspended'
      });

      const token = jwt.sign(
        { userId: suspendedUser._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'User account is suspended' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle inactive user', async () => {
      const inactiveUser = await createTestUser({
        role: 'admin',
        tenantId: testTenant._id,
        status: 'inactive'
      });

      const token = jwt.sign(
        { userId: inactiveUser._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'User account is inactive' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    test('should allow admin users', async () => {
      const req = createMockRequest({
        user: adminUser
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should deny regular users', async () => {
      const req = createMockRequest({
        user: regularUser
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny auditor users', async () => {
      const req = createMockRequest({
        user: auditorUser
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle missing user', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    test('should allow admin users for any permission', async () => {
      const req = createMockRequest({
        user: adminUser
      });
      const res = createMockResponse();
      const next = createMockNext();

      requirePermission('manage:users')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should allow users with specific permission', async () => {
      const req = createMockRequest({
        user: auditorUser
      });
      const res = createMockResponse();
      const next = createMockNext();

      requirePermission('view:reports')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should deny users without specific permission', async () => {
      const req = createMockRequest({
        user: regularUser
      });
      const res = createMockResponse();
      const next = createMockNext();

      requirePermission('manage:users')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle missing user', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      requirePermission('manage:users')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle invalid permission', async () => {
      const req = createMockRequest({
        user: adminUser
      });
      const res = createMockResponse();
      const next = createMockNext();

      requirePermission('invalid:permission')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle multiple permissions', async () => {
      const permissions = [
        'manage:users',
        'manage:vendors',
        'manage:datatypes',
        'view:reports',
        'export:data',
        'view:audit'
      ];

      for (const permission of permissions) {
        const req = createMockRequest({
          user: adminUser
        });
        const res = createMockResponse();
        const next = createMockNext();

        requirePermission(permission)(req, res, next);

        expect(next).toHaveBeenCalled();
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // Mock User.findById to throw an error
      const originalFindById = User.findById;
      User.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const token = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();

      // Restore original method
      User.findById = originalFindById;
    });

    test('should handle malformed token', async () => {
      const req = createMockRequest({
        headers: {
          authorization: 'Bearer malformed.token.here'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle missing JWT secret', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const token = jwt.sign(
        { userId: adminUser._id },
        'test-secret-key',
        { expiresIn: '24h' }
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();

      // Restore original secret
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Performance', () => {
    test('should handle multiple concurrent authentications', async () => {
      const token = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );

      const promises = [];
      for (let i = 0; i < 10; i++) {
        const req = createMockRequest({
          headers: {
            authorization: `Bearer ${token}`
          }
        });
        const res = createMockResponse();
        const next = createMockNext();

        promises.push(authenticateToken(req, res, next));
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should cache user lookups efficiently', async () => {
      const token = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const startTime = Date.now();
      await authenticateToken(req, res, next);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(next).toHaveBeenCalled();
    });
  });
});
