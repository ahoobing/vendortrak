const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'active'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isSubprocessor: {
    type: Boolean,
    default: false
  },
  contractValue: {
    type: Number,
    default: 0
  },
  contractStartDate: {
    type: Date
  },
  contractEndDate: {
    type: Date
  },
  primaryContact: {
    type: String,
    trim: true
  },
  primaryContactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  primaryContactPhone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  dataTypes: [{
    dataTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DataType',
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
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

// Indexes
vendorSchema.index({ tenantId: 1, name: 1 });
vendorSchema.index({ tenantId: 1, status: 1 });
vendorSchema.index({ tenantId: 1, riskLevel: 1 });
vendorSchema.index({ tenantId: 1, industry: 1 });
vendorSchema.index({ tenantId: 1, 'dataTypes.dataTypeId': 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
