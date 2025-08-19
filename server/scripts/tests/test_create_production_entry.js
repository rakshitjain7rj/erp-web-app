const axios = require('axios');

async function testCreateProductionEntry() {
  try {
    console.log('Testing production entry creation with yarn type...');
    
    const token = process.env.API_TOKEN || '';
    if (!token) {
      console.warn('⚠️ No API_TOKEN provided; this test may fail if auth is required.');
    }
    
    const testData = {
      machineNumber: 1,
      date: '2024-01-15',
      dayShiftProduction: 100,
      nightShiftProduction: 80,
      yarnType: 'Polyester'
    };
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios.post('http://localhost:5000/api/asu-unit1/production-entries', testData, config);
    console.log('✅ Success! Response:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testCreateProductionEntry();
