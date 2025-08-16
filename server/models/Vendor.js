const mongoose = require('mongoose');

const contactPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
});

const contractSchema = new mongoose.Schema({
  contractNumber: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  value: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'terminated', 'pending'],
    default: 'active'
  },
  renewalDate: Date,
  autoRenew: {
    type: Boolean,
    default: false
  },
  terms: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const dataTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sensitivity: {
    type: String,
    enum: ['public', 'internal', 'confidential', 'restricted'],
    default: 'internal'
  },
  retentionPeriod: {
    type: Number, // in days
    default: 2555 // 7 years
  },
  compliance: [{
    framework: String,
    requirements: [String]
  }]
});

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
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'prospect'],
    default: 'active'
  },
  vendorType: {
    type: String,
    enum: ['technology', 'consulting', 'services', 'products', 'other'],
    required: true
  },
  contactInfo: {
    website: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  contactPersons: [contactPersonSchema],
  contracts: [contractSchema],
  dataTypes: [dataTypeSchema],
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  compliance: {
    certifications: [{
      name: String,
      issuer: String,
      validUntil: Date,
      status: {
        type: String,
        enum: ['valid', 'expired', 'pending'],
        default: 'valid'
      }
    }],
    audits: [{
      type: String,
      date: Date,
      result: {
        type: String,
        enum: ['pass', 'fail', 'conditional'],
        required: true
      },
      notes: String
    }]
  },
  performance: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    reviews: [{
      date: {
        type: Date,
        default: Date.now
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      comment: String,
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes for efficient queries
vendorSchema.index({ tenantId: 1, name: 1 });
vendorSchema.index({ tenantId: 1, status: 1 });
vendorSchema.index({ tenantId: 1, vendorType: 1 });
vendorSchema.index({ tenantId: 1, 'contracts.status': 1 });
vendorSchema.index({ tenantId: 1, riskLevel: 1 });
vendorSchema.index({ tenantId: 1, tags: 1 });

// Virtual for active contracts count
vendorSchema.virtual('activeContractsCount').get(function() {
  return this.contracts.filter(contract => contract.status === 'active').length;
});

// Virtual for total contract value
vendorSchema.virtual('totalContractValue').get(function() {
  return this.contracts
    .filter(contract => contract.status === 'active')
    .reduce((total, contract) => total + contract.value.amount, 0);
});

// Ensure virtual fields are serialized
vendorSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Vendor', vendorSchema);
