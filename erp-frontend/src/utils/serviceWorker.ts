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
    this.callbacks.onUpdate?.({
      waiting: worker,
      installing: this.registration?.installing || null
    });
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
    // Check for updates every 30 minutes
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
