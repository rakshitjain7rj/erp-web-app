import React from 'react';
import { Package, Calendar, TrendingUp } from 'lucide-react';

interface YarnSummaryStatsProps {
  stats: {
    totalProduction: number;
    totalDays: number;
    yarnTypes: number;
    averageDaily: number;
  } | null;
}

export const YarnSummaryStats: React.FC<YarnSummaryStatsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Production</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProduction.toFixed(1)} kg</p>
          </div>
        </div>
      </div>
      <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Days Tracked</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDays}</p>
          </div>
        </div>
      </div>
      <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
            <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Yarn Types</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.yarnTypes}</p>
          </div>
        </div>
      </div>
      <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/30">
            <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Average</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageDaily.toFixed(1)} kg</p>
          </div>
        </div>
      </div>
    </div>
  );
};
