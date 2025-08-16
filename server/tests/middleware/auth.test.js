const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole, requireAdmin, requireManager } = require('../../middleware/auth');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const { createTestTenant, createTestUser, generateTestToken, createMockRequest, createMockResponse, createMockNext } = require('../utils/testUtils');

describe('Auth Middleware', () => {
  let testTenant;
  let testUser;

  beforeEach(async () => {
    testTenant = await createTestTenant();
    testUser = await createTestUser({ role: 'user' }, testTenant._id);
  });

  describe('authenticateToken', () => {
    test('should authenticate valid token and set user and tenant', async () => {
      const token = generateTestToken(testUser._id);
      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
      expect(req.tenant).toBeDefined();
      expect(req.tenant._id.toString()).toBe(testTenant._id.toString());
    });

    test('should return 401 when no token provided', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when token format is invalid', async () => {
      const req = createMockRequest({
        headers: { authorization: 'InvalidToken' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when token is invalid', async () => {
      const req = createMockRequest({
        headers: { authorization: 'Bearer invalid-token' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '-1h' }
      );

      const req = createMockRequest({
        headers: { authorization: `Bearer ${expiredToken}` }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when user does not exist', async () => {
      const nonExistentUserId = new (require('mongoose').Types.ObjectId)();
      const token = generateTestToken(nonExistentUserId);

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when user is inactive', async () => {
      const inactiveUser = await createTestUser({ 
        status: 'inactive',
        email: 'inactive@example.com'
      }, testTenant._id);
      const token = generateTestToken(inactiveUser._id);

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User account is not active' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when tenant is inactive', async () => {
      const inactiveTenant = await createTestTenant({ status: 'inactive' });
      const userInInactiveTenant = await createTestUser({
        email: 'inactive-tenant@example.com'
      }, inactiveTenant._id);
      const token = generateTestToken(userInInactiveTenant._id);

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tenant account is not active' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 500 on unexpected error', async () => {
      // Mock User.findById to throw an error
      const originalFindById = User.findById;
      User.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const token = generateTestToken(testUser._id);
      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication error' });
      expect(next).not.toHaveBeenCalled();

      // Restore original method
      User.findById = originalFindById;
    });
  });

  describe('requireRole', () => {
    test('should allow access when user has required role', () => {
      const req = createMockRequest({
        user: { role: 'admin' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole(['admin', 'manager']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access when user does not have required role', () => {
      const req = createMockRequest({
        user: { role: 'user' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole(['admin', 'manager']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when user is not authenticated', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    test('should allow access for admin users', () => {
      const req = createMockRequest({
        user: { role: 'admin' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access for non-admin users', () => {
      const req = createMockRequest({
        user: { role: 'user' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireManager', () => {
    test('should allow access for admin users', () => {
      const req = createMockRequest({
        user: { role: 'admin' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireManager(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access for manager users', () => {
      const req = createMockRequest({
        user: { role: 'manager' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireManager(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access for regular users', () => {
      const req = createMockRequest({
        user: { role: 'user' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireManager(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});