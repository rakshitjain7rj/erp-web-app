// Simple test to check API functionality
console.log('🧪 Starting API validation test...');

async function testDyeingFirmAPI() {
  try {
    console.log('🌐 Testing dyeing firms API...');
    
    // Test 1: Get all dyeing firms
    const response = await fetch('http://localhost:5000/api/dyeing-firms', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const firms = await response.json();
    console.log('✅ API Response:', {
      status: response.status,
      firmsCount: firms.length,
      firms: firms.map(f => ({ id: f.id, name: f.name }))
    });
    
    // Test 2: Create a new test firm
    const testFirmName = `Test Firm ${Date.now()}`;
    console.log(`🆕 Creating test firm: ${testFirmName}`);
    
    const createResponse = await fetch('http://localhost:5000/api/dyeing-firms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: testFirmName
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Create firm failed: ${createResponse.status} ${createResponse.statusText}`);
    }
    
    const newFirm = await createResponse.json();
    console.log('✅ Created firm:', newFirm);
    
    console.log('🎉 All API tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

// Run the test
testDyeingFirmAPI().then(success => {
  if (success) {
    console.log('✅ API validation complete - All systems working!');
  } else {
    console.log('❌ API validation failed - Check server connectivity');
  }
});
