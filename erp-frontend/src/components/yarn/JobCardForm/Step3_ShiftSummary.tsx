import React from 'react';
import { StepProps } from './types';

const Step3_ShiftSummary: React.FC<StepProps> = ({ jobCard }) => (
  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
    <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Shift Summary</h4>
    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
      <div>
        <span className="text-gray-600 dark:text-gray-400">Total Target:</span>
        <div className="font-medium">
          {jobCard.hourlyEfficiency?.reduce((sum, h) => sum + h.targetProduction, 0).toFixed(2)} kg
        </div>
      </div>
      <div>
        <span className="text-gray-600 dark:text-gray-400">Total Actual:</span>
        <div className="font-medium">
          {jobCard.hourlyEfficiency?.reduce((sum, h) => sum + h.actualProduction, 0).toFixed(2)} kg
        </div>
      </div>
      <div>
        <span className="text-gray-600 dark:text-gray-400">Average Efficiency:</span>
        <div className="font-medium">
          {jobCard.hourlyEfficiency && jobCard.hourlyEfficiency.length > 0 
            ? (jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.efficiency, 0) / jobCard.hourlyEfficiency.length).toFixed(1)
            : '0.0'}%
        </div>
      </div>
      <div>
        <span className="text-gray-600 dark:text-gray-400">Total Downtime:</span>
        <div className="font-medium">
          {jobCard.hourlyEfficiency?.reduce((sum, h) => sum + h.downtime, 0)} min
        </div>
      </div>
      <div>
        <span className="text-gray-600 dark:text-gray-400">Total Breaks:</span>
        <div className="font-medium">
          {jobCard.hourlyEfficiency?.reduce((sum, h) => sum + (h.yarnBreaks || 0), 0)}
        </div>
      </div>
    </div>
  </div>
);

export default Step3_ShiftSummary;
