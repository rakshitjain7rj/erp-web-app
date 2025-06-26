import React from 'react';
import ControlledInput from './ControlledInput';
import { StepProps } from './types';

const Step1_TheoreticalParams: React.FC<StepProps> = ({ jobCard, setJobCard, machines }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Job Information</h3>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <ControlledInput
        label="Yarn Type/Product"
        value={jobCard.productType || ''}
        onChange={e => setJobCard({ ...jobCard, productType: e.target.value })}
        placeholder="e.g., 30s Cotton Combed"
      />
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Machine</label>
        <select
          value={jobCard.machineId || 0}
          onChange={e => {
            const machineId = Number(e.target.value);
            setJobCard({
              ...jobCard,
              machineId,
              theoreticalParams: {
                ...jobCard.theoreticalParams!,
                machineId
              }
            });
          }}
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value={0}>Select Machine</option>
          {Array.isArray(machines) && machines.map((machine: any) => (
            <option key={machine.id} value={machine.id}>
              {machine.machineId} - {machine.name}
            </option>
          ))}
        </select>
      </div>
      <ControlledInput
        label="Target Quantity"
        type="number"
        value={jobCard.quantity ?? 0}
        onChange={e => setJobCard({ ...jobCard, quantity: Number(e.target.value) })}
      />
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Unit</label>
        <select
          value={jobCard.unit || 'kg'}
          onChange={e => setJobCard({ ...jobCard, unit: e.target.value })}
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="kg">kg</option>
          <option value="tons">tons</option>
          <option value="pounds">pounds</option>
        </select>
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
        <select
          value={jobCard.priority || 'medium'}
          onChange={e => setJobCard({ ...jobCard, priority: e.target.value as any })}
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <ControlledInput
        label="Due Date"
        type="date"
        value={jobCard.dueDate?.split('T')[0] || ''}
        onChange={e => setJobCard({ ...jobCard, dueDate: e.target.value })}
      />
      <ControlledInput
        label="Party/Client"
        value={jobCard.partyName || ''}
        onChange={e => setJobCard({ ...jobCard, partyName: e.target.value })}
        placeholder="Client name"
      />
    </div>
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Job Notes</label>
      <textarea
        value={jobCard.notes || ''}
        onChange={e => setJobCard({ ...jobCard, notes: e.target.value })}
        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        rows={3}
        placeholder="Additional notes or special instructions..."
      />
    </div>
  </div>
);

export default Step1_TheoreticalParams;
