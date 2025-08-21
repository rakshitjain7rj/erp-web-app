// Browser console test
console.log('🧪 Testing Count Products API from Browser...');

async function testFromBrowser() {
  try {
    console.log('📡 Making fetch request to backend...');
    const response = await fetch('http://localhost:5000/api/count-products');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    if (response.ok) {
      const json = await response.json();
      console.log('✅ Raw API response:', json);
      
      if (json.success && json.data) {
        const products = json.data;
        console.log('📦 Products found:', products.length);
        
        products.forEach((product, index) => {
          console.log(`🏷️ Product ${index + 1}:`, {
            id: product.id,
            customerName: product.customerName,
            hasCustomerName: !!product.customerName,
            customerNameLength: product.customerName ? product.customerName.length : 0,
            partyName: product.partyName,
            dyeingFirm: product.dyeingFirm
          });
        });
        
        // Test the mapping function manually
        console.log('\n🔄 Testing manual mapping...');
        const mapped = products.map(product => ({
          id: product.id,
          customerName: product.customerName,
          partyName: product.partyName,
          type: 'countProduct'
        }));
        console.log('🎯 Mapped results:', mapped);
        
      } else {
        console.error('❌ API response format unexpected:', json);
      }
    } else {
      console.error('❌ API request failed:', response.status);
    }
  } catch (error) {
    console.error('🚨 Fetch error:', error);
  }
}

// Run the test
testFromBrowser();

// Also test localStorage
console.log('\n💾 Checking localStorage...');
const cached = localStorage.getItem('countProducts');
if (cached) {
  try {
    const parsed = JSON.parse(cached);
    console.log('📦 Cached products:', parsed.length);
    parsed.forEach((product, index) => {
      console.log(`💾 Cached Product ${index + 1}:`, {
        id: product.id,
        customerName: product.customerName,
        hasCustomerName: !!product.customerName
      });
    });
  } catch (e) {
    console.error('❌ Failed to parse cached data:', e);
  }
} else {
  console.log('📦 No cached products found');
}
