const axios = require('axios');

async function findProductionWithData() {
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
    
    console.log('Searching for production entries with actual production data...\n');
    
    // Fetch a larger set of entries without date filtering
    const response = await axios.get(`${BASE_URL}/api/asu-unit1/production-entries`, {
      params: {
        limit: 100 // Get more entries
      },
      headers: config.headers
    });
    
    if (response.data && response.data.success && response.data.data && response.data.data.items) {
      const entries = response.data.data.items;
      console.log(`Found ${entries.length} total entries\n`);
      
      // Find entries with non-zero production
      const entriesWithProduction = entries.filter(entry => {
        const dayShift = parseFloat(entry.dayShift) || 0;
        const nightShift = parseFloat(entry.nightShift) || 0;
        return dayShift > 0 || nightShift > 0;
      });
      
      console.log(`Entries with actual production data: ${entriesWithProduction.length}\n`);
      
      if (entriesWithProduction.length > 0) {
        console.log('Sample entries with production:');
        entriesWithProduction.slice(0, 10).forEach((entry, index) => {
          const yarnType = entry.yarnType || entry.machine?.yarnType || 'Unknown';
          const dayShift = parseFloat(entry.dayShift) || 0;
          const nightShift = parseFloat(entry.nightShift) || 0;
          const total = dayShift + nightShift;
          console.log(`${index + 1}. ID: ${entry.id}, Date: ${entry.date}, Yarn: ${yarnType}, Day: ${dayShift}, Night: ${nightShift}, Total: ${total}`);
        });
        
        // Process yarn type summary
        const typeMap = new Map();
        let totalProduction = 0;
        
        entriesWithProduction.forEach((entry) => {
          const yarnType = entry.yarnType || entry.machine?.yarnType || 'Unknown';
          const dayShift = parseFloat(entry.dayShift) || 0;
          const nightShift = parseFloat(entry.nightShift) || 0;
          const entryTotal = dayShift + nightShift;
          
          const currentTotal = typeMap.get(yarnType) || 0;
          typeMap.set(yarnType, currentTotal + entryTotal);
          totalProduction += entryTotal;
        });
        
        const yarnBreakdown = Array.from(typeMap.entries())
          .map(([type, total]) => ({ type, total }))
          .sort((a, b) => b.total - a.total);
        
        console.log('\n📊 COMPLETE YARN TYPE SUMMARY:');
        console.log(`Total Production: ${totalProduction.toFixed(2)} kg`);
        console.log(`Unique Yarn Types: ${yarnBreakdown.length}`);
        
        yarnBreakdown.forEach((item, index) => {
          const percentage = Math.round((item.total / totalProduction) * 100);
          console.log(`${index + 1}. ${item.type}: ${item.total.toFixed(2)} kg (${percentage}%)`);
        });
        
      } else {
        console.log('❌ No entries found with actual production data');
        console.log('Creating some test entries with production data...\n');
        
        // Create test entries with actual production
        const testEntries = [
          {
            machineNumber: 1,
            date: '2025-08-05',
            shift: 'day',
            actualProduction: 45,
            yarnType: 'Cotton'
          },
          {
            machineNumber: 1,
            date: '2025-08-05',
            shift: 'night',
            actualProduction: 38,
            yarnType: 'Cotton'
          },
          {
            machineNumber: 2,
            date: '2025-08-05',
            shift: 'day',
            actualProduction: 52,
            yarnType: 'Polyester'
          }
        ];
        
        for (const entry of testEntries) {
          try {
            const createResponse = await axios.post(`${BASE_URL}/api/asu-unit1/production-entries`, entry, config);
            console.log(`✅ Created test entry: ${entry.yarnType} - ${entry.actualProduction} kg`);
          } catch (error) {
            console.log(`❌ Failed to create entry: ${error.response?.data?.error || error.message}`);
          }
        }
      }
      
    } else {
      console.log('❌ Invalid response from API');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

findProductionWithData();
