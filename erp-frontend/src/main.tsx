import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { registerServiceWorker } from "./utils/serviceWorker";
import { initializePerformanceOptimizations } from "./utils/performance";
import "./index.css";

// PWA Service Worker Registration
const initializePWA = async () => {
  try {
    const registered = await registerServiceWorker({
      onUpdate: (update) => {
        console.log('🆕 PWA update available');
        // Show update notification to user
        if (confirm('A new version of ASU ERP is available. Update now?')) {
          if (update.waiting) {
            update.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          window.location.reload();
        }
      },
      onSuccess: () => {
        console.log('✅ PWA ready for offline use');
      },
      onError: (error) => {
        console.error('🚨 PWA registration failed:', error);
      },
      onOffline: () => {
        console.log('📴 App running offline');
        // Could show offline indicator here
      },
      onOnline: () => {
        console.log('🌐 App back online');
        // Could hide offline indicator here
      }
    });

    if (registered) {
      console.log('🚀 PWA features enabled');
    }
  } catch (error) {
    console.error('🚨 PWA initialization failed:', error);
  }
};

// Wait for DOM to be ready and add extra safety checks
function initializeApp() {
  console.log('🚀 Initializing app...');
  
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("❌ Root element not found");
    return;
  }

  if (!document.body) {
    console.error("❌ Document body not ready");
    setTimeout(initializeApp, 10);
    return;
  }

  console.log('✅ DOM ready, starting React app...');

  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('✅ React app initialized successfully');
    
    // Initialize PWA features after React app is ready
    initializePWA();
    
    // Initialize performance optimizations
    initializePerformanceOptimizations();
  } catch (error) {
    console.error("❌ Failed to initialize React app:", error);
  }
}

// Initialize when DOM is ready with multiple checks
if (document.readyState === 'loading') {
  console.log('📄 Document still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  console.log('📄 Document already ready, initializing immediately...');
  initializeApp();
}