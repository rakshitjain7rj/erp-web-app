import React from 'react';

interface DailyYarnTypeBreakdownProps {
  limit?: number;
  isStandalonePage?: boolean;
}

// Placeholder implementation to satisfy build; replace with real metrics component later.
const DailyYarnTypeBreakdown: React.FC<DailyYarnTypeBreakdownProps> = ({ limit = 10, isStandalonePage }) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">Daily Yarn Type Breakdown</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">Showing last {limit} entries. Standalone: {isStandalonePage ? 'Yes' : 'No'}</p>
      <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">Placeholder component – implement data visualization later.</div>
    </div>
  );
};

export default DailyYarnTypeBreakdown;