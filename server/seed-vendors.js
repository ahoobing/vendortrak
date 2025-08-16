const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendortrak')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Vendor Schema (simplified for seeding)
const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  website: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  industry: String,
  description: String,
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
  contractValue: Number,
  contractStartDate: Date,
  contractEndDate: Date,
  primaryContact: String,
  primaryContactEmail: String,
  primaryContactPhone: String,
  notes: String,
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Vendor = mongoose.model('Vendor', vendorSchema);

// Sample vendor data
const sampleVendors = [
  {
    name: 'TechCorp Solutions',
    email: 'contact@techcorp.com',
    phone: '(555) 123-4567',
    website: 'https://www.techcorp.com',
    address: '123 Tech Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'United States',
    industry: 'Technology',
    description: 'Leading provider of cloud computing solutions and IT consulting services.',
    status: 'active',
    riskLevel: 'low',
    contractValue: 500000,
    contractStartDate: new Date('2024-01-01'),
    contractEndDate: new Date('2024-12-31'),
    primaryContact: 'Sarah Johnson',
    primaryContactEmail: 'sarah.johnson@techcorp.com',
    primaryContactPhone: '(555) 123-4568',
    notes: 'Excellent service provider with strong track record. Contract renewal due in Q4.'
  },
  {
    name: 'Global Logistics Inc.',
    email: 'info@globallogistics.com',
    phone: '(555) 234-5678',
    website: 'https://www.globallogistics.com',
    address: '456 Logistics Avenue',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'United States',
    industry: 'Logistics',
    description: 'International logistics and supply chain management services.',
    status: 'active',
    riskLevel: 'medium',
    contractValue: 750000,
    contractStartDate: new Date('2024-03-01'),
    contractEndDate: new Date('2025-02-28'),
    primaryContact: 'Michael Chen',
    primaryContactEmail: 'michael.chen@globallogistics.com',
    primaryContactPhone: '(555) 234-5679',
    notes: 'Reliable partner for international shipping. Some delays reported in Q2.'
  },
  {
    name: 'HealthCare Partners',
    email: 'contact@healthcarepartners.com',
    phone: '(555) 345-6789',
    website: 'https://www.healthcarepartners.com',
    address: '789 Medical Center Drive',
    city: 'Boston',
    state: 'MA',
    zipCode: '02108',
    country: 'United States',
    industry: 'Healthcare',
    description: 'Specialized healthcare equipment and medical supplies provider.',
    status: 'pending',
    riskLevel: 'medium',
    contractValue: 300000,
    contractStartDate: new Date('2024-06-01'),
    contractEndDate: new Date('2025-05-31'),
    primaryContact: 'Dr. Emily Rodriguez',
    primaryContactEmail: 'emily.rodriguez@healthcarepartners.com',
    primaryContactPhone: '(555) 345-6790',
    notes: 'New vendor under evaluation. Medical equipment quality assessment in progress.'
  },
  {
    name: 'SecureNet Systems',
    email: 'security@securenet.com',
    phone: '(555) 456-7890',
    website: 'https://www.securenet.com',
    address: '321 Security Boulevard',
    city: 'Austin',
    state: 'TX',
    zipCode: '73301',
    country: 'United States',
    industry: 'Cybersecurity',
    description: 'Cybersecurity solutions and network protection services.',
    status: 'active',
    riskLevel: 'high',
    contractValue: 1200000,
    contractStartDate: new Date('2024-01-15'),
    contractEndDate: new Date('2024-12-14'),
    primaryContact: 'David Thompson',
    primaryContactEmail: 'david.thompson@securenet.com',
    primaryContactPhone: '(555) 456-7891',
    notes: 'Critical security vendor. High risk due to sensitive data access. Regular audits required.'
  },
  {
    name: 'Green Energy Solutions',
    email: 'info@greenenergy.com',
    phone: '(555) 567-8901',
    website: 'https://www.greenenergy.com',
    address: '654 Renewable Energy Way',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    country: 'United States',
    industry: 'Energy',
    description: 'Renewable energy solutions and sustainability consulting.',
    status: 'inactive',
    riskLevel: 'low',
    contractValue: 250000,
    contractStartDate: new Date('2023-07-01'),
    contractEndDate: new Date('2024-06-30'),
    primaryContact: 'Lisa Wang',
    primaryContactEmail: 'lisa.wang@greenenergy.com',
    primaryContactPhone: '(555) 567-8902',
    notes: 'Contract expired. Considering renewal based on sustainability goals.'
  },
  {
    name: 'Creative Design Studio',
    email: 'hello@creativedesign.com',
    phone: '(555) 678-9012',
    website: 'https://www.creativedesign.com',
    address: '987 Creative Lane',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    industry: 'Marketing',
    description: 'Creative design and marketing services for digital and print media.',
    status: 'active',
    riskLevel: 'low',
    contractValue: 150000,
    contractStartDate: new Date('2024-02-01'),
    contractEndDate: new Date('2024-12-31'),
    primaryContact: 'Alex Martinez',
    primaryContactEmail: 'alex.martinez@creativedesign.com',
    primaryContactPhone: '(555) 678-9013',
    notes: 'Excellent creative work. Fast turnaround times. Recommended for future projects.'
  },
  {
    name: 'DataFlow Analytics',
    email: 'contact@dataflow.com',
    phone: '(555) 789-0123',
    website: 'https://www.dataflow.com',
    address: '147 Data Street',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    country: 'United States',
    industry: 'Data Analytics',
    description: 'Big data analytics and business intelligence solutions.',
    status: 'suspended',
    riskLevel: 'high',
    contractValue: 800000,
    contractStartDate: new Date('2024-01-01'),
    contractEndDate: new Date('2024-12-31'),
    primaryContact: 'Jennifer Kim',
    primaryContactEmail: 'jennifer.kim@dataflow.com',
    primaryContactPhone: '(555) 789-0124',
    notes: 'Suspended due to data breach concerns. Under investigation.'
  },
  {
    name: 'Office Supplies Plus',
    email: 'orders@officesupplies.com',
    phone: '(555) 890-1234',
    website: 'https://www.officesupplies.com',
    address: '258 Supply Chain Road',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30301',
    country: 'United States',
    industry: 'Office Supplies',
    description: 'Comprehensive office supplies and equipment provider.',
    status: 'active',
    riskLevel: 'low',
    contractValue: 75000,
    contractStartDate: new Date('2024-01-01'),
    contractEndDate: new Date('2024-12-31'),
    primaryContact: 'Robert Wilson',
    primaryContactEmail: 'robert.wilson@officesupplies.com',
    primaryContactPhone: '(555) 890-1235',
    notes: 'Reliable supplier with good pricing. Next-day delivery available.'
  }
];

async function seedVendors() {
  try {
    // Clear existing vendors
    await Vendor.deleteMany({});
    console.log('Cleared existing vendors');

    // Insert sample vendors
    const insertedVendors = await Vendor.insertMany(sampleVendors);
    console.log(`Successfully seeded ${insertedVendors.length} vendors`);

    // Display summary
    console.log('\nVendor Summary:');
    insertedVendors.forEach(vendor => {
      console.log(`- ${vendor.name} (${vendor.status}, ${vendor.riskLevel} risk)`);
    });

    console.log('\nSeeding completed successfully!');
  } catch (error) {
    console.error('Error seeding vendors:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedVendors();
