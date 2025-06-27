import React from 'react';
import { StepProps } from './types';

const Step5_ShiftPerformance: React.FC<StepProps> = ({ jobCard, setJobCard }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Shift Information & Performance Analysis</h3>
    {/* Shift Information */}
    <div>
      <h4 className="mb-4 font-medium text-gray-900 dark:text-gray-100">Shift Details</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Shift</label>
          <select
            value={jobCard.shiftData?.shift || 'A'}
            onChange={e => {
              const shift = e.target.value as 'A' | 'B' | 'C';
              const shiftLabels = {
                A: 'Morning (6AM-2PM)',
                B: 'Afternoon (2PM-10PM)',
                C: 'Night (10PM-6AM)'
              };
              setJobCard({
                ...jobCard,
                shiftData: {
                  ...jobCard.shiftData!,
                  shift,
                  shiftLabel: shiftLabels[shift]
                }
              });
            }}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="A">Shift A (6AM-2PM)</option>
            <option value="B">Shift B (2PM-10PM)</option>
            <option value="C">Shift C (10PM-6AM)</option>
          </select>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Supervisor</label>
          <input
            type="text"
            value={jobCard.shiftData?.supervisor || ''}
            onChange={e => setJobCard({
              ...jobCard,
              shiftData: { ...jobCard.shiftData!, supervisor: e.target.value }
            })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Supervisor name"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Operators (comma-separated)</label>
          <input
            type="text"
            value={Array.isArray(jobCard.shiftData?.operators) ? jobCard.shiftData.operators.join(', ') : ''}
            onChange={e => {
              // Ensure proper splitting of comma-separated values
              const operatorsArray = e.target.value
                .split(',')
                .map(op => op.trim())
                .filter(op => op);
                
              console.log('Operators input:', e.target.value);
              console.log('Parsed operators array:', operatorsArray);
                
              setJobCard({
                ...jobCard,
                shiftData: {
                  ...jobCard.shiftData || {},
                  operators: operatorsArray
                }
              });
            }}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Operator1, Operator2, Operator3"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Actual Start Time</label>
          <input
            type="time"
            value={jobCard.shiftData?.actualStartTime || ''}
            onChange={e => setJobCard({
              ...jobCard,
              shiftData: { ...jobCard.shiftData!, actualStartTime: e.target.value }
            })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Actual End Time</label>
          <input
            type="time"
            value={jobCard.shiftData?.actualEndTime || ''}
            onChange={e => setJobCard({
              ...jobCard,
              shiftData: { ...jobCard.shiftData!, actualEndTime: e.target.value }
            })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
    {/* Performance Analysis Summary */}
    <div className="p-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
      <h4 className="mb-4 font-medium text-gray-900 dark:text-gray-100">Performance Analysis Summary</h4>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Total Actual Production (kg)</label>
          <input
            type="number"
            step="0.01"
            value={jobCard.totalActualProduction || 0}
            onChange={e => setJobCard({
              ...jobCard,
              totalActualProduction: Number(e.target.value)
            })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Total Target Production (kg)</label>
          <input
            type="number"
            step="0.01"
            value={jobCard.totalTargetProduction || 0}
            onChange={e => setJobCard({
              ...jobCard,
              totalTargetProduction: Number(e.target.value)
            })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Average Efficiency (%)</label>
          <input
            type="number"
            step="0.01"
            value={jobCard.averageEfficiency || 0}
            onChange={e => setJobCard({
              ...jobCard,
              averageEfficiency: Number(e.target.value)
            })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Total Downtime (minutes)</label>
          <input
            type="number"
            value={jobCard.totalDowntime || 0}
            onChange={e => setJobCard({
              ...jobCard,
              totalDowntime: Number(e.target.value)
            })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Quality Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={jobCard.qualityScore || 0}
            onChange={e => setJobCard({
              ...jobCard,
              qualityScore: Number(e.target.value)
            })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Defect Count</label>
          <input
            type="number"
            min="0"
            value={jobCard.defectCount || 0}
            onChange={e => setJobCard({
              ...jobCard,
              defectCount: Number(e.target.value)
            })}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="0"
          />
        </div>
      </div>
      
      <div className="flex items-center mt-4">
        <input
          type="checkbox"
          id="reworkRequired"
          checked={jobCard.reworkRequired || false}
          onChange={e => setJobCard({
            ...jobCard,
            reworkRequired: e.target.checked
          })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor="reworkRequired" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Rework Required
        </label>
      </div>
      
      <div className="mt-4">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Performance Notes</label>
        <textarea
          value={jobCard.notes || ''}
          onChange={e => setJobCard({
            ...jobCard,
            notes: e.target.value
          })}
          rows={3}
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Add any important notes or observations about this shift's performance"
        ></textarea>
      </div>
    </div>
  </div>
);

export default Step5_ShiftPerformance;
