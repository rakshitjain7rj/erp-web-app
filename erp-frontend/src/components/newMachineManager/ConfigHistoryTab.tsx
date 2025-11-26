// ConfigHistoryTab.tsx - Lightweight, memoized configuration history tab
// Optimized for minimal re-renders and fast load times
import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { History, Calendar, Filter } from 'lucide-react';
import { ASUMachine } from '../../api/asuUnit1Api';
import { MachineConfiguration, machineConfigApi } from '../../api/machineConfigApi';

interface ConfigHistoryTabProps {
  machines: ASUMachine[];
}

// Memoized row component for each configuration
const ConfigRow = memo(({ config, machine }: { config: MachineConfiguration; machine: ASUMachine | undefined }) => {
  const duration = useMemo(() => 
    machineConfigApi.formatDuration(
      machineConfigApi.calculateDurationInDays(config.startDate, config.endDate)
    ), [config.startDate, config.endDate]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const isActive = config.endDate === null;

  return (
    <tr className={`text-sm ${isActive ? 'bg-green-50 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
      <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
        Machine {machine?.machineNo}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span>{formatDate(config.startDate)}</span>
          {isActive && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded dark:bg-green-900/30 dark:text-green-400">
              Active
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-400">
        {config.endDate ? formatDate(config.endDate) : '—'}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-gray-500 dark:text-gray-500 text-xs">
        {duration}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          {config.count || 0}
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
        {config.yarnType || 'Cotton'}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
        {config.spindleCount || 0}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
        {config.speed || 0}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="text-purple-600 font-medium dark:text-purple-400">
          {Number(config.productionAt100 || 0).toFixed(2)}
        </span>
      </td>
    </tr>
  );
});
ConfigRow.displayName = 'ConfigRow';

// Main component
const ConfigHistoryTab: React.FC<ConfigHistoryTabProps> = ({ machines }) => {
  const [configCache, setConfigCache] = useState<Record<number, MachineConfiguration[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  
  // Date filter state
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const handleLast31Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 31);
    
    setFromDate(start.toISOString().split('T')[0]);
    setToDate(end.toISOString().split('T')[0]);
  };

  // Fetch all configurations on mount
  useEffect(() => {
    const fetchAllConfigs = async () => {
      setLoading(true);
      try {
        const promises = machines.map(m => machineConfigApi.getMachineConfigurations(m.id));
        const results = await Promise.all(promises);
        
        const newCache: Record<number, MachineConfiguration[]> = {};
        machines.forEach((m, index) => {
          newCache[m.id] = results[index];
        });
        setConfigCache(newCache);
      } catch (error) {
        console.error('Failed to fetch configurations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (machines.length > 0) {
      fetchAllConfigs();
    }
  }, [machines]);

  // Flatten and filter configurations
  const filteredConfigs = useMemo(() => {
    let allConfigs: { config: MachineConfiguration; machineId: number }[] = [];
    
    // Flatten
    Object.entries(configCache).forEach(([machineId, configs]) => {
      configs.forEach(config => {
        allConfigs.push({ config, machineId: Number(machineId) });
      });
    });

    // Filter by date
    if (fromDate || toDate) {
      const start = fromDate ? new Date(fromDate).getTime() : 0;
      const end = toDate ? new Date(toDate).getTime() : Infinity;

      allConfigs = allConfigs.filter(({ config }) => {
        const configStart = new Date(config.startDate).getTime();
        const configEnd = config.endDate ? new Date(config.endDate).getTime() : new Date().getTime();
        
        // Check for overlap
        // Config interval: [configStart, configEnd]
        // Filter interval: [start, end]
        // Overlap if: configStart <= end AND configEnd >= start
        return configStart <= end && configEnd >= start;
      });
    }

    // Sort by date (descending) then machine
    return allConfigs.sort((a, b) => {
      const dateA = new Date(a.config.startDate).getTime();
      const dateB = new Date(b.config.startDate).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return a.machineId - b.machineId;
    });
  }, [configCache, fromDate, toDate]);

  // Identify machines with no history in the current view
  const machinesWithNoHistory = useMemo(() => {
    const machinesInHistory = new Set(filteredConfigs.map(item => item.machineId));
    return machines.filter(m => !machinesInHistory.has(m.id));
  }, [machines, filteredConfigs]);

  if (machines.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <History className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No machines available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Configuration History
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View history across all machines within a date range
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            onClick={handleLast31Days}
            className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            Last 31 Days
          </button>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Single Table View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading history...</span>
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">No records found</p>
            <p className="text-sm mt-1">Try adjusting the date filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-3 py-3 text-left font-medium">Machine</th>
                  <th className="px-3 py-3 text-left font-medium">From</th>
                  <th className="px-3 py-3 text-left font-medium">To</th>
                  <th className="px-3 py-3 text-left font-medium">Duration</th>
                  <th className="px-3 py-3 text-left font-medium">Count</th>
                  <th className="px-3 py-3 text-left font-medium">Yarn</th>
                  <th className="px-3 py-3 text-left font-medium">Spindles</th>
                  <th className="px-3 py-3 text-left font-medium">Speed</th>
                  <th className="px-3 py-3 text-left font-medium">Prod@100%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-800">
                {filteredConfigs.map((item, idx) => (
                  <ConfigRow 
                    key={`${item.machineId}-${item.config.id}`} 
                    config={item.config} 
                    machine={machines.find(m => m.id === item.machineId)}
                  />
                ))}
                {/* Show machines with no history in the selected range */}
                {machinesWithNoHistory.map(machine => (
                  <tr key={`no-history-${machine.id}`} className="text-sm text-gray-400 italic bg-gray-50/50 dark:bg-gray-800/50">
                    <td className="px-3 py-2 whitespace-nowrap font-medium">
                      Machine {machine.machineNo}
                    </td>
                    <td colSpan={8} className="px-3 py-2 text-center">
                      No configuration history found in selected range
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ConfigHistoryTab);
