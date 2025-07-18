const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/parties';

async function testCompleteArchiveWorkflow() {
  console.log('🧪 Testing Complete Archive Workflow...\n');
  
  try {
    // Step 1: Get current active parties
    console.log('📋 Step 1: Getting current active parties...');
    const activeResponse = await axios.get(`${API_BASE}/summary`);
    const activeParties = activeResponse.data;
    console.log(`✅ Found ${activeParties.length} active parties:`, activeParties.map(p => p.partyName));
    
    if (activeParties.length === 0) {
      console.log('❌ No active parties found to test with!');
      return;
    }
    
    // Step 2: Archive the first party
    const partyToArchive = activeParties[0].partyName;
    console.log(`\n📦 Step 2: Archiving party "${partyToArchive}"...`);
    
    try {
      const archiveResponse = await axios.post(`${API_BASE}/${encodeURIComponent(partyToArchive)}/archive`);
      console.log('✅ Archive response:', archiveResponse.data);
    } catch (archiveError) {
      console.log('❌ Archive failed:', archiveError.response?.data || archiveError.message);
      return;
    }
    
    // Step 3: Verify party is no longer in active list
    console.log(`\n🔍 Step 3: Verifying "${partyToArchive}" is removed from active list...`);
    const updatedActiveResponse = await axios.get(`${API_BASE}/summary`);
    const updatedActiveParties = updatedActiveResponse.data;
    const stillActive = updatedActiveParties.find(p => p.partyName === partyToArchive);
    
    if (stillActive) {
      console.log(`❌ ISSUE: "${partyToArchive}" still appears in active parties!`);
      console.log(`Active parties count: ${updatedActiveParties.length}`);
    } else {
      console.log(`✅ SUCCESS: "${partyToArchive}" properly removed from active list`);
      console.log(`Active parties count: ${updatedActiveParties.length} (was ${activeParties.length})`);
    }
    
    // Step 4: Verify party appears in archived list
    console.log(`\n📁 Step 4: Verifying "${partyToArchive}" appears in archived list...`);
    const archivedResponse = await axios.get(`${API_BASE}/archived/summary`);
    const archivedParties = archivedResponse.data;
    const isArchived = archivedParties.find(p => p.partyName === partyToArchive);
    
    if (isArchived) {
      console.log(`✅ SUCCESS: "${partyToArchive}" found in archived parties`);
      console.log(`Archived parties count: ${archivedParties.length}`);
    } else {
      console.log(`❌ ISSUE: "${partyToArchive}" not found in archived parties!`);
      console.log('Archived parties:', archivedParties.map(p => p.partyName));
    }
    
    // Step 5: Test restore functionality
    console.log(`\n🔄 Step 5: Testing restore functionality for "${partyToArchive}"...`);
    try {
      const restoreResponse = await axios.post(`${API_BASE}/${encodeURIComponent(partyToArchive)}/restore`);
      console.log('✅ Restore response:', restoreResponse.data);
      
      // Verify party is back in active list
      const finalActiveResponse = await axios.get(`${API_BASE}/summary`);
      const finalActiveParties = finalActiveResponse.data;
      const isRestored = finalActiveParties.find(p => p.partyName === partyToArchive);
      
      if (isRestored) {
        console.log(`✅ SUCCESS: "${partyToArchive}" successfully restored to active list`);
      } else {
        console.log(`❌ ISSUE: "${partyToArchive}" not found in active list after restore!`);
      }
    } catch (restoreError) {
      console.log('❌ Restore failed:', restoreError.response?.data || restoreError.message);
    }
    
    console.log('\n🎉 Complete Archive Workflow Test Finished!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteArchiveWorkflow();
