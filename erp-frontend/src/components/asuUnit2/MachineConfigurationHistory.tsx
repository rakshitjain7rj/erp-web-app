import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ASUMachine } from '../../api/asuUnit1Api';
import { format, isWithinInterval, parseISO, subDays } from 'date-fns';

// Create an interface for the machine configuration since it doesn't exist in the API
export interface MachineConfiguration {
  id: number;
  machineId: number;
  count: number | string;
  spindles: number | string;
  speed: number | string;
  yarnType: string;
  productionAt100: number | string;
  createdAt: string;
  updatedAt: string;
  machineName?: string;
  savedAt?: string;
  isActive?: boolean;
  hasProductionEntry?: boolean; // Indicates if this configuration has a production entry
}

interface MachineConfigurationHistoryProps {
  machine: ASUMachine;
  configurations: MachineConfiguration[];
  loading: boolean;
  hasProductionEntries?: boolean; // New prop that indicates if the machine has any production entries
}

export const MachineConfigurationHistory: React.FC<MachineConfigurationHistoryProps> = ({
  machine,
  configurations,
  loading,
  hasProductionEntries = false
}) => {
  // Date filter state
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  
  // Format date for better display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };
  
  // Filter configurations based on selected date range and remove duplicates
  const filteredConfigurations = React.useMemo(() => {
    if (configurations.length === 0) return [];
    
    // Start with all configurations, sorted by date (newest first)
    let configs = [...configurations].sort((a, b) => {
      const dateA = a.savedAt || a.createdAt || a.updatedAt || '';
      const dateB = b.savedAt || b.createdAt || b.updatedAt || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    // Apply date filter if not showing all
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysToSubtract = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
      const startDate = subDays(now, daysToSubtract);
      
      configs = configs.filter(config => {
        try {
          const configDate = parseISO(config.savedAt || config.createdAt || config.updatedAt || '');
          return isWithinInterval(configDate, { start: startDate, end: now });
        } catch {
          return true; // Include if date parsing fails
        }
      });
    }
    
    // Function to normalize numeric values to avoid slight formatting differences
    const normalizeValue = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return '0';
      if (typeof value === 'number') return value.toFixed(2);
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? value : num.toFixed(2);
      }
      return String(value);
    };
    
    // Remove duplicates (configurations with identical important values)
    const seen = new Set();
    return configs.filter(config => {
      // Create a unique key based on important properties with normalized numeric values
      const configKey = `${normalizeValue(config.count)}-${config.yarnType || ''}-${normalizeValue(config.spindles)}-${normalizeValue(config.speed)}-${normalizeValue(config.productionAt100)}`;
      if (seen.has(configKey)) return false;
      seen.add(configKey);
      return true;
    });
  }, [configurations, dateFilter]);

  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 bg-purple-50 dark:bg-purple-900/20 dark:border-gray-700">
        <div className="flex flex-wrap justify-between items-center">
          <h2 className="text-base font-medium text-purple-800 dark:text-purple-200">
            Machine {machine.machineNo} History {machine.machineName ? `(${machine.machineName})` : ''}
          </h2>
          
          <div className="flex gap-1 mt-1 sm:mt-0">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2 py-0.5 text-xs rounded-sm ${
                dateFilter === 'all' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-2 py-0.5 text-xs rounded-sm ${
                dateFilter === '7days' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateFilter('30days')}
              className={`px-2 py-0.5 text-xs rounded-sm ${
                dateFilter === '30days' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateFilter('90days')}
              className={`px-2 py-0.5 text-xs rounded-sm ${
                dateFilter === '90days' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <div className="w-5 h-5 border-b-2 border-purple-500 rounded-full animate-spin"></div>
              <span className="text-sm">Loading history...</span>
            </div>
          </div>
        ) : filteredConfigurations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <div className="p-2 mb-3 rounded-full bg-purple-50 dark:bg-purple-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-500 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              {configurations.length === 0 ? 'No configuration history available' : 'No configurations in selected period'}
            </p>
            <p className="max-w-md mt-1 text-sm text-gray-500 dark:text-gray-400">
              {configurations.length === 0 ? (
                <>
                  History is saved <strong>only when this machine has production entries</strong>.
                  {!hasProductionEntries && <span className="block mt-1 text-amber-600 dark:text-amber-400 text-sm">No production entries found. Add production first.</span>}
                </>
              ) : (
                'Try a different date range to see machine history.'
              )}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table className="w-full min-w-full">
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow className="border-b dark:border-gray-700">
                  <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Date</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Count</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Yarn</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Spindles</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Speed</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Prod @ 100%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredConfigurations.map((config, index) => (
                  <TableRow key={config.id || index} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${index === 0 ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                    <TableCell className="px-3 py-2 whitespace-nowrap sm:px-4">
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        {formatDate(config.savedAt || config.createdAt || config.updatedAt || '')}
                      </span>
                      {index === 0 && (
                        <span className="ml-1 text-xs font-medium bg-green-100 text-green-800 px-1 py-0.5 rounded-sm dark:bg-green-900 dark:text-green-200">Current</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap sm:px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{config.count || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap sm:px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{config.yarnType || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap sm:px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{config.spindles || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap sm:px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {config.speed ? `${config.speed}` : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap sm:px-4">
                      <span className="text-sm text-purple-600 dark:text-purple-400">
                        {config.productionAt100 !== undefined && config.productionAt100 !== null ? 
                          `${Number(config.productionAt100).toFixed(2)}` : 'N/A'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};
