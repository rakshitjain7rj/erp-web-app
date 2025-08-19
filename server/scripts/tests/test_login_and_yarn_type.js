const axios = require('axios');

async function testLoginAndYarnType() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
    console.log('1. Attempting to login to get valid token...');
    
    // Try to login first
    const loginData = {
      email: 'admin@erp.com',
      password: 'admin123'
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
        shift: 'day',
        actualProduction: 100,
        theoreticalProduction: 120,
        remarks: 'Test day shift with Polyester yarn',
        yarnType: 'Polyester'
      };
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, testData, config);
      console.log('✅ Production entry created successfully!');
      console.log('Response:', response.data);
    } catch (loginError) {
      console.error('❌ Login failed:', loginError.response ? loginError.response.data : loginError.message);
    }
    
  } catch (error) {
    console.error('❌ Overall error:', error.message);
  }
}

testLoginAndYarnType();
