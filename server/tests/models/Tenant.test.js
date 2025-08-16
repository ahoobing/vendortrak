const mongoose = require('mongoose');
const Tenant = require('../../models/Tenant');

describe('Tenant Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid tenant', async () => {
      const tenantData = {
        name: 'Test Company',
        domain: 'testcompany.com',
        subdomain: 'testcompany',
        status: 'active',
        contactInfo: {
          email: 'admin@testcompany.com',
          phone: '123-456-7890'
        }
      };

      const tenant = new Tenant(tenantData);
      const savedTenant = await tenant.save();

      expect(savedTenant._id).toBeDefined();
      expect(savedTenant.name).toBe(tenantData.name);
      expect(savedTenant.domain).toBe(tenantData.domain);
      expect(savedTenant.subdomain).toBe(tenantData.subdomain);
      expect(savedTenant.status).toBe(tenantData.status);
      expect(savedTenant.contactInfo.email).toBe(tenantData.contactInfo.email);
    });

    test('should require name', async () => {
      const tenantData = {
        domain: 'testcompany.com',
        subdomain: 'testcompany',
        status: 'active'
      };

      const tenant = new Tenant(tenantData);
      await expect(tenant.save()).rejects.toThrow();
    });

    test('should require domain', async () => {
      const tenantData = {
        name: 'Test Company',
        subdomain: 'testcompany',
        status: 'active'
      };

      const tenant = new Tenant(tenantData);
      await expect(tenant.save()).rejects.toThrow();
    });

    test('should require subdomain', async () => {
      const tenantData = {
        name: 'Test Company',
        domain: 'testcompany.com',
        status: 'active'
      };

      const tenant = new Tenant(tenantData);
      await expect(tenant.save()).rejects.toThrow();
    });

    test('should enforce status enum values', async () => {
      const tenantData = {
        name: 'Test Company',
        domain: 'testcompany.com',
        subdomain: 'testcompany',
        status: 'invalid-status'
      };

      const tenant = new Tenant(tenantData);
      await expect(tenant.save()).rejects.toThrow();
    });



    test('should set default status to active', async () => {
      const tenantData = {
        name: 'Test Company',
        domain: 'testcompany.com',
        subdomain: 'testcompany',
        contactInfo: {
          email: 'admin@testcompany.com'
        }
      };

      const tenant = new Tenant(tenantData);
      const savedTenant = await tenant.save();

      expect(savedTenant.status).toBe('active');
    });
  });

  describe('Indexes', () => {
    test('should enforce unique domain', async () => {
      const tenantData1 = {
        name: 'Test Company 1',
        domain: 'testcompany.com',
        subdomain: 'testcompany1',
        status: 'active',
        contactInfo: {
          email: 'admin1@testcompany.com'
        }
      };

      const tenantData2 = {
        name: 'Test Company 2',
        domain: 'testcompany.com', // Same domain
        subdomain: 'testcompany2',
        status: 'active',
        contactInfo: {
          email: 'admin2@testcompany.com'
        }
      };

      const tenant1 = new Tenant(tenantData1);
      await tenant1.save();

      const tenant2 = new Tenant(tenantData2);
      await expect(tenant2.save()).rejects.toThrow();
    });

    test('should enforce unique subdomain', async () => {
      const tenantData1 = {
        name: 'Test Company 1',
        domain: 'testcompany1.com',
        subdomain: 'testcompany',
        status: 'active',
        contactInfo: {
          email: 'admin1@testcompany1.com'
        }
      };

      const tenantData2 = {
        name: 'Test Company 2',
        domain: 'testcompany2.com',
        subdomain: 'testcompany', // Same subdomain
        status: 'active',
        contactInfo: {
          email: 'admin2@testcompany2.com'
        }
      };

      const tenant1 = new Tenant(tenantData1);
      await tenant1.save();

      const tenant2 = new Tenant(tenantData2);
      await expect(tenant2.save()).rejects.toThrow();
    });
  });


});