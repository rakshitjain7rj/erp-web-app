// MachineTable.tsx - Memoized table container (config-only, no add/delete)
import React, { memo } from 'react';
import { ASUMachine } from '../../api/asuUnit1Api';
import MachineRow from './MachineRow';

interface MachineTableProps {
  machines: ASUMachine[];
  loading: boolean;
  onUpdate: (id: number, data: Partial<ASUMachine>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

const MachineTable = memo(({ machines, loading, onUpdate, onDelete }: MachineTableProps) => {
  const headerClass = "px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className={`${headerClass} w-16`}>No</th>
              <th className={headerClass}>Name</th>
              <th className={`${headerClass} w-20`}>Count</th>
              <th className={headerClass}>Yarn Type</th>
              <th className={`${headerClass} w-24`}>Spindles</th>
              <th className={`${headerClass} w-24`}>Speed (RPM)</th>
              <th className={`${headerClass} w-28`}>Prod @ 100%</th>
              <th className={`${headerClass} w-20`}>Status</th>
              <th className={`${headerClass} text-right w-24`}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Loading machines...</span>
                  </div>
                </td>
              </tr>
            ) : machines.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No machines found. Click 'Add Machine' to create one.
                </td>
              </tr>
            ) : (
              machines.map((machine) => (
                <MachineRow
                  key={machine.id}
                  machine={machine}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

MachineTable.displayName = 'MachineTable';

export default MachineTable;
