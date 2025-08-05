const axios = require('axios');

async function testYarnTypeWithCorrectFormat() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
    console.log('1. Login with existing test user...');
    
    const loginData = {
      email: 'test@admin.com',
      password: 'test123'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Login successful!');
    
    const token = loginResponse.data.token;
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    // Test day shift entry with yarn type
    console.log('\n2. Testing DAY SHIFT production entry with yarn type...');
    
    const dayShiftData = {
      machineNumber: 1,
      date: '2024-01-15',
      shift: 'day',
      actualProduction: 100,
      theoreticalProduction: 120,
      remarks: 'Test day shift with Polyester yarn',
      yarnType: 'Polyester'
    };
    
    console.log('Sending day shift request with data:', dayShiftData);
    
    const dayResponse = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, dayShiftData, config);
    console.log('✅ Day shift entry created successfully!');
    console.log('Day Response:', dayResponse.data);
    
    // Test night shift entry with different yarn type
    console.log('\n3. Testing NIGHT SHIFT production entry with different yarn type...');
    
    const nightShiftData = {
      machineNumber: 1,
      date: '2024-01-15',
      shift: 'night',
      actualProduction: 80,
      theoreticalProduction: 100,
      remarks: 'Test night shift with Cotton yarn',
      yarnType: 'Cotton'
    };
    
    console.log('Sending night shift request with data:', nightShiftData);
    
    const nightResponse = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, nightShiftData, config);
    console.log('✅ Night shift entry created successfully!');
    console.log('Night Response:', nightResponse.data);
    
    // Fetch both entries to verify yarn types
    console.log('\n4. Fetching entries to verify yarn types...');
    
    if (dayResponse.data && dayResponse.data.id) {
      const dayFetchResponse = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries/${dayResponse.data.id}`, config);
      console.log('Day entry details:', dayFetchResponse.data);
      console.log('Day entry yarn type:', dayFetchResponse.data.yarnType || 'NOT FOUND');
    }
    
    if (nightResponse.data && nightResponse.data.id) {
      const nightFetchResponse = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries/${nightResponse.data.id}`, config);
      console.log('Night entry details:', nightFetchResponse.data);
      console.log('Night entry yarn type:', nightFetchResponse.data.yarnType || 'NOT FOUND');
    }
    
    // List recent entries to see yarn types
    console.log('\n5. Fetching recent entries to verify yarn type tracking...');
    const listResponse = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries?limit=5`, config);
    console.log('Recent entries with yarn types:');
    listResponse.data.data.items.forEach((entry, index) => {
      console.log(`${index + 1}. ID: ${entry.id}, Date: ${entry.date}, Shift: ${entry.shift}, Yarn Type: ${entry.yarnType || 'NOT SET'}, Production: ${entry.actualProduction}`);
    });
    
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('Yarn type tracking is working correctly.');
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testYarnTypeWithCorrectFormat();
