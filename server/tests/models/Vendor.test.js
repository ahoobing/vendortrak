const mongoose = require('mongoose');
const Vendor = require('../../models/Vendor');
const { createTestTenant, createTestUser } = require('../utils/testUtils');

describe('Vendor Model', () => {
  let testTenant;

  let testUser;

  beforeEach(async () => {
    testTenant = await createTestTenant();
    testUser = await createTestUser({}, testTenant._id);
  });

  describe('Schema Validation', () => {
    test('should create a valid vendor', async () => {
      const vendorData = {
        tenantId: testTenant._id,
        name: 'Test Vendor',
        email: 'vendor@test.com',
        phone: '123-456-7890',
        status: 'active',
        industry: 'Technology',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
        createdBy: testUser._id
      };

      const vendor = new Vendor(vendorData);
      const savedVendor = await vendor.save();

      expect(savedVendor._id).toBeDefined();
      expect(savedVendor.name).toBe(vendorData.name);
      expect(savedVendor.email).toBe(vendorData.email);
      expect(savedVendor.phone).toBe(vendorData.phone);
      expect(savedVendor.status).toBe(vendorData.status);
      expect(savedVendor.category).toBe(vendorData.category);
      expect(savedVendor.address.street).toBe(vendorData.address.street);
    });

    test('should require tenantId', async () => {
      const vendorData = {
        name: 'Test Vendor',
        email: 'vendor@test.com',
        phone: '123-456-7890'
      };

      const vendor = new Vendor(vendorData);
      await expect(vendor.save()).rejects.toThrow();
    });

    test('should require name', async () => {
      const vendorData = {
        tenantId: testTenant._id,
        email: 'vendor@test.com',
        phone: '123-456-7890'
      };

      const vendor = new Vendor(vendorData);
      await expect(vendor.save()).rejects.toThrow();
    });

    test('should require email', async () => {
      const vendorData = {
        tenantId: testTenant._id,
        name: 'Test Vendor',
        phone: '123-456-7890'
      };

      const vendor = new Vendor(vendorData);
      await expect(vendor.save()).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const vendorData = {
        tenantId: testTenant._id,
        name: 'Test Vendor',
        email: 'invalid-email',
        phone: '123-456-7890'
      };

      const vendor = new Vendor(vendorData);
      await expect(vendor.save()).rejects.toThrow();
    });

    test('should enforce status enum values', async () => {
      const vendorData = {
        tenantId: testTenant._id,
        name: 'Test Vendor',
        email: 'vendor@test.com',
        phone: '123-456-7890',
        status: 'invalid-status',
        createdBy: testUser._id
      };

      const vendor = new Vendor(vendorData);
      await expect(vendor.save()).rejects.toThrow();
    });

    test('should set default status to active', async () => {
      const vendorData = {
        tenantId: testTenant._id,
        name: 'Test Vendor',
        email: 'vendor@test.com',
        phone: '123-456-7890',
        createdBy: testUser._id
      };

      const vendor = new Vendor(vendorData);
      const savedVendor = await vendor.save();

      expect(savedVendor.status).toBe('active');
    });

    test('should validate address fields', async () => {
      const vendorData = {
        tenantId: testTenant._id,
        name: 'Test Vendor',
        email: 'vendor@test.com',
        phone: '123-456-7890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
        createdBy: testUser._id
      };

      const vendor = new Vendor(vendorData);
      const savedVendor = await vendor.save();

      expect(savedVendor.address).toBe(vendorData.address);
      expect(savedVendor.city).toBe(vendorData.city);
      expect(savedVendor.state).toBe(vendorData.state);
      expect(savedVendor.zipCode).toBe(vendorData.zipCode);
      expect(savedVendor.country).toBe(vendorData.country);
    });
  });

  describe('Indexes', () => {


    test('should allow same name for different tenants', async () => {
      const tenant2 = await createTestTenant({ subdomain: 'test2' });

      const vendorData1 = {
        tenantId: testTenant._id,
        name: 'Test Vendor',
        email: 'vendor1@test.com',
        phone: '123-456-7890',
        createdBy: testUser._id
      };

      const vendorData2 = {
        tenantId: tenant2._id,
        name: 'Test Vendor', // Same name, different tenant
        email: 'vendor2@test.com',
        phone: '987-654-3210',
        createdBy: testUser._id
      };

      const vendor1 = new Vendor(vendorData1);
      const vendor2 = new Vendor(vendorData2);

      await expect(vendor1.save()).resolves.toBeDefined();
      await expect(vendor2.save()).resolves.toBeDefined();
    });
  });


});