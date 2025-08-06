const axios = require('axios');

async function inspectDataStructure() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
    // Login first
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
    
    console.log('Inspecting actual data structure of production entries...\n');
    
    // Fetch recent entries
    const response = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries`, {
      params: { limit: 5 },
      headers: config.headers
    });
    
    if (response.data && response.data.success && response.data.data && response.data.data.items) {
      const entries = response.data.data.items;
      
      console.log('Raw data structure of first few entries:');
      entries.forEach((entry, index) => {
        console.log(`\nEntry ${index + 1} (ID: ${entry.id}):`);
        console.log(`  Date: ${entry.date}`);
        console.log(`  Shift: ${entry.shift}`);
        console.log(`  yarnType: ${entry.yarnType}`);
        console.log(`  actualProduction: ${entry.actualProduction}`);
        console.log(`  dayShift: ${entry.dayShift}`);
        console.log(`  nightShift: ${entry.nightShift}`);
        console.log(`  total: ${entry.total}`);
        console.log(`  machine.yarnType: ${entry.machine?.yarnType}`);
        console.log(`  Full entry:`, JSON.stringify(entry, null, 2));
        console.log('  ---');
      });
      
    } else {
      console.log('❌ Invalid response from API');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

inspectDataStructure();
