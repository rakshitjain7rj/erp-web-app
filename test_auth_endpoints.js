// Test authentication endpoints
const axios = require('axios');

async function testAuth() {
  const baseURL = 'http://localhost:5000/api/auth';
  
  console.log('🧪 Testing Authentication Endpoints');
  console.log('=====================================');
  
  try {
    // Test 1: Registration
    console.log('\n1️⃣ Testing Registration...');
    const regData = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      role: 'storekeeper'
    };
    
    try {
      const regResponse = await axios.post(`${baseURL}/register`, regData);
      console.log('✅ Registration Success:', regResponse.status);
      console.log('👤 User created:', regResponse.data.user?.name, regResponse.data.user?.email);
    } catch (regError) {
      console.log('❌ Registration Error:', regError.response?.status);
      console.log('📝 Error details:', regError.response?.data);
    }
    
    // Test 2: Login
    console.log('\n2️⃣ Testing Login...');
    const loginData = {
      email: 'testuser@example.com',
      password: 'password123'
    };
    
    try {
      const loginResponse = await axios.post(`${baseURL}/login`, loginData);
      console.log('✅ Login Success:', loginResponse.status);
      console.log('🔑 Token received:', loginResponse.data.token ? 'YES' : 'NO');
      console.log('👤 User info:', loginResponse.data.user?.name, loginResponse.data.user?.role);
    } catch (loginError) {
      console.log('❌ Login Error:', loginError.response?.status);
      console.log('📝 Error details:', loginError.response?.data);
    }
    
    // Test 3: Try login with admin (if created by fix script)
    console.log('\n3️⃣ Testing Admin Login...');
    const adminLoginData = {
      email: 'admin@example.com',
      password: 'admin123'
    };
    
    try {
      const adminLoginResponse = await axios.post(`${baseURL}/login`, adminLoginData);
      console.log('✅ Admin Login Success:', adminLoginResponse.status);
      console.log('🔑 Token received:', adminLoginResponse.data.token ? 'YES' : 'NO');
      console.log('👤 Admin info:', adminLoginResponse.data.user?.name, adminLoginResponse.data.user?.role);
    } catch (adminLoginError) {
      console.log('❌ Admin Login Error:', adminLoginError.response?.status);
      console.log('📝 Error details:', adminLoginError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAuth();
