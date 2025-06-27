import React from 'react';
import { StepProps } from './types';

const Step5_ShiftPerformance: React.FC<StepProps> = ({ jobCard, setJobCard }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Shift Information</h3>

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
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Supervisor name"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Operators (comma-separated)</label>
        <input
          type="text"
          value={jobCard.shiftData?.operators?.join(', ') || ''}
          onChange={e => setJobCard({
            ...jobCard,
            shiftData: {
              ...jobCard.shiftData!,
              operators: e.target.value.split(',').map(op => op.trim()).filter(op => op)
            }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Operator1, Operator2"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
    </div>
  </div>
);

export default Step5_ShiftPerformance;
