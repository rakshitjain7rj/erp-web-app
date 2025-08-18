// Centralized Dyeing Firms Synchronization Utility
// This utility provides cross-page synchronization for dyeing firms data

import { DyeingFirm } from '../api/dyeingFirmApi';
import { getAllDyeingFirms } from '../api/dyeingFirmApi';

// Event types for dyeing firms synchronization
export const DYEING_FIRMS_SYNC_EVENTS = {
  FIRMS_UPDATED: 'dyeing-firms-updated',
  FIRM_ADDED: 'dyeing-firm-added',
  FIRM_EDITED: 'dyeing-firm-edited',
  FIRM_DELETED: 'dyeing-firm-deleted',
  FORCE_REFRESH: 'dyeing-firms-force-refresh'
} as const;

// Interface for sync event data
interface DyeingFirmsSyncEventData {
  firms?: DyeingFirm[];
  updatedFirm?: DyeingFirm;
  deletedFirmId?: number;
  source: 'count-product-overview' | 'dyeing-orders';
  timestamp: number;
}

// Custom event class for dyeing firms synchronization
class DyeingFirmsSyncEvent extends CustomEvent<DyeingFirmsSyncEventData> {
  constructor(type: string, data: DyeingFirmsSyncEventData) {
    super(type, { detail: data });
  }
}

// Dyeing Firms Sync Manager
export class DyeingFirmsSyncManager {
  private static instance: DyeingFirmsSyncManager;
  private listeners: Map<string, Set<(data: DyeingFirmsSyncEventData) => void>> = new Map();

  // NEW: internal canonical list + subscribers
  private currentFirms: DyeingFirm[] = [];
  private firmSubscribers: Set<(firms: DyeingFirm[]) => void> = new Set();
  private isLoadingFirms = false;
  private hasTriedInitialLoad = false;

  private constructor() {
    console.log('🔧 [DyeingFirmsSync] Initializing synchronization system...');
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
    Object.values(DYEING_FIRMS_SYNC_EVENTS).forEach(eventType => {
      window.addEventListener(eventType, this.handleCustomEvent.bind(this));
    });
    console.log('✅ [DyeingFirmsSync] Synchronization system initialized successfully');
  }

  static getInstance(): DyeingFirmsSyncManager {
    if (!DyeingFirmsSyncManager.instance) {
      DyeingFirmsSyncManager.instance = new DyeingFirmsSyncManager();
    }
    return DyeingFirmsSyncManager.instance;
  }

  // ===================== Internal Firm State Helpers =====================
  private async loadInitialFirms(source: 'count-product-overview' | 'dyeing-orders') {
    if (this.isLoadingFirms) {
      console.log(`⚠️ [DyeingFirmsSync] Already loading firms, skipping duplicate request from ${source}`);
      return;
    }
    this.isLoadingFirms = true;
    console.log(`🔄 [DyeingFirmsSync] Loading initial firms from ${source}...`);
    try {
      const firms = await getAllDyeingFirms();
      console.log(`✅ [DyeingFirmsSync] Loaded ${firms.length} firms from API:`, firms.map(f => f.name));
      this.currentFirms = firms.sort((a,b) => a.name.localeCompare(b.name));
      this.notifyFirmSubscribers();
      // Broadcast consolidated update for other tabs/pages
      this.notifyFirmsUpdated(this.currentFirms, source);
      console.log(`📡 [DyeingFirmsSync] Notified all subscribers with ${this.currentFirms.length} firms`);
    } catch (err) {
      console.warn(`⚠️ [DyeingFirmsSync] Failed to load initial firms from ${source}:`, err);
    } finally {
      this.isLoadingFirms = false;
      this.hasTriedInitialLoad = true;
    }
  }

  private ensureInitialLoad(source: 'count-product-overview' | 'dyeing-orders') {
    // CHANGED: Always try to load if we don't have current firms, regardless of hasTriedInitialLoad
    if (this.currentFirms.length === 0) {
      console.log(`🔄 [DyeingFirmsSync] No current firms, triggering initial load from ${source}`);
      this.loadInitialFirms(source);
    } else {
      console.log(`✅ [DyeingFirmsSync] Already have ${this.currentFirms.length} firms, providing immediately to ${source}`);
    }
  }

  private upsertFirmLocal(firm: DyeingFirm, shouldBroadcast: boolean, source: 'count-product-overview' | 'dyeing-orders') {
    const exists = this.currentFirms.find(f => f.id === firm.id);
    if (exists) {
      this.currentFirms = this.currentFirms.map(f => f.id === firm.id ? firm : f).sort((a,b)=>a.name.localeCompare(b.name));
    } else {
      this.currentFirms = [...this.currentFirms, firm].sort((a,b)=>a.name.localeCompare(b.name));
    }
    this.notifyFirmSubscribers();
    if (shouldBroadcast) {
      this.notifyFirmAdded(firm, source); // will also update others
      this.notifyFirmsUpdated(this.currentFirms, source);
    }
  }

  private setFirmsLocal(firms: DyeingFirm[], shouldBroadcast: boolean, source: 'count-product-overview' | 'dyeing-orders') {
    this.currentFirms = [...firms].sort((a,b)=>a.name.localeCompare(b.name));
    this.notifyFirmSubscribers();
    if (shouldBroadcast) {
      this.notifyFirmsUpdated(this.currentFirms, source);
    }
  }

  private notifyFirmSubscribers() {
    console.log(`📡 [DyeingFirmsSync] Notifying ${this.firmSubscribers.size} subscribers with ${this.currentFirms.length} firms:`, this.currentFirms.map(f => f.name));
    this.firmSubscribers.forEach(cb => {
      try { cb(this.currentFirms); } catch (e) { console.error('[DyeingFirmsSync] firm subscriber error', e); }
    });
  }

  // Public convenience subscription returning unsubscribe
  subscribeFirms(callback: (firms: DyeingFirm[]) => void, source: 'count-product-overview' | 'dyeing-orders'): () => void {
    this.ensureInitialLoad(source);
    this.firmSubscribers.add(callback);
    // Immediate push of current list (even if empty)
    callback(this.currentFirms);
    return () => { this.firmSubscribers.delete(callback); };
  }

  getCurrentFirms() { return this.currentFirms; }

  // ===================== Original Event Subscription API =====================
  subscribe(eventType: string, callback: (data: DyeingFirmsSyncEventData) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) listeners.delete(callback);
    };
  }

  // ===================== Broadcast Methods (augmented to update local state) =====================
  notifyFirmsUpdated(firms: DyeingFirm[], source: 'count-product-overview' | 'dyeing-orders'): void {
    // Update local cache first
    this.setFirmsLocal(firms, false, source);
    const data: DyeingFirmsSyncEventData = { firms, source, timestamp: Date.now() };
    localStorage.setItem('dyeing-firms-sync-data', JSON.stringify(data));
    this.dispatchEvent(DYEING_FIRMS_SYNC_EVENTS.FIRMS_UPDATED, data);
  }

  notifyFirmAdded(firm: DyeingFirm, source: 'count-product-overview' | 'dyeing-orders'): void {
    this.upsertFirmLocal(firm, false, source);
    const data: DyeingFirmsSyncEventData = { updatedFirm: firm, source, timestamp: Date.now() };
    localStorage.setItem('dyeing-firms-sync-add', JSON.stringify(data));
    this.dispatchEvent(DYEING_FIRMS_SYNC_EVENTS.FIRM_ADDED, data);
    // CRITICAL: Also refresh the complete list to ensure all pages have the latest data
    setTimeout(() => this.loadInitialFirms(source), 100);
  }

  notifyFirmEdited(firm: DyeingFirm, source: 'count-product-overview' | 'dyeing-orders'): void {
    this.upsertFirmLocal(firm, false, source);
    const data: DyeingFirmsSyncEventData = { updatedFirm: firm, source, timestamp: Date.now() };
    localStorage.setItem('dyeing-firms-sync-edit', JSON.stringify(data));
    this.dispatchEvent(DYEING_FIRMS_SYNC_EVENTS.FIRM_EDITED, data);
  }

  forceRefresh(source: 'count-product-overview' | 'dyeing-orders'): void {
    console.log(`🔄 [DyeingFirmsSync] Force refresh triggered by ${source}`);
    const data: DyeingFirmsSyncEventData = { source, timestamp: Date.now() };
    localStorage.setItem('dyeing-firms-force-refresh', JSON.stringify(data));
    this.dispatchEvent(DYEING_FIRMS_SYNC_EVENTS.FORCE_REFRESH, data);
    // CRITICAL: Immediately trigger a reload to ensure fresh data
    this.loadInitialFirms(source);
  }

  // ===================== Event Handlers =====================
  private handleStorageEvent(event: StorageEvent): void {
    if (!event.key?.startsWith('dyeing-firms-sync')) return;
    try {
      const data: DyeingFirmsSyncEventData = JSON.parse(event.newValue || '{}');
      let eventType: string | undefined;
      if (event.key === 'dyeing-firms-sync-data') eventType = DYEING_FIRMS_SYNC_EVENTS.FIRMS_UPDATED;
      else if (event.key === 'dyeing-firms-sync-add') eventType = DYEING_FIRMS_SYNC_EVENTS.FIRM_ADDED;
      else if (event.key === 'dyeing-firms-sync-edit') eventType = DYEING_FIRMS_SYNC_EVENTS.FIRM_EDITED;
      else if (event.key === 'dyeing-firms-force-refresh') eventType = DYEING_FIRMS_SYNC_EVENTS.FORCE_REFRESH;
      if (!eventType) return;

      // Update local state WITHOUT rebroadcasting to avoid loops
      if (eventType === DYEING_FIRMS_SYNC_EVENTS.FIRMS_UPDATED && data.firms) {
        this.setFirmsLocal(data.firms, false, data.source);
      } else if ((eventType === DYEING_FIRMS_SYNC_EVENTS.FIRM_ADDED || eventType === DYEING_FIRMS_SYNC_EVENTS.FIRM_EDITED) && data.updatedFirm) {
        this.upsertFirmLocal(data.updatedFirm, false, data.source);
      } else if (eventType === DYEING_FIRMS_SYNC_EVENTS.FORCE_REFRESH) {
        this.loadInitialFirms(data.source);
      }
      this.notifyListeners(eventType, data);
    } catch (error) {
      console.error('[DyeingFirmsSync] Error handling storage event:', error);
    }
  }

  private handleCustomEvent(event: Event): void {
    if (event instanceof CustomEvent && event.detail) {
      const data = event.detail as DyeingFirmsSyncEventData;
      const type = event.type;
      // Update local state from in-tab events
      if (type === DYEING_FIRMS_SYNC_EVENTS.FIRMS_UPDATED && data.firms) {
        this.setFirmsLocal(data.firms, false, data.source);
      } else if ((type === DYEING_FIRMS_SYNC_EVENTS.FIRM_ADDED || type === DYEING_FIRMS_SYNC_EVENTS.FIRM_EDITED) && data.updatedFirm) {
        this.upsertFirmLocal(data.updatedFirm, false, data.source);
      } else if (type === DYEING_FIRMS_SYNC_EVENTS.FORCE_REFRESH) {
        this.loadInitialFirms(data.source);
      }
      this.notifyListeners(type, data);
    }
  }

  private dispatchEvent(type: string, data: DyeingFirmsSyncEventData): void {
    const customEvent = new DyeingFirmsSyncEvent(type, data);
    window.dispatchEvent(customEvent);
  }

  private notifyListeners(eventType: string, data: DyeingFirmsSyncEventData): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try { callback(data); } catch (error) { console.error(`[DyeingFirmsSync] Listener error for ${eventType}:`, error); }
      });
    }
  }

  cleanup(): void {
    this.listeners.clear();
    this.firmSubscribers.clear();
    window.removeEventListener('storage', this.handleStorageEvent.bind(this));
    Object.values(DYEING_FIRMS_SYNC_EVENTS).forEach(eventType => {
      window.removeEventListener(eventType, this.handleCustomEvent.bind(this));
    });
  }
}

// Singleton instance
export const dyeingFirmsSyncManager = DyeingFirmsSyncManager.getInstance();

// Facade export for ease of use
export const syncDyeingFirms = {
  events: DYEING_FIRMS_SYNC_EVENTS,
  subscribe: (eventType: string, callback: (data: DyeingFirmsSyncEventData) => void) => dyeingFirmsSyncManager.subscribe(eventType, callback),
  subscribeFirms: (cb: (firms: DyeingFirm[]) => void, source: 'count-product-overview' | 'dyeing-orders') => dyeingFirmsSyncManager.subscribeFirms(cb, source),
  notifyFirmsUpdated: (firms: DyeingFirm[], source: 'count-product-overview' | 'dyeing-orders') => dyeingFirmsSyncManager.notifyFirmsUpdated(firms, source),
  notifyFirmAdded: (firm: DyeingFirm, source: 'count-product-overview' | 'dyeing-orders') => dyeingFirmsSyncManager.notifyFirmAdded(firm, source),
  notifyFirmEdited: (firm: DyeingFirm, source: 'count-product-overview' | 'dyeing-orders') => dyeingFirmsSyncManager.notifyFirmEdited(firm, source),
  forceRefresh: (source: 'count-product-overview' | 'dyeing-orders') => dyeingFirmsSyncManager.forceRefresh(source),
  getFirms: () => dyeingFirmsSyncManager.getCurrentFirms()
};
