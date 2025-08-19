const axios = require('axios');

async function testMachineConfigurationChanges() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
    console.log('=== TESTING MACHINE CONFIGURATION CHANGES ===\n');
    
    // Step 1: Login
    console.log('1. Login...');
    const loginData = {
      email: 'test@admin.com',
      password: 'test123'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    const token = loginResponse.data.token;
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    console.log('✅ Login successful!');
    
    // Step 2: Create entries
    const entries = [
      {
        machineNumber: 3,
        date: '2024-02-01',
        shift: 'day',
        actualProduction: 50,
        yarnType: 'Cotton'
      },
      {
        machineNumber: 3,
        date: '2024-02-01',
        shift: 'night',
        actualProduction: 45,
        yarnType: 'Cotton'
      }
    ];
    
    for (const entry of entries) {
      const response = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, entry, config);
      console.log(`✅ Created entry: ID ${response.data.data.id}, Yarn: ${response.data.data.yarnType}`);
    }
    
    console.log('\n🎉 TEST COMPLETED!');
    
  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
  }
}

testMachineConfigurationChanges();
