const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const Vendor = require('../../models/Vendor');
const DataType = require('../../models/DataType');

// Generate JWT token for testing
const generateTestToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '24h' }
  );
};

// Create test tenant
const createTestTenant = async (tenantData = {}) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const defaultTenant = {
    name: 'Test Tenant',
    domain: `test${timestamp}${randomId}.com`,
    subdomain: `test${timestamp}${randomId}`,
    status: 'active',
    contactInfo: {
      email: `admin${timestamp}${randomId}@test.com`,
      phone: '123-456-7890'
    }
  };

  const tenant = new Tenant({ ...defaultTenant, ...tenantData });
  return await tenant.save();
};

// Create test user
const createTestUser = async (userData = {}, tenantId = null) => {
  if (!tenantId) {
    const tenant = await createTestTenant();
    tenantId = tenant._id;
  }

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const defaultUser = {
    tenantId,
    email: `test${timestamp}${randomId}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    status: 'active',
    emailVerified: true
  };

  const user = new User({ ...defaultUser, ...userData });
  return await user.save();
};

// Create test vendor
const createTestVendor = async (vendorData = {}, tenantId = null, userId = null) => {
  if (!tenantId) {
    const tenant = await createTestTenant();
    tenantId = tenant._id;
  }
  
  if (!userId) {
    const user = await createTestUser({}, tenantId);
    userId = user._id;
  }

  const defaultVendor = {
    tenantId,
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
    createdBy: userId
  };

  const vendor = new Vendor({ ...defaultVendor, ...vendorData });
  return await vendor.save();
};

// Create test data type
const createTestDataType = async (dataTypeData = {}, tenantId = null, userId = null) => {
  if (!tenantId) {
    const tenant = await createTestTenant();
    tenantId = tenant._id;
  }

  if (!userId) {
    const user = await createTestUser({}, tenantId);
    userId = user._id;
  }

  const defaultDataType = {
    tenantId,
    name: 'Test Data Type',
    description: 'Test data type description',
    classification: 'Personal Data',
    riskLevel: 'Medium',
    complianceRequirements: ['GDPR'],
    retentionPeriod: 12,
    isActive: true,
    createdBy: userId
  };

  const dataType = new DataType({ ...defaultDataType, ...dataTypeData });
  return await dataType.save();
};

// Create authenticated request headers
const createAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

// Mock request object for middleware testing
const createMockRequest = (overrides = {}) => {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    user: null,
    tenant: null,
    ...overrides
  };
};

// Mock response object for middleware testing
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Mock next function for middleware testing
const createMockNext = () => jest.fn();

module.exports = {
  generateTestToken,
  createTestTenant,
  createTestUser,
  createTestVendor,
  createTestDataType,
  createAuthHeaders,
  createMockRequest,
  createMockResponse,
  createMockNext
};