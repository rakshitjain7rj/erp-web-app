// debug_followup_issue.js
// This script helps debug the count product follow-up issue

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function debugFollowUpIssue() {
  console.log('🔍 Debugging Count Product Follow-up Issue...\n');

  // Step 1: Check if server is running
  console.log('1. Testing server connectivity...');
  try {
    const healthCheck = await axios.get(`${API_BASE_URL}/test`);
    console.log('✅ Server is running:', healthCheck.data);
  } catch (error) {
    console.log('❌ Server not running or not accessible:', error.message);
    console.log('🔧 Solution: Start the backend server with: node server/index.js');
    return;
  }

  // Step 2: Test count product follow-up endpoints
  console.log('\n2. Testing count product follow-up endpoints...');
  
  const testCountProductId = 1;
  
  // Test GET endpoint
  console.log(`   📡 GET /api/count-products/${testCountProductId}/followups`);
  try {
    const getResponse = await axios.get(`${API_BASE_URL}/count-products/${testCountProductId}/followups`);
    console.log('   ✅ GET successful:', getResponse.data);
  } catch (error) {
    console.log('   ❌ GET failed:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('   🔧 This might mean the route is not registered in server/index.js');
    }
  }

  // Test POST endpoint (without auth for now)
  console.log(`   📡 POST /api/count-products/${testCountProductId}/followups`);
  const testFollowUpData = {
    remarks: 'Test follow-up from debug script',
    followUpDate: new Date().toISOString()
  };
  
  try {
    const postResponse = await axios.post(
      `${API_BASE_URL}/count-products/${testCountProductId}/followups`, 
      testFollowUpData
    );
    console.log('   ✅ POST successful:', postResponse.data);
  } catch (error) {
    console.log('   ❌ POST failed:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('   🔧 This is expected - authentication required for POST requests');
    }
  }

  // Step 3: Compare with working dyeing endpoints
  console.log('\n3. Testing working dyeing follow-up endpoints for comparison...');
  const testDyeingId = 1;
  
  try {
    const dyeingResponse = await axios.get(`${API_BASE_URL}/dyeing/${testDyeingId}/followups`);
    console.log('   ✅ Dyeing follow-ups work:', dyeingResponse.data);
  } catch (error) {
    console.log('   ❌ Dyeing follow-ups also failing:', error.response?.status, error.message);
  }

  console.log('\n🎯 Debug Summary:');
  console.log('   - Check if backend server is running: node server/index.js');
  console.log('   - Check if count-products routes are registered in server/index.js');  
  console.log('   - Check if CountProductFollowUp model is properly loaded');
  console.log('   - Verify database table exists: CountProductFollowUps');
}

debugFollowUpIssue().catch(console.error);
