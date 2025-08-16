const mongoose = require('mongoose');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const { createTestTenant } = require('../utils/testUtils');

describe('User Model', () => {
  let testTenant;

  beforeEach(async () => {
    testTenant = await createTestTenant();
  });

  describe('Schema Validation', () => {
    test('should create a valid user', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
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
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
    });

    test('should require tenantId', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require email', async () => {
      const userData = {
        tenantId: testTenant._id,
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require password with minimum length', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: '123', // Too short
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require firstName', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        lastName: 'Doe'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require lastName', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });



    test('should enforce role enum values', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid-role'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should enforce status enum values', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        status: 'invalid-status'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/); // bcrypt pattern
    });

    test('should not rehash password if not modified', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const originalHash = savedUser.password;

      // Update non-password field
      savedUser.firstName = 'Jane';
      await savedUser.save();

      expect(savedUser.password).toBe(originalHash);
    });
  });

  describe('Password Comparison', () => {
    test('should correctly compare passwords', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      const isCorrectPassword = await savedUser.comparePassword('password123');
      const isWrongPassword = await savedUser.comparePassword('wrongpassword');

      expect(isCorrectPassword).toBe(true);
      expect(isWrongPassword).toBe(false);
    });
  });

  describe('Methods', () => {
    test('should return full name', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.getFullName()).toBe('John Doe');
    });
  });

  describe('Virtuals', () => {
    test('should have fullName virtual', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.fullName).toBe('John Doe');
    });
  });

  describe('JSON Serialization', () => {
    test('should exclude sensitive fields from JSON', async () => {
      const userData = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const userJson = savedUser.toJSON();

      expect(userJson.password).toBeUndefined();
      expect(userJson.passwordResetToken).toBeUndefined();
      expect(userJson.passwordResetExpires).toBeUndefined();
      expect(userJson.emailVerificationToken).toBeUndefined();
      expect(userJson.fullName).toBeDefined(); // Virtual should be included
    });
  });

  describe('Indexes', () => {
    test('should enforce unique email per tenant', async () => {
      const userData1 = {
        tenantId: testTenant._id,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const userData2 = {
        tenantId: testTenant._id,
        email: 'test@example.com', // Same email, same tenant
        password: 'password456',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });


  });
});