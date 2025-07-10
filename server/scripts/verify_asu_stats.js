const fetch = require('node-fetch');

/**
 * This script verifies that the ASU Unit 1 stats API is working correctly
 * after removing all Unit 2 functionality and fixing the endpoint.
 */
async function verifyASUStatsEndpoint() {
  try {
    console.log('Verifying ASU Unit 1 stats endpoint...');
    
    // Make a request to the stats endpoint
    const response = await fetch('http://localhost:5000/api/asu-unit1/stats');
    const data = await response.json();
    
    // Check if the response is successful
    if (data.success) {
      console.log('✅ API endpoint is working correctly!');
      console.log('Stats returned:');
      console.log(JSON.stringify(data.data, null, 2));
    } else {
      console.error('❌ API request failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error verifying stats endpoint:', error.message);
    console.log('Make sure the server is running on localhost:5000');
  }
}

// Execute the verification
verifyASUStatsEndpoint();
