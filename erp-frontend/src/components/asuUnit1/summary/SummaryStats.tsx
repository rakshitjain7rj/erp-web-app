import React from 'react';
import { Package, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';

interface YarnSummaryStats {
  totalProduction: number;
  totalDays: number;
  yarnTypes: number;
  averageDaily: number;
}

interface SummaryStatsProps {
  stats: YarnSummaryStats | null;
  loading?: boolean;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Total Production",
      value: `${stats.totalProduction.toFixed(1)} kg`,
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      label: "Days Tracked",
      value: stats.totalDays,
      icon: Calendar,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30"
    },
    {
      label: "Yarn Types",
      value: stats.yarnTypes,
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      label: "Daily Average",
      value: `${stats.averageDaily.toFixed(1)} kg`,
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/30"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(SummaryStats);
