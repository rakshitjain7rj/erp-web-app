const axios = require('axios');

// Test the API endpoints
async function testEndpoints() {
  const BASE_URL = 'http://localhost:5000';
  // Get token from localStorage if running in browser environment
  let token;
  try {
    // Try to get from environment variable first
    token = process.env.API_TOKEN || '';
    
    // If no token found, use a default test token
    if (!token) {
      console.log('⚠️ No token found in environment, using default test token');
      // This is just an example token, you should replace it with a valid one from your browser's localStorage
      token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluIiwiZW1haWwiOiJhZG1pbkBlcnAuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzAzMTMzNjU5fQ.Dq4jFn1puf54NCEpvb-pFykqleex5uyxXYkRbPm9vI4';
    }
    
    // Test machine performance endpoints
    console.log('\n===== Testing Machine Performance API =====');
    
    try {
      console.log('\n1. Testing /api/machines endpoint...');
      const rootResponse = await axios.get(`${BASE_URL}/api/machines`);
      console.log('Status:', rootResponse.status);
      console.log('Response:', rootResponse.data);
    } catch (error) {
      console.error('Error testing /api/machines:', error.message);
    }
    
    try {
      console.log('\n2. Testing /api/machines/performance endpoint...');
      const perfResponse = await axios.get(`${BASE_URL}/api/machines/performance`);
      console.log('Status:', perfResponse.status);
      console.log('Success:', perfResponse.data.success);
      console.log('Data Count:', perfResponse.data.data ? perfResponse.data.data.length : 0);
      if (perfResponse.data.data && perfResponse.data.data.length > 0) {
        console.log('Sample Machine:', perfResponse.data.data[0]);
      }
    } catch (error) {
      console.error('Error testing /api/machines/performance:', error.message);
    }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    console.log('Testing ASU machines endpoint...');
    const machinesResponse = await axios.get(`${BASE_URL}/api/asu-machines`, { headers });
    console.log('✅ ASU machines endpoint works');
    console.log('Sample machine data:', machinesResponse.data.data?.slice(0, 2));
    
    console.log('\nTesting yarn production entries endpoint...');
    const entriesResponse = await axios.get(`${BASE_URL}/api/yarn/production-entries`, { headers });
    console.log('✅ Yarn production entries endpoint works');
    console.log('Sample entry data:', entriesResponse.data.data?.slice(0, 2));
    
    // Check the data structure
    if (entriesResponse.data.data && entriesResponse.data.data.length > 0) {
      const sampleEntry = entriesResponse.data.data[0];
      console.log('\nSample entry structure:', {
        date: sampleEntry.date,
        avgEfficiency: sampleEntry.avgEfficiency,
        totalProduction: sampleEntry.totalProduction,
        machines: sampleEntry.machines,
        yarnBreakdown: sampleEntry.yarnBreakdown
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.response?.data || error.message);
  }
}

testEndpoints();
