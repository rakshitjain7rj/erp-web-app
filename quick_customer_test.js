// Quick test to verify customer names are working
console.log('🧪 CUSTOMER NAME QUICK TEST');

// Test API endpoint directly
fetch('/api/count-products')
  .then(response => response.json())
  .then(data => {
    console.log(`✅ Found ${data.length} count products`);
    
    if (data.length > 0) {
      console.log('\n📋 CUSTOMER NAME ANALYSIS:');
      
      data.slice(0, 10).forEach((product, index) => {
        const customerName = product.customerName || 'MISSING';
        const partyName = product.partyName || 'MISSING';
        
        console.log(`${index + 1}. Customer: "${customerName}" | Party: "${partyName}"`);
        
        // Check for issues
        if (customerName === partyName) {
          console.log(`   ❌ ISSUE: Customer name equals party name`);
        } else if (customerName.match(/^Customer_\d+$/)) {
          console.log(`   ❌ ISSUE: Generated customer name detected`);
        } else if (customerName === 'MISSING' || customerName === '') {
          console.log(`   ❌ ISSUE: Missing customer name`);
        } else {
          console.log(`   ✅ VALID: Distinct customer name`);
        }
      });
    }
    
    console.log('\n🎯 If you see any ❌ ISSUE markers, customer names need more fixes');
    console.log('🎯 If all show ✅ VALID, customer names are working correctly');
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });
