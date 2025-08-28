// CONSOLE CUSTOMER NAME FIX SCRIPT
// Copy and paste this into your browser console while on the dyeing orders page

console.log('🔥 STARTING CUSTOMER NAME FIX...');

// Function to load and inject customer names
async function fixCustomerNamesNow() {
  try {
    console.log('📡 Testing API connection...');
    const response = await fetch('http://localhost:5000/api/count-products');
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    
    if (data.success && data.data && Array.isArray(data.data)) {
      const products = data.data;
      console.log(`🎯 Found ${products.length} products with customer names:`);
      
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ID=${product.id}, Customer="${product.customerName}", Party="${product.partyName}"`);
      });
      
      // Find and replace [No Customer Name] elements
      let replacements = 0;
      
      // Method 1: Text content replacement
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.includes('[No Customer Name]')) {
          const parentCell = node.parentElement;
          const row = parentCell?.closest('tr');
          
          if (row) {
            // Try to match by row position
            const rowIndex = Array.from(row.parentNode.children).indexOf(row) - 1; // -1 for header
            
            if (rowIndex >= 0 && rowIndex < products.length) {
              const product = products[rowIndex];
              if (product.customerName) {
                node.textContent = product.customerName;
                parentCell.style.backgroundColor = '#dcfce7';
                parentCell.style.fontWeight = 'bold';
                console.log(`✅ Fixed row ${rowIndex + 1}: "${product.customerName}"`);
                replacements++;
              }
            }
          }
        }
      }
      
      // Method 2: Direct table cell search
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        const dataRows = Array.from(table.querySelectorAll('tr')).slice(1); // Skip header
        
        dataRows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll('td');
          
          cells.forEach(cell => {
            if (cell.textContent && cell.textContent.includes('[No Customer Name]')) {
              if (rowIndex < products.length) {
                const product = products[rowIndex];
                if (product.customerName) {
                  cell.textContent = product.customerName;
                  cell.style.backgroundColor = '#dcfce7';
                  cell.style.fontWeight = 'bold';
                  console.log(`✅ Table fix row ${rowIndex + 1}: "${product.customerName}"`);
                  replacements++;
                }
              }
            }
          });
        });
      });
      
      console.log(`🎉 Successfully fixed ${replacements} customer name entries!`);
      
      if (replacements === 0) {
        console.log('⚠️ No [No Customer Name] entries found to replace. The page might already be fixed or not fully loaded.');
        
        // Show available customer names for reference
        console.log('📋 Available customer names from API:');
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. "${product.customerName}"`);
        });
      }
      
      return replacements;
      
    } else {
      console.error('❌ Invalid API response format');
      return 0;
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return 0;
  }
}

// Run the fix
fixCustomerNamesNow().then(count => {
  if (count > 0) {
    console.log(`🎊 CUSTOMER NAME FIX COMPLETE! Fixed ${count} entries.`);
  } else {
    console.log('🔍 No fixes applied. Check if the page has loaded completely.');
  }
});

console.log('✅ Customer name fix script loaded. Check results above.');
console.log('💡 You can run fixCustomerNamesNow() again if needed.');
