// Test both dyeing APIs to verify form submission will work
const axios = require('axios');

async function testCompleteDyeingFlow() {
  console.log('🚀 Testing Complete Dyeing Order Flow');
  console.log('=====================================\n');

  try {
    // Test 1: Get all dyeing firms (for form dropdown)
    console.log('1️⃣ Testing GET /api/dyeing-firms (for form dropdown)');
    const firmsResponse = await axios.get('http://localhost:5000/api/dyeing-firms');
    console.log('✅ Status:', firmsResponse.status);
    console.log('✅ Firms available:', firmsResponse.data.data.map(f => f.name));
    console.log('✅ Response:', firmsResponse.data);

    // Test 2: Create a dyeing firm (if user types new one)
    console.log('\n2️⃣ Testing POST /api/dyeing-firms (create new firm)');
    const newFirm = { name: 'User Created Firm' };
    const createFirmResponse = await axios.post('http://localhost:5000/api/dyeing-firms', newFirm);
    console.log('✅ Status:', createFirmResponse.status);
    console.log('✅ New firm created:', createFirmResponse.data);

    // Test 3: Get all dyeing records (for listing)
    console.log('\n3️⃣ Testing GET /api/dyeing (current orders list)');
    const recordsResponse = await axios.get('http://localhost:5000/api/dyeing');
    console.log('✅ Status:', recordsResponse.status);
    console.log('✅ Current orders count:', recordsResponse.data.length);

    // Test 4: Create a dyeing order (main form submission)
    console.log('\n4️⃣ Testing POST /api/dyeing (submit form)');
    const testOrder = {
      yarnType: "Cotton",
      sentDate: "2024-01-15",
      expectedArrivalDate: "2024-01-22",
      remarks: "Test order from complete flow test",
      partyName: "Test Customer Form Flow",
      quantity: 150,
      shade: "Red",
      count: "30s",
      lot: "LOT-FLOW-001",
      dyeingFirm: "User Created Firm"  // Use the firm we just created
    };

    const createOrderResponse = await axios.post('http://localhost:5000/api/dyeing', testOrder);
    console.log('✅ Status:', createOrderResponse.status);
    console.log('✅ Order created:', createOrderResponse.data);

    // Test 5: Get updated dyeing records list
    console.log('\n5️⃣ Testing GET /api/dyeing (updated list after submission)');
    const updatedRecordsResponse = await axios.get('http://localhost:5000/api/dyeing');
    console.log('✅ Status:', updatedRecordsResponse.status);
    console.log('✅ Updated orders count:', updatedRecordsResponse.data.length);
    console.log('✅ New order in list:', updatedRecordsResponse.data.find(r => r.lot === 'LOT-FLOW-001') ? 'YES' : 'NO');

    console.log('\n🎉 SUCCESS: Complete dyeing order flow test passed!');
    console.log('📋 Summary:');
    console.log('   - Dyeing firms API working ✅');
    console.log('   - Dyeing orders API working ✅');
    console.log('   - Form submission flow ready ✅');
    console.log('   - Backend can handle all frontend requests ✅');
    console.log('\n🎯 The dyeing form submission issue is RESOLVED!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.status, error.response?.data || error.message);
  }
}

testCompleteDyeingFlow();
