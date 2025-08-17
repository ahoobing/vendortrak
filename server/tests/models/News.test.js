const mongoose = require('mongoose');
const News = require('../../models/News');
const { setupTestDB, createTestTenant, createTestVendor } = require('../utils/testUtils');

describe('News Model', () => {
  let testTenant;
  let testVendor;

  beforeAll(async () => {
    await setupTestDB();
    testTenant = await createTestTenant();
    testVendor = await createTestVendor({}, testTenant._id);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await News.deleteMany({});
  });

  describe('News Creation', () => {
    it('should create a news article with required fields', async () => {
      const newsData = {
        title: 'Test Security Breach',
        summary: 'A test security breach has been reported',
        url: 'https://example.com/test-breach',
        publishedAt: new Date(),
        source: 'Test Source',
        tenantId: testTenant._id
      };

      const news = new News(newsData);
      const savedNews = await news.save();

      expect(savedNews._id).toBeDefined();
      expect(savedNews.title).toBe(newsData.title);
      expect(savedNews.summary).toBe(newsData.summary);
      expect(savedNews.url).toBe(newsData.url);
      expect(savedNews.source).toBe(newsData.source);
      expect(savedNews.tenantId).toEqual(testTenant._id);
      expect(savedNews.isActive).toBe(true);
      expect(savedNews.hash).toBeDefined();
    });

    it('should generate hash for deduplication', async () => {
      const newsData = {
        title: 'Test Article',
        summary: 'Test summary',
        url: 'https://example.com/test',
        publishedAt: new Date(),
        source: 'Test Source',
        tenantId: testTenant._id
      };

      const news = new News(newsData);
      const savedNews = await news.save();

      expect(savedNews.hash).toBeDefined();
      expect(typeof savedNews.hash).toBe('string');
      expect(savedNews.hash.length).toBe(64); // SHA-256 hash length
    });

    it('should set default values correctly', async () => {
      const newsData = {
        title: 'Test Article',
        summary: 'Test summary',
        url: 'https://example.com/test',
        publishedAt: new Date(),
        source: 'Test Source',
        tenantId: testTenant._id
      };

      const news = new News(newsData);
      const savedNews = await news.save();

      expect(savedNews.category).toBe('general');
      expect(savedNews.severity).toBe('info');
      expect(savedNews.isActive).toBe(true);
      expect(savedNews.keywords).toEqual([]);
      expect(savedNews.tags).toEqual([]);
    });

    it('should validate URL format', async () => {
      const newsData = {
        title: 'Test Article',
        summary: 'Test summary',
        url: 'invalid-url',
        publishedAt: new Date(),
        source: 'Test Source',
        tenantId: testTenant._id
      };

      const news = new News(newsData);
      
      try {
        await news.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toContain('URL must be a valid HTTP/HTTPS URL');
      }
    });
  });

  describe('News Queries', () => {
    beforeEach(async () => {
      // Create test news articles
      const newsArticles = [
        {
          title: 'Security Breach',
          summary: 'A security breach occurred',
          url: 'https://example.com/breach',
          publishedAt: new Date(),
          source: 'Security News',
          category: 'breach',
          severity: 'critical',
          tenantId: testTenant._id
        },
        {
          title: 'Vendor Update',
          summary: 'Vendor released an update',
          url: 'https://example.com/update',
          publishedAt: new Date(),
          source: 'Vendor News',
          category: 'update',
          severity: 'medium',
          vendorId: testVendor._id,
          vendorName: testVendor.name,
          tenantId: testTenant._id
        },
        {
          title: 'General News',
          summary: 'General industry news',
          url: 'https://example.com/general',
          publishedAt: new Date(),
          source: 'General News',
          category: 'general',
          severity: 'low',
          tenantId: testTenant._id
        }
      ];

      await News.insertMany(newsArticles);
    });

    it('should find news by vendor', async () => {
      const news = await News.findByVendor(testVendor._id, testTenant._id);
      
      expect(news).toHaveLength(1);
      expect(news[0].vendorId).toEqual(testVendor._id);
      expect(news[0].vendorName).toBe(testVendor.name);
    });

    it('should find security news', async () => {
      const securityNews = await News.findSecurityNews(testTenant._id);
      
      expect(securityNews).toHaveLength(1);
      expect(securityNews[0].category).toBe('breach');
    });

    it('should find recent news', async () => {
      const recentNews = await News.findRecent(testTenant._id, 7);
      
      expect(recentNews).toHaveLength(3);
    });

    it('should filter by category', async () => {
      const breachNews = await News.find({ 
        tenantId: testTenant._id, 
        category: 'breach' 
      });
      
      expect(breachNews).toHaveLength(1);
      expect(breachNews[0].category).toBe('breach');
    });

    it('should filter by severity', async () => {
      const criticalNews = await News.find({ 
        tenantId: testTenant._id, 
        severity: 'critical' 
      });
      
      expect(criticalNews).toHaveLength(1);
      expect(criticalNews[0].severity).toBe('critical');
    });
  });

  describe('News Updates', () => {
    it('should update lastUpdated timestamp on save', async () => {
      const newsData = {
        title: 'Test Article',
        summary: 'Test summary',
        url: 'https://example.com/test',
        publishedAt: new Date(),
        source: 'Test Source',
        tenantId: testTenant._id
      };

      const news = new News(newsData);
      const savedNews = await news.save();
      const originalUpdated = savedNews.lastUpdated;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      savedNews.title = 'Updated Title';
      const updatedNews = await savedNews.save();

      expect(updatedNews.lastUpdated.getTime()).toBeGreaterThan(originalUpdated.getTime());
    });
  });

  describe('News Validation', () => {
    it('should require title', async () => {
      const newsData = {
        summary: 'Test summary',
        url: 'https://example.com/test',
        publishedAt: new Date(),
        source: 'Test Source',
        tenantId: testTenant._id
      };

      const news = new News(newsData);
      
      try {
        await news.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toContain('title');
      }
    });

    it('should require summary', async () => {
      const newsData = {
        title: 'Test Article',
        url: 'https://example.com/test',
        publishedAt: new Date(),
        source: 'Test Source',
        tenantId: testTenant._id
      };

      const news = new News(newsData);
      
      try {
        await news.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toContain('summary');
      }
    });

    it('should require tenantId', async () => {
      const newsData = {
        title: 'Test Article',
        summary: 'Test summary',
        url: 'https://example.com/test',
        publishedAt: new Date(),
        source: 'Test Source'
      };

      const news = new News(newsData);
      
      try {
        await news.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toContain('tenantId');
      }
    });

    it('should validate category enum', async () => {
      const newsData = {
        title: 'Test Article',
        summary: 'Test summary',
        url: 'https://example.com/test',
        publishedAt: new Date(),
        source: 'Test Source',
        category: 'invalid-category',
        tenantId: testTenant._id
      };

      const news = new News(newsData);
      
      try {
        await news.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toContain('category');
      }
    });

    it('should validate severity enum', async () => {
      const newsData = {
        title: 'Test Article',
        summary: 'Test summary',
        url: 'https://example.com/test',
        publishedAt: new Date(),
        source: 'Test Source',
        severity: 'invalid-severity',
        tenantId: testTenant._id
      };

      const news = new News(newsData);
      
      try {
        await news.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toContain('severity');
      }
    });
  });
});
