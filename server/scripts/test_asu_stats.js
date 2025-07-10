/**
 * ASU Stats API Test Script
 * 
 * This script tests the ASU Unit 1 stats endpoint after fixing the column name issue.
 */

require('dotenv').config();
const fetch = require('node-fetch');

async function testStatsEndpoint() {
  try {
    console.log('🔄 Testing ASU Unit 1 stats endpoint...');
    
    const response = await fetch('http://localhost:5000/api/asu-unit1/stats');
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ API endpoint is working correctly!');
      console.log('\nStats data:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.error('❌ API request failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing stats endpoint:', error);
    console.log('Make sure the server is running on localhost:5000');
  }
}

testStatsEndpoint();
