// Performance optimization utilities for PWA
import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Lazy loading with retry mechanism
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries: number = 3
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed to load component, attempt ${i + 1}/${retries}:`, error);
        
        // Wait before retrying (exponential backoff)
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError;
  });
}

// Preload critical resources
export function preloadCriticalResources(): void {
  // Only preload essential icons that are used immediately
  const criticalImages = [
    '/icons/icon-192x192.png',
    '/favicon.ico'
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();

  static startMeasure(name: string): void {
    this.metrics.set(name, performance.now());
  }

  static endMeasure(name: string): number {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      console.warn(`No start time found for measure: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);
    
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    return fn().finally(() => {
      this.endMeasure(name);
    });
  }

  static getWebVitals(): void {
    // Core Web Vitals monitoring - simplified version
    try {
      // Basic performance measurement
      if ('performance' in window && 'getEntriesByType' in performance) {
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
          console.log(`📊 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
        });

        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0] as PerformanceNavigationTiming;
          console.log(`📊 DOM Content Loaded: ${nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart}ms`);
          console.log(`📊 Load Complete: ${nav.loadEventEnd - nav.loadEventStart}ms`);
        }
      }
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }
}

// Image lazy loading with IntersectionObserver
export class LazyImageLoader {
  private static observer: IntersectionObserver | null = null;

  static init(): void {
    if (this.observer) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.classList.remove('lazy');
            this.observer?.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
  }

  static observe(img: HTMLImageElement): void {
    if (!this.observer) {
      this.init();
    }
    this.observer?.observe(img);
  }

  static disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

// Bundle size optimization
export function optimizeBundle(): void {
  // Remove console.log statements in production
  if (import.meta.env.PROD) {
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
  }

  // Optimize images on the fly
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      LazyImageLoader.init();
    });
  } else {
    setTimeout(() => LazyImageLoader.init(), 100);
  }
}

// Network-aware loading
export class NetworkAwareLoader {
  static isSlowConnection(): boolean {
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) return false;
    
    // Consider 2G/slow-2g as slow connections
    return connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
  }

  static shouldReduceData(): boolean {
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) return false;
    
    return connection.saveData === true || this.isSlowConnection();
  }

  static getOptimalImageQuality(): 'low' | 'medium' | 'high' {
    if (this.shouldReduceData()) return 'low';
    if (this.isSlowConnection()) return 'medium';
    return 'high';
  }
}

// Cache management
export class CacheManager {
  static async clearOldCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('asu-erp-') && !name.includes('v1.0.0')
      );

      await Promise.all(
        oldCaches.map(cacheName => caches.delete(cacheName))
      );

      console.log(`🧹 Cleared ${oldCaches.length} old caches`);
    } catch (error) {
      console.error('Failed to clear old caches:', error);
    }
  }

  static async getCacheSize(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
    } catch (error) {
      console.error('Failed to get cache size:', error);
    }
    return 0;
  }

  static async clearAllCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('🗑️ All caches cleared');
    } catch (error) {
      console.error('Failed to clear all caches:', error);
    }
  }
}

// Initialize performance optimizations
export function initializePerformanceOptimizations(): void {
  // Start performance monitoring
  PerformanceMonitor.getWebVitals();
  
  // Optimize bundle
  optimizeBundle();
  
  // Preload critical resources
  preloadCriticalResources();
  
  // Clear old caches
  CacheManager.clearOldCaches();
  
  console.log('🚀 Performance optimizations initialized');
}
