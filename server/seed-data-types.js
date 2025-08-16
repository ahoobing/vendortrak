const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Tenant = require('./models/Tenant');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendortrak')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Data Type Schema (simplified for seeding)
const dataTypeSchema = new mongoose.Schema({
  name: String,
  description: String,
  classification: String,
  riskLevel: String,
  complianceRequirements: [String],
  retentionPeriod: Number,
  isActive: Boolean,
  tenantId: mongoose.Schema.Types.ObjectId,
  createdBy: mongoose.Schema.Types.ObjectId,
  updatedBy: mongoose.Schema.Types.ObjectId
}, {
  timestamps: true
});

const DataType = mongoose.model('DataType', dataTypeSchema);

// Sample data types
const sampleDataTypes = [
  {
    name: 'Customer Personal Information',
    description: 'Personal data collected from customers including names, addresses, phone numbers, and email addresses',
    classification: 'Personal Data',
    riskLevel: 'Medium',
    complianceRequirements: ['GDPR', 'CCPA'],
    retentionPeriod: 84, // 7 years
    isActive: true
  },
  {
    name: 'Credit Card Information',
    description: 'Payment card data including card numbers, expiration dates, and CVV codes',
    classification: 'Financial Data',
    riskLevel: 'Critical',
    complianceRequirements: ['PCI-DSS', 'GDPR'],
    retentionPeriod: 0, // Indefinite for compliance
    isActive: true
  },
  {
    name: 'Employee Health Records',
    description: 'Medical information and health records of employees',
    classification: 'Health Data',
    riskLevel: 'High',
    complianceRequirements: ['HIPAA', 'GDPR'],
    retentionPeriod: 120, // 10 years
    isActive: true
  },
  {
    name: 'Business Financial Records',
    description: 'Company financial data including revenue, expenses, and accounting records',
    classification: 'Financial Data',
    riskLevel: 'High',
    complianceRequirements: ['SOX', 'GLBA'],
    retentionPeriod: 84, // 7 years
    isActive: true
  },
  {
    name: 'System Logs',
    description: 'Technical logs and system monitoring data',
    classification: 'Technical Data',
    riskLevel: 'Low',
    complianceRequirements: [],
    retentionPeriod: 12, // 1 year
    isActive: true
  },
  {
    name: 'Legal Documents',
    description: 'Contracts, legal agreements, and compliance documentation',
    classification: 'Legal Data',
    riskLevel: 'High',
    complianceRequirements: ['SOX'],
    retentionPeriod: 0, // Indefinite
    isActive: true
  },
  {
    name: 'Social Security Numbers',
    description: 'Employee and customer SSNs for tax and identification purposes',
    classification: 'Sensitive Personal Data',
    riskLevel: 'Critical',
    complianceRequirements: ['GDPR', 'CCPA', 'GLBA'],
    retentionPeriod: 0, // Indefinite
    isActive: true
  },
  {
    name: 'Marketing Analytics',
    description: 'Customer behavior data and marketing campaign analytics',
    classification: 'Business Data',
    riskLevel: 'Medium',
    complianceRequirements: ['GDPR', 'CCPA'],
    retentionPeriod: 36, // 3 years
    isActive: true
  }
];

async function seedDataTypes() {
  try {
    // Get the first tenant and user for seeding
    const tenant = await Tenant.findOne();
    const user = await User.findOne();

    if (!tenant) {
      console.error('No tenant found. Please create a tenant first.');
      process.exit(1);
    }

    if (!user) {
      console.error('No user found. Please create a user first.');
      process.exit(1);
    }

    console.log(`Seeding data types for tenant: ${tenant.name}`);
    console.log(`Using user: ${user.firstName} ${user.lastName}`);

    // Clear existing data types for this tenant
    await DataType.deleteMany({ tenantId: tenant._id });
    console.log('Cleared existing data types');

    // Insert sample data types
    const dataTypesWithIds = sampleDataTypes.map(dataType => ({
      ...dataType,
      tenantId: tenant._id,
      createdBy: user._id,
      updatedBy: user._id
    }));

    const result = await DataType.insertMany(dataTypesWithIds);
    console.log(`Successfully seeded ${result.length} data types`);

    // Display the created data types
    console.log('\nCreated Data Types:');
    result.forEach((dataType, index) => {
      console.log(`${index + 1}. ${dataType.name} (${dataType.classification}) - Risk: ${dataType.riskLevel}`);
    });

    console.log('\nData types seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data types:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDataTypes();
