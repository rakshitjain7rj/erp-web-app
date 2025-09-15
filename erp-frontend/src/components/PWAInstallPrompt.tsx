import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Chrome } from 'lucide-react';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
  onInstall?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss, onInstall }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed (standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                            (window.navigator as any).standalone ||
                            document.referrer.includes('android-app://');
    setIsStandalone(isStandaloneMode);

    // Check if user has already dismissed the prompt
    const hasInteractedBefore = localStorage.getItem('pwa-prompt-dismissed') === 'true';
    setHasInteracted(hasInteractedBefore);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎯 PWA install prompt event detected!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt immediately for better visibility during testing
      if (!hasInteractedBefore && !isStandaloneMode) {
        setTimeout(() => {
          console.log('📱 Showing PWA install prompt');
          setShowPrompt(true);
        }, 3000); // Reduced to 3 seconds for better UX
      }
    };

    // For testing purposes, also show install button even without beforeinstallprompt
    if (!hasInteractedBefore && !isStandaloneMode) {
      setTimeout(() => {
        console.log('🔧 Showing install prompt for testing (no beforeinstallprompt event)');
        setShowPrompt(true);
      }, 5000); // Show after 5 seconds even without the event
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installed successfully');
      setShowPrompt(false);
      onInstall?.();
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [onInstall]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // For iOS or unsupported browsers, show manual instructions
      if (isIOS) {
        setShowPrompt(true);
        return;
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        onInstall?.();
      } else {
        console.log('❌ User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
      setHasInteracted(true);
      localStorage.setItem('pwa-prompt-dismissed', 'true');
    } catch (error) {
      console.error('🚨 Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setHasInteracted(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    onDismiss?.();
  };

  // Don't show if already installed or user has dismissed
  if (isStandalone || hasInteracted) {
    return null;
  }

  // Manual installation trigger button (always available)
  const InstallButton = () => (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleInstall}
        className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl animate-pulse"
        title="Install ASU ERP as App"
      >
        <Download className="w-7 h-7" />
        <div className="absolute -top-16 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Install as App
        </div>
      </button>
    </div>
  );

  if (!showPrompt) {
    return <InstallButton />;
  }

  // Show both banner and modal for better visibility
  return (
    <>
      <InstallButton />
      
      {/* Top Banner for Desktop */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Download className="w-6 h-6" />
            <div>
              <p className="font-semibold">Install ASU ERP as an App</p>
              <p className="text-sm opacity-90">Get faster access and offline functionality</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleInstall}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ paddingTop: '80px' }}>
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all duration-300 ease-out">
          {/* Header */}
          <div className="relative p-6 pb-4">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Download className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Install ASU ERP
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Get the full app experience
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Smartphone className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Mobile Optimized
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Monitor className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Works Offline
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Chrome className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Fast Loading
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Benefits of installing:
                </h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                    Access from your home screen
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                    Works offline for core features
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                    Faster loading and better performance
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                    Push notifications (coming soon)
                  </li>
                </ul>
              </div>

              {/* iOS specific instructions */}
              {isIOS && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    Install on iOS:
                  </h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>1. Tap the Share button in Safari</li>
                    <li>2. Scroll down and tap "Add to Home Screen"</li>
                    <li>3. Tap "Add" to install the app</li>
                  </ol>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  {isIOS ? 'Show Instructions' : 'Install App'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PWAInstallPrompt;
