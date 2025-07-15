const axios = require('axios');

// Test the API endpoints
async function testEndpoints() {
  const BASE_URL = 'http://localhost:5000';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluIiwiaWF0IjoxNzM3NjQ2MjA5fQ.uUiCUzPQP4RB_fJwKEhc4oXfbL_21P7lQcfpOD3QGjw';
  
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
