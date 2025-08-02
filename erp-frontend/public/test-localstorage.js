// Quick test to verify localStorage persistence works in browser console
console.log('🧪 Testing localStorage dyeing firm persistence...');

// Function to check localStorage state
function checkLocalStorageState() {
  const savedFirms = localStorage.getItem('dyeingFirms');
  if (savedFirms) {
    try {
      const firms = JSON.parse(savedFirms);
      console.log('📋 Firms in localStorage:', firms.map(f => f.name));
      return firms;
    } catch (e) {
      console.error('Failed to parse saved firms:', e);
      return null;
    }
  } else {
    console.log('❌ No firms found in localStorage');
    return null;
  }
}

// Function to add a test firm to localStorage
function addTestFirmToLocalStorage() {
  const testFirm = {
    id: Date.now(),
    name: `Test Persistence Firm ${Date.now()}`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const existingFirms = checkLocalStorageState() || [];
  const updatedFirms = [...existingFirms, testFirm].sort((a, b) => a.name.localeCompare(b.name));
  
  localStorage.setItem('dyeingFirms', JSON.stringify(updatedFirms));
  console.log('✅ Added test firm to localStorage:', testFirm.name);
  
  return updatedFirms;
}

// Function to clear localStorage for testing
function clearLocalStorageTest() {
  localStorage.removeItem('dyeingFirms');
  console.log('🗑️ Cleared dyeing firms from localStorage');
}

// Instructions for manual testing
console.log(`
🔧 Manual Testing Instructions:
1. Run: checkLocalStorageState() - to see current saved firms
2. Run: addTestFirmToLocalStorage() - to add a test firm
3. Refresh the page (F5 or Ctrl+R)
4. Run: checkLocalStorageState() - to verify firm persisted
5. Run: clearLocalStorageTest() - to clean up when done

📝 Usage examples:
checkLocalStorageState();
addTestFirmToLocalStorage();
clearLocalStorageTest();
`);

// Make functions available globally for console testing
window.checkLocalStorageState = checkLocalStorageState;
window.addTestFirmToLocalStorage = addTestFirmToLocalStorage;
window.clearLocalStorageTest = clearLocalStorageTest;

// Show current state
console.log('📊 Current localStorage state:');
checkLocalStorageState();
