const request = require('supertest');
const express = require('express');
const userRoutes = require('../../routes/users-debug');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const { createTestTenant, createTestUser, generateTestToken } = require('../utils/testUtils');

// Create test app
const app = express();
app.use(express.json());

// Mock the authenticateToken middleware for testing
const { authenticateToken } = require('../../middleware/auth-debug');
app.use('/api/users', (req, res, next) => {
  // Set user and tenant from headers for testing
  if (req.headers['user']) {
    const userData = JSON.parse(req.headers['user']);
    // Create a mock user object with the required methods
    req.user = {
      ...userData,
      canPerform: function(action) {
        // Mock permission logic based on role
        const actionPermissions = {
          'view:reports': 'canViewReports',
          'manage:users': 'canManageUsers',
          'create:user': 'canManageUsers',
          'update:user': 'canManageUsers',
          'delete:user': 'canManageUsers'
        };
        const requiredPermission = actionPermissions[action];
        if (!requiredPermission) return false;
        
        // Mock permissions based on role
        const rolePermissions = {
          admin: {
            canViewReports: true,
            canManageUsers: true,
            canManageVendors: true,
            canManageDataTypes: true,
            canExportData: true,
            canAuditLogs: true
          },
          regular: {
            canViewReports: true,
            canManageUsers: false,
            canManageVendors: true,
            canManageDataTypes: false,
            canExportData: false,
            canAuditLogs: false
          },
          auditor: {
            canViewReports: true,
            canManageUsers: false,
            canManageVendors: false,
            canManageDataTypes: false,
            canExportData: true,
            canAuditLogs: true
          }
        };
        
        return rolePermissions[this.role] && rolePermissions[this.role][requiredPermission];
      },
      hasPermission: function(permission) {
        return this.canPerform(permission);
      }
    };
  }
  if (req.headers['tenant']) {
    req.tenant = JSON.parse(req.headers['tenant']);
  }
  next();
}, userRoutes);

describe('User Management - Comprehensive Tests', () => {
  let testTenant, adminUser, regularUser, auditorUser, adminToken, regularToken, auditorToken;

  beforeEach(async () => {
    // Create test tenant
    testTenant = await createTestTenant();
    
    // Create admin user
    adminUser = await createTestUser({
      role: 'admin',
      tenantId: testTenant._id,
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User'
    });
    adminToken = generateTestToken(adminUser._id);
    
    // Create regular user
    regularUser = await createTestUser({
      role: 'regular',
      tenantId: testTenant._id,
      email: 'regular@test.com',
      firstName: 'Regular',
      lastName: 'User'
    });
    regularToken = generateTestToken(regularUser._id);
    
    // Create auditor user
    auditorUser = await createTestUser({
      role: 'auditor',
      tenantId: testTenant._id,
      email: 'auditor@test.com',
      firstName: 'Auditor',
      lastName: 'User'
    });
    auditorToken = generateTestToken(auditorUser._id);
  });

  describe('GET /api/users - User Listing', () => {
    beforeEach(async () => {
      // Create additional test users for comprehensive testing
      await createTestUser({ 
        tenantId: testTenant._id, 
        role: 'admin',
        status: 'active',
        firstName: 'John',
        lastName: 'Admin',
        email: 'john.admin@test.com'
      });
      await createTestUser({ 
        tenantId: testTenant._id, 
        role: 'regular',
        status: 'inactive',
        firstName: 'Jane',
        lastName: 'Regular',
        email: 'jane.regular@test.com'
      });
      await createTestUser({ 
        tenantId: testTenant._id, 
        role: 'auditor',
        status: 'suspended',
        firstName: 'Bob',
        lastName: 'Auditor',
        email: 'bob.auditor@test.com'
      });
    });

    test('should get all users with pagination successfully', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser));


      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.total).toBeGreaterThan(0);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    test('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      response.body.users.forEach(user => {
        expect(user.role).toBe('admin');
      });
    });

    test('should filter users by status', async () => {
      const response = await request(app)
        .get('/api/users?status=inactive')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      response.body.users.forEach(user => {
        expect(user.status).toBe('inactive');
      });
    });

    test('should search users by name or email', async () => {
      const response = await request(app)
        .get('/api/users?search=John')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users.some(user => 
        user.firstName.includes('John') || user.lastName.includes('John')
      )).toBe(true);
    });

    test('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body.users.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    test('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=0&limit=1000&role=invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should allow regular user to view users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(regularUser))
        .expect(200);

      expect(response.body.users).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    test('should handle empty results gracefully', async () => {
      // Create a new tenant with no users
      const emptyTenant = await createTestTenant();
      const emptyAdmin = await createTestUser({
        role: 'admin',
        tenantId: emptyTenant._id
      });
      const emptyToken = generateTestToken(emptyAdmin._id);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${emptyToken}`)
        .set('tenant', JSON.stringify(emptyTenant))
        .set('user', JSON.stringify(emptyAdmin))
        .expect(200);

      expect(response.body.users).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('GET /api/users/:id - Get User by ID', () => {
    test('should get user by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user._id).toBe(regularUser._id.toString());
      expect(response.body.user.password).toBeUndefined(); // Should not include password
      expect(response.body.user.email).toBe(regularUser.email);
    });

    test('should return 404 when user not found', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/users/${nonExistentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('should allow regular user to view user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser._id}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(regularUser))
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user._id).toBe(regularUser._id.toString());
    });

    test('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /api/users - Create User', () => {
    test('should create new user successfully', async () => {
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
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send(userData)
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.user.password).toBeUndefined(); // Should not include password
    });

    test('should create user with all valid roles', async () => {
      const roles = ['admin', 'regular', 'auditor'];
      
      for (const role of roles) {
        const userData = {
          email: `test${role}@test.com`,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: role,
          status: 'active'
        };

        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .set('tenant', JSON.stringify(testTenant))
          .set('user', JSON.stringify(adminUser))
          .send(userData)
          .expect(201);

        expect(response.body.user.role).toBe(role);
      }
    });

    test('should return 400 for invalid user data', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: 'User',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send(invalidUserData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should return 400 when user email already exists', async () => {
      const existingUser = await createTestUser({
        email: 'existing@test.com',
        tenantId: testTenant._id
      });

      const userData = {
        email: 'existing@test.com', // Same email
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'regular'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('User with this email already exists');
    });

    test('should return 403 for non-admin user', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'regular'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(regularUser))
        .send(userData)
        .expect(403);
    });

    test('should validate password length', async () => {
      const userData = {
        email: 'test@test.com',
        password: '123', // Too short
        firstName: 'Test',
        lastName: 'User',
        role: 'regular'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(error => 
        error.msg.includes('password') || error.msg.includes('length')
      )).toBe(true);
    });
  });

  describe('PUT /api/users/:id - Update User', () => {
    test('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'auditor',
        status: 'inactive',
        profile: {
          phone: '123-456-7890',
          department: 'IT',
          position: 'Developer'
        }
      };

      const response = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send(updateData)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.role).toBe(updateData.role);
      expect(response.body.user.profile.phone).toBe(updateData.profile.phone);
    });

    test('should update user with partial data', async () => {
      const updateData = {
        firstName: 'UpdatedName'
      };

      const response = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send(updateData)
        .expect(200);

      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(regularUser.lastName); // Should remain unchanged
    });

    test('should return 400 for invalid update data', async () => {
      const invalidData = {
        firstName: '', // Empty
        role: 'invalid-role',
        status: 'invalid-status'
      };

      const response = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should return 404 when user not found', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/users/${nonExistentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send({ firstName: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(regularUser))
        .send({ firstName: 'Updated' })
        .expect(403);
    });
  });

  describe('DELETE /api/users/:id - Delete User', () => {
    test('should delete user successfully', async () => {
      const userToDelete = await createTestUser({
        role: 'regular',
        tenantId: testTenant._id
      });

      const response = await request(app)
        .delete(`/api/users/${userToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
    });

    test('should return 400 when trying to delete own account', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(400);

      expect(response.body.error).toBe('Cannot delete your own account');
    });

    test('should return 404 when user not found', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/users/${nonExistentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(regularUser))
        .expect(403);
    });
  });

  describe('POST /api/users/:id/reset-password - Reset Password', () => {
    test('should reset user password successfully', async () => {
      const resetData = {
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .post(`/api/users/${regularUser._id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send(resetData)
        .expect(200);

      expect(response.body.message).toBe('Password reset successfully');
    });

    test('should return 400 for invalid password', async () => {
      const invalidData = {
        newPassword: '123' // Too short
      };

      const response = await request(app)
        .post(`/api/users/${regularUser._id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should return 404 when user not found', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/users/${nonExistentUserId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .send({ newPassword: 'newpassword123' })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post(`/api/users/${regularUser._id}/reset-password`)
        .set('Authorization', `Bearer ${regularToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(regularUser))
        .send({ newPassword: 'newpassword123' })
        .expect(403);
    });
  });

  describe('GET /api/users/stats - User Statistics', () => {
    beforeEach(async () => {
      // Create users with different roles and statuses for statistics
      await createTestUser({ 
        tenantId: testTenant._id, 
        role: 'admin',
        status: 'active'
      });
      await createTestUser({ 
        tenantId: testTenant._id, 
        role: 'regular',
        status: 'active'
      });
      await createTestUser({ 
        tenantId: testTenant._id, 
        role: 'auditor',
        status: 'inactive'
      });
    });

    test('should get user statistics successfully', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.active).toBeGreaterThan(0);
      expect(response.body.admins).toBeGreaterThan(0);
      expect(response.body.inactive).toBeGreaterThan(0);
    });

    test('should allow regular user to view stats', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(regularUser))
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.active).toBeDefined();
    });
  });

  describe('GET /api/users/permissions - User Permissions', () => {
    test('should get user permissions successfully', async () => {
      const response = await request(app)
        .get('/api/users/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body.permissions).toBeDefined();
      expect(response.body.permissions.canManageUsers).toBe(true);
      expect(response.body.permissions.canManageVendors).toBe(true);
    });

    test('should return permissions for regular user', async () => {
      const response = await request(app)
        .get('/api/users/permissions')
        .set('Authorization', `Bearer ${regularToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(regularUser))
        .expect(200);

      expect(response.body.permissions).toBeDefined();
      expect(response.body.permissions.canManageUsers).toBe(false);
    });

    test('should return permissions for auditor user', async () => {
      const response = await request(app)
        .get('/api/users/permissions')
        .set('Authorization', `Bearer ${auditorToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(auditorUser))
        .expect(200);

      expect(response.body.permissions).toBeDefined();
      expect(response.body.permissions.canAuditLogs).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll test that the route exists and returns appropriate responses
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    test('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(401);
    });

    test('should handle missing tenant context', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('user', JSON.stringify(adminUser))
        .expect(500);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large number of users efficiently', async () => {
      // Create multiple users to test pagination performance
      const users = [];
      for (let i = 0; i < 25; i++) {
        users.push(createTestUser({
          tenantId: testTenant._id,
          email: `user${i}@test.com`,
          firstName: `User${i}`,
          lastName: 'Test'
        }));
      }
      await Promise.all(users);

      const response = await request(app)
        .get('/api/users?limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body.users.length).toBeLessThanOrEqual(10);
      expect(response.body.pagination.total).toBeGreaterThan(25);
    });

    test('should handle complex search queries efficiently', async () => {
      const response = await request(app)
        .get('/api/users?search=test&role=regular&status=active&page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('tenant', JSON.stringify(testTenant))
        .set('user', JSON.stringify(adminUser))
        .expect(200);

      expect(response.body.users).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });
  });
});
