const express = require('express');
const { body, validationResult } = require('express-validator');
const Tenant = require('../models/Tenant');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get current tenant info
router.get('/current', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenant._id);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ tenant });

  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to get tenant information' });
  }
});

// Update tenant settings (admin only)
router.put('/current', requireAdmin, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('contactInfo.email').optional().isEmail(),
  body('contactInfo.phone').optional().trim(),
  body('settings.maxUsers').optional().isInt({ min: 1, max: 1000 }),
  body('settings.maxVendors').optional().isInt({ min: 1, max: 10000 }),
  body('settings.features').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenant._id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Tenant updated successfully',
      tenant
    });

  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// Get tenant statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const Vendor = require('../models/Vendor');

    const [
      totalUsers,
      activeUsers,
      totalVendors,
      activeVendors,
      totalContracts,
      activeContracts
    ] = await Promise.all([
      User.countDocuments({ tenantId: req.tenant._id }),
      User.countDocuments({ tenantId: req.tenant._id, status: 'active' }),
      Vendor.countDocuments({ tenantId: req.tenant._id }),
      Vendor.countDocuments({ tenantId: req.tenant._id, status: 'active' }),
      Vendor.aggregate([
        { $match: { tenantId: req.tenant._id } },
        { $unwind: '$contracts' },
        { $count: 'total' }
      ]),
      Vendor.aggregate([
        { $match: { tenantId: req.tenant._id } },
        { $unwind: '$contracts' },
        { $match: { 'contracts.status': 'active' } },
        { $count: 'total' }
      ])
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      vendors: {
        total: totalVendors,
        active: activeVendors,
        inactive: totalVendors - activeVendors
      },
      contracts: {
        total: totalContracts[0]?.total || 0,
        active: activeContracts[0]?.total || 0
      },
      limits: {
        maxUsers: req.tenant.settings.maxUsers,
        maxVendors: req.tenant.settings.maxVendors,
        usersUsed: totalUsers,
        vendorsUsed: totalVendors
      }
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(500).json({ error: 'Failed to get tenant statistics' });
  }
});

// Get vendor type distribution
router.get('/stats/vendor-types', requireAdmin, async (req, res) => {
  try {
    const Vendor = require('../models/Vendor');

    const vendorTypes = await Vendor.aggregate([
      { $match: { tenantId: req.tenant._id } },
      {
        $group: {
          _id: '$vendorType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ vendorTypes });

  } catch (error) {
    console.error('Get vendor types error:', error);
    res.status(500).json({ error: 'Failed to get vendor type distribution' });
  }
});

// Get risk level distribution
router.get('/stats/risk-levels', requireAdmin, async (req, res) => {
  try {
    const Vendor = require('../models/Vendor');

    const riskLevels = await Vendor.aggregate([
      { $match: { tenantId: req.tenant._id } },
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ riskLevels });

  } catch (error) {
    console.error('Get risk levels error:', error);
    res.status(500).json({ error: 'Failed to get risk level distribution' });
  }
});

// Get contract value summary
router.get('/stats/contract-values', requireAdmin, async (req, res) => {
  try {
    const Vendor = require('../models/Vendor');

    const contractValues = await Vendor.aggregate([
      { $match: { tenantId: req.tenant._id } },
      { $unwind: '$contracts' },
      { $match: { 'contracts.status': 'active' } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$contracts.value.amount' },
          avgValue: { $avg: '$contracts.value.amount' },
          minValue: { $min: '$contracts.value.amount' },
          maxValue: { $max: '$contracts.value.amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ 
      contractValues: contractValues[0] || {
        totalValue: 0,
        avgValue: 0,
        minValue: 0,
        maxValue: 0,
        count: 0
      }
    });

  } catch (error) {
    console.error('Get contract values error:', error);
    res.status(500).json({ error: 'Failed to get contract value summary' });
  }
});

// Get recent activity
router.get('/activity', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const Vendor = require('../models/Vendor');

    const [recentUsers, recentVendors] = await Promise.all([
      User.find({ tenantId: req.tenant._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email createdAt'),
      Vendor.find({ tenantId: req.tenant._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name vendorType status createdAt')
    ]);

    const activity = {
      recentUsers,
      recentVendors
    };

    res.json({ activity });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get recent activity' });
  }
});

module.exports = router;
