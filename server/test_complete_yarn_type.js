const axios = require('axios');

async function createUserAndTestYarnType() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
    console.log('1. Creating test user...');
    
    // Create a test user first
    const userData = {
      name: 'Test Admin',
      email: 'test@admin.com',
      password: 'test123',
      role: 'admin'
    };
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, userData);
      console.log('✅ User created successfully!');
      console.log('User:', registerResponse.data);
      
      const token = registerResponse.data.token;
      
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
          console.log('✅ SUCCESS! Yarn type saved and retrieved:', fetchResponse.data.yarnType);
        } else {
          console.log('❌ Yarn type not found in response');
        }
      }
      
    } catch (registerError) {
      if (registerError.response && registerError.response.status === 400) {
        console.log('User might already exist, trying to login...');
        
        // Try login with the test user
        const loginData = {
          email: 'test@admin.com',
          password: 'test123'
        };
        
        try {
          const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
          console.log('✅ Login successful!');
          
          const token = loginResponse.data.token;
          
          // Test production entry creation
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
          
          const response = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, testData, config);
          console.log('✅ Production entry created successfully!');
          console.log('Response:', response.data);
          
        } catch (loginError) {
          console.error('❌ Login also failed:', loginError.response ? loginError.response.data : loginError.message);
        }
      } else {
        console.error('❌ Registration failed:', registerError.response ? registerError.response.data : registerError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Overall error:', error.message);
  }
}

createUserAndTestYarnType();
