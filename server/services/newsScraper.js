const axios = require('axios');
const cheerio = require('cheerio');
const News = require('../models/News');
const Vendor = require('../models/Vendor');
const { createTestTenant } = require('../tests/utils/testUtils');

class NewsScraper {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
    
    this.securityKeywords = [
      'security breach', 'data breach', 'cybersecurity', 'vulnerability', 'exploit',
      'ransomware', 'phishing', 'malware', 'zero-day', 'CVE', 'security update',
      'patch', 'threat', 'attack', 'incident', 'compromise', 'leak', 'exposure'
    ];
    
    this.newsSources = [
      {
        name: 'Security Weekly',
        url: 'https://securityweekly.com',
        type: 'security',
        selectors: {
          articles: '.post',
          title: 'h2 a',
          summary: '.excerpt',
          date: '.date',
          link: 'h2 a'
        }
      },
      {
        name: 'The Hacker News',
        url: 'https://thehackernews.com',
        type: 'security',
        selectors: {
          articles: '.post',
          title: 'h2 a',
          summary: '.post-excerpt',
          date: '.post-date',
          link: 'h2 a'
        }
      },
      {
        name: 'Krebs on Security',
        url: 'https://krebsonsecurity.com',
        type: 'security',
        selectors: {
          articles: 'article',
          title: 'h2 a',
          summary: '.entry-content p',
          date: '.entry-date',
          link: 'h2 a'
        }
      }
    ];
  }

  // Get random user agent
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  // Make HTTP request with retry logic
  async makeRequest(url, options = {}) {
    const maxRetries = 3;
    const delay = 1000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios({
          url,
          timeout: 10000,
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            ...options.headers
          },
          ...options
        });
        return response;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  // Scrape news from RSS feeds
  async scrapeRSSFeed(feedUrl, sourceName) {
    try {
      const response = await this.makeRequest(feedUrl);
      const $ = cheerio.load(response.data, { xmlMode: true });
      const articles = [];

      $('item').each((i, element) => {
        const $item = $(element);
        const title = $item.find('title').text().trim();
        const description = $item.find('description').text().trim();
        const link = $item.find('link').text().trim();
        const pubDate = $item.find('pubDate').text().trim();

        if (title && link) {
          articles.push({
            title,
            summary: description,
            url: link,
            publishedAt: new Date(pubDate),
            source: sourceName,
            sourceUrl: feedUrl
          });
        }
      });

      return articles;
    } catch (error) {
      console.error(`Error scraping RSS feed ${feedUrl}:`, error.message);
      return [];
    }
  }

  // Scrape news from web pages
  async scrapeWebPage(source) {
    try {
      const response = await this.makeRequest(source.url);
      const $ = cheerio.load(response.data);
      const articles = [];

      $(source.selectors.articles).each((i, element) => {
        const $article = $(element);
        const title = $article.find(source.selectors.title).text().trim();
        const summary = $article.find(source.selectors.summary).text().trim();
        const link = $article.find(source.selectors.link).attr('href');
        const dateText = $article.find(source.selectors.date).text().trim();

        if (title && link) {
          const fullLink = link.startsWith('http') ? link : `${source.url}${link}`;
          articles.push({
            title,
            summary,
            url: fullLink,
            publishedAt: this.parseDate(dateText) || new Date(),
            source: source.name,
            sourceUrl: source.url
          });
        }
      });

      return articles;
    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error.message);
      return [];
    }
  }

  // Parse date from various formats
  parseDate(dateText) {
    if (!dateText) return null;
    
    try {
      // Try parsing as ISO date
      const isoDate = new Date(dateText);
      if (!isNaN(isoDate.getTime())) return isoDate;

      // Try parsing common formats
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
        /(\d{1,2})\s+(\w+)\s+(\d{4})/
      ];

      for (const format of formats) {
        const match = dateText.match(format);
        if (match) {
          return new Date(dateText);
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Analyze content for security relevance
  analyzeSecurityRelevance(title, summary) {
    const text = `${title} ${summary}`.toLowerCase();
    let score = 0;
    let category = 'general';
    let severity = 'info';

    // Check for security keywords
    for (const keyword of this.securityKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    // Determine category and severity based on keywords
    if (text.includes('breach') || text.includes('leak') || text.includes('compromise')) {
      category = 'breach';
      severity = score > 2 ? 'critical' : 'high';
    } else if (text.includes('vulnerability') || text.includes('exploit') || text.includes('cve')) {
      category = 'security';
      severity = score > 2 ? 'high' : 'medium';
    } else if (text.includes('update') || text.includes('patch')) {
      category = 'update';
      severity = 'medium';
    } else if (score > 0) {
      category = 'security';
      severity = 'low';
    }

    return { category, severity, score };
  }

  // Extract vendor names from content
  async extractVendorNames(title, summary, tenantId) {
    const vendors = await Vendor.find({ tenantId, isActive: true });
    const text = `${title} ${summary}`.toLowerCase();
    const foundVendors = [];

    for (const vendor of vendors) {
      if (text.includes(vendor.name.toLowerCase())) {
        foundVendors.push({
          vendorId: vendor._id,
          vendorName: vendor.name
        });
      }
    }

    return foundVendors;
  }

  // Generate keywords from content
  generateKeywords(title, summary) {
    const text = `${title} ${summary}`.toLowerCase();
    const words = text.split(/\s+/);
    const keywordCount = {};
    
    // Count word frequency (excluding common words)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'];
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !stopWords.includes(cleanWord)) {
        keywordCount[cleanWord] = (keywordCount[cleanWord] || 0) + 1;
      }
    });

    // Return top keywords
    return Object.entries(keywordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Save news to database
  async saveNews(articles, tenantId) {
    const savedCount = 0;
    const skippedCount = 0;

    for (const article of articles) {
      try {
        // Check if article already exists
        const existingNews = await News.findOne({ 
          hash: this.generateHash(article.title, article.url, article.publishedAt),
          tenantId 
        });

        if (existingNews) {
          skippedCount++;
          continue;
        }

        // Analyze content
        const { category, severity } = this.analyzeSecurityRelevance(article.title, article.summary);
        const vendorInfo = await this.extractVendorNames(article.title, article.summary, tenantId);
        const keywords = this.generateKeywords(article.title, article.summary);

        // Create news document
        const newsData = {
          title: article.title,
          summary: article.summary,
          url: article.url,
          publishedAt: article.publishedAt,
          category,
          severity,
          source: article.source,
          sourceUrl: article.sourceUrl,
          keywords,
          tenantId,
          ...(vendorInfo.length > 0 && {
            vendorId: vendorInfo[0].vendorId,
            vendorName: vendorInfo[0].vendorName
          })
        };

        const news = new News(newsData);
        await news.save();
        savedCount++;

      } catch (error) {
        console.error('Error saving news article:', error.message);
      }
    }

    return { savedCount, skippedCount };
  }

  // Generate hash for deduplication
  generateHash(title, url, publishedAt) {
    const crypto = require('crypto');
    const content = `${title}${url}${publishedAt}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Main scraping method
  async scrapeNews(tenantId) {
    console.log(`Starting news scraping for tenant: ${tenantId}`);
    
    let allArticles = [];

    // Scrape from RSS feeds
    const rssFeeds = [
      { url: 'https://feeds.feedburner.com/TheHackersNews', name: 'The Hacker News' },
      { url: 'https://krebsonsecurity.com/feed/', name: 'Krebs on Security' },
      { url: 'https://www.securityweek.com/feed/', name: 'SecurityWeek' },
      { url: 'https://www.bleepingcomputer.com/feed/', name: 'Bleeping Computer' }
    ];

    for (const feed of rssFeeds) {
      try {
        const articles = await this.scrapeRSSFeed(feed.url, feed.name);
        allArticles = allArticles.concat(articles);
        console.log(`Scraped ${articles.length} articles from ${feed.name}`);
      } catch (error) {
        console.error(`Error scraping RSS feed ${feed.name}:`, error.message);
      }
    }

    // Scrape from web pages
    for (const source of this.newsSources) {
      try {
        const articles = await this.scrapeWebPage(source);
        allArticles = allArticles.concat(articles);
        console.log(`Scraped ${articles.length} articles from ${source.name}`);
      } catch (error) {
        console.error(`Error scraping web page ${source.name}:`, error.message);
      }
    }

    // Save articles to database
    const { savedCount, skippedCount } = await this.saveNews(allArticles, tenantId);
    
    console.log(`News scraping completed. Saved: ${savedCount}, Skipped: ${skippedCount}`);
    
    return { savedCount, skippedCount, totalFound: allArticles.length };
  }

  // Scrape news for all tenants
  async scrapeNewsForAllTenants() {
    try {
      // Get all active tenants
      const Tenant = require('../models/Tenant');
      const tenants = await Tenant.find({ status: 'active' });

      const results = [];
      for (const tenant of tenants) {
        try {
          const result = await this.scrapeNews(tenant._id);
          results.push({
            tenantId: tenant._id,
            tenantName: tenant.name,
            ...result
          });
        } catch (error) {
          console.error(`Error scraping news for tenant ${tenant.name}:`, error.message);
          results.push({
            tenantId: tenant._id,
            tenantName: tenant.name,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in scrapeNewsForAllTenants:', error.message);
      throw error;
    }
  }
}

module.exports = NewsScraper;
