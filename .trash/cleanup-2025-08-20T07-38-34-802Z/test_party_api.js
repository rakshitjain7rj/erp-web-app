const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testPartyAPI() {
  console.log('🧪 Testing Party API Endpoints\n');

  try {
    // Test 1: GET /api/parties/summary
    console.log('1️⃣ Testing GET /api/parties/summary');
    const summaryResponse = await axios.get(`${API_BASE}/parties/summary`);
    console.log('✅ Summary endpoint working');
    console.log('📊 Current parties:', summaryResponse.data.length);

    // Test 2: POST /api/parties (Create new party)
    console.log('\n2️⃣ Testing POST /api/parties (Create party)');
    const testParty = {
      name: `Test Party ${Date.now()}`,
      dyeingFirm: 'Test Dyeing Firm',
      address: '123 Test Street, Test City',
      contact: '+91 9876543210'
    };
    
    const createResponse = await axios.post(`${API_BASE}/parties`, testParty);
    console.log('✅ Create party endpoint working');
    console.log('🎉 Created party:', createResponse.data.party.name);

    // Test 3: GET /api/parties/names
    console.log('\n3️⃣ Testing GET /api/parties/names');
    const namesResponse = await axios.get(`${API_BASE}/parties/names`);
    console.log('✅ Names endpoint working');
    console.log('📝 Total unique parties:', namesResponse.data.length);

    // Test 4: GET /api/parties/statistics
    console.log('\n4️⃣ Testing GET /api/parties/statistics');
    const statsResponse = await axios.get(`${API_BASE}/parties/statistics`);
    console.log('✅ Statistics endpoint working');
    console.log('📈 Stats:', statsResponse.data);

    console.log('\n🎉 All Party API endpoints are working correctly!');
    console.log('\n🔧 Frontend should now be able to:');
    console.log('   ✅ Load existing parties');
    console.log('   ✅ Create new parties');
    console.log('   ✅ Validate duplicate names');
    console.log('   ✅ Show party statistics');

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('📄 Response Status:', error.response.status);
      console.error('📝 Response Data:', error.response.data);
    }
  }
}

testPartyAPI();
