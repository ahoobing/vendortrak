const mongoose = require('mongoose');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const { createTestTenant, createTestUser } = require('../utils/testUtils');

describe('User Model - Comprehensive Tests', () => {
  let testTenant;

  beforeEach(async () => {
    testTenant = await createTestTenant();
  });

  describe('Schema Validation', () => {
    test('should create a valid user with all required fields', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular',
        status: 'active'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.status).toBe(userData.status);
      expect(savedUser.tenantId.toString()).toBe(testTenant._id.toString());
    });

    test('should require email field', async () => {
      const userData = {
        tenantId: testTenant._id,
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('email');
    });

    test('should require password field', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('password');
    });

    test('should require firstName field', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        lastName: 'Doe',
        role: 'regular'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('firstName');
    });

    test('should require lastName field', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        role: 'regular'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('lastName');
    });

    test('should require tenantId field', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('tenantId');
    });

    test('should validate email format', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('email');
    });

    test('should validate role enum values', async () => {
      const validRoles = ['admin', 'regular', 'auditor'];
      
      for (const role of validRoles) {
        const userData = {
          tenantId: testTenant._id,
          email: `test${role}@example.com`,
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: role
        };

        const user = new User(userData);
        const savedUser = await user.save();
        expect(savedUser.role).toBe(role);
      }
    });

    test('should reject invalid role values', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid-role'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('role');
    });

    test('should validate status enum values', async () => {
      const validStatuses = ['active', 'inactive', 'suspended'];
      
      for (const status of validStatuses) {
        const userData = {
          tenantId: testTenant._id,
          email: `test${status}@example.com`,
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'regular',
          status: status
        };

        const user = new User(userData);
        const savedUser = await user.save();
        expect(savedUser.status).toBe(status);
      }
    });

    test('should reject invalid status values', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular',
        status: 'invalid-status'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('status');
    });

    test('should set default values correctly', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.status).toBe('active');
      expect(savedUser.emailVerified).toBe(false);
      expect(savedUser.lastLoginAt).toBeUndefined();
      expect(savedUser.profile).toBeDefined();
      expect(savedUser.permissions).toBeDefined();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.password).not.toBe('password123');
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should not hash password if it is already hashed', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: '$2b$10$alreadyhashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.password).toBe('$2b$10$alreadyhashedpassword');
    });

    test('should hash password when updating', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id,
        password: 'oldpassword'
      });

      user.password = 'newpassword123';
      const updatedUser = await user.save();

      expect(updatedUser.password).not.toBe('newpassword123');
      expect(updatedUser.password).toMatch(/^\$2[aby]\$\d+\$/);
    });
  });

  describe('Password Comparison', () => {
    test('should compare password correctly', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const user = new User(userData);
      await user.save();

      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });
  });

  describe('Permissions', () => {
    test('should set correct permissions for admin role', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id,
        role: 'admin'
      });

      expect(user.permissions.canManageUsers).toBe(true);
      expect(user.permissions.canManageVendors).toBe(true);
      expect(user.permissions.canManageDataTypes).toBe(true);
      expect(user.permissions.canViewReports).toBe(true);
      expect(user.permissions.canExportData).toBe(true);
      expect(user.permissions.canAuditLogs).toBe(true);
    });

    test('should set correct permissions for regular role', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id,
        role: 'regular'
      });

      expect(user.permissions.canManageUsers).toBe(false);
      expect(user.permissions.canManageVendors).toBe(false);
      expect(user.permissions.canManageDataTypes).toBe(false);
      expect(user.permissions.canViewReports).toBe(false);
      expect(user.permissions.canExportData).toBe(false);
      expect(user.permissions.canAuditLogs).toBe(false);
    });

    test('should set correct permissions for auditor role', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id,
        role: 'auditor'
      });

      expect(user.permissions.canManageUsers).toBe(false);
      expect(user.permissions.canManageVendors).toBe(false);
      expect(user.permissions.canManageDataTypes).toBe(false);
      expect(user.permissions.canViewReports).toBe(true);
      expect(user.permissions.canExportData).toBe(false);
      expect(user.permissions.canAuditLogs).toBe(true);
    });

    test('should check permissions correctly', async () => {
      const adminUser = await createTestUser({
        tenantId: testTenant._id,
        role: 'admin'
      });

      const regularUser = await createTestUser({
        tenantId: testTenant._id,
        role: 'regular'
      });

      expect(adminUser.hasPermission('canManageUsers')).toBe(true);
      expect(adminUser.hasPermission('canViewReports')).toBe(true);
      expect(regularUser.hasPermission('canManageUsers')).toBe(false);
      expect(regularUser.hasPermission('canViewReports')).toBe(false);
    });

    test('should check action permissions correctly', async () => {
      const adminUser = await createTestUser({
        tenantId: testTenant._id,
        role: 'admin'
      });

      const regularUser = await createTestUser({
        tenantId: testTenant._id,
        role: 'regular'
      });

      expect(adminUser.canPerform('manage:users')).toBe(true);
      expect(adminUser.canPerform('create:vendor')).toBe(true);
      expect(adminUser.canPerform('view:reports')).toBe(true);
      expect(regularUser.canPerform('manage:users')).toBe(false);
      expect(regularUser.canPerform('create:vendor')).toBe(false);
      expect(regularUser.canPerform('view:reports')).toBe(false);
    });
  });

  describe('JSON Transformation', () => {
    test('should exclude password from JSON output', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id,
        password: 'password123'
      });

      const userJSON = user.toJSON();
      expect(userJSON.password).toBeUndefined();
      expect(userJSON._id).toBeDefined();
      expect(userJSON.email).toBeDefined();
    });

    test('should include all other fields in JSON output', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin'
      });

      const userJSON = user.toJSON();
      expect(userJSON._id).toBeDefined();
      expect(userJSON.email).toBe('test@example.com');
      expect(userJSON.firstName).toBe('John');
      expect(userJSON.lastName).toBe('Doe');
      expect(userJSON.role).toBe('admin');
      expect(userJSON.permissions).toBeDefined();
      expect(userJSON.profile).toBeDefined();
    });
  });

  describe('Profile Management', () => {
    test('should handle profile updates', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id
      });

      user.profile.phone = '123-456-7890';
      user.profile.department = 'IT';
      user.profile.position = 'Developer';
      
      const updatedUser = await user.save();

      expect(updatedUser.profile.phone).toBe('123-456-7890');
      expect(updatedUser.profile.department).toBe('IT');
      expect(updatedUser.profile.position).toBe('Developer');
    });

    test('should handle nested profile updates', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id
      });

      user.profile.address = {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      };
      
      const updatedUser = await user.save();

      expect(updatedUser.profile.address.street).toBe('123 Main St');
      expect(updatedUser.profile.address.city).toBe('Anytown');
      expect(updatedUser.profile.address.state).toBe('CA');
      expect(updatedUser.profile.address.zipCode).toBe('12345');
    });
  });

  describe('Email Verification', () => {
    test('should handle email verification', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id,
        emailVerified: false
      });

      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
      
      const updatedUser = await user.save();

      expect(updatedUser.emailVerified).toBe(true);
      expect(updatedUser.emailVerifiedAt).toBeDefined();
    });
  });

  describe('Last Login Tracking', () => {
    test('should update last login timestamp', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id
      });

      const loginTime = new Date();
      user.lastLoginAt = loginTime;
      
      const updatedUser = await user.save();

      expect(updatedUser.lastLoginAt).toBeDefined();
      expect(updatedUser.lastLoginAt.getTime()).toBe(loginTime.getTime());
    });
  });

  describe('Unique Constraints', () => {
    test('should enforce unique email per tenant', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'unique@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow('duplicate key error');
    });

    test('should allow same email in different tenants', async () => {
      const anotherTenant = await createTestTenant();
      
      const userData1 = {
        tenantId: testTenant._id,
        email: 'same@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const userData2 = {
        tenantId: anotherTenant._id,
        email: 'same@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'regular'
      };

      const user1 = new User(userData1);
      const user2 = new User(userData2);

      await user1.save();
      await user2.save();

      expect(user1._id).toBeDefined();
      expect(user2._id).toBeDefined();
    });
  });

  describe('Virtual Fields', () => {
    test('should generate full name correctly', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id,
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(user.fullName).toBe('John Doe');
    });

    test('should handle empty names in full name', async () => {
      const user = await createTestUser({
        tenantId: testTenant._id,
        firstName: '',
        lastName: 'Doe'
      });

      expect(user.fullName).toBe('Doe');
    });
  });

  describe('Indexes', () => {
    test('should have proper indexes', async () => {
      const indexes = await User.collection.getIndexes();
      
      // Check for email index
      expect(indexes).toHaveProperty('email_1');
      
      // Check for tenantId index
      expect(indexes).toHaveProperty('tenantId_1');
      
      // Check for compound index
      expect(indexes).toHaveProperty('tenantId_1_email_1');
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors gracefully', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: '',
        role: 'invalid-role'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should handle save errors gracefully', async () => {
      const userData = {
        tenantId: 'invalid-object-id',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'regular'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle bulk operations efficiently', async () => {
      const users = [];
      for (let i = 0; i < 10; i++) {
        users.push({
          tenantId: testTenant._id,
          email: `user${i}@example.com`,
          password: 'password123',
          firstName: `User${i}`,
          lastName: 'Test',
          role: 'regular'
        });
      }

      const startTime = Date.now();
      await User.insertMany(users);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle large queries efficiently', async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 50; i++) {
        users.push({
          tenantId: testTenant._id,
          email: `user${i}@example.com`,
          password: 'password123',
          firstName: `User${i}`,
          lastName: 'Test',
          role: 'regular'
        });
      }
      await User.insertMany(users);

      const startTime = Date.now();
      const foundUsers = await User.find({ tenantId: testTenant._id }).limit(20);
      const endTime = Date.now();

      expect(foundUsers.length).toBeLessThanOrEqual(20);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
