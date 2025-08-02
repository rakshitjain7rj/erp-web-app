// Test script to verify dyeing firms API
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function testDyeingFirmsAPI() {
  try {
    console.log('🧪 Testing Dyeing Firms API...\n');

    // Test 1: Get all dyeing firms
    console.log('📋 Test 1: GET /api/dyeing-firms');
    try {
      const response = await fetch(`${BASE_URL}/dyeing-firms`);
      if (response.ok) {
        const firms = await response.json();
        console.log(`✅ Found ${firms.length} dyeing firms`);
        firms.forEach(firm => console.log(`   - ${firm.name}`));
      } else {
        console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n');

    // Test 2: Create or find a dyeing firm
    console.log('🔍 Test 2: POST /api/dyeing-firms/find-or-create');
    try {
      const response = await fetch(`${BASE_URL}/dyeing-firms/find-or-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Dyeing Company' })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${result.created ? 'Created' : 'Found'} firm: ${result.data.name}`);
      } else {
        console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n');

    // Test 3: Test server connectivity
    console.log('🌐 Test 3: GET /api/test');
    try {
      const response = await fetch(`${BASE_URL}/test`);
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Server responding: ${result.message}`);
      } else {
        console.log(`❌ Server check failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      console.log('🔧 Make sure the server is running on port 5000');
    }

  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

// Run the test
testDyeingFirmsAPI();
