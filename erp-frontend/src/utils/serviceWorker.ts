// Service Worker Registration and Management
export interface ServiceWorkerUpdate {
  waiting: ServiceWorker | null;
  installing: ServiceWorker | null;
}

export interface PWAUpdateCallbacks {
  onUpdate?: (update: ServiceWorkerUpdate) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private callbacks: PWAUpdateCallbacks = {};
  // Track the scriptURL of the worker we've already notified about to avoid
  // showing multiple update prompts (seen occurring 10-15 times in some cases)
  private notifiedWorkerScriptURL: string | null = null;

  constructor(callbacks: PWAUpdateCallbacks = {}) {
    this.callbacks = callbacks;
    this.setupOnlineOfflineListeners();
  }

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('🚫 Service Workers not supported');
      return false;
    }

    try {
      console.log('🔧 Registering Service Worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports'
      });

      console.log('✅ Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });

      // Check if there's already a waiting service worker
      if (this.registration.waiting) {
        this.handleWaiting(this.registration.waiting);
      }

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed');
        this.callbacks.onSuccess?.();
      });

      // Check for updates periodically
      this.setupPeriodicUpdateCheck();

      return true;
    } catch (error) {
      console.error('🚨 Service Worker registration failed:', error);
      this.callbacks.onError?.(error as Error);
      return false;
    }
  }

  private handleUpdateFound(): void {
    if (!this.registration) return;

    const installingWorker = this.registration.installing;
    if (!installingWorker) return;

    console.log('🔄 Service Worker update found');

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New content is available
          console.log('🆕 New content available');
          this.handleWaiting(installingWorker);
        } else {
          // Content is cached for offline use
          console.log('📦 Content cached for offline use');
          this.callbacks.onSuccess?.();
        }
      }
    });
  }

  private handleWaiting(worker: ServiceWorker): void {
    // Skip notifications in development mode to prevent constant update prompts
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      console.log('ℹ️ Development mode: skipping service worker update notification');
      return;
    }
    
    // Dedupe: only notify once per unique worker script URL
    const scriptURL = worker.scriptURL;
    // Extra global session guard (covers dev HMR + any accidental double event)
    const w = window as any;
    if (!w.__ASU_ERP_SW_NOTIFIED__) {
      w.__ASU_ERP_SW_NOTIFIED__ = new Set<string>();
    }

    const notifiedSet: Set<string> = w.__ASU_ERP_SW_NOTIFIED__;

    if (this.notifiedWorkerScriptURL === scriptURL || notifiedSet.has(scriptURL)) {
      console.log('ℹ️ Already notified for this service worker version, skipping...');
      return; // already notified for this version in this tab
    }

    // Add additional session-based throttling - only one notification per 5 minutes
    const lastNotificationTime = sessionStorage.getItem('sw-last-notification');
    const now = Date.now();
    if (lastNotificationTime) {
      const timeSinceLastNotification = now - parseInt(lastNotificationTime);
      if (timeSinceLastNotification < 5 * 60 * 1000) { // 5 minutes
        console.log('ℹ️ Recent notification sent, throttling update prompt');
        return;
      }
    }

    this.notifiedWorkerScriptURL = scriptURL;
    notifiedSet.add(scriptURL);
    sessionStorage.setItem('sw-last-notification', now.toString());

    // Small micro-delay to allow 'waiting' state stabilization (prevents race where installing triggers then waiting triggers quickly).
    setTimeout(() => {
      this.callbacks.onUpdate?.({
        waiting: worker,
        installing: this.registration?.installing || null
      });
    }, 50);
  }

  skipWaiting(): void {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  private setupPeriodicUpdateCheck(): void {
    // Skip periodic updates in development mode
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      console.log('ℹ️ Development mode: skipping periodic update checks');
      return;
    }
    
    // Check for updates every 30 minutes in production only
    setInterval(() => {
      if (this.registration) {
        console.log('🔍 Checking for Service Worker updates...');
        this.registration.update();
      }
    }, 30 * 60 * 1000);
  }

  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 App is back online');
      this.callbacks.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('📴 App is offline');
      this.callbacks.onOffline?.();
    });
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  async getVersion(): Promise<string> {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker.controller) {
        resolve('unknown');
        return;
      }

      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || 'unknown');
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    });
  }

  async preloadRoutes(routes: string[]): Promise<void> {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      urls: routes
    });
  }
}

// Singleton instance
let swManager: ServiceWorkerManager | null = null;

export function registerServiceWorker(callbacks: PWAUpdateCallbacks = {}): Promise<boolean> {
  if (!swManager) {
    swManager = new ServiceWorkerManager(callbacks);
  }
  return swManager.register();
}

export function getServiceWorkerManager(): ServiceWorkerManager | null {
  return swManager;
}

export function skipWaiting(): void {
  swManager?.skipWaiting();
}

export function updateServiceWorker(): Promise<void> {
  return swManager?.update() || Promise.resolve();
}

export function isOnline(): boolean {
  return swManager?.isOnline() ?? navigator.onLine;
}

export function getServiceWorkerVersion(): Promise<string> {
  return swManager?.getVersion() || Promise.resolve('unknown');
}

export function preloadRoutes(routes: string[]): Promise<void> {
  return swManager?.preloadRoutes(routes) || Promise.resolve();
}

// Development utility to clear update notification state
export function clearUpdateNotificationState(): void {
  if (import.meta && import.meta.env && import.meta.env.DEV) {
    sessionStorage.removeItem('sw-last-notification');
    const w = window as any;
    if (w.__ASU_ERP_SW_NOTIFIED__) {
      w.__ASU_ERP_SW_NOTIFIED__.clear();
    }
    if (swManager) {
      (swManager as any).notifiedWorkerScriptURL = null;
    }
    console.log('🧹 Cleared service worker notification state');
  }
}
