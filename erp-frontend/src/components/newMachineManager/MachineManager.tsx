// MachineManager.tsx - Simplified config-only component (machines 1-9 pre-seeded)
import React, { useState, memo, useCallback } from 'react';
import { Settings, History } from 'lucide-react';
import { useMachineData } from './useMachineData';
import MachineTable from './MachineTable';
import ConfigHistoryTab from './ConfigHistoryTab';

type TabType = 'config' | 'history';

const MachineManager: React.FC = () => {
  const { machines, loading, updateMachine } = useMachineData();
  const [activeTab, setActiveTab] = useState<TabType>('config');

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Machine Configuration
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure count, yarn type, spindles, speed, and production settings
          </p>
        </div>
        
        {/* Tab buttons */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => handleTabChange('config')}
            className={`px-4 py-2 flex items-center gap-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'config'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`px-4 py-2 flex items-center gap-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'config' ? (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
            {machines.length} machine{machines.length !== 1 ? 's' : ''}
          </div>
          <MachineTable
            machines={machines}
            loading={loading}
            onUpdate={updateMachine}
          />
        </>
      ) : (
        <ConfigHistoryTab machines={machines} />
      )}
    </div>
  );
};

export default memo(MachineManager);
