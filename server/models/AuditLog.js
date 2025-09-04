const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'READ', 'UPDATE', 'DELETE',
      'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT',
      'PASSWORD_RESET', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
      'VENDOR_CREATED', 'VENDOR_UPDATED', 'VENDOR_DELETED',
      'CONTRACT_ADDED', 'CONTRACT_UPDATED', 'CONTRACT_DELETED'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['USER', 'VENDOR', 'CONTRACT', 'AUTH', 'SYSTEM']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  details: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
auditLogSchema.index({ tenantId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });

// Static method to create audit log entry
auditLogSchema.statics.log = function(data) {
  return this.create({
    tenantId: data.tenantId,
    userId: data.userId,
    userEmail: data.userEmail,
    action: data.action,
    resource: data.resource,
    resourceId: data.resourceId,
    details: data.details,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    metadata: data.metadata || {}
  });
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
