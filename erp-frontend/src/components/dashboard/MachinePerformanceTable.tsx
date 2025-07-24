import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, Check } from 'lucide-react';

interface MachinePerformanceData {
  id: number;
  name: string;
  efficiency: number;
  status: 'operational' | 'maintenance' | 'offline';
  lastMaintenance: string;
  entriesCount: number;
  totalProduction: number;
  wastePercentage: number;
}

interface MachinePerformanceTableProps {
  machines: MachinePerformanceData[];
}

const MachinePerformanceTable: React.FC<MachinePerformanceTableProps> = ({ machines }) => {
  // Sort machines by efficiency in descending order
  const sortedMachines = [...machines].sort((a, b) => b.efficiency - a.efficiency);
  
  // Get the best and worst machines
  const bestMachine = sortedMachines[0];
  const worstMachine = sortedMachines[sortedMachines.length - 1];
  
  // Calculate the average efficiency
  const avgEfficiency = 
    machines.length > 0 
      ? machines.reduce((sum, machine) => sum + machine.efficiency, 0) / machines.length 
      : 0;
  
  return (
    <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-md rounded-xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white">Machine Performance</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Efficiency and production details</p>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <div className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded flex items-center">
            <Activity className="w-3.5 h-3.5 mr-1" />
            <span>Avg: {avgEfficiency.toFixed(1)}%</span>
          </div>
          <div className="px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            <span>Best: {bestMachine?.efficiency || 0}%</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Machine</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Efficiency</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Production</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waste %</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Maintenance</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedMachines.map((machine) => {
              // Determine if machine is performing above or below average
              const efficiencyDiff = machine.efficiency - avgEfficiency;
              const isAboveAverage = efficiencyDiff > 0;
              
              // Determine status indicator
              let statusBg = 'bg-emerald-100 dark:bg-emerald-900/30';
              let statusText = 'text-emerald-700 dark:text-emerald-300';
              let StatusIcon = Check;
              
              if (machine.status === 'maintenance') {
                statusBg = 'bg-amber-100 dark:bg-amber-900/30';
                statusText = 'text-amber-700 dark:text-amber-300';
                StatusIcon = Activity;
              } else if (machine.status === 'offline') {
                statusBg = 'bg-red-100 dark:bg-red-900/30';
                statusText = 'text-red-700 dark:text-red-300';
                StatusIcon = AlertTriangle;
              }
              
              return (
                <tr key={machine.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                    {machine.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full mr-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            machine.efficiency >= 80 ? 'bg-emerald-500' : 
                            machine.efficiency >= 60 ? 'bg-blue-500' : 
                            machine.efficiency >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${machine.efficiency}%` }}
                        />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{machine.efficiency}%</span>
                      {Math.abs(efficiencyDiff) >= 1 && (
                        <span className={`ml-2 flex items-center text-xs ${isAboveAverage ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isAboveAverage ? 
                            <ArrowUpRight className="w-3 h-3 mr-0.5" /> : 
                            <ArrowDownRight className="w-3 h-3 mr-0.5" />
                          }
                          {Math.abs(efficiencyDiff).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBg} ${statusText}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {machine.totalProduction.toLocaleString()} kg 
                    <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">({machine.entriesCount} entries)</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`${
                      machine.wastePercentage <= 2 ? 'text-emerald-600 dark:text-emerald-400' : 
                      machine.wastePercentage <= 5 ? 'text-amber-600 dark:text-amber-400' : 
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {machine.wastePercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {machine.lastMaintenance}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MachinePerformanceTable;
