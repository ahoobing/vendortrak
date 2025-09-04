const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['admin', 'regular', 'auditor'],
    default: 'regular'
  },
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageVendors: { type: Boolean, default: false },
    canManageDataTypes: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
    canAuditLogs: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  profile: {
    phone: String,
    department: String,
    position: String,
    avatar: String
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for tenant isolation
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, status: 1 });
userSchema.index({ tenantId: 1, role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = {
          canManageUsers: true,
          canManageVendors: true,
          canManageDataTypes: true,
          canViewReports: true,
          canExportData: true,
          canAuditLogs: true
        };
        break;
      case 'regular':
        this.permissions = {
          canManageUsers: false,
          canManageVendors: true,
          canManageDataTypes: false,
          canViewReports: true,
          canExportData: false,
          canAuditLogs: false
        };
        break;
      case 'auditor':
        this.permissions = {
          canManageUsers: false,
          canManageVendors: false,
          canManageDataTypes: false,
          canViewReports: true,
          canExportData: true,
          canAuditLogs: true
        };
        break;
    }
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get full name
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Method to check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] || false;
};

// Method to check if user can perform action
userSchema.methods.canPerform = function(action) {
  const actionPermissions = {
    'create:user': 'canManageUsers',
    'update:user': 'canManageUsers',
    'delete:user': 'canManageUsers',
    'create:vendor': 'canManageVendors',
    'update:vendor': 'canManageVendors',
    'delete:vendor': 'canManageVendors',
    'create:datatype': 'canManageDataTypes',
    'update:datatype': 'canManageDataTypes',
    'delete:datatype': 'canManageDataTypes',
    'view:reports': 'canViewReports',
    'export:data': 'canExportData',
    'view:audit': 'canAuditLogs'
  };
  
  const requiredPermission = actionPermissions[action];
  return requiredPermission ? this.hasPermission(requiredPermission) : false;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.getFullName();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.emailVerificationToken;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
