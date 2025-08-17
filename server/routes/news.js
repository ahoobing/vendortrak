const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const News = require('../models/News');
const newsScheduler = require('../services/newsScheduler');

// Get vendor-specific news
router.get('/vendors', async (req, res) => {
  try {
    const { limit = 20, offset = 0, vendorId, category } = req.query;
    const tenantId = req.user.tenantId;
    
    // Build query
    let query = { tenantId, isActive: true };
    
    // Filter by vendor if specified
    if (vendorId) {
      query.$or = [
        { vendorId: vendorId },
        { vendorName: { $regex: new RegExp(vendorId, 'i') } }
      ];
    }
    
    // Filter by category if specified
    if (category) {
      query.category = category;
    }

    // Get total count
    const total = await News.countDocuments(query);

    // Get paginated results
    const news = await News.find(query)
      .sort({ publishedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('vendorId', 'name');

    // Transform to match expected format
    const transformedNews = news.map(item => ({
      id: item._id.toString(),
      title: item.title,
      summary: item.summary,
      publishedAt: item.publishedAt.toISOString(),
      url: item.url,
      category: item.category,
      severity: item.severity,
      vendorId: item.vendorId?._id?.toString(),
      vendorName: item.vendorName || item.vendorId?.name,
      source: item.source
    }));

    res.json({
      success: true,
      news: transformedNews,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching vendor news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor news'
    });
  }
});

// Get industry security news
router.get('/industry', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const tenantId = req.user.tenantId;
    
    // Get security news from database
    const query = { 
      tenantId, 
      isActive: true,
      category: { $in: ['security', 'breach', 'compliance'] }
    };

    // Get total count
    const total = await News.countDocuments(query);

    // Get paginated results
    const news = await News.find(query)
      .sort({ publishedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Transform to match expected format
    const transformedNews = news.map(item => ({
      id: item._id.toString(),
      title: item.title,
      summary: item.summary,
      publishedAt: item.publishedAt.toISOString(),
      url: item.url,
      category: item.category,
      severity: item.severity,
      source: item.source
    }));

    res.json({
      success: true,
      news: transformedNews,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching industry news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch industry news'
    });
  }
});

// Get security alerts
router.get('/security-alerts', async (req, res) => {
  try {
    const { limit = 10, offset = 0, severity } = req.query;
    const tenantId = req.user.tenantId;
    
    // Build query for security alerts
    let query = { 
      tenantId, 
      isActive: true,
      category: { $in: ['security', 'breach'] }
    };

    // Filter by severity if specified
    if (severity) {
      query.severity = severity;
    }

    // Get total count
    const total = await News.countDocuments(query);

    // Get paginated results
    const alerts = await News.find(query)
      .sort({ publishedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Transform to match expected format
    const transformedAlerts = alerts.map(item => ({
      id: item._id.toString(),
      title: item.title,
      summary: item.summary,
      publishedAt: item.publishedAt.toISOString(),
      url: item.url,
      severity: item.severity,
      affectedVendors: item.affectedVendors || [],
      recommendedAction: item.recommendedAction,
      source: item.source
    }));

    res.json({
      success: true,
      alerts: transformedAlerts,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security alerts'
    });
  }
});

// Get news by specific vendor
router.get('/vendors/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    const tenantId = req.user.tenantId;

    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Build query for vendor-specific news
    const query = {
      tenantId,
      isActive: true,
      $or: [
        { vendorId: vendorId },
        { vendorName: { $regex: new RegExp(vendor.name, 'i') } }
      ]
    };

    // Get total count
    const total = await News.countDocuments(query);

    // Get paginated results
    const news = await News.find(query)
      .sort({ publishedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('vendorId', 'name');

    // Transform to match expected format
    const transformedNews = news.map(item => ({
      id: item._id.toString(),
      title: item.title,
      summary: item.summary,
      publishedAt: item.publishedAt.toISOString(),
      url: item.url,
      category: item.category,
      severity: item.severity,
      vendorId: item.vendorId?._id?.toString(),
      vendorName: item.vendorName || item.vendorId?.name,
      source: item.source
    }));

    res.json({
      success: true,
      news: transformedNews,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      vendor: {
        id: vendor._id,
        name: vendor.name
      }
    });
  } catch (error) {
    console.error('Error fetching vendor-specific news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor-specific news'
    });
  }
});

// Get news statistics
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Get various statistics
    const [
      totalNewsItems,
      securityAlerts,
      criticalIssues,
      highRiskIssues,
      mediumRiskIssues,
      lowRiskIssues,
      vendorsWithNews
    ] = await Promise.all([
      News.countDocuments({ tenantId, isActive: true }),
      News.countDocuments({ tenantId, isActive: true, category: { $in: ['security', 'breach'] } }),
      News.countDocuments({ tenantId, isActive: true, severity: 'critical' }),
      News.countDocuments({ tenantId, isActive: true, severity: 'high' }),
      News.countDocuments({ tenantId, isActive: true, severity: 'medium' }),
      News.countDocuments({ tenantId, isActive: true, severity: 'low' }),
      News.distinct('vendorId', { tenantId, isActive: true, vendorId: { $exists: true, $ne: null } })
    ]);

    const stats = {
      totalNewsItems,
      securityAlerts,
      criticalIssues,
      highRiskIssues,
      mediumRiskIssues,
      lowRiskIssues,
      vendorsWithNews: vendorsWithNews.length,
      lastUpdated: new Date().toISOString(),
      newsSources: ['VendorTrak Monitoring', 'Security Weekly', 'Privacy Today', 'Supply Chain Security']
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching news stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news statistics'
    });
  }
});

// Manual news scraping trigger (admin only)
router.post('/scrape', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const tenantId = req.user.tenantId;
    
    // Trigger news scraping for this tenant
    const result = await newsScheduler.runNewsScrapingForTenant(tenantId);
    
    res.json({
      success: true,
      message: 'News scraping completed successfully',
      result
    });
  } catch (error) {
    console.error('Error triggering news scraping:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger news scraping'
    });
  }
});

// Get scheduler status (admin only)
router.get('/scheduler/status', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const status = newsScheduler.getStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status'
    });
  }
});

// Update scraping schedule (admin only)
router.put('/scheduler/schedule', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { cronExpression } = req.body;
    
    if (!cronExpression) {
      return res.status(400).json({
        success: false,
        error: 'Cron expression is required'
      });
    }

    const success = newsScheduler.updateSchedule(cronExpression);
    
    if (success) {
      res.json({
        success: true,
        message: 'Schedule updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid cron expression'
      });
    }
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule'
    });
  }
});

module.exports = router;
