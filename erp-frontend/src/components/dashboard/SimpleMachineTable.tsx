import React from 'react';

// Minimal placeholder matching expected interface
const SimpleMachineTable: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-3">Machine Overview</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400">
            <th className="py-2">Machine</th>
            <th className="py-2">Status</th>
            <th className="py-2">Efficiency</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-200 dark:border-gray-700">
            <td className="py-2">Placeholder 1</td>
            <td className="py-2">Running</td>
            <td className="py-2">92%</td>
          </tr>
          <tr className="border-t border-gray-200 dark:border-gray-700">
            <td className="py-2">Placeholder 2</td>
            <td className="py-2">Idle</td>
            <td className="py-2">--</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">Placeholder table – integrate real machine data later.</p>
    </div>
  );
};

export default SimpleMachineTable;