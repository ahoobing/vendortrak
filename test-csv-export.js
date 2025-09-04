const mongoose = require('mongoose');
const Vendor = require('./server/models/Vendor');
const Tenant = require('./server/models/Tenant');
const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendortrak', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testCSVExport() {
  try {
    console.log('Testing CSV export functionality...');
    
    // Find a tenant and user for testing
    const tenant = await Tenant.findOne();
    const user = await User.findOne();
    
    if (!tenant || !user) {
      console.log('No tenant or user found. Please ensure the database is seeded.');
      return;
    }
    
    console.log(`Testing with tenant: ${tenant.name}`);
    console.log(`Testing with user: ${user.email}`);
    
    // Get vendors for the tenant
    const vendors = await Vendor.find({ tenantId: tenant._id })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('dataTypes.dataTypeId', 'name description classification riskLevel')
      .sort({ name: 1 });
    
    console.log(`Found ${vendors.length} vendors to export`);
    
    if (vendors.length === 0) {
      console.log('No vendors found. Creating a test vendor...');
      
      // Create a test vendor
      const testVendor = new Vendor({
        tenantId: tenant._id,
        name: 'Test Vendor Corp',
        email: 'test@vendor.com',
        phone: '+1-555-0123',
        website: 'https://testvendor.com',
        address: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'United States',
        industry: 'Technology',
        description: 'A test vendor for CSV export functionality',
        status: 'active',
        riskLevel: 'medium',
        contractValue: 50000,
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2024-12-31'),
        primaryContact: 'John Test',
        primaryContactEmail: 'john@testvendor.com',
        primaryContactPhone: '+1-555-0124',
        notes: 'Test vendor for CSV export',
        createdBy: user._id
      });
      
      await testVendor.save();
      console.log('Test vendor created successfully');
      
      // Re-fetch vendors
      const updatedVendors = await Vendor.find({ tenantId: tenant._id })
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .populate('dataTypes.dataTypeId', 'name description classification riskLevel')
        .sort({ name: 1 });
      
      console.log(`Now found ${updatedVendors.length} vendors to export`);
    }
    
    // Test CSV generation logic
    const csvHeaders = [
      'Name',
      'Email',
      'Phone',
      'Website',
      'Address',
      'City',
      'State',
      'Zip Code',
      'Country',
      'Industry',
      'Description',
      'Status',
      'Risk Level',
      'Contract Value',
      'Contract Start Date',
      'Contract End Date',
      'Primary Contact',
      'Primary Contact Email',
      'Primary Contact Phone',
      'Notes',
      'Data Types',
      'Created By',
      'Created At',
      'Updated By',
      'Updated At'
    ];

    const csvRows = vendors.map(vendor => {
      const dataTypes = vendor.dataTypes.map(dt => 
        dt.dataTypeId ? `${dt.dataTypeId.name} (${dt.dataTypeId.classification})` : 'N/A'
      ).join('; ');

      return [
        vendor.name || '',
        vendor.email || '',
        vendor.phone || '',
        vendor.website || '',
        vendor.address || '',
        vendor.city || '',
        vendor.state || '',
        vendor.zipCode || '',
        vendor.country || '',
        vendor.industry || '',
        vendor.description || '',
        vendor.status || '',
        vendor.riskLevel || '',
        vendor.contractValue || '',
        vendor.contractStartDate ? vendor.contractStartDate.toISOString().split('T')[0] : '',
        vendor.contractEndDate ? vendor.contractEndDate.toISOString().split('T')[0] : '',
        vendor.primaryContact || '',
        vendor.primaryContactEmail || '',
        vendor.primaryContactPhone || '',
        vendor.notes || '',
        dataTypes,
        vendor.createdBy ? `${vendor.createdBy.firstName} ${vendor.createdBy.lastName}` : '',
        vendor.createdAt ? vendor.createdAt.toISOString() : '',
        vendor.updatedBy ? `${vendor.updatedBy.firstName} ${vendor.updatedBy.lastName}` : '',
        vendor.updatedAt ? vendor.updatedAt.toISOString() : ''
      ];
    });

    // Escape CSV values
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Build CSV content
    const csvContent = [
      csvHeaders.map(escapeCsvValue).join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    console.log('\n=== CSV Export Test Results ===');
    console.log('CSV Headers:', csvHeaders.length);
    console.log('CSV Rows:', csvRows.length);
    console.log('\nFirst few lines of CSV:');
    console.log(csvContent.split('\n').slice(0, 3).join('\n'));
    console.log('\nCSV Export functionality test completed successfully!');
    
    // Save test CSV file
    const fs = require('fs');
    const filename = `test_vendors_export_${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csvContent);
    console.log(`Test CSV file saved as: ${filename}`);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCSVExport();
