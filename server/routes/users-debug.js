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
    console.log('👥 [USERS] GET / - Starting user fetch');
    console.log('👥 [USERS] Request user:', {
      id: req.user?._id,
      email: req.user?.email,
      role: req.user?.role,
      permissions: req.user?.permissions
    });
    console.log('👥 [USERS] Request tenant:', {
      id: req.tenant?._id,
      name: req.tenant?.name,
      status: req.tenant?.status
    });
    console.log('👥 [USERS] Query parameters:', req.query);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [USERS] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, role, status, search } = req.query;
    
    console.log('👥 [USERS] Processing parameters:', { page, limit, role, status, search });

    const filter = { tenantId: req.tenant._id };
    
    if (role) {
      filter.role = role;
      console.log('👥 [USERS] Added role filter:', role);
    }
    
    if (status) {
      filter.status = status;
      console.log('👥 [USERS] Added status filter:', status);
    }
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
      console.log('👥 [USERS] Added search filter for:', search);
    }
    
    console.log('👥 [USERS] Final filter:', JSON.stringify(filter, null, 2));

    const skip = (page - 1) * limit;
    
    console.log('👥 [USERS] Executing database queries...');
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('tenantId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);
    
    console.log('👥 [USERS] Database queries completed');
    console.log('👥 [USERS] Users found:', users.length);
    console.log('👥 [USERS] Total count:', total);

    const totalPages = Math.ceil(total / limit);
    
    const response = {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    };
    
    console.log('✅ [USERS] Successfully returning response');
    console.log('✅ [USERS] Response summary:', {
      userCount: users.length,
      totalUsers: total,
      currentPage: page,
      totalPages
    });
    
    res.json(response);
  } catch (error) {
    console.error('❌ [USERS] Get users error:', error);
    console.error('❌ [USERS] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create new user
router.post('/', requirePermission('manage:users'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['admin', 'regular', 'auditor']),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    console.log('👥 [USERS] POST / - Creating new user');
    console.log('👥 [USERS] Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [USERS] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, status = 'active' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email, tenantId: req.tenant._id });
    if (existingUser) {
      console.log('❌ [USERS] User already exists with email:', email);
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      status,
      tenantId: req.tenant._id
    });

    await user.save();
    
    console.log('✅ [USERS] User created successfully:', user._id);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error('❌ [USERS] Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', requirePermission('manage:users'), [
  body('email').optional().isEmail().normalizeEmail(),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('role').optional().isIn(['admin', 'regular', 'auditor']),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    console.log('👥 [USERS] PUT /:id - Updating user');
    console.log('👥 [USERS] User ID:', req.params.id);
    console.log('👥 [USERS] Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [USERS] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenant._id });
    if (!user) {
      console.log('❌ [USERS] User not found:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        user[key] = req.body[key];
      }
    });

    await user.save();
    
    console.log('✅ [USERS] User updated successfully:', user._id);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ user: userResponse });
  } catch (error) {
    console.error('❌ [USERS] Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', requirePermission('manage:users'), async (req, res) => {
  try {
    console.log('👥 [USERS] DELETE /:id - Deleting user');
    console.log('👥 [USERS] User ID:', req.params.id);
    
    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenant._id });
    if (!user) {
      console.log('❌ [USERS] User not found:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    
    console.log('✅ [USERS] User deleted successfully:', req.params.id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ [USERS] Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics
router.get('/stats', requirePermission('view:reports'), async (req, res) => {
  try {
    console.log('👥 [USERS] GET /stats - Getting user statistics');
    
    const stats = await User.aggregate([
      { $match: { tenantId: req.tenant._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          regular: { $sum: { $cond: [{ $eq: ['$role', 'regular'] }, 1, 0] } },
          auditors: { $sum: { $cond: [{ $eq: ['$role', 'auditor'] }, 1, 0] } }
        }
      }
    ]);

    console.log('✅ [USERS] Statistics retrieved successfully');
    
    res.json(stats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      suspended: 0,
      admins: 0,
      regular: 0,
      auditors: 0
    });
  } catch (error) {
    console.error('❌ [USERS] Get stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

// Get user permissions
router.get('/permissions', async (req, res) => {
  try {
    console.log('👥 [USERS] GET /permissions - Getting user permissions');
    console.log('👥 [USERS] Current user:', req.user?.email);
    
    if (!req.user) {
      console.log('❌ [USERS] No authenticated user');
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('✅ [USERS] Permissions retrieved successfully');
    
    res.json({
      permissions: req.user.permissions,
      role: req.user.role
    });
  } catch (error) {
    console.error('❌ [USERS] Get permissions error:', error);
    res.status(500).json({ error: 'Failed to get user permissions' });
  }
});

module.exports = router;
