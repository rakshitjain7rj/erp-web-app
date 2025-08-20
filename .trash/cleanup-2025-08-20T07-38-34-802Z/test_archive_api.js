const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testArchiveEndpoint() {
  console.log('🧪 Testing Archive Party endpoint...');
  
  try {
    // First get the current parties
    const response = await axios.get(`${API_BASE}/parties/summary`);
    console.log('✅ Current parties:', response.data.map(p => p.partyName));
    
    if (response.data.length > 0) {
      const partyToArchive = response.data[0].partyName;
      console.log(`🗂️ Attempting to archive: ${partyToArchive}`);
      
      // Test archive endpoint
      const archiveResponse = await axios.post(`${API_BASE}/parties/${encodeURIComponent(partyToArchive)}/archive`);
      console.log('✅ Archive Success:', archiveResponse.status, archiveResponse.data);
      
      // Check if party is still in the main list
      const updatedResponse = await axios.get(`${API_BASE}/parties/summary`);
      console.log('✅ Updated parties:', updatedResponse.data.map(p => p.partyName));
      console.log(`📊 Party count before: ${response.data.length}, after: ${updatedResponse.data.length}`);
      
    } else {
      console.log('❌ No parties found to archive');
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Archive Error Response:', error.response.status, error.response.statusText);
      console.log('❌ Error Data:', error.response.data);
      console.log('❌ Error Config URL:', error.response.config.url);
    } else {
      console.log('❌ Archive Error:', error.message);
    }
  }
}

testArchiveEndpoint().catch(console.error);
