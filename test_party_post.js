const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testPartyPOST() {
  console.log('🧪 Testing Party POST endpoint...');
  
  try {
    // Test basic POST
    const response = await axios.post(`${API_BASE}/parties`, {
      name: 'Test Party API',
      address: '123 Test Street',
      contact: '9876543210',
      dyeingFirm: 'Test Dyeing Firm'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ POST Success:', response.status, response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ POST Error Response:', error.response.status, error.response.statusText);
      console.log('❌ Error Data:', error.response.data);
      console.log('❌ Error Config URL:', error.response.config.url);
      console.log('❌ Error Config Method:', error.response.config.method);
    } else if (error.request) {
      console.log('❌ No Response Error:', error.message);
    } else {
      console.log('❌ Setup Error:', error.message);
    }
  }
}

async function testRoutes() {
  console.log('\n🔍 Testing available routes...');
  
  try {
    // Test the test route first
    const testResponse = await axios.get(`${API_BASE}/test`);
    console.log('✅ GET /api/test:', testResponse.data);
    
    // Test the test POST route
    const testPostResponse = await axios.post(`${API_BASE}/test-post`, {
      message: 'Hello from test'
    });
    console.log('✅ POST /api/test-post:', testPostResponse.data);
    
    // Test party GET route
    const partyResponse = await axios.get(`${API_BASE}/parties/summary`);
    console.log('✅ GET /api/parties/summary:', partyResponse.data.length, 'parties');
    
  } catch (error) {
    console.log('❌ Route test error:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testRoutes();
  await testPartyPOST();
}

runAllTests().catch(console.error);
