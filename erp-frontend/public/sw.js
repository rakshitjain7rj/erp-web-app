// ASU ERP Service Worker - Advanced PWA Implementation
const CACHE_NAME = 'asu-erp-v1.0.0';
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_NAME}-dynamic`;
const API_CACHE_NAME = `${CACHE_NAME}-api`;

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  // Add other critical static assets
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth',
  '/api/parties',
  '/api/inventory',
  '/api/dyeing-firms',
  '/api/count-products',
  '/api/dashboard'
];

// Network-first strategy URLs
const NETWORK_FIRST_URLS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/parties/create',
  '/api/inventory/create'
];

// Cache-first strategy for static assets
const CACHE_FIRST_URLS = [
  '/icons/',
  '/screenshots/',
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.ico'
];

self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('asu-erp-') && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Network First for critical API calls
    if (NETWORK_FIRST_URLS.some(endpoint => url.pathname.includes(endpoint))) {
      return await networkFirst(request);
    }
    
    // Strategy 2: Cache First for static assets
    if (CACHE_FIRST_URLS.some(pattern => url.pathname.includes(pattern))) {
      return await cacheFirst(request);
    }
    
    // Strategy 3: Stale While Revalidate for API data
    if (url.pathname.startsWith('/api/')) {
      return await staleWhileRevalidate(request);
    }
    
    // Strategy 4: Network First with Cache Fallback for HTML
    if (request.destination === 'document') {
      return await networkFirstWithFallback(request);
    }
    
    // Default: Network First
    return await networkFirst(request);
    
  } catch (error) {
    console.error('🚨 Service Worker: Fetch error:', error);
    return await fallbackResponse(request);
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Service Worker: Network failed, trying cache for:', request.url);
    const cacheResponse = await caches.match(request);
    
    if (cacheResponse) {
      return cacheResponse;
    }
    
    throw error;
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  const cacheResponse = await caches.match(request);
  
  if (cacheResponse) {
    return cacheResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('🚨 Service Worker: Cache first failed for:', request.url);
    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cacheResponse = await cache.match(request);
  
  // Always try to fetch fresh data in the background
  const networkPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.log('🌐 Service Worker: Background fetch failed for:', request.url);
    return null;
  });
  
  // Return cached version immediately if available
  if (cacheResponse) {
    return cacheResponse;
  }
  
  // Otherwise wait for network
  return await networkPromise;
}

// Network First with Fallback for HTML
async function networkFirstWithFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cacheResponse = await caches.match(request);
    
    if (cacheResponse) {
      return cacheResponse;
    }
    
    // Return offline page as fallback
    return await caches.match('/index.html') || await fallbackResponse(request);
  }
}

// Fallback response for when all else fails
async function fallbackResponse(request) {
  if (request.destination === 'document') {
    return await caches.match('/index.html') || new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  if (request.destination === 'image') {
    return await caches.match('/icons/icon-192x192.png') || new Response('', { status: 404 });
  }
  
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Background Sync for offline actions
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-parties') {
    event.waitUntil(syncOfflineParties());
  }
  
  if (event.tag === 'background-sync-inventory') {
    event.waitUntil(syncOfflineInventory());
  }
});

// Sync offline data when connection is restored
async function syncOfflineParties() {
  try {
    console.log('🔄 Service Worker: Syncing offline parties data...');
    
    // Get offline data from IndexedDB
    const offlineData = await getOfflineData('parties');
    
    if (offlineData && offlineData.length > 0) {
      for (const data of offlineData) {
        try {
          await fetch('/api/parties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          // Remove from offline storage after successful sync
          await removeOfflineData('parties', data.id);
        } catch (error) {
          console.error('🚨 Service Worker: Failed to sync party data:', error);
        }
      }
    }
  } catch (error) {
    console.error('🚨 Service Worker: Background sync failed:', error);
  }
}

async function syncOfflineInventory() {
  try {
    console.log('🔄 Service Worker: Syncing offline inventory data...');
    
    const offlineData = await getOfflineData('inventory');
    
    if (offlineData && offlineData.length > 0) {
      for (const data of offlineData) {
        try {
          await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          await removeOfflineData('inventory', data.id);
        } catch (error) {
          console.error('🚨 Service Worker: Failed to sync inventory data:', error);
        }
      }
    }
  } catch (error) {
    console.error('🚨 Service Worker: Background inventory sync failed:', error);
  }
}

// IndexedDB helper functions
async function getOfflineData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ASU_ERP_Offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function removeOfflineData(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ASU_ERP_Offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Push notification support
self.addEventListener('push', event => {
  console.log('📱 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from ASU ERP',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ASU ERP', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('📱 Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle message from main thread
self.addEventListener('message', event => {
  console.log('💬 Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.urls)
    );
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  return await cache.addAll(urls);
}

console.log('🚀 Service Worker: Script loaded successfully');
