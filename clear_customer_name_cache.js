// Clear all localStorage to force fresh data with proper customer names
console.log('🔥 CLEARING CACHE FOR CUSTOMER NAME FIX');

// Clear all cached data
localStorage.removeItem('countProducts');
localStorage.removeItem('countProductsTimestamp');
localStorage.removeItem('dyeing_firms_version');
localStorage.removeItem('dyeing_records_version');
localStorage.removeItem('dyeingFirms');
localStorage.removeItem('dyeingRecords');

console.log('✅ CACHE CLEARED');
console.log('🎯 Customer names will now show EXACTLY what the user entered in the form');

// Force reload
if (typeof window !== 'undefined') {
  window.location.reload();
}
