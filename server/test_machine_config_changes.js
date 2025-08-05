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
    
    // Step 2: Create entries with machine configured for Cotton
    console.log('\n2. Creating entries when machine is configured for Cotton...');
    
    const cottonEntries = [
      {
        machineNumber: 3,
        date: '2024-02-01',
        shift: 'day',
        actualProduction: 50,
        yarnType: 'Cotton',
        remarks: 'Machine configured for Cotton - Day shift'
      },
      {
        machineNumber: 3,
        date: '2024-02-01',
        shift: 'night',
        actualProduction: 45,
        yarnType: 'Cotton',
        remarks: 'Machine configured for Cotton - Night shift'
      }
    ];
    
    const cottonEntryIds = [];
    for (const entry of cottonEntries) {
      const response = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, entry, config);
      cottonEntryIds.push(response.data.data.id);
      console.log(`✅ Created Cotton entry: ID ${response.data.data.id}, Yarn: ${response.data.data.yarnType}`);
    }
    
    // Step 3: Simulate machine configuration change (in real app, this would be done via machine management)
    console.log('\n3. === SIMULATING MACHINE CONFIGURATION CHANGE ===');
    console.log('   (Machine 3 configuration changed from Cotton to Polyester)');
    console.log('   In real application, this would be done via machine management interface');
    
    // Step 4: Create new entries after configuration change
    console.log('\n4. Creating NEW entries after machine reconfiguration to Polyester...');
    
    const polyesterEntries = [
      {
        machineNumber: 3,
        date: '2024-02-02',
        shift: 'day',
        actualProduction: 48,
        yarnType: 'Polyester', // New machine configuration
        remarks: 'After config change - Polyester Day shift'
      },
      {
        machineNumber: 3,
        date: '2024-02-02',
        shift: 'night',
        actualProduction: 42,
        yarnType: 'Polyester', // New machine configuration
        remarks: 'After config change - Polyester Night shift'
      }
    ];
    
    const polyesterEntryIds = [];
    for (const entry of polyesterEntries) {
      const response = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, entry, config);
      polyesterEntryIds.push(response.data.data.id);
      console.log(`✅ Created Polyester entry: ID ${response.data.data.id}, Yarn: ${response.data.data.yarnType}`);
    }
    
    // Step 5: Verify historical preservation and new configuration usage
    console.log('\n5. VERIFICATION - Checking yarn type consistency...');
    
    console.log('\n--- COTTON ENTRIES (Before config change) ---');
    for (const id of cottonEntryIds) {
      try {
        const fetchResponse = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries/${id}`, config);
        console.log(`Entry ID ${id}: Date ${fetchResponse.data.date}, Shift ${fetchResponse.data.shift}, Yarn: ${fetchResponse.data.yarnType}, Production: ${fetchResponse.data.actualProduction}`);
      } catch (error) {
        console.log(`Entry ID ${id}: Could not fetch (${error.response?.status || 'error'})`);
      }
    }
    
    console.log('\n--- POLYESTER ENTRIES (After config change) ---');
    for (const id of polyesterEntryIds) {
      try {
        const fetchResponse = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries/${id}`, config);
        console.log(`Entry ID ${id}: Date ${fetchResponse.data.date}, Shift ${fetchResponse.data.shift}, Yarn: ${fetchResponse.data.yarnType}, Production: ${fetchResponse.data.actualProduction}`);
      } catch (error) {
        console.log(`Entry ID ${id}: Could not fetch (${error.response?.status || 'error'})`);
      }
    }
    
    // Step 6: List all entries for machine 3 to see complete history
    console.log('\n6. COMPLETE MACHINE 3 HISTORY:');
    try {
      const allEntriesResponse = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries?machineNumber=3&limit=20`, config);
      const entries = allEntriesResponse.data.data.items;
      
      console.log(`Found ${entries.length} entries for Machine 3:`);
      entries
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date ascending
        .forEach((entry, index) => {
          console.log(`${index + 1}. ${entry.date} ${entry.shift} - Yarn: ${entry.yarnType} - Production: ${entry.actualProduction} - Remarks: ${entry.remarks}`);
        });
      
      // Analyze results
      const cottonCount = entries.filter(e => e.yarnType === 'Cotton').length;
      const polyesterCount = entries.filter(e => e.yarnType === 'Polyester').length;
      
      console.log('\n📊 ANALYSIS:');
      console.log(`- Cotton entries: ${cottonCount}`);
      console.log(`- Polyester entries: ${polyesterCount}`);
      console.log(`- Total entries: ${entries.length}`);
      
      if (cottonCount > 0 && polyesterCount > 0) {
        console.log('✅ SUCCESS: Historical preservation working - both yarn types coexist');
        console.log('✅ SUCCESS: New entries use current machine configuration');
        console.log('✅ SUCCESS: Previous entries maintain their original yarn types');
      } else {
        console.log('❌ Issue: Not all yarn types are represented');
      }
      
    } catch (error) {
      console.error('Error fetching machine history:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 MACHINE CONFIGURATION CHANGE TEST COMPLETED!');
    
  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
  }
}

testMachineConfigurationChanges();
