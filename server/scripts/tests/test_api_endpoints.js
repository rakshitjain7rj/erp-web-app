const axios = require('axios');

// Test the API endpoints
async function testEndpoints() {
  const BASE_URL = 'http://localhost:5000';
  // Get token from env if available
  const token = process.env.API_TOKEN || '';

  try {
    console.log('\n===== Testing Machine Performance API =====');

    console.log('\n1. Testing /api/machines endpoint...');
    const rootResponse = await axios.get(`${BASE_URL}/api/machines`);
    console.log('Status:', rootResponse.status);
    console.log('Response:', rootResponse.data);
  } catch (error) {
    console.error('Error testing /api/machines:', error.message);
  }
}

testEndpoints();
