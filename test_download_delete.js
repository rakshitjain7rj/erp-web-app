const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/parties';

async function testDownloadAndDeleteFunctionality() {
  console.log('🧪 Testing Download and Delete Functionality...\n');
  
  try {
    // Step 1: Get current active parties and archive one for testing
    console.log('📋 Step 1: Setting up test data...');
    const activeResponse = await axios.get(`${API_BASE}/summary`);
    const activeParties = activeResponse.data;
    
    if (activeParties.length === 0) {
      console.log('❌ No active parties found to test with!');
      return;
    }
    
    const testParty = activeParties[0].partyName;
    console.log(`🎯 Using party "${testParty}" for testing`);
    
    // Archive the party for testing
    console.log(`📦 Archiving party "${testParty}" for testing...`);
    await axios.post(`${API_BASE}/${encodeURIComponent(testParty)}/archive`);
    console.log('✅ Party archived successfully');
    
    // Step 2: Test CSV Download Functionality
    console.log(`\n📊 Step 2: Testing CSV download for "${testParty}"...`);
    try {
      const downloadResponse = await axios.get(`${API_BASE}/${encodeURIComponent(testParty)}/export/csv`, {
        responseType: 'blob'
      });
      
      if (downloadResponse.status === 200) {
        console.log('✅ CSV download successful');
        console.log(`📄 File size: ${downloadResponse.data.size} bytes`);
        console.log(`📋 Content type: ${downloadResponse.headers['content-type']}`);
      } else {
        console.log(`❌ CSV download failed with status: ${downloadResponse.status}`);
      }
    } catch (downloadError) {
      console.log('❌ CSV download failed:', downloadError.response?.data || downloadError.message);
    }
    
    // Step 3: Test Permanent Delete Functionality
    console.log(`\n🗑️ Step 3: Testing permanent deletion for "${testParty}"...`);
    try {
      const deleteResponse = await axios.delete(`${API_BASE}/${encodeURIComponent(testParty)}/permanent`);
      
      if (deleteResponse.status === 200) {
        console.log('✅ Permanent deletion successful');
        console.log('📊 Deletion response:', deleteResponse.data);
        
        // Verify party is removed from archived list
        const archivedResponse = await axios.get(`${API_BASE}/archived/summary`);
        const archivedParties = archivedResponse.data;
        const stillExists = archivedParties.find(p => p.partyName === testParty);
        
        if (stillExists) {
          console.log(`❌ ISSUE: "${testParty}" still appears in archived parties!`);
        } else {
          console.log(`✅ SUCCESS: "${testParty}" properly removed from archived parties`);
        }
      } else {
        console.log(`❌ Permanent deletion failed with status: ${deleteResponse.status}`);
      }
    } catch (deleteError) {
      console.log('❌ Permanent deletion failed:', deleteError.response?.data || deleteError.message);
    }
    
    console.log('\n🎉 Download and Delete Functionality Test Finished!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDownloadAndDeleteFunctionality();
