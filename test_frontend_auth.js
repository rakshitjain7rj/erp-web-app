// Test authentication with exact same approach as frontend
const axios = require('axios');

// This matches the frontend auth API exactly
const API = 'http://localhost:5000/api';

async function testFrontendAuth() {
  console.log('🧪 Testing Authentication (Frontend Style)');
  console.log('==========================================');
  
  // Test Registration
  console.log('\n1️⃣ Testing Registration...');
  const registrationData = {
    name: 'Frontend Test User',
    email: 'frontend@test.com',
    password: 'password123',
    role: 'storekeeper'
  };
  
  try {
    console.log(`Making register request to: ${API}/auth/register`);
    const regResponse = await axios.post(`${API}/auth/register`, registrationData);
    console.log('✅ Registration Success!');
    console.log('📋 Response:', regResponse.data);
  } catch (regError) {
    console.log('❌ Registration Failed');
    console.log('📋 Status:', regError.response?.status);
    console.log('📋 Error:', regError.response?.data);
    console.log('📋 Message:', regError.message);
  }
  
  // Test Login
  console.log('\n2️⃣ Testing Login...');
  const loginData = {
    email: 'frontend@test.com',
    password: 'password123'
  };
  
  try {
    console.log(`Making login request to: ${API}/auth/login`);
    const loginResponse = await axios.post(`${API}/auth/login`, loginData);
    console.log('✅ Login Success!');
    console.log('📋 Response:', loginResponse.data);
    console.log('🔑 Token present:', !!loginResponse.data.token);
  } catch (loginError) {
    console.log('❌ Login Failed');
    console.log('📋 Status:', loginError.response?.status);
    console.log('📋 Error:', loginError.response?.data);
    console.log('📋 Message:', loginError.message);
  }
  
  console.log('\n✅ Test completed!');
}

testFrontendAuth();
