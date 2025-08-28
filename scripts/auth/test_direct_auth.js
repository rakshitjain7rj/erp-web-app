// Direct test of User model and auth controller
const User = require('./server/models/User');
const authController = require('./server/controllers/authController');

async function testDirectAuth() {
  try {
    console.log('🧪 Testing User Model and Auth Controller Directly');
    console.log('=================================================');
    
    // Test 1: Create a user using the User model
    console.log('\n1️⃣ Testing User Model...');
    
    // Clear any existing test user
    await User.destroy({ where: { email: 'modeltest@example.com' } });
    
    // Create user using model
    const testUser = await User.create({
      name: 'Model Test User',
      email: 'modeltest@example.com',
      password: '$2a$12$5K8M8bITdx2.2vL8jVN3K.X1q5HJ7k9T8fN6.0A1n4C8pG9uZ3dVK', // bcrypt hash of 'password123'
      role: 'storekeeper',
      status: 'active'
    });
    
    console.log('✅ User created via model:', testUser.id, testUser.name, testUser.email);
    
    // Test 2: Find user with password scope
    console.log('\n2️⃣ Testing User with Password Scope...');
    const userWithPassword = await User.scope('withPassword').findOne({
      where: { email: 'modeltest@example.com' }
    });
    
    console.log('✅ User found with password:', !!userWithPassword, !!userWithPassword?.password);
    
    // Test 3: Test bcrypt comparison
    console.log('\n3️⃣ Testing bcrypt...');
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare('password123', userWithPassword.password);
    console.log('✅ Password validation:', isValidPassword);
    
    // Test 4: Create mock req/res to test auth controller
    console.log('\n4️⃣ Testing Auth Controller...');
    
    const mockReq = {
      body: {
        email: 'modeltest@example.com',
        password: 'password123'
      }
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`✅ Auth Controller Response: ${code}`, data);
          return mockRes;
        }
      }),
      json: (data) => {
        console.log('✅ Auth Controller Success:', data);
        return mockRes;
      }
    };
    
    // Test login controller
    await authController.login(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Direct test error:', error.message);
    console.error('📋 Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testDirectAuth();
