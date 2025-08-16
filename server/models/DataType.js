const mongoose = require('mongoose');

const dataTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  classification: {
    type: String,
    required: true,
    enum: [
      'Personal Data',
      'Sensitive Personal Data',
      'Financial Data',
      'Health Data',
      'Business Data',
      'Technical Data',
      'Legal Data',
      'Other'
    ],
    default: 'Other'
  },

  riskLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  complianceRequirements: [{
    type: String,
    enum: [
      'GDPR',
      'CCPA',
      'HIPAA',
      'SOX',
      'PCI-DSS',
      'FERPA',
      'GLBA',
      'Other'
    ]
  }],
  retentionPeriod: {
    type: Number, // in months
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
dataTypeSchema.index({ tenantId: 1, name: 1 }, { unique: true });
dataTypeSchema.index({ tenantId: 1, classification: 1 });
dataTypeSchema.index({ tenantId: 1, riskLevel: 1 });
dataTypeSchema.index({ tenantId: 1, isActive: 1 });

// Virtual for formatted retention period
dataTypeSchema.virtual('retentionPeriodFormatted').get(function() {
  if (this.retentionPeriod === 0) return 'Indefinite';
  if (this.retentionPeriod < 12) return `${this.retentionPeriod} months`;
  const years = Math.floor(this.retentionPeriod / 12);
  const months = this.retentionPeriod % 12;
  if (months === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
});

// Ensure virtual fields are serialized
dataTypeSchema.set('toJSON', { virtuals: true });
dataTypeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DataType', dataTypeSchema);
