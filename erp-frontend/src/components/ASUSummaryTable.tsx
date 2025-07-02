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
  filters: ASUFilters;
  isLoading?: boolean;
}

const ASUSummaryTable: React.FC<ASUSummaryTableProps> = ({
  dailyMachineData,
  productionEfficiency,
  mainsReadings,
  weeklyData,
  onFiltersChange,
  filters = {},
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'production' | 'mains' | 'weekly'>('daily');
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof ASUFilters, value: string | number | Date | undefined) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange?.({ page: 1, limit: 10 });
  };

  const exportToCSV = () => {
    const dataToExport =
      activeTab === 'daily' ? dailyMachineData.data :
      activeTab === 'production' ? productionEfficiency.data :
      activeTab === 'mains' ? mainsReadings.data :
      weeklyData.data;

    if (!dataToExport || dataToExport.length === 0) return;

    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row =>
        headers.map(header => JSON.stringify((row as unknown as Record<string, unknown>)[header] ?? '')).join(',')
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

  const renderPagination = () => {
    const current = filters.page || 1;
    const totalPages =
      activeTab === 'daily' ? dailyMachineData.totalPages :
      activeTab === 'production' ? productionEfficiency.totalPages :
      activeTab === 'mains' ? mainsReadings.totalPages :
      weeklyData.totalPages;

    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-4 space-x-2">
        {[...Array(totalPages)].map((_, idx) => {
          const page = idx + 1;
          return (
            <button
              key={page}
              className={`px-3 py-1 text-sm rounded-md ${
                page === current
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100'
              }`}
              onClick={() => handleFilterChange('page', page)}
            >
              {page}
            </button>
          );
        })}
      </div>
    );
  };

  const renderTable = () => {
    const data = getCurrentData();
    if (data.length === 0) return null;

    const columns = {
      daily: ['date', 'machine', 'karigarName', 'yarn', 'reading8AM', 'reading8PM', 'machineHoursWorked', 'extraHours'],
      production: ['date', 'machine', 'shift', 'efficiency', 'targetEfficiency'],
      mains: ['date', 'unit', 'reading', 'consumption'],
      weekly: ['weekStart', 'weekEnd', 'machine', 'totalHours', 'averageEfficiency']
    }[activeTab];

    const headers = columns.map((key) => <th key={key} className="px-4 py-2 capitalize">{key}</th>);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-600 border dark:text-gray-300">
          <thead className="text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-100">
            <tr>{headers}</tr>
          </thead>
          <tbody>
            {data.map((row: Record<string , any >, idx: number) => (
              <tr key={idx} className="border-b dark:border-gray-600">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2">
                    {row[col] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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

  const renderPlaceholder = () => (
    <div className="py-12 text-center">
      <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
      <p className="text-gray-500 dark:text-gray-400">
        No {tabLabels[activeTab].toLowerCase()} records found
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg dark:bg-gray-800">
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

      {showFilters && (
        <div className="p-4 mb-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Machine</label>
              <select
                value={filters.machine?.toString() || ''}
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
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Karigar Name</label>
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
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Date From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Date To</label>
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
      )}

      <div className="p-6">
        {getCurrentData().length === 0 ? renderPlaceholder() : (
          <>
            {renderTable()}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default ASUSummaryTable;
