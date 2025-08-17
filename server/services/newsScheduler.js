const cron = require('node-cron');
const NewsScraper = require('./newsScraper');
const News = require('../models/News');

class NewsScheduler {
  constructor() {
    this.scraper = new NewsScraper();
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Start the scheduler
  start() {
    console.log('Starting News Scheduler...');
    
    // Schedule news scraping every 6 hours
    const newsJob = cron.schedule('0 */6 * * *', async () => {
      await this.runNewsScraping();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Schedule cleanup of old news every day at 2 AM
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldNews();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Store job references
    this.jobs.set('newsScraping', newsJob);
    this.jobs.set('cleanup', cleanupJob);

    // Start the jobs
    newsJob.start();
    cleanupJob.start();

    console.log('News Scheduler started successfully');
    console.log('- News scraping scheduled every 6 hours');
    console.log('- News cleanup scheduled daily at 2 AM UTC');
  }

  // Stop the scheduler
  stop() {
    console.log('Stopping News Scheduler...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped ${name} job`);
    }
    
    this.jobs.clear();
    console.log('News Scheduler stopped');
  }

  // Run news scraping manually
  async runNewsScraping() {
    if (this.isRunning) {
      console.log('News scraping already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('Starting scheduled news scraping...');
      
      const results = await this.scraper.scrapeNewsForAllTenants();
      
      const totalSaved = results.reduce((sum, result) => sum + (result.savedCount || 0), 0);
      const totalSkipped = results.reduce((sum, result) => sum + (result.skippedCount || 0), 0);
      const totalFound = results.reduce((sum, result) => sum + (result.totalFound || 0), 0);
      
      const duration = Date.now() - startTime;
      
      console.log('Scheduled news scraping completed:');
      console.log(`- Duration: ${duration}ms`);
      console.log(`- Total articles found: ${totalFound}`);
      console.log(`- Total saved: ${totalSaved}`);
      console.log(`- Total skipped: ${totalSkipped}`);
      
      // Log results for each tenant
      for (const result of results) {
        if (result.error) {
          console.error(`- ${result.tenantName}: Error - ${result.error}`);
        } else {
          console.log(`- ${result.tenantName}: ${result.savedCount} saved, ${result.skippedCount} skipped`);
        }
      }

    } catch (error) {
      console.error('Error in scheduled news scraping:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  // Run news scraping for a specific tenant
  async runNewsScrapingForTenant(tenantId) {
    if (this.isRunning) {
      console.log('News scraping already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log(`Starting news scraping for tenant: ${tenantId}`);
      
      const result = await this.scraper.scrapeNews(tenantId);
      
      const duration = Date.now() - startTime;
      
      console.log(`News scraping completed for tenant ${tenantId}:`);
      console.log(`- Duration: ${duration}ms`);
      console.log(`- Articles found: ${result.totalFound}`);
      console.log(`- Saved: ${result.savedCount}`);
      console.log(`- Skipped: ${result.skippedCount}`);

      return result;

    } catch (error) {
      console.error(`Error in news scraping for tenant ${tenantId}:`, error.message);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Cleanup old news articles
  async cleanupOldNews() {
    try {
      console.log('Starting news cleanup...');
      
      // Delete news older than 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      const result = await News.deleteMany({
        publishedAt: { $lt: cutoffDate },
        isActive: true
      });
      
      console.log(`News cleanup completed: ${result.deletedCount} articles deleted`);
      
    } catch (error) {
      console.error('Error in news cleanup:', error.message);
    }
  }

  // Get scheduler status
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: {}
    };

    for (const [name, job] of this.jobs) {
      status.jobs[name] = {
        running: job.running,
        nextDate: job.nextDate(),
        lastDate: job.lastDate()
      };
    }

    return status;
  }

  // Update scraping schedule
  updateSchedule(cronExpression) {
    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      // Stop current news scraping job
      const currentJob = this.jobs.get('newsScraping');
      if (currentJob) {
        currentJob.stop();
      }

      // Create new job with updated schedule
      const newJob = cron.schedule(cronExpression, async () => {
        await this.runNewsScraping();
      }, {
        scheduled: false,
        timezone: 'UTC'
      });

      // Start new job
      newJob.start();
      
      // Update job reference
      this.jobs.set('newsScraping', newJob);

      console.log(`News scraping schedule updated to: ${cronExpression}`);
      
      return true;
    } catch (error) {
      console.error('Error updating schedule:', error.message);
      return false;
    }
  }

  // Get next scheduled run time
  getNextRunTime() {
    const newsJob = this.jobs.get('newsScraping');
    return newsJob ? newsJob.nextDate() : null;
  }

  // Get last run time
  getLastRunTime() {
    const newsJob = this.jobs.get('newsScraping');
    return newsJob ? newsJob.lastDate() : null;
  }
}

// Create singleton instance
const newsScheduler = new NewsScheduler();

module.exports = newsScheduler;
