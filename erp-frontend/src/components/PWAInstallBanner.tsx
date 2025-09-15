import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Chrome, Monitor } from 'lucide-react';

interface PWAInstallBannerProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onInstall, onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                            (window.navigator as any).standalone ||
                            document.referrer.includes('android-app://');
    setIsStandalone(isStandaloneMode);

    // Check if user dismissed banner
    const bannerDismissed = localStorage.getItem('pwa-banner-dismissed') === 'true';
    
    if (!isStandaloneMode && !bannerDismissed) {
      // Show banner after a short delay
      setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎯 beforeinstallprompt event fired - PWA can be installed!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (!bannerDismissed && !isStandaloneMode) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Manual instructions for browsers that don't support beforeinstallprompt
      alert('To install this app:\n\n1. Click the menu (⋮) in your browser\n2. Select "Install ASU ERP..." or "Add to Home Screen"\n3. Follow the prompts to install');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        onInstall?.();
      }
      
      setDeferredPrompt(null);
      setShowBanner(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
    onDismiss?.();
  };

  if (isStandalone || !showBanner) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Install ASU ERP</h3>
              <p className="text-sm opacity-90 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <Monitor className="w-4 h-4" />
                <Chrome className="w-4 h-4" />
                Fast, offline access on any device
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleInstall}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-3">
          <div className="flex justify-between text-xs opacity-75 mb-1">
            <span>Install Progress</span>
            <span>Ready to Install</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1">
            <div className="bg-white h-1 rounded-full w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
