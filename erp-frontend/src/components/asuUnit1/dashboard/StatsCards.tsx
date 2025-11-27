import React from 'react';
import { Activity, TrendingUp, Package, Calendar } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';

interface StatsCardsProps {
  totalProduction: number;
  entryCount: number;
  averagePerDay: number;
  topYarnType: string;
  loading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ 
  totalProduction, 
  entryCount, 
  averagePerDay, 
  topYarnType,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Production",
      value: `${totalProduction.toLocaleString()} kg`,
      icon: Activity,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100/50 dark:bg-blue-900/20"
    },
    {
      title: "Entries",
      value: entryCount,
      icon: Calendar,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100/50 dark:bg-purple-900/20"
    },
    {
      title: "Avg / Day",
      value: `${Math.round(averagePerDay).toLocaleString()} kg`,
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100/50 dark:bg-green-900/20"
    },
    {
      title: "Top Yarn",
      value: topYarnType || "N/A",
      icon: Package,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100/50 dark:bg-orange-900/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="border-none shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-full ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default React.memo(StatsCards);
