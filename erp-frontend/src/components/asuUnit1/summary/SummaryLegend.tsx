import React from 'react';

interface SummaryLegendProps {
  show: boolean;
  onToggle: (show: boolean) => void;
}

const SummaryLegend: React.FC<SummaryLegendProps> = ({ show, onToggle }) => {
  if (!show) {
    return (
      <div className="mt-4 text-center">
        <button
          onClick={() => onToggle(true)}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Show Legend
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Legend</h4>
        <button
          onClick={() => onToggle(false)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Hide
        </button>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">All Yarn Types from Production History</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1 py-0.5 text-[10px] rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">ACTIVE</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">Currently on active machines</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">123.45</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">Production amount</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">0.00</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">No production</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SummaryLegend);
