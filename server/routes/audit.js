const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticateToken } = require('../middleware/auth-debug');
const { requirePermission } = require('../middleware/auth');

// Get audit logs for the tenant
router.get('/', authenticateToken, requirePermission('audit:logs'), async (req, res) => {
  try {
    console.log('🔍 [AUDIT] GET / - Getting audit logs');
    console.log('🔍 [AUDIT] Tenant:', req.tenant.name);
    console.log('🔍 [AUDIT] User:', req.user.email);

    const {
      page = 1,
      limit = 50,
      action,
      resource,
      userId,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object
    const filter = {
      tenantId: req.tenant._id
    };

    if (action) {
      filter.action = action;
    }

    if (resource) {
      filter.resource = resource;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    if (search) {
      filter.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('🔍 [AUDIT] Filter:', JSON.stringify(filter, null, 2));

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get audit logs with pagination
    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'email firstName lastName')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await AuditLog.countDocuments(filter);

    console.log('🔍 [AUDIT] Found logs:', auditLogs.length);
    console.log('🔍 [AUDIT] Total count:', totalCount);

    res.json({
      success: true,
      data: auditLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + auditLogs.length < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('🔍 [AUDIT] Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit logs'
    });
  }
});

// Get audit log statistics
router.get('/stats', authenticateToken, requirePermission('audit:logs'), async (req, res) => {
  try {
    console.log('🔍 [AUDIT] GET /stats - Getting audit statistics');

    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {
      tenantId: req.tenant._id
    };

    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.timestamp.$lte = new Date(endDate);
      }
    }

    // Get statistics
    const [
      totalLogs,
      actionStats,
      resourceStats,
      userStats,
      recentActivity
    ] = await Promise.all([
      // Total logs
      AuditLog.countDocuments(dateFilter),
      
      // Action statistics
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Resource statistics
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$resource', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // User statistics
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$userEmail', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Recent activity (last 24 hours)
      AuditLog.countDocuments({
        ...dateFilter,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    console.log('🔍 [AUDIT] Statistics retrieved successfully');

    res.json({
      success: true,
      data: {
        totalLogs,
        actionStats,
        resourceStats,
        userStats,
        recentActivity,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });

  } catch (error) {
    console.error('🔍 [AUDIT] Error getting audit statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit statistics'
    });
  }
});

// Get audit log by ID
router.get('/:id', authenticateToken, requirePermission('audit:logs'), async (req, res) => {
  try {
    console.log('🔍 [AUDIT] GET /:id - Getting audit log by ID:', req.params.id);

    const auditLog = await AuditLog.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    }).populate('userId', 'email firstName lastName');

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }

    console.log('🔍 [AUDIT] Audit log found');

    res.json({
      success: true,
      data: auditLog
    });

  } catch (error) {
    console.error('🔍 [AUDIT] Error getting audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit log'
    });
  }
});

// Export audit logs to CSV
router.get('/export/csv', authenticateToken, requirePermission('audit:logs'), async (req, res) => {
  try {
    console.log('🔍 [AUDIT] GET /export/csv - Exporting audit logs to CSV');

    const {
      action,
      resource,
      userId,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object (same as GET /)
    const filter = {
      tenantId: req.tenant._id
    };

    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } }
      ];
    }

    // Get all matching audit logs
    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'email firstName lastName')
      .sort({ timestamp: -1 });

    // Generate CSV content
    const csvHeaders = [
      'Timestamp',
      'User Email',
      'Action',
      'Resource',
      'Details',
      'IP Address',
      'User Agent'
    ].join(',');

    const csvRows = auditLogs.map(log => [
      log.timestamp.toISOString(),
      log.userEmail,
      log.action,
      log.resource,
      `"${(log.details || '').replace(/"/g, '""')}"`,
      log.ipAddress || '',
      `"${(log.userAgent || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Set response headers for CSV download
    const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

    console.log('🔍 [AUDIT] CSV export completed');

  } catch (error) {
    console.error('🔍 [AUDIT] Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs'
    });
  }
});

module.exports = router;
