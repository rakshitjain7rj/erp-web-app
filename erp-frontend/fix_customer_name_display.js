// This fix ensures all DyeingRecords have a customerName field
// Add this to the dyeingDataStore.ts file's loadRecords method

async loadRecords(force: boolean = true) {
  if (this.state.loadingRecords && !force) return;
  this.state.loadingRecords = true;
  try {
    const recs = await getAllDyeingRecords();
    // Ensure each record has a customerName property
    const processedRecs = Array.isArray(recs) ? recs.map(record => ({
      ...record,
      // Set customerName if not present, using a distinct value different from partyName
      customerName: record.customerName || `Customer: ${record.partyName || 'Unknown'}`
    })) : [];
    
    this.state.dyeingRecords = processedRecs;
    this.state.recordVersion = Date.now();
    this.emitRecords();
  } catch (error) {
    console.warn('Failed to load records from API:', error);
    // Keep existing records on error
  } finally {
    this.state.loadingRecords = false;
  }
}

// Add this to the DyeingOrders.tsx file's fetchCountProducts function:

// Process and verify data integrity for each product
const processedProducts = products.map(product => {
  // Always ensure customer name is distinct and valid
  if (!product.customerName || product.customerName === product.partyName) {
    console.warn('⚠️ [DyeingOrders] Found product with missing or duplicate customer name:', product.id);
    
    // Always ensure customer name is distinct from party name with a clear label
    return {
      ...product,
      customerName: `Customer: ${product.id} (${product.partyName})` // Make it clearly different
    };
  }
  return product;
});
