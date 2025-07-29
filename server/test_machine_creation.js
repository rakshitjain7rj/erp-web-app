const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api/asu-unit1';

// Login first to get auth token
async function getAuthToken() {
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com', // Replace with valid credentials
      password: 'admin123' // Replace with valid credentials
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      console.log('Login successful, got auth token');
      return loginResponse.data.token;
    } else {
      console.error('Login failed:', loginResponse.data);
      return null;
    }
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
}

// Test functions
async function testMachineCreation() {
  try {
    console.log('Testing machine creation and production entry...');
    
    // Get authentication token first
    const token = await getAuthToken();
    if (!token) {
      console.error('Failed to get authentication token. Aborting test.');
      return;
    }
    
    // Set headers with the token
    const headers = {
      Authorization: `Bearer ${token}`
    };
    
    // 1. Create a new machine
    const machineData = {
      machineNo: 999, // Test machine number
      machine_name: 'Test Machine',
      machine_number: '999',
      count: 20,
      yarnType: 'Cotton',
      spindles: 240,
      speed: 18000,
      productionAt100: 120,
      isActive: true
    };
    
    console.log('Creating machine with data:', machineData);
    const machineResponse = await axios.post(`${BASE_URL}/asu-machines`, machineData, { headers });
    console.log('Machine created successfully:', machineResponse.data);
    
    // 2. Create a production entry for the new machine
    const productionData = {
      machineNumber: 999, // Use same machine number
      date: new Date().toISOString().split('T')[0], // Today's date
      shift: 'day',
      actualProduction: 85.5,
      theoreticalProduction: 100.0,
      remarks: 'Test production entry'
    };
    
    console.log('Creating production entry with data:', productionData);
    const productionResponse = await axios.post(`${BASE_URL}/production-entries`, productionData, { headers });
    console.log('Production entry created successfully:', productionResponse.data);
    
    // 3. Clean up - delete the test entries (optional)
    // Note: Uncomment if you want to clean up after testing
    /*
    if (productionResponse.data && productionResponse.data.data && productionResponse.data.data.id) {
      console.log(`Deleting test production entry ID: ${productionResponse.data.data.id}`);
      await axios.delete(`${BASE_URL}/production-entries/${productionResponse.data.data.id}`);
    }
    
    if (machineResponse.data && machineResponse.data.data && machineResponse.data.data.id) {
      console.log(`Deleting test machine ID: ${machineResponse.data.data.id}`);
      await axios.delete(`${BASE_URL}/asu-machines/${machineResponse.data.data.id}`);
    }
    */
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed with error:');
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testMachineCreation();
