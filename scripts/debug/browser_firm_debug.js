// BROWSER DEBUG TOOL FOR FIRM PERSISTENCE ISSUE
// Copy and paste this into the browser console on the Count Product Overview page

console.log('🔧 FIRM PERSISTENCE DEBUG TOOL STARTING...');

// Helper function to test API
window.testFirmAPI = async function() {
  console.log('🌐 Testing dyeing firms API...');
  
  try {
    // Test GET
    const getResponse = await fetch('http://localhost:5000/api/dyeing-firms', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('📊 GET /api/dyeing-firms Status:', getResponse.status);
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('📊 Current firms in database:', data);
      return data;
    } else {
      console.error('❌ GET failed:', getResponse.statusText);
      return null;
    }
  } catch (error) {
    console.error('❌ API test failed:', error);
    return null;
  }
};

// Helper function to test firm creation
window.testFirmCreation = async function(firmName = 'Debug Test Firm ' + Date.now()) {
  console.log('🆕 Testing firm creation with name:', firmName);
  
  try {
    const createResponse = await fetch('http://localhost:5000/api/dyeing-firms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: firmName })
    });
    
    console.log('✅ POST Status:', createResponse.status);
    
    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log('✅ Created firm:', created);
      
      // Test immediate retrieval
      const verification = await window.testFirmAPI();
      const found = verification?.data?.find(f => f.name === firmName);
      
      if (found) {
        console.log('✅ PERSISTENCE TEST PASSED: Firm found after creation');
        return found;
      } else {
        console.error('❌ PERSISTENCE TEST FAILED: Firm not found after creation');
        return null;
      }
    } else {
      console.error('❌ Create failed:', createResponse.statusText);
      return null;
    }
  } catch (error) {
    console.error('❌ Firm creation test failed:', error);
    return null;
  }
};

// Helper function to check frontend store state
window.checkStoreState = function() {
  console.log('🏪 Checking frontend store state...');
  
  // Check if dyeingDataStore is available
  if (typeof window.dyeingDataStore !== 'undefined') {
    console.log('✅ Store available globally');
    const firms = window.dyeingDataStore.getFirms();
    console.log('📊 Store firms:', firms);
  } else {
    console.log('⚠️ Store not available globally, checking React DevTools...');
  }
  
  // Check localStorage
  try {
    const cached = localStorage.getItem('custom-dyeing-firms');
    console.log('💾 LocalStorage cached firms:', cached ? JSON.parse(cached) : 'none');
  } catch (e) {
    console.log('⚠️ Failed to read localStorage:', e);
  }
  
  // Check DOM for firm dropdowns
  const firmDropdowns = document.querySelectorAll('[data-testid*="firm"], [placeholder*="firm" i], [placeholder*="dyeing" i]');
  console.log('🎯 Found firm-related elements:', firmDropdowns.length);
  firmDropdowns.forEach((el, i) => {
    console.log(`  ${i+1}. ${el.tagName} - ${el.placeholder || el.textContent?.slice(0, 50)}`);
  });
};

// Helper function to run complete diagnosis
window.diagnoseFirmIssue = async function() {
  console.log('🔍 RUNNING COMPLETE FIRM PERSISTENCE DIAGNOSIS...');
  console.log('═══════════════════════════════════════════════');
  
  // 1. Test API connectivity
  console.log('1️⃣ Testing API connectivity...');
  const apiData = await window.testFirmAPI();
  
  // 2. Check frontend store
  console.log('2️⃣ Checking frontend store...');
  window.checkStoreState();
  
  // 3. Test firm creation and persistence
  console.log('3️⃣ Testing firm creation...');
  const created = await window.testFirmCreation();
  
  // 4. Check page refresh simulation
  console.log('4️⃣ Simulating refresh by forcing store reload...');
  if (typeof window.dyeingDataStore !== 'undefined') {
    try {
      await window.dyeingDataStore.forceRefresh();
      console.log('✅ Store refresh completed');
      window.checkStoreState();
    } catch (e) {
      console.error('❌ Store refresh failed:', e);
    }
  }
  
  console.log('═══════════════════════════════════════════════');
  console.log('🏁 DIAGNOSIS COMPLETE. Check logs above for issues.');
  
  return {
    apiWorking: !!apiData,
    firmCount: apiData?.data?.length || 0,
    createdFirm: !!created,
    timestamp: new Date().toISOString()
  };
};

// Auto-run basic checks
console.log('🚀 Auto-running basic checks...');
setTimeout(() => {
  window.diagnoseFirmIssue();
}, 1000);

console.log('✅ Debug tool loaded! Available functions:');
console.log('  - testFirmAPI() - Test API connectivity');
console.log('  - testFirmCreation(name?) - Test creating a firm');  
console.log('  - checkStoreState() - Check frontend store state');
console.log('  - diagnoseFirmIssue() - Run complete diagnosis');
