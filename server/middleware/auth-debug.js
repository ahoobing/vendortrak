const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 [AUTH] Starting authentication for:', req.method, req.path);
    console.log('🔐 [AUTH] Headers:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    console.log('🔐 [AUTH] Auth header:', authHeader);
    console.log('🔐 [AUTH] Extracted token:', token ? `${token.substring(0, 20)}...` : 'none');

    if (!token) {
      console.log('❌ [AUTH] No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔐 [AUTH] Token decoded successfully:', { userId: decoded.userId });
    
    // Get user with tenant information
    const user = await User.findById(decoded.userId)
      .populate('tenantId', 'name subdomain status')
      .select('-password');

    console.log('🔐 [AUTH] User found:', {
      id: user?._id,
      email: user?.email,
      role: user?.role,
      status: user?.status,
      tenantId: user?.tenantId?._id,
      tenantName: user?.tenantId?.name,
      tenantStatus: user?.tenantId?.status
    });

    if (!user) {
      console.log('❌ [AUTH] User not found in database');
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (user.status !== 'active') {
      console.log('❌ [AUTH] User account is not active:', user.status);
      return res.status(401).json({ error: 'User account is not active' });
    }

    if (!user.tenantId) {
      console.log('❌ [AUTH] User has no tenant');
      return res.status(401).json({ error: 'User not associated with any tenant' });
    }

    if (user.tenantId.status !== 'active') {
      console.log('❌ [AUTH] Tenant account is not active:', user.tenantId.status);
      return res.status(401).json({ error: 'Tenant account is not active' });
    }

    // Add user and tenant info to request
    req.user = user;
    req.tenant = user.tenantId;
    
    console.log('✅ [AUTH] Authentication successful for user:', user.email);
    console.log('✅ [AUTH] Tenant context set:', req.tenant.name);

    next();
  } catch (error) {
    console.error('❌ [AUTH] Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    console.log('🔒 [PERMISSION] Checking permission:', permission);
    console.log('🔒 [PERMISSION] User:', {
      id: req.user?._id,
      email: req.user?.email,
      role: req.user?.role
    });
    console.log('🔒 [PERMISSION] User permissions:', req.user?.permissions);
    
    if (!req.user) {
      console.log('❌ [PERMISSION] No user in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const hasPermission = req.user.canPerform(permission);
    console.log('🔒 [PERMISSION] Permission check result:', hasPermission);
    
    if (!hasPermission) {
      console.log('❌ [PERMISSION] Permission denied for:', permission);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    console.log('✅ [PERMISSION] Permission granted for:', permission);
    next();
  };
};

const requireAdmin = requireRole(['admin']);
const requireManager = requireRole(['admin', 'regular']);
const requireAuditor = requireRole(['admin', 'auditor']);

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireAdmin,
  requireManager,
  requireAuditor
};
