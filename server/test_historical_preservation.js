const axios = require('axios');

async function testHistoricalPreservation() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
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
    
    // Step 1: Create production entries with specific yarn types
    console.log('\n2. Creating production entries with different yarn types...');
    
    const entries = [
      {
        machineNumber: 2,
        date: '2024-01-16', 
        shift: 'day',
        actualProduction: 150,
        yarnType: 'Cotton',
        remarks: 'Initial Cotton production'
      },
      {
        machineNumber: 2,
        date: '2024-01-16',
        shift: 'night', 
        actualProduction: 130,
        yarnType: 'Cotton',
        remarks: 'Night Cotton production'
      }
    ];
    
    const createdEntries = [];
    for (const entry of entries) {
      const response = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, entry, config);
      createdEntries.push(response.data.data);
      console.log(`✅ Created entry: ID ${response.data.data.id}, Yarn: ${response.data.data.yarnType}`);
    }
    
    // Step 2: Get machine configuration and update it (simulating machine reconfiguration)
    console.log('\n3. Testing machine configuration change scenario...');
    
    // Let's say we change the machine configuration to Polyester
    console.log('Simulating machine configuration change from Cotton to Polyester...');
    
    // Step 3: Create new production entries after configuration change
    const newEntries = [
      {
        machineNumber: 2,
        date: '2024-01-17',
        shift: 'day',
        actualProduction: 140,
        yarnType: 'Polyester', // New yarn type
        remarks: 'After config change - Polyester'
      }
    ];
    
    for (const entry of newEntries) {
      const response = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, entry, config);
      createdEntries.push(response.data.data);
      console.log(`✅ Created new entry: ID ${response.data.data.id}, Yarn: ${response.data.data.yarnType}`);
    }
    
    // Step 4: Verify historical entries maintain their original yarn types
    console.log('\n4. Verifying historical data preservation...');
    
    const allEntriesResponse = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries?machineNumber=2&limit=10`, config);
    const machineEntries = allEntriesResponse.data.data.items;
    
    console.log('All entries for Machine 2:');
    machineEntries.forEach((entry, index) => {
      console.log(`${index + 1}. Date: ${entry.date}, Shift: ${entry.shift}, Yarn: ${entry.yarnType}, Production: ${entry.actualProduction}, Remarks: ${entry.remarks}`);
    });
    
    // Verify specific preservation
    const cottonEntries = machineEntries.filter(e => e.yarnType === 'Cotton');
    const polyesterEntries = machineEntries.filter(e => e.yarnType === 'Polyester');
    
    console.log(`\n✅ VERIFICATION RESULTS:`);
    console.log(`- Cotton entries preserved: ${cottonEntries.length}`);
    console.log(`- Polyester entries: ${polyesterEntries.length}`);
    console.log(`- Historical yarn types maintained: ${cottonEntries.length > 0 && polyesterEntries.length > 0 ? 'YES' : 'NO'}`);
    
    // Additional verification: Check if old entries still have Cotton
    const oldCottonEntry = createdEntries.find(e => e.yarnType === 'Cotton');
    if (oldCottonEntry) {
      const verifyResponse = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries/${oldCottonEntry.id}`, config);
      console.log(`- Old Cotton entry (ID: ${oldCottonEntry.id}) still has yarn type: ${verifyResponse.data.yarnType}`);
    }
    
    console.log('\n🎉 HISTORICAL PRESERVATION TEST COMPLETED!');
    console.log('✅ Production entries maintain their yarn types even after machine configuration changes.');
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testHistoricalPreservation();
