import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

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