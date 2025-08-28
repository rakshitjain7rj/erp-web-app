// Debug auth controller to see what's happening
const axios = require('axios');

async function debugAuth() {
  console.log('🔍 Debug Authentication Issues');
  console.log('==============================');
  
  // Test 1: Check if server is responding at all
  console.log('\n1️⃣ Testing basic server connectivity...');
  try {
    const response = await axios.get('http://localhost:5000/api/test');
    console.log('✅ Server reachable:', response.status);
    console.log('📋 Response:', response.data);
  } catch (error) {
    console.log('❌ Server not reachable:', error.code);
    return;
  }
  
  // Test 2: Test auth endpoint with minimal data
  console.log('\n2️⃣ Testing auth endpoint with minimal request...');
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test',
      email: 'debug@test.com',
      password: '123456',
      role: 'storekeeper'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Auth Success:', response.status);
    console.log('📋 Response:', response.data);
  } catch (error) {
    console.log('❌ Auth Error:');
    console.log('  - Code:', error.code);
    console.log('  - Status:', error.response?.status);
    console.log('  - Message:', error.message);
    if (error.response?.data) {
      console.log('  - Response Data:', error.response.data);
    }
  }
  
  // Test 3: Test auth routes specifically
  console.log('\n3️⃣ Testing auth routes structure...');
  try {
    const response = await axios.get('http://localhost:5000/api/debug-routes');
    console.log('✅ Routes available:', response.data);
  } catch (error) {
    console.log('❌ Routes debug failed:', error.message);
  }
}

debugAuth();
