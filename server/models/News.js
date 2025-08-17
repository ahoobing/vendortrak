const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP/HTTPS URL'
    }
  },
  publishedAt: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['security', 'general', 'maintenance', 'compliance', 'breach', 'update'],
    default: 'general'
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    default: 'info'
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  sourceUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Source URL must be a valid HTTP/HTTPS URL'
    }
  },
  // For vendor-specific news
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  vendorName: {
    type: String,
    trim: true
  },
  // For security alerts
  affectedVendors: [{
    type: String,
    trim: true
  }],
  recommendedAction: {
    type: String,
    trim: true
  },
  // Metadata
  keywords: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  // Processing metadata
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // For deduplication
  hash: {
    type: String,
    unique: true,
    sparse: true
  },
  // Tenant isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance
newsSchema.index({ tenantId: 1, publishedAt: -1 });
newsSchema.index({ tenantId: 1, category: 1 });
newsSchema.index({ tenantId: 1, severity: 1 });
newsSchema.index({ tenantId: 1, vendorId: 1 });
newsSchema.index({ hash: 1 });
newsSchema.index({ url: 1 });
newsSchema.index({ 'keywords': 'text', 'title': 'text', 'summary': 'text' });

// Generate hash for deduplication
newsSchema.methods.generateHash = function() {
  const crypto = require('crypto');
  const content = `${this.title}${this.url}${this.publishedAt}`;
  return crypto.createHash('sha256').update(content).digest('hex');
};

// Pre-save middleware to generate hash
newsSchema.pre('save', function(next) {
  if (!this.hash) {
    this.hash = this.generateHash();
  }
  this.lastUpdated = new Date();
  next();
});

// Static method to find news by vendor
newsSchema.statics.findByVendor = function(vendorId, tenantId, options = {}) {
  const query = {
    tenantId,
    $or: [
      { vendorId: vendorId },
      { vendorName: { $regex: new RegExp(vendorId, 'i') } },
      { 'affectedVendors': { $regex: new RegExp(vendorId, 'i') } }
    ]
  };
  
  return this.find(query, null, options);
};

// Static method to find security news
newsSchema.statics.findSecurityNews = function(tenantId, options = {}) {
  const query = {
    tenantId,
    category: { $in: ['security', 'breach', 'compliance'] }
  };
  
  return this.find(query, null, options);
};

// Static method to find recent news
newsSchema.statics.findRecent = function(tenantId, days = 7, options = {}) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const query = {
    tenantId,
    publishedAt: { $gte: cutoffDate }
  };
  
  return this.find(query, null, options);
};

module.exports = mongoose.model('News', newsSchema);
