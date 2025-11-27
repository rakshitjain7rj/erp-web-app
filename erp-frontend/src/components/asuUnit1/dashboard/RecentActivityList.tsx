import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface ProductionEntry {
  id?: number;
  yarnType?: string;
  machine?: { yarnType?: string };
  actualProduction?: number | string;
  shift?: string;
  date?: string;
}

interface RecentActivityListProps {
  entries: ProductionEntry[];
  loading?: boolean;
}

const RecentActivityList: React.FC<RecentActivityListProps> = ({ entries, loading }) => {
  if (loading) {
    return <div className="h-[400px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />;
  }

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
    .slice(0, 8);

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-gray-800 h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentEntries.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {entry.yarnType || entry.machine?.yarnType || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.date} • Shift {entry.shift}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {Number(entry.actualProduction).toFixed(1)} kg
              </span>
            </div>
          ))}
          {recentEntries.length === 0 && (
            <p className="text-center text-gray-500 py-4">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(RecentActivityList);
