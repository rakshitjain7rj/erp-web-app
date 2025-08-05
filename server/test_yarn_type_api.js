const axios = require('axios');

async function testCreateProductionEntry() {
  try {
    console.log('Testing production entry creation with yarn type...');
    
    // Use authentication token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluIiwiZW1haWwiOiJhZG1pbkBlcnAuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzAzMTMzNjU5fQ.Dq4jFn1puf54NCEpvb-pFykqleex5uyxXYkRbPm9vI4';
    
    const testData = {
      machineNumber: 1,
      date: '2024-01-15',
      dayShiftProduction: 100,
      nightShiftProduction: 80,
      yarnType: 'Polyester' // Testing the yarn type parameter
    };
    
    console.log('Sending request with data:', testData);
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios.post('http://localhost:5000/api/asu-unit1/production-entries', testData, config);
    
    console.log('✅ Success! Response:', response.data);
    
    // Try to fetch the created entry to verify yarn type was saved
    if (response.data && response.data.id) {
      console.log('Fetching created entry to verify yarn type...');
      const fetchResponse = await axios.get(`http://localhost:5000/api/asu-unit1/production-entries/${response.data.id}`, config);
      console.log('Entry details:', fetchResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testCreateProductionEntry();
