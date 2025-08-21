// Centralized dyeing firms + dyeing records store with cross-tab sync
import { getAllDyeingFirms, createDyeingFirm, updateDyeingFirm, DyeingFirm } from "../api/dyeingFirmApi";
import { getAllDyeingRecords, createDyeingRecord, updateDyeingRecord } from "../api/dyeingApi";
import { DyeingRecord } from "../types/dyeing";

type SyncMessage =
  | { type: "FIRMS_CHANGED"; version: number }
  | { type: "RECORDS_CHANGED"; version: number };

interface InternalState {
  firms: DyeingFirm[];
  dyeingRecords: DyeingRecord[];
  loadingFirms: boolean;
  loadingRecords: boolean;
  firmVersion: number;
  recordVersion: number;
}

type FirmsSubscriber = (firms: DyeingFirm[]) => void;
type RecordsSubscriber = (records: DyeingRecord[]) => void;

class DyeingDataStore {
  private state: InternalState = {
    firms: [],
    dyeingRecords: [],
    loadingFirms: false,
    loadingRecords: false,
    firmVersion: 0,
    recordVersion: 0,
  };

  private firmSubscribers = new Set<FirmsSubscriber>();
  private recordSubscribers = new Set<RecordsSubscriber>();
  private bc: BroadcastChannel | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private FIRMS_KEY = "dyeing_firms_version";
  private RECORDS_KEY = "dyeing_records_version";
  private CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private CACHE_TIMESTAMP_KEY = "dyeing_data_cache_timestamp";

  // Method to check if cache is still valid (within 24 hours)
  private isCacheValid(): boolean {
    const lastCache = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);
    if (!lastCache) return false;
    
    const cacheTime = parseInt(lastCache);
    const now = Date.now();
    const isValid = (now - cacheTime) < this.CACHE_DURATION;
    
    console.log(`📅 Cache validity check: ${isValid ? 'VALID' : 'EXPIRED'} (age: ${Math.round((now - cacheTime) / 1000 / 60)} minutes)`);
    return isValid;
  }

  // Method to update cache timestamp
  private updateCacheTimestamp(): void {
    localStorage.setItem(this.CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('🕒 Cache timestamp updated');
  }

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.initialized) return Promise.resolve();

    this.initPromise = this.performInit();
    return this.initPromise;
  }

  private async performInit() {
    if (this.initialized) return;
    
    console.log('🔧 [Store] Starting initialization...');
    this.initialized = true;

    // BroadcastChannel
    try {
      this.bc = new BroadcastChannel("dyeing-sync");
      this.bc.onmessage = (ev) => this.handleRemoteMessage(ev.data as SyncMessage);
      console.log('✅ [Store] BroadcastChannel initialized');
    } catch (err) {
      console.warn('⚠️ [Store] BroadcastChannel failed:', err);
      this.bc = null;
    }

    // storage events
    window.addEventListener("storage", (e) => {
      if (e.key === this.FIRMS_KEY) {
        const incoming = Number(e.newValue || 0);
        if (incoming > this.state.firmVersion) this.loadFirms(false);
      }
      if (e.key === this.RECORDS_KEY) {
        const incoming = Number(e.newValue || 0);
        if (incoming > this.state.recordVersion) this.loadRecords(false);
      }
      
      // Handle force sync events
      if (e.key === 'dyeing-firms-force-sync' && e.newValue) {
        console.log('🔄 [Store] Force sync event detected, reloading firms...');
        this.loadFirms(true);
      }
    });

    // Smart initial load - only force if cache is expired
    console.log('🔧 [Store] Performing smart initial data load...');
    const shouldForceLoad = !this.isCacheValid();
    console.log(`📊 Initial load strategy: ${shouldForceLoad ? 'FORCE (cache expired)' : 'CACHED (cache valid)'}`);
    
    try {
      await Promise.all([
        this.loadFirms(shouldForceLoad),
        this.loadRecords(shouldForceLoad)
      ]);
      console.log('✅ [Store] Initial data load complete');
    } catch (err) {
      console.error('❌ [Store] Initial data load failed:', err);
    }
    
    // Set up periodic sync check (every 30 seconds instead of 5 to prevent rate limiting)
    setInterval(() => {
      this.checkForRemoteUpdates();
    }, 30000);
    
    console.log('✅ [Store] Initialization complete');
  }
  
  private checkForRemoteUpdates() {
    const storedFirmVersion = Number(localStorage.getItem(this.FIRMS_KEY) || 0);
    const storedRecordVersion = Number(localStorage.getItem(this.RECORDS_KEY) || 0);
    
    if (storedFirmVersion > this.state.firmVersion) {
      console.log('🔄 [Store] Detected remote firm update, syncing...');
      this.loadFirms(false);
    }
    
    if (storedRecordVersion > this.state.recordVersion) {
      console.log('🔄 [Store] Detected remote record update, syncing...');
      this.loadRecords(false);
    }
  }

  // ====================== GETTERS ======================
  getFirms() {
    return this.state.firms;
  }
  
  getRecords() {
    return this.state.dyeingRecords;
  }
  
  getFirmsWithRecords() {
    const firmsWith = new Set(
      this.state.dyeingRecords
        .filter(r => !!r.dyeingFirm)
        .map(r => r.dyeingFirm.toLowerCase())
    );
    return this.state.firms.filter(f => firmsWith.has(f.name.toLowerCase()));
  }

  isLoadingFirms() {
    return this.state.loadingFirms;
  }

  isLoadingRecords() {
    return this.state.loadingRecords;
  }

  // ====================== FORCE REFRESH ======================
  async forceRefresh() {
    console.log('🔄 [Store] Force refresh requested');
    await Promise.all([
      this.loadFirms(true),
      this.loadRecords(true)
    ]);
    console.log('✅ [Store] Force refresh completed');
  }

  // ====================== SUBSCRIPTIONS ======================
  async subscribeFirms(cb: FirmsSubscriber) {
    // Ensure store is initialized before subscribing
    await this.init();
    
    // Add multiple DOM safety checks
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('⚠️ [Store] Window/document not available, skipping subscription');
      return () => {};
    }
    
    // Wait for both DOM and React to be ready
    await new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        const onReady = () => {
          document.removeEventListener('DOMContentLoaded', onReady);
          window.removeEventListener('load', onReady);
          resolve();
        };
        document.addEventListener('DOMContentLoaded', onReady);
        window.addEventListener('load', onReady);
      }
    });
    
    // Additional delay to ensure React components are mounted
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ [Store] Adding firm subscriber (DOM ready)');
    this.firmSubscribers.add(cb);
    
    // Safe callback execution with error boundary
    const safeCallback = (firms: DyeingFirm[]) => {
      try {
        if (typeof cb === 'function') {
          cb(firms);
        }
      } catch (error) {
        console.error('❌ [Store] Error in firm subscriber callback:', error);
      }
    };
    
    // Replace the original callback with the safe one
    this.firmSubscribers.delete(cb);
    this.firmSubscribers.add(safeCallback);
    
    // Use requestAnimationFrame for safe initial call
    requestAnimationFrame(() => {
      try {
        console.log('📡 [Store] Calling initial firm callback with', this.state.firms.length, 'firms');
        safeCallback(this.state.firms);
      } catch (error) {
        console.error('❌ [Store] Error in initial firm callback:', error);
      }
    });
    
    return () => {
      console.log('🗑️ [Store] Removing firm subscriber');
      this.firmSubscribers.delete(safeCallback);
    };
  }
  
  async subscribeRecords(cb: RecordsSubscriber) {
    // Ensure store is initialized before subscribing
    await this.init();
    
    // Add multiple DOM safety checks
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('⚠️ [Store] Window/document not available, skipping subscription');
      return () => {};
    }
    
    // Wait for both DOM and React to be ready
    await new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        const onReady = () => {
          document.removeEventListener('DOMContentLoaded', onReady);
          window.removeEventListener('load', onReady);
          resolve();
        };
        document.addEventListener('DOMContentLoaded', onReady);
        window.addEventListener('load', onReady);
      }
    });
    
    // Additional delay to ensure React components are mounted
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ [Store] Adding record subscriber (DOM ready)');
    this.recordSubscribers.add(cb);
    
    // Safe callback execution with error boundary
    const safeCallback = (records: DyeingRecord[]) => {
      try {
        if (typeof cb === 'function') {
          cb(records);
        }
      } catch (error) {
        console.error('❌ [Store] Error in record subscriber callback:', error);
      }
    };
    
    // Replace the original callback with the safe one
    this.recordSubscribers.delete(cb);
    this.recordSubscribers.add(safeCallback);
    
    // Use requestAnimationFrame for safe initial call
    requestAnimationFrame(() => {
      try {
        console.log('📡 [Store] Calling initial record callback with', this.state.dyeingRecords.length, 'records');
        safeCallback(this.state.dyeingRecords);
      } catch (error) {
        console.error('❌ [Store] Error in initial record callback:', error);
      }
    });
    
    return () => {
      console.log('🗑️ [Store] Removing record subscriber');
      this.recordSubscribers.delete(safeCallback);
    };
  }

  private emitFirms() {
    try {
      console.log('📡 [Store] Emitting to', this.firmSubscribers.size, 'firm subscribers');
      this.firmSubscribers.forEach(cb => {
        try {
          cb(this.state.firms);
        } catch (error) {
          console.error('❌ [Store] Error in firm subscriber callback:', error);
        }
      });
    } catch (error) {
      console.error('❌ [Store] Error emitting firms:', error);
    }
  }
  
  private emitRecords() {
    try {
      console.log('📡 [Store] Emitting to', this.recordSubscribers.size, 'record subscribers');
      this.recordSubscribers.forEach(cb => {
        try {
          cb(this.state.dyeingRecords);
        } catch (error) {
          console.error('❌ [Store] Error in record subscriber callback:', error);
        }
      });
    } catch (error) {
      console.error('❌ [Store] Error emitting records:', error);
    }
  }

  // ====================== REMOTE HANDLERS ======================
  private handleRemoteMessage(msg: SyncMessage) {
    console.log('📻 [Store] Received remote message:', msg);
    if (msg.type === "FIRMS_CHANGED" && msg.version > this.state.firmVersion) {
      console.log('🔄 [Store] Remote firm change detected, reloading...');
      this.loadFirms(false);
    }
    if (msg.type === "RECORDS_CHANGED" && msg.version > this.state.recordVersion) {
      console.log('🔄 [Store] Remote record change detected, reloading...');
      this.loadRecords(false);
    }
  }

  private broadcast(msg: SyncMessage) {
    console.log('📻 [Store] Broadcasting message:', msg);
    if (this.bc) {
      try { 
        this.bc.postMessage(msg);
        console.log('✅ [Store] Message broadcast via BroadcastChannel');
      } catch (e) {
        console.warn('⚠️ [Store] BroadcastChannel failed:', e);
      }
    } else {
      console.log('ℹ️ [Store] No BroadcastChannel available');
    }
    if (msg.type === "FIRMS_CHANGED") {
      localStorage.setItem(this.FIRMS_KEY, String(msg.version));
      console.log('💾 [Store] Firm version saved to localStorage:', msg.version);
    }
    if (msg.type === "RECORDS_CHANGED") {
      localStorage.setItem(this.RECORDS_KEY, String(msg.version));
      console.log('💾 [Store] Record version saved to localStorage:', msg.version);
    }
  }

  // ====================== LOADERS ======================
  async loadFirms(force: boolean = true) {
    console.log(`🔄 [Store] loadFirms called with force=${force}, currently loading=${this.state.loadingFirms}`);
    if (this.state.loadingFirms && !force) {
      console.log('⏳ [Store] Already loading firms and force=false, skipping...');
      return;
    }
    
    // Check cache validity first - only load from API if cache is expired or force is true
    if (!force && this.isCacheValid() && this.state.firms.length > 0) {
      console.log('🏢 Using cached firms - skipping API call');
      return;
    }
    
    this.state.loadingFirms = true;
    try {
      console.log('🌐 [Store] Fetching firms from API...');
      const firms = await getAllDyeingFirms();
      console.log('✅ [Store] API returned firms:', { count: firms.length, firms: Array.isArray(firms) ? firms.map(f => f.name) : 'not-array' });
      this.state.firms = Array.isArray(firms) ? firms : [];

      // Merge any locally cached optimistic firms (created while offline/API failed)
      try {
        const cached = localStorage.getItem('custom-dyeing-firms');
        if (cached) {
          const cachedNames: string[] = JSON.parse(cached);
          const existingLower = new Set(this.state.firms.map(f => f.name.toLowerCase()));
          const additions = cachedNames.filter(n => !existingLower.has(n.toLowerCase()));
          if (additions.length) {
            console.log(`🔄 [Store] Retrying ${additions.length} cached firm(s) with working API:`, additions);
            // Try to create each cached firm via API now that it's working
            for (const name of additions) {
              try {
                const created = await createDyeingFirm({ name });
                console.log(`✅ [Store] Successfully persisted cached firm to API:`, created.name);
                this.state.firms.push(created);
              } catch (err) {
                console.warn(`⚠️ [Store] Failed to persist cached firm "${name}":`, err);
                // Keep as optimistic if still failing
                const optimistic = {
                  id: Date.now() + Math.floor(Math.random() * 1000),
                  name: name,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                } as DyeingFirm;
                this.state.firms.push(optimistic);
              }
            }
            // Clear successfully processed cached names
            const remaining = cachedNames.filter(n => 
              !this.state.firms.some(f => f.name.toLowerCase() === n.toLowerCase())
            );
            if (remaining.length !== cachedNames.length) {
              localStorage.setItem('custom-dyeing-firms', JSON.stringify(remaining));
              console.log(`🧹 [Store] Cleaned up cached firms, ${remaining.length} remaining`);
            }
          }
        }
      } catch (mergeErr) {
        console.warn('⚠️ [Store] Failed merging cached firms:', mergeErr);
      }

      this.state.firmVersion = Date.now();
      this.updateCacheTimestamp(); // Update cache timestamp after successful load
      console.log('📡 [Store] Emitting firms to subscribers...');
      this.emitFirms();
      console.log('✅ [Store] Firms loaded and emitted successfully');
      
      // Debug: Log final firm state for troubleshooting
      console.log('🔍 [Store] Final firms state after loadFirms:', {
        count: this.state.firms.length,
        names: this.state.firms.map(f => f.name),
        isActive: this.state.firms.filter(f => f.isActive).length,
        cached: localStorage.getItem('custom-dyeing-firms')
      });
      
    } catch (error) {
      console.warn('❌ [Store] Failed to load firms from API:', error);
      // Fallback: load cached optimistic firm names so UI isn't empty after refresh
      try {
        const cached = localStorage.getItem('custom-dyeing-firms');
        if (cached) {
          const names: string[] = JSON.parse(cached);
          const existingLower = new Set(this.state.firms.map(f => f.name.toLowerCase()));
            const additions = names.filter(n => !existingLower.has(n.toLowerCase()));
            if (additions.length) {
              const additionObjects = additions.map(n => ({
                id: Date.now() + Math.floor(Math.random()*1000),
                name: n,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })) as DyeingFirm[];
              this.state.firms = [...this.state.firms, ...additionObjects];
              console.log('🛟 [Store] Loaded fallback cached firms after API failure:', additions);
              this.emitFirms();
            }
        }
      } catch (fallbackErr) {
        console.warn('⚠️ [Store] Failed fallback loading cached firms:', fallbackErr);
      }
    } finally {
      this.state.loadingFirms = false;
      console.log('🔄 [Store] loadFirms completed, loading state reset');
    }
  }

  async loadRecords(force: boolean = true) {
    if (this.state.loadingRecords && !force) return;
    
    // Check cache validity first - only load from API if cache is expired or force is true
    if (!force && this.isCacheValid() && this.state.dyeingRecords.length > 0) {
      console.log('📋 Using cached records - skipping API call');
      return;
    }
    
    this.state.loadingRecords = true;
    try {
      console.log('🌐 Loading records from API...');
      const recs = await getAllDyeingRecords();
      // Ensure each record has a customerName property
      const processedRecs = Array.isArray(recs) ? recs.map(record => ({
        ...record,
        // FINAL FIX: Keep the original customer name exactly as it comes from the database
        // Don't apply any fallbacks - preserve the user's input exactly
        customerName: record.customerName
      })) : [];
      
      this.state.dyeingRecords = processedRecs;
      this.state.recordVersion = Date.now();
      this.updateCacheTimestamp(); // Update cache timestamp after successful load
      this.emitRecords();
      console.log(`✅ Loaded ${processedRecs.length} records from API`);
    } catch (error) {
      console.warn('Failed to load records from API:', error);
      // Keep existing records on error
    } finally {
      this.state.loadingRecords = false;
    }
  }

  // ====================== FIRM ACTIONS ======================
  async ensureFirm(name: string): Promise<DyeingFirm> {
    const trimmed = name.trim();
    console.log(`🏢 [Store] ensureFirm called with name: "${trimmed}"`);
    if (!trimmed) throw new Error("Firm name required");
    
    // Make sure store is initialized
    await this.init();
    
    const existing = this.state.firms.find(f => f.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      console.log('✅ [Store] Firm already exists:', existing.name);
      return existing;
    }

    console.log('🆕 [Store] Creating new firm...');
    
    try {
      console.log('🌐 [Store] Creating firm via API...');
      const created = await createDyeingFirm({ name: trimmed });
      console.log('✅ [Store] Firm created via API:', created);
      
      // Add to local state immediately
      this.state.firms = [...this.state.firms, created];
      this.state.firmVersion = Date.now();
      
      console.log('📡 [Store] Emitting firm update...');
      this.emitFirms();
      
      // Broadcast to other tabs immediately
      this.broadcast({ type: "FIRMS_CHANGED", version: this.state.firmVersion });
      
      // Force reload all tabs after a short delay
      setTimeout(() => {
        console.log('🔄 [Store] Force broadcasting firm sync...');
        this.broadcast({ type: "FIRMS_CHANGED", version: Date.now() });
        
        // Also trigger a storage event for cross-tab sync
        localStorage.setItem('dyeing-firms-force-sync', Date.now().toString());
        localStorage.removeItem('dyeing-firms-force-sync');
      }, 500);
      
      return created;
      
    } catch (error) {
      console.error('❌ [Store] Failed to create firm via API:', error);
      
      // Create optimistic firm as fallback
      const optimistic: DyeingFirm = {
        id: Date.now(),
        name: trimmed,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as DyeingFirm;
      
      this.state.firms = [...this.state.firms, optimistic];
      this.emitFirms();

      // Cache name locally so it survives refresh and can be merged once API succeeds
      try {
        const cached = localStorage.getItem('custom-dyeing-firms');
        const list: string[] = cached ? JSON.parse(cached) : [];
        if (!list.map(n => n.toLowerCase()).includes(trimmed.toLowerCase())) {
          list.push(trimmed);
          localStorage.setItem('custom-dyeing-firms', JSON.stringify(list));
          console.log('💾 [Store] Cached optimistic firm name locally:', trimmed);
        }
      } catch (cacheErr) {
        console.warn('⚠️ [Store] Failed to cache optimistic firm name:', cacheErr);
      }
      
      return optimistic;
    }
  }

  async editFirm(id: number, name: string) {
    const trimmed = name.trim();
    const duplicate = this.state.firms.find(f => 
      f.name.toLowerCase() === trimmed.toLowerCase() && f.id !== id
    );
    if (duplicate) throw new Error("Firm name already exists");
    
    await updateDyeingFirm(id, { name: trimmed });
    this.state.firms = this.state.firms.map(f => 
      f.id === id ? { ...f, name: trimmed, updatedAt: new Date().toISOString() } : f
    );
    this.emitFirms();
    this.state.firmVersion = Date.now();
    this.broadcast({ type: "FIRMS_CHANGED", version: this.state.firmVersion });
  }

  // ====================== RECORD ACTIONS ======================
  async addRecord(payload: any) {
    const created = await createDyeingRecord(payload);
    this.state.dyeingRecords = [created, ...this.state.dyeingRecords];
    this.emitRecords();
    this.state.recordVersion = Date.now();
    this.broadcast({ type: "RECORDS_CHANGED", version: this.state.recordVersion });
    return created;
  }

  async updateRecord(id: number, payload: any) {
    const updated = await updateDyeingRecord(id, payload);
    this.state.dyeingRecords = this.state.dyeingRecords.map(r => 
      r.id === id ? updated : r
    );
    this.emitRecords();
    this.state.recordVersion = Date.now();
    this.broadcast({ type: "RECORDS_CHANGED", version: this.state.recordVersion });
    return updated;
  }
}

export const dyeingDataStore = new DyeingDataStore();
