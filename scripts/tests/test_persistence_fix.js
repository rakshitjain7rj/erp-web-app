// Test script to verify dyeing firm persistence works properly
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testDyeingFirmPersistence() {
  console.log('🧪 Testing Dyeing Firm Persistence Fix...\n');

  try {
    // Test 1: Check server connectivity
    console.log('🌐 Test 1: Checking server connectivity...');
    try {
      const healthCheck = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running or not accessible');
      console.log('🔧 Please start the server first with: node server/index.js');
      return;
    }

    // Test 2: Get initial dyeing firms count
    console.log('\n📋 Test 2: Getting initial dyeing firms...');
    let initialResponse;
    try {
      initialResponse = await axios.get(`${BASE_URL}/dyeing-firms`);
      const initialFirms = initialResponse.data.data || initialResponse.data;
      console.log(`✅ Found ${initialFirms.length} existing dyeing firms`);
      initialFirms.forEach(firm => console.log(`   - ${firm.name} (ID: ${firm.id})`));
    } catch (error) {
      console.log('❌ Failed to fetch initial dyeing firms:', error.message);
      return;
    }

    // Test 3: Create a new test firm
    console.log('\n🏭 Test 3: Creating a new test dyeing firm...');
    const testFirmName = `Test Firm ${Date.now()}`;
    try {
      const createResponse = await axios.post(`${BASE_URL}/dyeing-firms/find-or-create`, {
        name: testFirmName
      });
      
      if (createResponse.data.success) {
        console.log(`✅ ${createResponse.data.created ? 'Created' : 'Found'} firm: ${createResponse.data.data.name}`);
        console.log(`   ID: ${createResponse.data.data.id}`);
        console.log(`   Created: ${createResponse.data.created}`);
      } else {
        console.log('❌ Failed to create firm:', createResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error creating firm:', error.response?.data?.message || error.message);
      return;
    }

    // Test 4: Verify persistence by fetching again
    console.log('\n🔍 Test 4: Verifying firm was persisted...');
    try {
      const verifyResponse = await axios.get(`${BASE_URL}/dyeing-firms`);
      const updatedFirms = verifyResponse.data.data || verifyResponse.data;
      
      const testFirm = updatedFirms.find(firm => firm.name === testFirmName);
      if (testFirm) {
        console.log(`✅ Test firm found in database: ${testFirm.name} (ID: ${testFirm.id})`);
        console.log(`   Total firms now: ${updatedFirms.length}`);
      } else {
        console.log('❌ Test firm not found in database - persistence failed!');
      }
    } catch (error) {
      console.log('❌ Error verifying persistence:', error.message);
    }

    // Test 5: Test duplicate prevention
    console.log('\n🔁 Test 5: Testing duplicate prevention...');
    try {
      const duplicateResponse = await axios.post(`${BASE_URL}/dyeing-firms/find-or-create`, {
        name: testFirmName
      });
      
      if (duplicateResponse.data.success && !duplicateResponse.data.created) {
        console.log('✅ Duplicate prevention working - found existing firm');
      } else {
        console.log('⚠️ Unexpected behavior with duplicate firm');
      }
    } catch (error) {
      console.log('❌ Error testing duplicates:', error.message);
    }

    console.log('\n🎯 Persistence test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDyeingFirmPersistence().catch(console.error);
