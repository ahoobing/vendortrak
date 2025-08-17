# News Scraping Agent Documentation

## Overview

The News Scraping Agent is an automated system that searches the web for vendor-related news and security issues, then stores this information in the database for display in the VendorTrak application. The agent runs periodically to keep the news feed updated with the latest information.

## Features

### 🔍 **Multi-Source Scraping**
- **RSS Feeds**: Scrapes from major security news RSS feeds
- **Web Pages**: Direct scraping from security news websites
- **Vendor-Specific**: Identifies news related to vendors in your organization

### 🛡️ **Security Focus**
- **Security Keywords**: Automatically identifies security-related content
- **Severity Classification**: Categorizes news by risk level (Critical, High, Medium, Low)
- **Category Detection**: Classifies news as security, breach, compliance, etc.

### 🔄 **Automated Operation**
- **Scheduled Scraping**: Runs every 6 hours automatically
- **Deduplication**: Prevents duplicate articles using content hashing
- **Cleanup**: Automatically removes old news (90+ days)

### 📊 **Smart Analysis**
- **Vendor Matching**: Links news to specific vendors in your system
- **Keyword Extraction**: Generates relevant keywords for search
- **Content Analysis**: Analyzes text for security relevance

## Architecture

### Components

1. **NewsScraper Class** (`server/services/newsScraper.js`)
   - Handles web scraping and content analysis
   - Manages multiple data sources
   - Performs security relevance analysis

2. **NewsScheduler Class** (`server/services/newsScheduler.js`)
   - Manages automated scheduling
   - Handles job execution and monitoring
   - Provides status and control endpoints

3. **News Model** (`server/models/News.js`)
   - Database schema for news articles
   - Includes validation and indexing
   - Supports tenant isolation

4. **News Routes** (`server/routes/news.js`)
   - API endpoints for news retrieval
   - Admin controls for scraping
   - Scheduler management

## Data Sources

### RSS Feeds
- **The Hacker News**: `https://feeds.feedburner.com/TheHackersNews`
- **Krebs on Security**: `https://krebsonsecurity.com/feed/`
- **SecurityWeek**: `https://www.securityweek.com/feed/`
- **Bleeping Computer**: `https://www.bleepingcomputer.com/feed/`

### Web Scraping Sources
- **Security Weekly**: `https://securityweekly.com`
- **The Hacker News**: `https://thehackernews.com`
- **Krebs on Security**: `https://krebsonsecurity.com`

## Configuration

### Environment Variables

```bash
# News scraping configuration
NEWS_SCRAPING_ENABLED=true
NEWS_SCRAPING_INTERVAL=0 */6 * * *  # Cron expression (every 6 hours)
NEWS_RETENTION_DAYS=90              # Days to keep news articles
NEWS_MAX_ARTICLES_PER_SOURCE=50     # Max articles per source per run
```

### Cron Schedule Options

```bash
# Every 6 hours (default)
0 */6 * * *

# Every 4 hours
0 */4 * * *

# Every 12 hours
0 */12 * * *

# Daily at 2 AM
0 2 * * *

# Every 2 hours during business hours
0 9-17/2 * * 1-5
```

## API Endpoints

### News Retrieval

#### GET `/api/news/vendors`
Returns vendor-specific news with filtering and pagination.

**Query Parameters:**
- `limit`: Number of items per page (default: 20)
- `offset`: Pagination offset (default: 0)
- `vendorId`: Filter by specific vendor
- `category`: Filter by category (security, general, maintenance)

#### GET `/api/news/industry`
Returns industry security news.

**Query Parameters:**
- `limit`: Number of items per page (default: 10)
- `offset`: Pagination offset (default: 0)

#### GET `/api/news/security-alerts`
Returns security alerts with severity filtering.

**Query Parameters:**
- `limit`: Number of items per page (default: 10)
- `offset`: Pagination offset (default: 0)
- `severity`: Filter by severity (critical, high, medium, low)

#### GET `/api/news/vendors/:vendorId`
Returns news specific to a particular vendor.

#### GET `/api/news/stats`
Returns news statistics and metrics.

### Admin Controls (Admin Only)

#### POST `/api/news/scrape`
Manually triggers news scraping for the current tenant.

#### GET `/api/news/scheduler/status`
Returns the current status of the news scheduler.

#### PUT `/api/news/scheduler/schedule`
Updates the scraping schedule.

**Request Body:**
```json
{
  "cronExpression": "0 */6 * * *"
}
```

## Database Schema

### News Collection

```javascript
{
  _id: ObjectId,
  title: String,                    // Article title
  summary: String,                  // Article summary
  content: String,                  // Full article content (optional)
  url: String,                      // Article URL
  publishedAt: Date,                // Publication date
  category: String,                 // security, breach, compliance, general, maintenance, update
  severity: String,                 // critical, high, medium, low, info
  source: String,                   // News source name
  sourceUrl: String,                // News source URL
  vendorId: ObjectId,               // Related vendor (optional)
  vendorName: String,               // Vendor name (optional)
  affectedVendors: [String],        // List of affected vendors
  recommendedAction: String,        // Recommended action
  keywords: [String],               // Extracted keywords
  tags: [String],                   // Article tags
  scrapedAt: Date,                  // When article was scraped
  lastUpdated: Date,                // Last update timestamp
  isActive: Boolean,                // Article active status
  hash: String,                     // Content hash for deduplication
  tenantId: ObjectId,               // Tenant ID for isolation
  createdAt: Date,                  // Creation timestamp
  updatedAt: Date                   // Update timestamp
}
```

## Security Analysis

### Security Keywords
The agent automatically detects security-related content using these keywords:
- `security breach`, `data breach`, `cybersecurity`, `vulnerability`, `exploit`
- `ransomware`, `phishing`, `malware`, `zero-day`, `CVE`, `security update`
- `patch`, `threat`, `attack`, `incident`, `compromise`, `leak`, `exposure`

### Severity Classification
- **Critical**: Breaches, zero-day exploits, major vulnerabilities
- **High**: Security incidents, data leaks, significant threats
- **Medium**: Security updates, patches, moderate threats
- **Low**: General security news, best practices
- **Info**: Non-security related news

### Category Detection
- **breach**: Data breaches, security incidents
- **security**: General security news, vulnerabilities
- **compliance**: Regulatory updates, compliance requirements
- **maintenance**: Service maintenance, updates
- **update**: Software updates, patches
- **general**: Non-security related news

## Usage Examples

### Starting the Agent

The news agent starts automatically when the server starts:

```bash
npm run dev
```

### Manual Scraping

Trigger manual scraping via API:

```bash
curl -X POST http://localhost:5001/api/news/scrape \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Checking Scheduler Status

```bash
curl -X GET http://localhost:5001/api/news/scheduler/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Updating Schedule

```bash
curl -X PUT http://localhost:5001/api/news/scheduler/schedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cronExpression": "0 */4 * * *"}'
```

## Seeding Initial Data

To populate the database with sample news data:

```bash
cd server
npm run seed:news
```

This creates sample news articles for testing and demonstration.

## Monitoring and Logging

### Log Messages
The agent provides detailed logging:

```
Starting News Scheduler...
News scraping scheduled every 6 hours
News cleanup scheduled daily at 2 AM UTC
Starting scheduled news scraping...
Scraped 15 articles from The Hacker News
Scraped 8 articles from Krebs on Security
News scraping completed. Saved: 20, Skipped: 3
```

### Error Handling
- **Network Errors**: Retries with exponential backoff
- **Rate Limiting**: Respects website rate limits
- **Invalid Content**: Skips articles with missing required fields
- **Duplicate Detection**: Prevents duplicate articles

## Performance Considerations

### Optimization Features
- **Connection Pooling**: Reuses HTTP connections
- **Concurrent Scraping**: Scrapes multiple sources simultaneously
- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient handling of large datasets

### Resource Usage
- **Memory**: Minimal memory footprint
- **CPU**: Low CPU usage during scraping
- **Network**: Respectful of bandwidth and rate limits
- **Database**: Efficient queries with proper indexing

## Troubleshooting

### Common Issues

1. **No News Articles Appearing**
   - Check if scraping is enabled
   - Verify network connectivity
   - Check scheduler status
   - Review error logs

2. **Scraping Fails**
   - Check website availability
   - Verify RSS feed URLs
   - Review rate limiting
   - Check authentication

3. **High Resource Usage**
   - Reduce scraping frequency
   - Limit concurrent requests
   - Review database indexes
   - Monitor memory usage

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=news-scraper:*
```

## Future Enhancements

### Planned Features
- **Machine Learning**: Improved content classification
- **Sentiment Analysis**: Analyze news sentiment
- **Email Notifications**: Alert on critical security news
- **Custom Sources**: User-defined news sources
- **Advanced Filtering**: More sophisticated filtering options
- **Analytics Dashboard**: Scraping performance metrics

### Integration Opportunities
- **Threat Intelligence**: Integration with threat feeds
- **Vulnerability Databases**: CVE database integration
- **Social Media**: Social media monitoring
- **Dark Web**: Dark web monitoring (if applicable)

## Security Considerations

### Data Protection
- **Tenant Isolation**: News is isolated by tenant
- **Input Validation**: All inputs are validated
- **Rate Limiting**: Respects source website limits
- **Error Handling**: Secure error handling

### Privacy
- **No Personal Data**: Agent doesn't collect personal information
- **Public Sources**: Only scrapes publicly available information
- **Data Retention**: Automatic cleanup of old data
- **Access Control**: Admin-only controls

## Support

For issues or questions about the news scraping agent:

1. Check the logs for error messages
2. Verify configuration settings
3. Test manual scraping
4. Review network connectivity
5. Contact system administrator

The news scraping agent is designed to be robust, efficient, and respectful of the sources it scrapes while providing valuable security intelligence for vendor risk management.
