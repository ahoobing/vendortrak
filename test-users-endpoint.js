const axios = require('axios');

async function testUsersEndpoint() {
  try {
    console.log('🧪 Testing users endpoint...');
    
    // First, let's test the health endpoint to make sure server is running
    const healthResponse = await axios.get('http://localhost:5001/api/health');
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Now test the users endpoint without authentication (should get 401)
    try {
      const usersResponse = await axios.get('http://localhost:5001/api/users');
      console.log('❌ Unexpected success:', usersResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly got 401 (no auth token)');
        console.log('Response:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUsersEndpoint();
