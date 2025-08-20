// Simple test to verify our yarn type functionality
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/asu-unit1';

// Test data
const testEntry = {
  machineNumber: 1,
  date: '2025-08-05',
  shift: 'day',
  actualProduction: 50.5,
  theoreticalProduction: 87,
  yarnType: 'Test-Cotton'
};

async function testYarnTypeFunctionality() {
  try {
    console.log('Testing yarn type functionality...');
    
    // First, try to get machines (this might fail due to auth, but we'll try)
    try {
      const machinesResponse = await axios.get(`${API_BASE}/machines`);
      console.log('✅ Machines API working');
    } catch (error) {
      console.log('⚠️ Machines API requires auth (expected)');
    }
    
    // Try to create a test production entry (this will also fail due to auth, but let's see the error)
    try {
      const createResponse = await axios.post(`${API_BASE}/production-entries`, testEntry);
      console.log('✅ Production entry created with yarn type:', createResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ API Error:', error.response.status, error.response.data);
        
        // Check if the error mentions yarn_type column
        if (error.response.data.error && error.response.data.error.includes('yarn_type')) {
          console.log('🔧 Yarn type column is being processed by the API');
        }
      } else {
        console.log('❌ Network Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testYarnTypeFunctionality();
