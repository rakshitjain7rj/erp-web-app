// Direct Customer Name Fix Script
// This script bypasses React and directly fetches and displays customer names

console.log('🔥 DIRECT CUSTOMER NAME FIX SCRIPT LOADED');

// Function to load customer names directly
async function loadCustomerNamesDirect() {
  console.log('🎯 Starting direct customer name load...');
  
  try {
    const response = await fetch('http://localhost:5000/api/count-products');
    console.log('📡 Direct API response:', response.status, response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Data received:', data);
      
      if (data.success && data.data) {
        console.log('📋 Count Products found:', data.data.length);
        
        // Log customer names
        data.data.forEach((product, index) => {
          console.log(`🏷️ Product ${index + 1}: ID=${product.id}, Customer="${product.customerName}", Party="${product.partyName}"`);
        });
        
        // Find customer name cells and update them
        updateCustomerNameCells(data.data);
        
        return data.data;
      }
    } else {
      console.error('❌ API call failed:', response.status);
    }
  } catch (error) {
    console.error('🚨 Error loading customer names:', error);
  }
}

// Function to update customer name cells in the DOM
function updateCustomerNameCells(products) {
  console.log('🔄 Attempting to update customer name cells in DOM...');
  
  // Look for table cells containing [No Customer Name]
  const cells = document.querySelectorAll('td');
  let updatedCount = 0;
  
  cells.forEach((cell, index) => {
    if (cell.textContent && cell.textContent.includes('[No Customer Name]')) {
      console.log(`🎯 Found empty customer name cell at index ${index}`);
      
      // Try to find a matching product by looking at nearby cells
      const row = cell.closest('tr');
      if (row) {
        const rowCells = row.querySelectorAll('td');
        console.log(`📊 Row has ${rowCells.length} cells`);
        
        // Look for quantity or other identifying information
        const quantityCell = rowCells[0]; // Quantity is usually first column
        if (quantityCell && quantityCell.textContent) {
          const quantityText = quantityCell.textContent.trim();
          console.log(`🔍 Looking for quantity: "${quantityText}"`);
          
          // Find matching product
          const matchingProduct = products.find(product => {
            const productQty = product.quantity?.toString();
            return quantityText.includes(productQty) || productQty?.includes(quantityText.replace(/[^\d.]/g, ''));
          });
          
          if (matchingProduct && matchingProduct.customerName) {
            console.log(`✅ Found matching product: ID=${matchingProduct.id}, Customer="${matchingProduct.customerName}"`);
            cell.textContent = matchingProduct.customerName;
            cell.style.backgroundColor = '#dcfce7'; // Light green background to indicate fix
            cell.style.fontWeight = 'bold';
            updatedCount++;
          }
        }
      }
    }
  });
  
  console.log(`🎉 Updated ${updatedCount} customer name cells`);
  
  if (updatedCount === 0) {
    console.log('⚠️ No customer name cells found to update. The page might not be fully loaded yet.');
    
    // Try again after a delay
    setTimeout(() => {
      console.log('🔄 Retrying customer name update...');
      updateCustomerNameCells(products);
    }, 2000);
  }
}

// Run the fix
console.log('🚀 Starting customer name fix...');
loadCustomerNamesDirect();

// Also set up a periodic check
setInterval(() => {
  console.log('🔄 Periodic customer name check...');
  const hasEmptyNames = document.body.textContent.includes('[No Customer Name]');
  if (hasEmptyNames) {
    console.log('🎯 Found empty customer names, reloading...');
    loadCustomerNamesDirect();
  }
}, 5000);

console.log('✅ Customer name fix script initialized');
