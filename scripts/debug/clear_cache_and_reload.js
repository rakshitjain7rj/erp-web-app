// Clear all localStorage data to force fresh data fetch with fixes
console.log('🔥 CLEARING ALL CACHED DATA TO APPLY CUSTOMER NAME FIXES');

// Clear all dyeing-related cache
localStorage.removeItem('countProducts');
localStorage.removeItem('countProductsTimestamp');
localStorage.removeItem('dyeing_firms_version');
localStorage.removeItem('dyeing_records_version');
localStorage.removeItem('dyeingFirms');
localStorage.removeItem('dyeingRecords');

// Clear any other related cache
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('dyeing') || key.includes('count') || key.includes('customer'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log('🗑️ Removed cached data:', key);
});

console.log('✅ CACHE CLEARED - Please refresh the page to see the fixes');
console.log('🎯 The customer name issue should now be completely resolved!');

// Also trigger a page reload if this is run in the browser console
if (typeof window !== 'undefined') {
  window.location.reload();
}
