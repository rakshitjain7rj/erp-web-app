// Test script to check localStorage persistence
console.log('🧪 Testing localStorage persistence...');

// Simulate creating a product
const testProduct = {
  id: Date.now(),
  customerName: "Test Customer",
  dyeingFirm: "Test Firm",
  partyName: "Test Party",
  yarnType: "Cotton",
  count: "30s",
  shade: "Red",
  quantity: 100,
  qualityGrade: "A",
  lotNumber: `LOT-${Date.now()}`,
  completedDate: new Date().toISOString().split('T')[0],
  sentToDye: true,
  sentDate: new Date().toISOString().split('T')[0],
  received: false,
  dispatch: false,
  middleman: "Direct Supply",
  processedBy: "System"
};

// Save to localStorage
const existingProducts = JSON.parse(localStorage.getItem('countProducts') || '[]');
const updatedProducts = [testProduct, ...existingProducts];
localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());

console.log('✅ Test product saved to localStorage');
console.log('📦 Total products in localStorage:', updatedProducts.length);
console.log('🆔 Test product ID:', testProduct.id);

// Check if it can be retrieved
const retrieved = JSON.parse(localStorage.getItem('countProducts') || '[]');
const foundProduct = retrieved.find(p => p.id === testProduct.id);

if (foundProduct) {
  console.log('✅ Test product successfully retrieved from localStorage');
  console.log('📝 Product details:', {
    customerName: foundProduct.customerName,
    dyeingFirm: foundProduct.dyeingFirm,
    quantity: foundProduct.quantity
  });
} else {
  console.error('❌ Test product NOT found in localStorage');
}

// Test refresh scenario
console.log('🔄 Simulating page refresh...');
const afterRefresh = JSON.parse(localStorage.getItem('countProducts') || '[]');
console.log('📊 Products after simulated refresh:', afterRefresh.length);

if (afterRefresh.length > 0) {
  console.log('✅ LocalStorage persistence working correctly');
} else {
  console.error('❌ LocalStorage persistence FAILED - no products found after refresh');
}
