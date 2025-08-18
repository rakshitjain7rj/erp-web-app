// Debug helper for Count Product Overview
console.log('🔍 DEBUG: Testing dyeing firms API from browser...');

// Test API availability
fetch('http://localhost:5000/api/dyeing-firms')
  .then(response => {
    console.log('✅ API Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📊 Current firms in database:', data);
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });

// Test creating a firm
const testFirmName = 'Test Browser Firm ' + Date.now();
fetch('http://localhost:5000/api/dyeing-firms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: testFirmName })
})
  .then(response => {
    console.log('✅ Create Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('🆕 Created firm:', data);
    // Test fetching again to confirm persistence
    return fetch('http://localhost:5000/api/dyeing-firms');
  })
  .then(response => response.json())
  .then(data => {
    console.log('📊 Updated firms list:', data);
    const createdFirm = data.data.find(f => f.name === testFirmName);
    if (createdFirm) {
      console.log('✅ PERSISTENCE TEST PASSED: Firm survived API round-trip');
    } else {
      console.log('❌ PERSISTENCE TEST FAILED: Firm not found after creation');
    }
  })
  .catch(error => {
    console.error('❌ Create Error:', error);
  });
