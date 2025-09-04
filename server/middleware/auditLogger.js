const AuditLog = require('../models/AuditLog');

// Helper function to determine action from HTTP method
const getActionFromMethod = (method) => {
  switch (method.toUpperCase()) {
    case 'GET': return 'READ';
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'READ';
  }
};

// Helper function to determine resource from URL
const getResourceFromUrl = (url) => {
  if (url.includes('/users')) return 'USER';
  if (url.includes('/vendors')) return 'VENDOR';
  if (url.includes('/contracts')) return 'CONTRACT';
  if (url.includes('/auth')) return 'AUTH';
  return 'SYSTEM';
};

// Helper function to extract resource ID from URL
const getResourceIdFromUrl = (url) => {
  const matches = url.match(/\/([a-f0-9]{24})(?:\/|$)/);
  return matches ? matches[1] : null;
};

// Audit logging middleware
const auditLogger = (options = {}) => {
  return async (req, res, next) => {
    // Skip audit logging for certain paths
    const skipPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/audit', // Prevent infinite loops
      '/api/health'
    ];

    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Only log for authenticated users
    if (!req.user || !req.tenant) {
      return next();
    }

    // Store original res.json to intercept response
    const originalJson = res.json;
    let responseData = null;

    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };

    // Log the audit entry after response is sent
    res.on('finish', async () => {
      try {
        // Only log successful operations (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const action = getActionFromMethod(req.method);
          const resource = getResourceFromUrl(req.path);
          const resourceId = getResourceIdFromUrl(req.path);

          // Create details based on action and response
          let details = `${action} ${resource}`;
          if (resourceId) {
            details += ` (ID: ${resourceId})`;
          }

          // Add specific details for certain actions
          if (action === 'CREATE' && responseData && responseData.data) {
            details += ` - Created: ${responseData.data.name || responseData.data.email || 'New record'}`;
          } else if (action === 'UPDATE' && responseData && responseData.data) {
            details += ` - Updated: ${responseData.data.name || responseData.data.email || 'Record'}`;
          } else if (action === 'DELETE' && responseData && responseData.message) {
            details += ` - ${responseData.message}`;
          }

          // Special handling for login/logout
          if (req.path === '/api/auth/profile' && req.method === 'GET') {
            details = 'User profile accessed';
          }

          await AuditLog.log({
            tenantId: req.tenant._id,
            userId: req.user._id,
            userEmail: req.user.email,
            action,
            resource,
            resourceId,
            details,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            metadata: {
              method: req.method,
              url: req.path,
              statusCode: res.statusCode,
              timestamp: new Date()
            }
          });
        }
      } catch (error) {
        console.error('Audit logging error:', error);
        // Don't throw error to avoid breaking the main request
      }
    });

    next();
  };
};

// Special audit logger for authentication events
const auditAuth = async (req, res, next) => {
  if (!req.user || !req.tenant) {
    return next();
  }

  try {
    await AuditLog.log({
      tenantId: req.tenant._id,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'LOGIN',
      resource: 'AUTH',
      details: 'User logged in successfully',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: {
        method: req.method,
        url: req.path,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Auth audit logging error:', error);
  }

  next();
};

module.exports = {
  auditLogger,
  auditAuth
};
