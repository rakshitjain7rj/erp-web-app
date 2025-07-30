// test_count_product_followup.js
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test function to check if count product follow-up endpoints work
async function testCountProductFollowUp() {
  try {
    console.log('Testing Count Product Follow-Up API endpoints...');
    
    // Test data
    const countProductId = 1;
    const followUpData = {
      remarks: 'Test follow-up from API test',
      followUpDate: new Date().toISOString()
    };

    // 1. Try to get existing follow-ups
    console.log(`\n1. Getting follow-ups for count product ${countProductId}...`);
    try {
      const getResponse = await axios.get(`${API_BASE_URL}/count-products/${countProductId}/followups`);
      console.log('✅ GET follow-ups successful:', getResponse.data);
    } catch (error) {
      console.log('❌ GET follow-ups failed:', error.response?.data || error.message);
    }

    // 2. Try to create a new follow-up
    console.log(`\n2. Creating follow-up for count product ${countProductId}...`);
    try {
      const createResponse = await axios.post(`${API_BASE_URL}/count-products/${countProductId}/followups`, followUpData);
      console.log('✅ CREATE follow-up successful:', createResponse.data);
      
      const newFollowUpId = createResponse.data.data?.id || createResponse.data.id;
      
      // 3. Try to delete the follow-up we just created
      if (newFollowUpId) {
        console.log(`\n3. Deleting follow-up ${newFollowUpId}...`);
        try {
          await axios.delete(`${API_BASE_URL}/count-products/${countProductId}/followups/${newFollowUpId}`);
          console.log('✅ DELETE follow-up successful');
        } catch (error) {
          console.log('❌ DELETE follow-up failed:', error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.log('❌ CREATE follow-up failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCountProductFollowUp();
