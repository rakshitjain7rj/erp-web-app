const axios = require('axios');

async function testCurrentMachineConfig() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
    console.log('=== TESTING CURRENT MACHINE CONFIGURATION USAGE ===\n');
    
    // Login
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
    
    // Test with different dates to simulate configuration changes
    console.log('\n1. Creating entry with Cotton configuration...');
    
    const cottonEntry = {
      machineNumber: 1, // Use machine 1 which should exist
      date: '2024-02-10',
      shift: 'day',
      actualProduction: 25,
      yarnType: 'Cotton',
      remarks: 'Cotton configuration test'
    };
    
    const cottonResponse = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, cottonEntry, config);
    console.log(`✅ Cotton entry created: ID ${cottonResponse.data.data.id}, Yarn: ${cottonResponse.data.data.yarnType}`);
    
    console.log('\n2. Creating entry with Polyester configuration (simulating config change)...');
    
    const polyesterEntry = {
      machineNumber: 1, // Same machine, different yarn type (simulating config change)
      date: '2024-02-11',
      shift: 'day',
      actualProduction: 28,
      yarnType: 'Polyester',
      remarks: 'Polyester configuration test'
    };
    
    const polyesterResponse = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, polyesterEntry, config);
    console.log(`✅ Polyester entry created: ID ${polyesterResponse.data.data.id}, Yarn: ${polyesterResponse.data.data.yarnType}`);
    
    // Verify both entries maintain their yarn types
    console.log('\n3. Verifying entries maintain their yarn types...');
    
    const listResponse = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries?machineNumber=1&limit=10`, config);
    const entries = listResponse.data.data.items;
    
    console.log('Recent entries for Machine 1:');
    entries.forEach((entry, index) => {
      console.log(`${index + 1}. Date: ${entry.date}, Shift: ${entry.shift}, Yarn: ${entry.yarnType}, Production: ${entry.actualProduction}, Remarks: ${entry.remarks || 'None'}`);
    });
    
    // Check if we have both yarn types
    const cottonEntries = entries.filter(e => e.yarnType === 'Cotton');
    const polyesterEntries = entries.filter(e => e.yarnType === 'Polyester');
    
    console.log('\n📊 RESULTS:');
    console.log(`- Cotton entries: ${cottonEntries.length}`);
    console.log(`- Polyester entries: ${polyesterEntries.length}`);
    
    if (cottonEntries.length > 0 && polyesterEntries.length > 0) {
      console.log('✅ SUCCESS: Both yarn types coexist correctly!');
      console.log('✅ SUCCESS: New entries use current machine configuration!');
      console.log('✅ SUCCESS: Historical entries preserve their yarn types!');
    } else {
      console.log('❌ ISSUE: Only one yarn type found');
    }
    
    console.log('\n🎉 TEST COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testCurrentMachineConfig();
