const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { requireAdmin, requirePermission } = require('../middleware/auth-debug');

const router = express.Router();

// Get all users for tenant
router.get('/', requirePermission('view:reports'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['admin', 'regular', 'auditor']),
  query('status').optional().isIn(['active', 'inactive', 'suspended']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sortBy = 'firstName',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { tenantId: req.tenant._id };
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/:id', requirePermission('view:reports'), async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Create new user
router.post('/', requirePermission('create:user'), [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name required'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name required'),
  body('role').isIn(['admin', 'regular', 'auditor']).withMessage('Valid role required'),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const userData = {
      ...req.body,
      tenantId: req.tenant._id,
      emailVerified: true
    };

    const user = new User(userData);
    await user.save();

    const userResponse = user.toJSON();

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', requirePermission('update:user'), [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('role').optional().isIn(['admin', 'regular', 'auditor']),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
  body('profile.phone').optional().trim(),
  body('profile.department').optional().trim(),
  body('profile.position').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenant._id
      },
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', requirePermission('delete:user'), async (req, res) => {
  try {
    // Prevent deleting the last admin
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const userToDelete = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if this is the last admin
    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({
        tenantId: req.tenant._id,
        role: 'admin',
        status: 'active'
      });

      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Reset user password
router.post('/:id/reset-password', requirePermission('update:user'), [
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get user statistics
router.get('/stats/overview', requirePermission('view:reports'), async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      regularUsers,
      auditorUsers
    ] = await Promise.all([
      User.countDocuments({ tenantId: req.tenant._id }),
      User.countDocuments({ tenantId: req.tenant._id, status: 'active' }),
      User.countDocuments({ tenantId: req.tenant._id, role: 'admin' }),
      User.countDocuments({ tenantId: req.tenant._id, role: 'regular' }),
      User.countDocuments({ tenantId: req.tenant._id, role: 'auditor' })
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      roleDistribution: {
        admin: adminUsers,
        regular: regularUsers,
        auditor: auditorUsers
      }
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

// Get user permissions
router.get('/:id/permissions', requirePermission('view:reports'), async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    }).select('permissions role');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      permissions: user.permissions,
      role: user.role
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ error: 'Failed to get user permissions' });
  }
});

module.exports = router;
