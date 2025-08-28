// Direct API test script
console.log('🔍 Testing Count Products API directly...');

async function testDirectAPI() {
  try {
    // Test the count products API endpoint directly
    const response = await fetch('http://localhost:5000/api/count-products');
    
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response Data:', data);
      console.log('📊 Number of records:', data.length);
      
      // Check each record for customer names
      data.forEach((item, index) => {
        console.log(`Record ${index + 1}:`, {
          id: item.id,
          customerName: item.customerName,
          dyeingFirm: item.dyeingFirm,
          hasCustomerName: !!item.customerName
        });
      });
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('🚨 Network Error:', error);
  }
}

// Run the test
testDirectAPI();
