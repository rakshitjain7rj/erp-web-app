import React from 'react';
import { StepProps } from './types';

const Step4_UtilitiesAndQuality: React.FC<StepProps> = ({
  jobCard,
  updateUtilityReading,
  addUtilityReading,
  setJobCard
}) => {
  return (
    <div className="space-y-6">
      {/* Utility Readings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Utility Readings</h3>
          <button
            onClick={() => addUtilityReading && addUtilityReading()}
            className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
          >
            Add Reading
          </button>
        </div>

        {(jobCard.utilityReadings || []).map((reading, index) => (
          <div key={index} className="grid grid-cols-1 gap-4 p-4 mb-4 rounded-lg md:grid-cols-6 bg-gray-50 dark:bg-gray-900">
            <input
              type="datetime-local"
              value={reading.timestamp?.slice(0, 16) || ''}
              onChange={e => updateUtilityReading?.(index, 'timestamp', e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <input
              type="number"
              placeholder="Electricity (kWh)"
              value={reading.electricity ?? 0}
              onChange={e => updateUtilityReading?.(index, 'electricity', Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <input
              type="number"
              placeholder="Water (L)"
              value={reading.water ?? 0}
              onChange={e => updateUtilityReading?.(index, 'water', Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <input
              type="number"
              placeholder="Steam (kg)"
              value={reading.steam ?? 0}
              onChange={e => updateUtilityReading?.(index, 'steam', Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <input
              type="number"
              placeholder="Gas (m³)"
              value={reading.gas ?? 0}
              onChange={e => updateUtilityReading?.(index, 'gas', Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <button
              onClick={() => {
                const updated = jobCard.utilityReadings?.filter((_, i) => i !== index) || [];
                setJobCard?.({ ...jobCard, utilityReadings: updated });
              }}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Yarn Quality Parameters */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Yarn Quality Parameters</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Yarn Count (e.g. 30s)"
            value={jobCard.qualityParams?.yarnCount || ''}
            onChange={e =>
              setJobCard?.({
                ...jobCard,
                qualityParams: { ...jobCard.qualityParams, yarnCount: e.target.value }
              })
            }
            className="px-3 py-2 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Strength (g/tex)"
            value={jobCard.qualityParams?.strength || ''}
            onChange={e =>
              setJobCard?.({
                ...jobCard,
                qualityParams: { ...jobCard.qualityParams, strength: Number(e.target.value) }
              })
            }
            className="px-3 py-2 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Evenness (%)"
            value={jobCard.qualityParams?.evenness || ''}
            onChange={e =>
              setJobCard?.({
                ...jobCard,
                qualityParams: { ...jobCard.qualityParams, evenness: Number(e.target.value) }
              })
            }
            className="px-3 py-2 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <input
            type="number"
            placeholder="Imperfections (IPI)"
            value={jobCard.qualityParams?.ipi || ''}
            onChange={e =>
              setJobCard?.({
                ...jobCard,
                qualityParams: { ...jobCard.qualityParams, ipi: Number(e.target.value) }
              })
            }
            className="px-3 py-2 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>
      </div>
    </div>
  );
};

export default Step4_UtilitiesAndQuality;
