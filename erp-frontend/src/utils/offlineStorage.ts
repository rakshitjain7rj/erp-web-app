// IndexedDB wrapper for offline data storage
export interface OfflineData {
  id: string;
  type: 'party' | 'inventory' | 'dyeing-order' | 'count-product';
  data: any;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
  synced: boolean;
}

class OfflineStorageManager {
  private dbName = 'ASU_ERP_Offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('🚨 IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for different data types
        if (!db.objectStoreNames.contains('parties')) {
          const partiesStore = db.createObjectStore('parties', { keyPath: 'id' });
          partiesStore.createIndex('timestamp', 'timestamp', { unique: false });
          partiesStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('inventory')) {
          const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
          inventoryStore.createIndex('timestamp', 'timestamp', { unique: false });
          inventoryStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('dyeing-orders')) {
          const dyeingStore = db.createObjectStore('dyeing-orders', { keyPath: 'id' });
          dyeingStore.createIndex('timestamp', 'timestamp', { unique: false });
          dyeingStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('count-products')) {
          const countStore = db.createObjectStore('count-products', { keyPath: 'id' });
          countStore.createIndex('timestamp', 'timestamp', { unique: false });
          countStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('cached-data')) {
          const cacheStore = db.createObjectStore('cached-data', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('🔧 IndexedDB upgraded successfully');
      };
    });
  }

  async storeOfflineAction(data: Omit<OfflineData, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `${data.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineData: OfflineData = {
      id,
      ...data,
      timestamp: Date.now(),
      synced: false
    };

    const storeName = this.getStoreName(data.type);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(offlineData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`💾 Stored offline ${data.type} action:`, data.action);
        resolve(id);
      };
    });
  }

  async getOfflineActions(type?: OfflineData['type']): Promise<OfflineData[]> {
    if (!this.db) throw new Error('Database not initialized');

    if (type) {
      return this.getActionsForType(type);
    }

    // Get all unsynced actions from all stores
    const allActions: OfflineData[] = [];
    const types: OfflineData['type'][] = ['party', 'inventory', 'dyeing-order', 'count-product'];

    for (const actionType of types) {
      const actions = await this.getActionsForType(actionType);
      allActions.push(...actions);
    }

    return allActions.sort((a, b) => a.timestamp - b.timestamp);
  }

  private async getActionsForType(type: OfflineData['type']): Promise<OfflineData[]> {
    const storeName = this.getStoreName(type);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll(); // Get all items

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Filter unsynced items in JavaScript since boolean isn't a valid IndexedDB key
        const allItems = request.result || [];
        const unsyncedItems = allItems.filter(item => item.synced === false);
        resolve(unsyncedItems);
      };
    });
  }

  async markAsSynced(id: string, type: OfflineData['type']): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const storeName = this.getStoreName(type);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => {
            console.log(`✅ Marked ${type} as synced:`, id);
            resolve();
          };
        } else {
          resolve(); // Data not found, consider it synced
        }
      };
    });
  }

  async removeOfflineAction(id: string, type: OfflineData['type']): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const storeName = this.getStoreName(type);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`🗑️ Removed offline ${type} action:`, id);
        resolve();
      };
    });
  }

  async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cacheData = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || (24 * 60 * 60 * 1000) // Default 24 hours
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-data'], 'readwrite');
      const store = transaction.objectStore('cached-data');
      const request = store.put(cacheData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`💾 Cached data:`, key);
        resolve();
      };
    });
  }

  async getCachedData(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-data'], 'readonly');
      const store = transaction.objectStore('cached-data');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if data is still valid
          const now = Date.now();
          if (now - result.timestamp < result.ttl) {
            console.log(`📦 Retrieved cached data:`, key);
            resolve(result.data);
          } else {
            console.log(`⏰ Cached data expired:`, key);
            // Remove expired data
            this.removeCachedData(key);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
    });
  }

  async removeCachedData(key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-data'], 'readwrite');
      const store = transaction.objectStore('cached-data');
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-data'], 'readwrite');
      const store = transaction.objectStore('cached-data');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const now = Date.now();
        const expired = request.result.filter(item => 
          now - item.timestamp >= item.ttl
        );

        if (expired.length > 0) {
          const deletePromises = expired.map(item => 
            this.removeCachedData(item.key)
          );
          
          Promise.all(deletePromises).then(() => {
            console.log(`🧹 Cleaned up ${expired.length} expired cache entries`);
            resolve();
          }).catch(reject);
        } else {
          resolve();
        }
      };
    });
  }

  private getStoreName(type: OfflineData['type']): string {
    switch (type) {
      case 'party': return 'parties';
      case 'inventory': return 'inventory';
      case 'dyeing-order': return 'dyeing-orders';
      case 'count-product': return 'count-products';
      default: throw new Error(`Unknown type: ${type}`);
    }
  }

  async getStorageInfo(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const info: any = {};
    const types: OfflineData['type'][] = ['party', 'inventory', 'dyeing-order', 'count-product'];

    for (const type of types) {
      const actions = await this.getActionsForType(type);
      info[type] = {
        total: actions.length,
        unsynced: actions.filter(a => !a.synced).length
      };
    }

    return info;
  }
}

// Singleton instance
let offlineManager: OfflineStorageManager | null = null;

export async function getOfflineManager(): Promise<OfflineStorageManager> {
  if (!offlineManager) {
    offlineManager = new OfflineStorageManager();
    await offlineManager.init();
  }
  return offlineManager;
}

// High-level helper functions
export async function storeOfflineAction(
  type: OfflineData['type'],
  action: OfflineData['action'],
  data: any
): Promise<string> {
  const manager = await getOfflineManager();
  return manager.storeOfflineAction({ type, action, data });
}

export async function syncOfflineActions(): Promise<void> {
  const manager = await getOfflineManager();
  const actions = await manager.getOfflineActions();

  console.log(`🔄 Syncing ${actions.length} offline actions...`);

  for (const action of actions) {
    try {
      await syncSingleAction(action);
      await manager.markAsSynced(action.id, action.type);
    } catch (error) {
      console.error(`🚨 Failed to sync action ${action.id}:`, error);
      // Continue with other actions
    }
  }
}

async function syncSingleAction(action: OfflineData): Promise<void> {
  const endpoint = getApiEndpoint(action.type);
  let url = endpoint;
  let method = 'POST';

  switch (action.action) {
    case 'create':
      method = 'POST';
      break;
    case 'update':
      method = 'PUT';
      url = `${endpoint}/${action.data.id || action.data._id}`;
      break;
    case 'delete':
      method = 'DELETE';
      url = `${endpoint}/${action.data.id || action.data._id}`;
      break;
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    },
    body: action.action !== 'delete' ? JSON.stringify(action.data) : undefined
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

function getApiEndpoint(type: OfflineData['type']): string {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  switch (type) {
    case 'party': return `${baseUrl}/parties`;
    case 'inventory': return `${baseUrl}/inventory`;
    case 'dyeing-order': return `${baseUrl}/dyeing`;
    case 'count-product': return `${baseUrl}/count-products`;
    default: throw new Error(`Unknown type: ${type}`);
  }
}

export async function cacheApiData(key: string, data: any, ttlHours: number = 24): Promise<void> {
  const manager = await getOfflineManager();
  await manager.cacheData(key, data, ttlHours * 60 * 60 * 1000);
}

export async function getCachedApiData(key: string): Promise<any> {
  const manager = await getOfflineManager();
  return manager.getCachedData(key);
}

export async function getOfflineStorageInfo(): Promise<any> {
  const manager = await getOfflineManager();
  return manager.getStorageInfo();
}
