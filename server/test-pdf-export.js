const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const Vendor = require('./models/Vendor');
const Tenant = require('./models/Tenant');
const User = require('./models/User');
const DataType = require('./models/DataType');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendortrak', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Helper function to generate HTML content for PDF export (copied from routes)
function generateVendorPDFHTML(vendors, tenantName, filters) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: '#10B981',
      inactive: '#6B7280',
      pending: '#F59E0B',
      suspended: '#EF4444'
    };
    return `<span style="background-color: ${statusColors[status] || '#6B7280'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${status.toUpperCase()}</span>`;
  };

  const getRiskBadge = (risk) => {
    const riskColors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444'
    };
    return `<span style="background-color: ${riskColors[risk] || '#6B7280'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${risk.toUpperCase()}</span>`;
  };

  const vendorRows = vendors.map(vendor => {
    const dataTypes = vendor.dataTypes.map(dt => 
      dt.dataTypeId ? `${dt.dataTypeId.name} (${dt.dataTypeId.classification})` : 'N/A'
    ).join(', ');

    return `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 12px; font-size: 12px; font-weight: 500;">${vendor.name || 'N/A'}</td>
        <td style="padding: 12px; font-size: 12px;">${vendor.email || 'N/A'}</td>
        <td style="padding: 12px; font-size: 12px;">${vendor.phone || 'N/A'}</td>
        <td style="padding: 12px; font-size: 12px;">${vendor.industry || 'N/A'}</td>
        <td style="padding: 12px; font-size: 12px; text-align: center;">${getStatusBadge(vendor.status)}</td>
        <td style="padding: 12px; font-size: 12px; text-align: center;">${getRiskBadge(vendor.riskLevel)}</td>
        <td style="padding: 12px; font-size: 12px; text-align: right;">${formatCurrency(vendor.contractValue)}</td>
        <td style="padding: 12px; font-size: 12px;">${formatDate(vendor.contractStartDate)}</td>
        <td style="padding: 12px; font-size: 12px;">${formatDate(vendor.contractEndDate)}</td>
        <td style="padding: 12px; font-size: 12px;">${vendor.primaryContact || 'N/A'}</td>
        <td style="padding: 12px; font-size: 12px;">${dataTypes || 'None'}</td>
      </tr>
    `;
  }).join('');

  const filterInfo = [];
  if (filters.status) filterInfo.push(`Status: ${filters.status}`);
  if (filters.riskLevel) filterInfo.push(`Risk Level: ${filters.riskLevel}`);
  if (filters.search) filterInfo.push(`Search: "${filters.search}"`);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Vendor Export Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          color: #1F2937;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #E5E7EB;
        }
        .header h1 {
          color: #111827;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .header .subtitle {
          color: #6B7280;
          font-size: 16px;
          margin: 0;
        }
        .report-info {
          background-color: #F9FAFB;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          border-left: 4px solid #3B82F6;
        }
        .report-info h3 {
          margin: 0 0 8px 0;
          color: #111827;
          font-size: 16px;
          font-weight: 600;
        }
        .report-info p {
          margin: 4px 0;
          color: #6B7280;
          font-size: 14px;
        }
        .summary {
          display: flex;
          justify-content: space-between;
          margin-bottom: 24px;
          background-color: #F3F4F6;
          padding: 16px;
          border-radius: 8px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item .number {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          display: block;
        }
        .summary-item .label {
          font-size: 12px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          font-size: 12px;
        }
        th {
          background-color: #F9FAFB;
          color: #374151;
          font-weight: 600;
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid #E5E7EB;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #E5E7EB;
          vertical-align: top;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          color: #6B7280;
          font-size: 12px;
        }
        .page-break {
          page-break-before: always;
        }
        @media print {
          body { margin: 0; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Vendor Export Report</h1>
        <p class="subtitle">${tenantName}</p>
      </div>

      <div class="report-info">
        <h3>Report Information</h3>
        <p><strong>Export Date:</strong> ${filters.exportDate}</p>
        <p><strong>Total Vendors:</strong> ${vendors.length}</p>
        ${filterInfo.length > 0 ? `<p><strong>Filters Applied:</strong> ${filterInfo.join(', ')}</p>` : ''}
      </div>

      <div class="summary">
        <div class="summary-item">
          <span class="number">${vendors.length}</span>
          <span class="label">Total Vendors</span>
        </div>
        <div class="summary-item">
          <span class="number">${vendors.filter(v => v.status === 'active').length}</span>
          <span class="label">Active</span>
        </div>
        <div class="summary-item">
          <span class="number">${vendors.filter(v => v.riskLevel === 'high').length}</span>
          <span class="label">High Risk</span>
        </div>
        <div class="summary-item">
          <span class="number">${formatCurrency(vendors.reduce((sum, v) => sum + (v.contractValue || 0), 0))}</span>
          <span class="label">Total Contract Value</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Industry</th>
            <th>Status</th>
            <th>Risk Level</th>
            <th>Contract Value</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Primary Contact</th>
            <th>Data Types</th>
          </tr>
        </thead>
        <tbody>
          ${vendorRows}
        </tbody>
      </table>

      <div class="footer">
        <p>Generated on ${filters.exportDate} | VendorTrak Export Report</p>
      </div>
    </body>
    </html>
  `;
}

async function testPDFExport() {
  try {
    console.log('Testing PDF export functionality...');
    
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
        description: 'A test vendor for PDF export functionality',
        status: 'active',
        riskLevel: 'medium',
        contractValue: 50000,
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2024-12-31'),
        primaryContact: 'John Test',
        primaryContactEmail: 'john@testvendor.com',
        primaryContactPhone: '+1-555-0124',
        notes: 'Test vendor for PDF export',
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
    
    // Generate HTML content for PDF
    const htmlContent = generateVendorPDFHTML(vendors, tenant.name, {
      exportDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });

    console.log('HTML content generated successfully');
    console.log('HTML length:', htmlContent.length, 'characters');

    // Launch Puppeteer and generate PDF
    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    console.log('Setting HTML content...');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    console.log('PDF generated successfully');

    // Save test PDF file
    const fs = require('fs');
    const filename = `test_vendors_export_${new Date().toISOString().split('T')[0]}.pdf`;
    fs.writeFileSync(filename, pdfBuffer);
    console.log(`Test PDF file saved as: ${filename}`);
    console.log(`PDF size: ${pdfBuffer.length} bytes`);
    
    console.log('\n=== PDF Export Test Results ===');
    console.log('✅ HTML generation: SUCCESS');
    console.log('✅ Puppeteer launch: SUCCESS');
    console.log('✅ PDF generation: SUCCESS');
    console.log('✅ File save: SUCCESS');
    console.log('\nPDF Export functionality test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPDFExport();
