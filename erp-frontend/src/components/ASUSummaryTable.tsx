import React, { useState } from 'react';
import {
  ASUFilters,
  ASUDailyMachinePaginated,
  ASUProductionEfficiencyPaginated,
  ASUMainsReadingPaginated,
  ASUWeeklyPaginated
} from '../types/asu';
import {
  Filter,
  Download,
  Eye,
  TrendingUp,
  Activity,
  Zap,
  Cog
} from 'lucide-react';

interface ASUSummaryTableProps {
  dailyMachineData: ASUDailyMachinePaginated;
  productionEfficiency: ASUProductionEfficiencyPaginated;
  mainsReadings: ASUMainsReadingPaginated;
  weeklyData: ASUWeeklyPaginated;
  onFiltersChange?: (filters: ASUFilters) => void;
  filters?: ASUFilters;
  isLoading?: boolean;
}

const ASUSummaryTable: React.FC<ASUSummaryTableProps> = ({
  dailyMachineData,
  productionEfficiency,
  mainsReadings,
  weeklyData,
  onFiltersChange,
  filters: externalFilters,
  isLoading = false
}) => {
  // Debug logging to see what data the component receives
  console.log('🔍 ASUSummaryTable received props:', {
    dailyMachineDataLength: dailyMachineData?.data?.length || 0,
    productionEfficiencyLength: productionEfficiency?.data?.length || 0,
    mainsReadingsLength: mainsReadings?.data?.length || 0,
    weeklyDataLength: weeklyData?.data?.length || 0,
    isLoading,
    dailyMachineData: dailyMachineData,
    productionEfficiency: productionEfficiency,
    mainsReadings: mainsReadings,
    weeklyData: weeklyData
  });

  // Helper function to safely convert database string numbers to actual numbers
  const safeNumber = (value: string | number | null | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const [activeTab, setActiveTab] = useState<'daily' | 'production' | 'mains' | 'weekly'>('daily');
  const [filters, setFilters] = useState<ASUFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof ASUFilters, value: string | number | Date | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange?.({});
  };

  const exportToCSV = () => {
    const dataToExport =
      activeTab === 'daily' ? dailyMachineData.data :
      activeTab === 'production' ? productionEfficiency.data :
      activeTab === 'mains' ? mainsReadings.data :
      weeklyData.data;

    if (!dataToExport || dataToExport.length === 0) {
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row =>
        headers.map(header =>
          JSON.stringify((row as Record<string, unknown>)[header] ?? '')
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asu-${activeTab}-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'daily': return dailyMachineData?.data || [];
      case 'production': return productionEfficiency?.data || [];
      case 'mains': return mainsReadings?.data || [];
      case 'weekly': return weeklyData?.data || [];
      default: return [];
    }
  };

  const renderFilters = () => (
    <div className={`bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4 ${showFilters ? 'block' : 'hidden'}`}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Machine
          </label>
          <select
            value={filters.machine || ''}
            onChange={(e) => handleFilterChange('machine', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          >
            <option value="">All Machines</option>
            {Array.from({ length: 21 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>Machine {num}</option>
            ))}
          </select>
        </div>

        {activeTab === 'daily' && (
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Karigar Name
            </label>
            <input
              type="text"
              value={filters.karigarName || ''}
              onChange={(e) => handleFilterChange('karigarName', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              placeholder="Enter karigar name"
            />
          </div>
        )}

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Date From
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Date To
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        <button
          onClick={clearFilters}
          className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );

  const renderDailyMachineTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Machine
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Date
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Karigar
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              8AM Reading
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              8PM Reading
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Hours Working
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Extra Hours
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Yarn
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {dailyMachineData.data && dailyMachineData.data.length > 0 ? (
            dailyMachineData.data.map((record, index) => (
              <tr key={record.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  Machine {record.machine}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {record.karigarName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.reading8AM).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.reading8PM).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.machineHoursWorked).toFixed(1)}h
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.extraHours || 0).toFixed(1)}h
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {record.yarn}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-300">
                No daily machine data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderProductionTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Machine
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Date
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Kgs Produced
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Hours Working
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Efficiency (kg/h)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {productionEfficiency.data && productionEfficiency.data.length > 0 ? (
            productionEfficiency.data.map((record, index) => (
              <tr key={record.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  Machine {record.machine}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.kgsProduced).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.machineHoursWorking).toFixed(1)}h
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (safeNumber(record.kgsProduced) / safeNumber(record.machineHoursWorking)) > 10 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {(safeNumber(record.kgsProduced) / safeNumber(record.machineHoursWorking)).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-300">
                No production efficiency data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderMainsTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Date
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              8AM Reading
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              8PM Reading
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Daily Consumption
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {mainsReadings.data && mainsReadings.data.length > 0 ? (
            mainsReadings.data.map((record, index) => (
              <tr key={record.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.reading8AM).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.reading8PM).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                    {(safeNumber(record.reading8PM) - safeNumber(record.reading8AM)).toFixed(2)} units
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-300">
                No mains readings available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderWeeklyTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Machine
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Week Start
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Threads
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              10 Min Weight
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Ideal 24Hr (kg)
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Ideal 85% (kg)
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Speed (RPM)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {weeklyData.data && weeklyData.data.length > 0 ? (
            weeklyData.data.map((record, index) => (
              <tr key={record.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  Machine {record.machine}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {new Date(record.weekStartDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {record.numberOfThreads}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.tenMinWeight).toFixed(1)}g
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.ideal12Hr).toFixed(2)} kg
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.ideal85Percent).toFixed(2)} kg
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                  {safeNumber(record.speed).toFixed(1)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-300">
                No weekly data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const tabIcons = {
    daily: <Activity className="w-4 h-4" />,
    production: <TrendingUp className="w-4 h-4" />,
    mains: <Zap className="w-4 h-4" />,
    weekly: <Cog className="w-4 h-4" />
  };

  const tabLabels = {
    daily: 'Daily Machine Data',
    production: 'Production Efficiency',
    mains: 'Mains Readings',
    weekly: 'Weekly Data'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg dark:bg-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white sm:mb-0">
            ASU Unit 2 Summary
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 space-x-2 text-sm text-gray-700 transition-colors bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center px-3 py-2 space-x-2 text-sm text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <nav className="flex space-x-1 overflow-x-auto">
            {(['daily', 'production', 'mains', 'weekly'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tabIcons[tab]}
                <span>{tabLabels[tab]}</span>
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">
                  {getCurrentData().length}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Table Content */}
      <div className="p-6">
        {getCurrentData().length === 0 ? (
          <div className="py-12 text-center">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              No {tabLabels[activeTab].toLowerCase()} records found
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'daily' && renderDailyMachineTable()}
            {activeTab === 'production' && renderProductionTable()}
            {activeTab === 'mains' && renderMainsTable()}
            {activeTab === 'weekly' && renderWeeklyTable()}
          </>
        )}
      </div>
    </div>
  );
};

export default ASUSummaryTable;
