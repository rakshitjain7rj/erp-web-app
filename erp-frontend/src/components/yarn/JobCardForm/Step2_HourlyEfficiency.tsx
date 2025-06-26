import React from 'react';
import { StepProps } from './types';

const Step2_HourlyEfficiency: React.FC<StepProps> = ({ jobCard, updateHourlyData, generateHourlySlots, setJobCard }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hourly Efficiency Data Collection</h3>
      <button
        onClick={() => setJobCard && setJobCard({ ...jobCard, hourlyEfficiency: generateHourlySlots ? generateHourlySlots() : [] })}
        className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Generate 6AM-6PM Slots
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-gray-100">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Time</th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Target (kg)</th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Actual (kg)</th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Efficiency %</th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Downtime (min)</th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Operator</th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Speed (RPM)</th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Breaks</th>
            <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {(jobCard.hourlyEfficiency || []).map((hour, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-3 py-2 text-sm font-medium">{hour.hour}</td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  step="0.01"
                  value={hour.targetProduction ?? 0}
                  onChange={e => updateHourlyData && updateHourlyData(index, 'targetProduction', Number(e.target.value))}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  step="0.01"
                  value={hour.actualProduction ?? 0}
                  onChange={e => updateHourlyData && updateHourlyData(index, 'actualProduction', Number(e.target.value))}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </td>
              <td className="px-3 py-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  hour.efficiency >= 85 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  hour.efficiency >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {hour.efficiency?.toFixed(1) ?? '0.0'}%
                </span>
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  value={hour.downtime ?? 0}
                  onChange={e => updateHourlyData && updateHourlyData(index, 'downtime', Number(e.target.value))}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={hour.operatorName || ''}
                  onChange={e => updateHourlyData && updateHourlyData(index, 'operatorName', e.target.value)}
                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Name"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  value={hour.machineSpeed ?? 0}
                  onChange={e => updateHourlyData && updateHourlyData(index, 'machineSpeed', Number(e.target.value))}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  value={hour.yarnBreaks ?? 0}
                  onChange={e => updateHourlyData && updateHourlyData(index, 'yarnBreaks', Number(e.target.value))}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={hour.notes || ''}
                  onChange={e => updateHourlyData && updateHourlyData(index, 'notes', e.target.value)}
                  className="w-32 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Notes"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Step2_HourlyEfficiency;
