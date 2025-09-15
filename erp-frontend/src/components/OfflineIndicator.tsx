import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { syncOfflineActions, getOfflineStorageInfo } from '../utils/offlineStorage';

const OfflineIndicator: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [offlineActions, setOfflineActions] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) {
        // Try to sync when coming back online
        handleSync();
      }
    };

    const updateOfflineActions = async () => {
      try {
        const info = await getOfflineStorageInfo();
        const total = Object.values(info).reduce((sum: number, data: any) => sum + data.unsynced, 0);
        setOfflineActions(total);
      } catch (error) {
        console.error('Failed to get offline storage info:', error);
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update offline actions count periodically
    updateOfflineActions();
    const interval = setInterval(updateOfflineActions, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!online || syncing) return;

    setSyncing(true);
    try {
      await syncOfflineActions();
      setOfflineActions(0);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (online && offlineActions === 0) {
    return null; // Don't show anything when online and no pending actions
  }

  return (
    <div className="fixed top-4 left-4 z-40">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 cursor-pointer ${
          online
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {online ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        
        <span className="text-sm font-medium">
          {online ? (
            offlineActions > 0 ? (
              `${offlineActions} pending sync${offlineActions > 1 ? 's' : ''}`
            ) : (
              'Online'
            )
          ) : (
            'Offline'
          )}
        </span>

        {online && offlineActions > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSync();
            }}
            disabled={syncing}
            className="ml-1 p-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors"
            title="Sync now"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Details popup */}
      {showDetails && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {online ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold text-gray-900 dark:text-white">
                Connection Status
              </span>
            </div>

            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={online ? 'text-green-600' : 'text-red-600'}>
                  {online ? 'Online' : 'Offline'}
                </span>
              </div>

              {offlineActions > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pending actions:</span>
                  <span className="text-yellow-600">{offlineActions}</span>
                </div>
              )}
            </div>

            {!online && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-medium mb-1">Working Offline</p>
                  <p>Your changes are saved locally and will sync when you're back online.</p>
                </div>
              </div>
            )}

            {online && offlineActions > 0 && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
