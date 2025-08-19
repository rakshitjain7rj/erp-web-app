const axios = require('axios');

async function testMachinePerformanceAPI() {
  const BASE_URL = 'http://localhost:5000';
  
  console.log('===== Testing Machine Performance API =====');
  
  try {
    console.log('\n1. Testing /api/test endpoint to verify API is running...');
    const testResponse = await axios.get(`${BASE_URL}/api/test`);
    console.log('Status:', testResponse.status);
    console.log('Available Routes:', testResponse.data.availableRoutes);
  } catch (error) {
    console.error('Error testing /api/test:', error.message);
    return;
  }
  
  try {
    console.log('\n2. Testing /api/machines endpoint...');
    const rootResponse = await axios.get(`${BASE_URL}/api/machines`);
    console.log('Status:', rootResponse.status);
    console.log('Response:', rootResponse.data);
  } catch (error) {
    console.error('Error testing /api/machines:', error.message);
  }
  
  try {
    console.log('\n3. Testing /api/machines/performance endpoint...');
    const perfResponse = await axios.get(`${BASE_URL}/api/machines/performance`);
    console.log('Status:', perfResponse.status);
    console.log('Success:', perfResponse.data.success);
    console.log('Data Count:', perfResponse.data.data ? perfResponse.data.data.length : 0);
    if (perfResponse.data.data && perfResponse.data.data.length > 0) {
      console.log('Sample Machine:', perfResponse.data.data[0]);
    }
  } catch (error) {
    console.error('Error testing /api/machines/performance:', error.message);
  }
  
  try {
    console.log('\n4. Testing /api/machines/status endpoint...');
    const statusResponse = await axios.get(`${BASE_URL}/api/machines/status`);
    console.log('Status:', statusResponse.status);
    console.log('Success:', statusResponse.data.success);
  } catch (error) {
    console.error('Error testing /api/machines/status:', error.message);
  }
  
  console.log('\n===== API Testing Complete =====');
}

testMachinePerformanceAPI();
