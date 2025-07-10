// Test script to verify the fixes

const axios = require('axios');

async function testProductionEntryDuplication() {
  console.log('Testing production entry duplication handling...');
  
  try {
    // Try to create two identical entries
    const payload = {
      machineNumber: 1,
      date: '2025-07-09',
      shift: 'day',
      actualProduction: 100,
      theoreticalProduction: 150
    };
    
    // First creation should work
    const firstResponse = await axios.post('http://localhost:5000/api/asu-unit1/production-entries', payload);
    console.log('First creation response:', firstResponse.status === 201 ? 'Created successfully' : 'Failed');
    
    try {
      // Second creation should fail with 409
      const secondResponse = await axios.post('http://localhost:5000/api/asu-unit1/production-entries', payload);
      console.log('ERROR: Second creation did not fail as expected');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ Duplicate entry correctly returned 409 Conflict');
        console.log('Error message:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Clean up by deleting the test entry
    if (firstResponse.data && firstResponse.data.data && firstResponse.data.data.id) {
      await axios.delete(`http://localhost:5000/api/asu-unit1/production-entries/${firstResponse.data.data.id}`);
      console.log('Test entry deleted');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testProductionEntryDuplication();
