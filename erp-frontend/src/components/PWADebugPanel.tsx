import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Wifi, RefreshCw, Settings, Bug } from 'lucide-react';

const PWADebugPanel: React.FC = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // Check PWA installation status
    const checkPWAStatus = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);

      // Check service worker
      setSwRegistered('serviceWorker' in navigator);
    };

    checkPWAStatus();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptAvailable(true);
      console.log('🎯 PWA install prompt available!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstallPrompt = () => {
    // Force show install banner
    localStorage.removeItem('pwa-banner-dismissed');
    localStorage.removeItem('pwa-prompt-dismissed');
    window.location.reload();
  };

  const openInstallInstructions = () => {
    const instructions = `
🔧 Manual PWA Installation Instructions:

📱 **Chrome/Edge (Desktop):**
1. Click the address bar
2. Look for install icon (⬇️) on the right
3. Click "Install ASU ERP"

📱 **Chrome (Mobile):**
1. Tap menu (⋮)
2. Select "Add to Home Screen"
3. Tap "Add"

📱 **Safari (iOS):**
1. Tap Share button (⬆️)
2. Scroll down to "Add to Home Screen"
3. Tap "Add"

🔧 **Alternative:**
1. Bookmark this page
2. Visit chrome://apps (Chrome)
3. Look for ASU ERP
    `;
    
    alert(instructions);
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="PWA Debug Panel"
      >
        <Bug className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Bug className="w-5 h-5" />
          PWA Debug
        </h3>
        <button
          onClick={() => setShowPanel(false)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* Status */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Status:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded ${isStandalone ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              📱 {isStandalone ? 'Installed' : 'Not Installed'}
            </div>
            <div className={`p-2 rounded ${swRegistered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              ⚙️ {swRegistered ? 'SW Ready' : 'SW Missing'}
            </div>
            <div className={`p-2 rounded ${installPromptAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              💾 {installPromptAvailable ? 'Can Install' : 'No Prompt'}
            </div>
            <div className={`p-2 rounded ${navigator.onLine ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              🌐 {navigator.onLine ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Actions:</h4>
          
          <button
            onClick={triggerInstallPrompt}
            className="w-full bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Force Install Prompt
          </button>

          <button
            onClick={openInstallInstructions}
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Manual Install Guide
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-1 text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
            
            <button
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => registration.unregister());
                  });
                }
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
                window.location.reload();
              }}
              className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1 text-xs"
            >
              <Settings className="w-3 h-3" />
              Clear SW
            </button>
          </div>
        </div>

        {/* Current URL */}
        <div className="text-xs text-gray-600 dark:text-gray-400 border-t pt-2">
          <strong>URL:</strong> {window.location.origin}
          <br />
          <strong>UA:</strong> {navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}
        </div>
      </div>
    </div>
  );
};

export default PWADebugPanel;
