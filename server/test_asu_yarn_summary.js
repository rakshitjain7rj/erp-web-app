const axios = require('axios');

async function testASUUnit1YarnSummary() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
    console.log('=== TESTING ASU UNIT 1 YARN SUMMARY FUNCTIONALITY ===\n');
    
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
    console.log('✅ Login successful!');
    
    // Calculate date range for last 31 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 31);
    
    const dateFrom = startDate.toISOString().split('T')[0];
    const dateTo = endDate.toISOString().split('T')[0];
    
    console.log(`\nFetching ASU Unit 1 production data from ${dateFrom} to ${dateTo}...`);
    
    // Fetch ASU Unit 1 production entries
    const response = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries`, {
      params: {
        dateFrom,
        dateTo,
        limit: 1000
      },
      headers: config.headers
    });
    
    if (response.data && response.data.success && response.data.data && response.data.data.items) {
      const entries = response.data.data.items;
      console.log(`✅ Successfully fetched ${entries.length} production entries`);
      
      // Process yarn type data
      const typeMap = new Map();
      let totalProduction = 0;
      
      entries.forEach((entry, index) => {
        const yarnType = entry.yarnType || entry.machine?.yarnType || 'Unknown';
        const actualProduction = parseFloat(entry.actualProduction) || 0;
        
        const currentTotal = typeMap.get(yarnType) || 0;
        typeMap.set(yarnType, currentTotal + actualProduction);
        totalProduction += actualProduction;
        
        if (index < 5) { // Show first 5 entries as examples
          console.log(`Entry ${entry.id}: Date: ${entry.date}, Yarn: ${yarnType}, Shift: ${entry.shift}, Production: ${actualProduction} kg`);
        }
      });
      
      // Convert to array and sort
      const yarnBreakdown = Array.from(typeMap.entries())
        .map(([type, total]) => ({ type, total }))
        .sort((a, b) => b.total - a.total);
      
      console.log('\n📊 YARN TYPE BREAKDOWN:');
      console.log(`Total Production: ${totalProduction.toFixed(2)} kg`);
      console.log(`Unique Yarn Types: ${yarnBreakdown.length}`);
      
      yarnBreakdown.forEach((item, index) => {
        const percentage = Math.round((item.total / totalProduction) * 100);
        console.log(`${index + 1}. ${item.type}: ${item.total.toFixed(2)} kg (${percentage}%)`);
      });
      
      if (yarnBreakdown.length > 0) {
        console.log('\n✅ SUCCESS: Yarn type data successfully processed!');
        console.log('✅ The TotalASUUnit1YarnSummary component should now work correctly!');
      } else {
        console.log('\n⚠️ WARNING: No yarn type data found in production entries');
      }
      
    } else {
      console.log('❌ Invalid response format from ASU Unit 1 API');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing ASU Unit 1 yarn summary:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testASUUnit1YarnSummary();
