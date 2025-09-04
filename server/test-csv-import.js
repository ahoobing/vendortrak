const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function testCSVImport() {
  try {
    console.log('Testing CSV import functionality...');
    
    // Read the sample CSV file
    const csvPath = path.join(__dirname, 'sample_vendors.csv');
    const csvContent = fs.readFileSync(csvPath);
    
    console.log('CSV file size:', csvContent.length, 'bytes');
    console.log('CSV content preview:', csvContent.toString().substring(0, 200) + '...');
    
    // Create form data
    const formData = new FormData();
    formData.append('csvFile', csvContent, {
      filename: 'sample_vendors.csv',
      contentType: 'text/csv'
    });
    
    // Make the import request
    const response = await axios.post('http://localhost:5001/api/vendors/import', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to replace this with a valid token
      }
    });
    
    console.log('✅ Import successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Import failed:', error.response?.data || error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testCSVImport();
}

module.exports = testCSVImport;
