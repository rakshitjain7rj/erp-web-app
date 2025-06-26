import React from 'react';
import { StepProps } from './types';

const Step4_UtilitiesAndQuality: React.FC<StepProps> = ({ jobCard, updateUtilityReading, addUtilityReading, setJobCard }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Utility Readings & Quality Parameters</h3>
    {/* Utility Readings */}
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">Daily Utility (Mains) Readings</h4>
        <button
          onClick={() => addUtilityReading && addUtilityReading()}
          className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
        >
          Add Reading
        </button>
      </div>
      <div className="space-y-3">
        {(jobCard.utilityReadings || []).map((reading, index) => (
          <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-7">
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Time</label>
                <input
                  type="datetime-local"
                  value={reading.timestamp?.slice(0, 16) || ''}
                  onChange={e => updateUtilityReading && updateUtilityReading(index, 'timestamp', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Electricity (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={reading.electricity ?? 0}
                  onChange={e => updateUtilityReading && updateUtilityReading(index, 'electricity', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Water (L)</label>
                <input
                  type="number"
                  value={reading.water ?? 0}
                  onChange={e => updateUtilityReading && updateUtilityReading(index, 'water', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Steam (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={reading.steam ?? 0}
                  onChange={e => updateUtilityReading && updateUtilityReading(index, 'steam', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Gas (m³)</label>
                <input
                  type="number"
                  step="0.1"
                  value={reading.gas ?? 0}
                  onChange={e => updateUtilityReading && updateUtilityReading(index, 'gas', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
                <select
                  value={reading.readingType}
                  onChange={e => updateUtilityReading && updateUtilityReading(index, 'readingType', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="start">Start</option>
                  <option value="end">End</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    const updated = jobCard.utilityReadings?.filter((_, i) => i !== index) || [];
                    setJobCard && setJobCard({ ...jobCard, utilityReadings: updated });
                  }}
                  className="p-1 text-red-600 rounded hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    {/* Quality Parameters (simplified for brevity) */}
    <div>
      <h4 className="mb-4 font-medium text-gray-900 dark:text-gray-100">Yarn Quality Control Parameters</h4>
      {/* ...quality fields as in main form... */}
    </div>
  </div>
);

export default Step4_UtilitiesAndQuality;
