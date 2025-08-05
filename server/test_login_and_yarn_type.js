const axios = require('axios');

async function testLoginAndYarnType() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
    console.log('1. Attempting to login to get valid token...');
    
    // Try to login first
    const loginData = {
      email: 'admin@erp.com',
      password: 'admin123' // Common default password
    };
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
      console.log('✅ Login successful!');
      
      const token = loginResponse.data.token;
      console.log('Token received:', token.substring(0, 50) + '...');
      
      // Now test production entry creation
      console.log('\n2. Testing production entry creation with yarn type...');
      
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
      
      console.log('Sending request with data:', testData);
      
      const response = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, testData, config);
      console.log('✅ Production entry created successfully!');
      console.log('Response:', response.data);
      
      // Verify yarn type was saved
      if (response.data && response.data.id) {
        console.log('\n3. Fetching created entry to verify yarn type...');
        const fetchResponse = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries/${response.data.id}`, config);
        console.log('Entry details:', fetchResponse.data);
        
        if (fetchResponse.data.yarnType) {
          console.log('✅ Yarn type saved successfully:', fetchResponse.data.yarnType);
        } else {
          console.log('❌ Yarn type not found in response');
        }
      }
      
    } catch (loginError) {
      console.error('❌ Login failed:', loginError.response ? loginError.response.data : loginError.message);
      
      // If login fails, try without authentication to test the endpoint structure
      console.log('\n2. Testing endpoint without authentication (will fail but shows error details)...');
      try {
        const testData = {
          machineNumber: 1,
          date: '2024-01-15',
          dayShiftProduction: 100,
          nightShiftProduction: 80,
          yarnType: 'Polyester'
        };
        
        await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, testData);
      } catch (err) {
        console.log('Expected auth error:', err.response ? err.response.data : err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Overall error:', error.message);
  }
}

testLoginAndYarnType();
