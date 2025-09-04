const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const PasswordResetToken = require('../models/PasswordResetToken');
const { authenticateToken } = require('../middleware/auth-debug');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Register new tenant and admin user
router.post('/register', [
  body('tenant.name').trim().isLength({ min: 2, max: 100 }).withMessage('Tenant name must be 2-100 characters'),
  body('tenant.domain').trim().isLength({ min: 3, max: 50 }).withMessage('Domain must be 3-50 characters'),
  body('tenant.subdomain').trim().isLength({ min: 3, max: 50 }).withMessage('Subdomain must be 3-50 characters'),
  body('user.email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('user.password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('user.firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name required'),
  body('user.lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tenant, user } = req.body;

    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({
      $or: [
        { domain: tenant.domain },
        { subdomain: tenant.subdomain }
      ]
    });

    if (existingTenant) {
      return res.status(400).json({ error: 'Tenant with this domain or subdomain already exists' });
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ email: user.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create tenant
    const newTenant = new Tenant({
      name: tenant.name,
      domain: tenant.domain,
      subdomain: tenant.subdomain,
      contactInfo: {
        email: user.email
      }
    });

    await newTenant.save();

    // Create admin user
    const newUser = new User({
      tenantId: newTenant._id,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: 'admin',
      emailVerified: true
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    res.status(201).json({
      message: 'Tenant and admin user created successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        tenant: {
          id: newTenant._id,
          name: newTenant.name,
          subdomain: newTenant.subdomain
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with tenant info
    const user = await User.findOne({ email })
      .populate('tenantId', 'name subdomain status')
      .select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'User account is not active' });
    }

    // Check if tenant is active
    if (user.tenantId.status !== 'active') {
      return res.status(401).json({ error: 'Tenant account is not active' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant: {
          id: user.tenantId._id,
          name: user.tenantId.name,
          subdomain: user.tenantId.subdomain
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('tenantId', 'name subdomain status settings');

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        profile: user.profile,
        lastLogin: user.lastLogin,
        tenant: user.tenantId
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('profile.phone').optional().trim(),
  body('profile.department').optional().trim(),
  body('profile.position').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, profile } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (profile) updateData.profile = { ...req.user.profile, ...profile };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('tenantId', 'name subdomain status');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        profile: user.profile,
        tenant: user.tenantId
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Forgot password - request password reset
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('🔐 [FORGOT-PASSWORD] No user found with email:', email);
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save reset token to database
    const resetTokenDoc = new PasswordResetToken({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
    });

    await resetTokenDoc.save();

    // In a real application, you would send an email here
    // For now, we'll just return the token (remove this in production)
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    res.json({ 
      message: 'Password reset link sent successfully',
      resetUrl, // Remove this in production - only for development
      note: 'In production, this would be sent via email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('🔐 [RESET-PASSWORD] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, email, newPassword } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid reset request' });
    }

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find and validate reset token
    const resetToken = await PasswordResetToken.findOne({
      userId: user._id,
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update user password
    user.password = newPassword;
    await user.save();

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
