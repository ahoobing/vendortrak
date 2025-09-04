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

    // Store original data for UPDATE operations to track changes
    let originalData = null;
    if (req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const resourceId = getResourceIdFromUrl(req.path);
        if (resourceId) {
          const resource = getResourceFromUrl(req.path);
          if (resource === 'USER') {
            const User = require('../models/User');
            originalData = await User.findById(resourceId).lean();
          } else if (resource === 'VENDOR') {
            const Vendor = require('../models/Vendor');
            originalData = await Vendor.findById(resourceId).lean();
          }
        }
      } catch (error) {
        console.error('Error fetching original data for audit:', error);
      }
    }

    // Store original res.json to intercept response
    const originalJson = res.json;
    let responseData = null;

    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };

    // Capture request payload for logging
    let requestPayload = null;
    let queryParams = null;
    
    // Capture request body for POST/PUT/PATCH requests
    if (req.body && Object.keys(req.body).length > 0) {
      // Create a sanitized copy of the request body
      requestPayload = JSON.parse(JSON.stringify(req.body));
      
      // Remove sensitive fields from payload
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
      const sanitizePayload = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const sanitized = Array.isArray(obj) ? [] : {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizePayload(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };
      
      requestPayload = sanitizePayload(requestPayload);
    }
    
    // Capture query parameters for GET requests
    if (req.method === 'GET' && req.query && Object.keys(req.query).length > 0) {
      queryParams = { ...req.query };
      
      // Remove sensitive query parameters
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
      for (const key of Object.keys(queryParams)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          queryParams[key] = '[REDACTED]';
        }
      }
    }

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

          // Prepare metadata with change tracking
          const metadata = {
            method: req.method,
            url: req.path,
            statusCode: res.statusCode,
            timestamp: new Date()
          };

          // Add request payload to metadata
          if (requestPayload) {
            metadata.requestPayload = requestPayload;
          }
          
          // Add query parameters to metadata
          if (queryParams) {
            metadata.queryParams = queryParams;
          }

          // Add change tracking for UPDATE operations
          if (action === 'UPDATE' && originalData && responseData && responseData.data) {
            const changes = {};
            const updatedData = responseData.data;
            
            // Compare original data with updated data
            Object.keys(updatedData).forEach(key => {
              if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
                const originalValue = originalData[key];
                const updatedValue = updatedData[key];
                
                if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
                  changes[key] = {
                    before: originalValue,
                    after: updatedValue
                  };
                }
              }
            });

            if (Object.keys(changes).length > 0) {
              metadata.changes = changes;
            }
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
            metadata
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
