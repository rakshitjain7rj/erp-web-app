// CUSTOMER NAME VALIDATION TEST
// Run this in the browser console on the dyeing orders page

console.log('🧪 STARTING CUSTOMER NAME VALIDATION TEST');

// Test 1: Check if customer names match user input
async function testCustomerNameDisplay() {
  console.log('📋 Test 1: Customer Name Display Validation');
  
  // Get all visible customer names from the table
  const customerCells = document.querySelectorAll('td:nth-child(2)'); // Assuming customer name is 2nd column
  
  if (customerCells.length === 0) {
    console.log('⚠️ No customer names found in table');
    return;
  }
  
  console.log(`✅ Found ${customerCells.length} customer name entries`);
  
  customerCells.forEach((cell, index) => {
    const customerName = cell.textContent.trim();
    console.log(`   ${index + 1}. Customer Name: "${customerName}"`);
    
    // Check if it's a generated name (like Customer_87)
    if (customerName.match(/^Customer_\d+$/)) {
      console.log(`   ❌ ISSUE: Generated customer name detected: ${customerName}`);
    } else if (customerName === '' || customerName === 'undefined' || customerName === 'null') {
      console.log(`   ❌ ISSUE: Empty or invalid customer name: ${customerName}`);
    } else {
      console.log(`   ✅ VALID: User-provided customer name: ${customerName}`);
    }
  });
}

// Test 2: Check localStorage for cached data
function testLocalStorageCleanup() {
  console.log('📋 Test 2: LocalStorage Cleanup Validation');
  
  const dyeingStore = localStorage.getItem('dyeing_data_store');
  const countProducts = localStorage.getItem('countProducts');
  
  if (!dyeingStore && !countProducts) {
    console.log('✅ LocalStorage is clean');
  } else {
    console.log('⚠️ Found cached data:');
    if (dyeingStore) console.log('   - dyeing_data_store present');
    if (countProducts) console.log('   - countProducts present');
  }
}

// Test 3: Check API response for customer names
async function testApiResponse() {
  console.log('📋 Test 3: API Response Validation');
  
  try {
    const response = await fetch('/api/count-products');
    const data = await response.json();
    
    if (data && data.length > 0) {
      console.log(`✅ API returned ${data.length} count products`);
      
      data.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. API Customer: "${item.customerName}" | Party: "${item.partyName}"`);
        
        if (item.customerName === item.partyName) {
          console.log(`   ❌ ISSUE: Customer name equals party name`);
        } else if (item.customerName && item.customerName.trim() !== '') {
          console.log(`   ✅ VALID: Distinct customer name`);
        }
      });
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 RUNNING COMPREHENSIVE CUSTOMER NAME TESTS\n');
  
  await testCustomerNameDisplay();
  console.log('');
  testLocalStorageCleanup();
  console.log('');
  await testApiResponse();
  
  console.log('\n🏁 CUSTOMER NAME VALIDATION COMPLETE');
  console.log('💡 If you see any ❌ ISSUE markers, those need to be fixed');
}

// Execute tests
runAllTests();
