// Quick Test Script for Firm Synchronization
// Run this in the browser console to test sync

console.log('🧪 Testing firm synchronization...');

// Import the sync manager
import { syncDyeingFirms } from './src/utils/dyeingFirmsSync.js';

// Create a test firm
const testFirm = {
  id: 999,
  name: 'Test Sync Firm',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

console.log('📡 Sending test firm sync notification...');
syncDyeingFirms.notifyFirmAdded(testFirm, 'count-product-overview');

console.log('✅ Test notification sent. Check console for sync events.');
