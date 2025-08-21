// Test script to verify update quantities functionality
const axios = require('axios');

async function testUpdateQuantities() {
  try {
    console.log('🧪 Testing Update Quantities Functionality');
    
    // 1. Get all dyeing records
    const recordsResponse = await axios.get('http://localhost:5000/api/dyeing-records');
    const records = recordsResponse.data;
    
    console.log(`📋 Found ${records.length} dyeing records`);
    
    if (records.length === 0) {
      console.log('❌ No records found to test with');
      return;
    }
    
    // 2. Take the first record for testing
    const testRecord = records[0];
    console.log('🎯 Testing with record:', {
      id: testRecord.id,
      customerName: testRecord.customerName,
      dyeingFirm: testRecord.dyeingFirm,
      quantity: testRecord.quantity
    });
    
    // 3. Create update data (same structure as our handleSaveQuantities)
    const updateData = {
      yarnType: testRecord.yarnType,
      sentDate: testRecord.sentDate,
      expectedArrivalDate: testRecord.expectedArrivalDate,
      partyName: testRecord.partyName,
      shade: testRecord.shade,
      count: testRecord.count,
      lot: testRecord.lot,
      dyeingFirm: testRecord.dyeingFirm,
      customerName: testRecord.customerName,
      quantity: testRecord.quantity + 1, // Just increment by 1 for testing
      remarks: testRecord.remarks || ''
    };
    
    console.log('📤 Sending update request...');
    
    // 4. Update the record
    const updateResponse = await axios.put(`http://localhost:5000/api/dyeing-records/${testRecord.id}`, updateData);
    
    console.log('✅ Update successful!');
    console.log('📋 Updated record quantity:', updateResponse.data.quantity);
    
    // 5. Revert the change
    const revertData = {
      ...updateData,
      quantity: testRecord.quantity
    };
    
    await axios.put(`http://localhost:5000/api/dyeing-records/${testRecord.id}`, revertData);
    console.log('🔄 Reverted changes successfully');
    
    console.log('🎉 Update Quantities API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testUpdateQuantities();
