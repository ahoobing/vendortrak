const mongoose = require('mongoose');
const DataType = require('../../models/DataType');
const { createTestTenant, createTestUser } = require('../utils/testUtils');

describe('DataType Model', () => {
  let testTenant;
  let testUser;

  beforeEach(async () => {
    testTenant = await createTestTenant();
    testUser = await createTestUser({}, testTenant._id);
  });

  describe('Schema Validation', () => {
    test('should create a valid data type', async () => {
      const dataTypeData = {
        name: 'Test Data Type',
        description: 'Test description for data type',
        classification: 'Personal Data',
        riskLevel: 'Medium',
        tenantId: testTenant._id,
        createdBy: testUser._id
      };

      const dataType = new DataType(dataTypeData);
      const savedDataType = await dataType.save();

      expect(savedDataType._id).toBeDefined();
      expect(savedDataType.name).toBe(dataTypeData.name);
      expect(savedDataType.description).toBe(dataTypeData.description);
      expect(savedDataType.classification).toBe(dataTypeData.classification);
      expect(savedDataType.riskLevel).toBe(dataTypeData.riskLevel);
      expect(savedDataType.tenantId.toString()).toBe(testTenant._id.toString());
      expect(savedDataType.createdBy.toString()).toBe(testUser._id.toString());
    });

    test('should require name', async () => {
      const dataTypeData = {
        description: 'Test description',
        category: 'General',
        fields: []
      };

      const dataType = new DataType(dataTypeData);
      await expect(dataType.save()).rejects.toThrow();
    });

    test('should require description', async () => {
      const dataTypeData = {
        name: 'Test Data Type',
        classification: 'Personal Data',
        riskLevel: 'Medium',
        tenantId: testTenant._id,
        createdBy: testUser._id
      };

      const dataType = new DataType(dataTypeData);
      await expect(dataType.save()).rejects.toThrow();
    });

    test('should require tenantId', async () => {
      const dataTypeData = {
        name: 'Test Data Type',
        description: 'Test description',
        classification: 'Personal Data',
        riskLevel: 'Medium',
        createdBy: testUser._id
      };

      const dataType = new DataType(dataTypeData);
      await expect(dataType.save()).rejects.toThrow();
    });

    test('should enforce classification enum values', async () => {
      const dataTypeData = {
        name: 'Test Data Type',
        description: 'Test description',
        classification: 'invalid-classification',
        riskLevel: 'Medium',
        tenantId: testTenant._id,
        createdBy: testUser._id
      };

      const dataType = new DataType(dataTypeData);
      await expect(dataType.save()).rejects.toThrow();
    });

    test('should set default values', async () => {
      const dataTypeData = {
        name: 'Test Data Type',
        description: 'Test description',
        tenantId: testTenant._id,
        createdBy: testUser._id
      };

      const dataType = new DataType(dataTypeData);
      const savedDataType = await dataType.save();

      expect(savedDataType.classification).toBe('Other');
      expect(savedDataType.riskLevel).toBe('Medium');
      expect(savedDataType.isActive).toBe(true);
      expect(savedDataType.retentionPeriod).toBe(0);
    });
  });

  describe('Indexes', () => {
    test('should enforce unique name per tenant', async () => {
      const dataTypeData1 = {
        name: 'Test Data Type',
        description: 'Test description 1',
        classification: 'Personal Data',
        riskLevel: 'Medium',
        tenantId: testTenant._id,
        createdBy: testUser._id
      };

      const dataTypeData2 = {
        name: 'Test Data Type', // Same name, same tenant
        description: 'Test description 2',
        classification: 'Financial Data',
        riskLevel: 'High',
        tenantId: testTenant._id,
        createdBy: testUser._id
      };

      const dataType1 = new DataType(dataTypeData1);
      await dataType1.save();

      const dataType2 = new DataType(dataTypeData2);
      await expect(dataType2.save()).rejects.toThrow();
    });
  });

  describe('Virtuals', () => {
    test('should have retentionPeriodFormatted virtual', async () => {
      const dataTypeData = {
        name: 'Test Data Type',
        description: 'Test description',
        classification: 'Personal Data',
        riskLevel: 'Medium',
        retentionPeriod: 18,
        tenantId: testTenant._id,
        createdBy: testUser._id
      };

      const dataType = new DataType(dataTypeData);
      const savedDataType = await dataType.save();

      expect(savedDataType.retentionPeriodFormatted).toBe('1 year 6 months');
    });

    test('should format indefinite retention period', async () => {
      const dataTypeData = {
        name: 'Test Data Type',
        description: 'Test description',
        classification: 'Personal Data',
        riskLevel: 'Medium',
        retentionPeriod: 0,
        tenantId: testTenant._id,
        createdBy: testUser._id
      };

      const dataType = new DataType(dataTypeData);
      const savedDataType = await dataType.save();

      expect(savedDataType.retentionPeriodFormatted).toBe('Indefinite');
    });
  });

  describe('JSON Serialization', () => {
    test('should serialize correctly', async () => {
      const dataTypeData = {
        name: 'Test Data Type',
        description: 'Test description',
        classification: 'Personal Data',
        riskLevel: 'Medium',
        retentionPeriod: 12,
        tenantId: testTenant._id,
        createdBy: testUser._id
      };

      const dataType = new DataType(dataTypeData);
      const savedDataType = await dataType.save();
      const dataTypeJson = savedDataType.toJSON();

      expect(dataTypeJson._id).toBeDefined();
      expect(dataTypeJson.name).toBe(dataTypeData.name);
      expect(dataTypeJson.description).toBe(dataTypeData.description);
      expect(dataTypeJson.classification).toBe(dataTypeData.classification);
      expect(dataTypeJson.riskLevel).toBe(dataTypeData.riskLevel);
      expect(dataTypeJson.retentionPeriodFormatted).toBeDefined();
      expect(dataTypeJson.createdAt).toBeDefined();
      expect(dataTypeJson.updatedAt).toBeDefined();
    });
  });
});