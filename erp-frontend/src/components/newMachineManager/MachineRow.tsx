// MachineRow.tsx - Memoized row component with inline editing (no delete - machines are fixed)
import React, { useState, memo, useCallback } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { ASUMachine } from '../../api/asuUnit1Api';

const YARN_TYPES = ['Cotton', 'PC', 'CVC', 'Tencel', 'Polyester', 'Viscose', 'Rayon', 'Blended', 'Acrylic', 'Linen'];

interface MachineRowProps {
  machine: ASUMachine;
  onUpdate: (id: number, data: Partial<ASUMachine>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

interface EditData {
  machineName: string;
  count: number;
  yarnType: string;
  spindles: number;
  speed: number;
  productionAt100: number;
  isActive: boolean;
}

// Custom comparison for memo - only re-render if machine data changed
const areEqual = (prev: MachineRowProps, next: MachineRowProps): boolean => {
  const p = prev.machine;
  const n = next.machine;
  return (
    p.id === n.id &&
    p.machineNo === n.machineNo &&
    p.machineName === n.machineName &&
    p.count === n.count &&
    p.yarnType === n.yarnType &&
    p.spindles === n.spindles &&
    p.speed === n.speed &&
    p.productionAt100 === n.productionAt100 &&
    p.isActive === n.isActive
  );
};

const MachineRow = memo(({ machine, onUpdate, onDelete }: MachineRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState<EditData>({
    machineName: machine.machineName || '',
    count: Number(machine.count) || 0,
    yarnType: machine.yarnType || 'Cotton',
    spindles: Number(machine.spindles) || 0,
    speed: Number(machine.speed) || 0,
    productionAt100: Number(machine.productionAt100) || 0,
    isActive: machine.isActive,
  });

  const handleEdit = useCallback(() => {
    setEditData({
      machineName: machine.machineName || '',
      count: Number(machine.count) || 0,
      yarnType: machine.yarnType || 'Cotton',
      spindles: Number(machine.spindles) || 0,
      speed: Number(machine.speed) || 0,
      productionAt100: Number(machine.productionAt100) || 0,
      isActive: machine.isActive,
    });
    setIsEditing(true);
  }, [machine]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    await onDelete(machine.id);
    setIsDeleting(false);
  }, [machine.id, onDelete]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Instant save - close immediately, API runs in background
  const handleSave = useCallback(() => {
    setIsEditing(false);
    onUpdate(machine.id, editData);
  }, [machine.id, editData, onUpdate]);

  // Input change handlers
  const updateField = useCallback(<K extends keyof EditData>(field: K, value: EditData[K]) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Common input styles
  const inputClass = "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
  const cellClass = "px-3 py-2 whitespace-nowrap text-sm";

  if (isEditing) {
    return (
      <tr className="bg-blue-50 dark:bg-blue-900/20">
        <td className={`${cellClass} font-medium text-gray-900 dark:text-gray-100`}>
          {machine.machineNo}
        </td>
        <td className={cellClass}>
          <input
            type="text"
            value={editData.machineName}
            onChange={(e) => updateField('machineName', e.target.value)}
            className={`${inputClass} w-24`}
            placeholder="Name"
          />
        </td>
        <td className={cellClass}>
          <input
            type="number"
            value={editData.count || ''}
            onChange={(e) => updateField('count', parseFloat(e.target.value) || 0)}
            className={`${inputClass} w-16`}
            placeholder="0"
          />
        </td>
        <td className={cellClass}>
          <select
            value={editData.yarnType}
            onChange={(e) => updateField('yarnType', e.target.value)}
            className={`${inputClass} w-24`}
          >
            {YARN_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </td>
        <td className={cellClass}>
          <input
            type="number"
            value={editData.spindles || ''}
            onChange={(e) => updateField('spindles', parseInt(e.target.value) || 0)}
            className={`${inputClass} w-20`}
            placeholder="0"
          />
        </td>
        <td className={cellClass}>
          <input
            type="number"
            value={editData.speed || ''}
            onChange={(e) => updateField('speed', parseFloat(e.target.value) || 0)}
            className={`${inputClass} w-20`}
            placeholder="0"
          />
        </td>
        <td className={cellClass}>
          <input
            type="number"
            step="0.00001"
            value={editData.productionAt100 || ''}
            onChange={(e) => updateField('productionAt100', parseFloat(e.target.value) || 0)}
            className={`${inputClass} w-20`}
            placeholder="0"
          />
        </td>
        <td className={cellClass}>
          <input
            type="checkbox"
            checked={editData.isActive}
            onChange={(e) => updateField('isActive', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </td>
        <td className={`${cellClass} text-right`}>
          <div className="flex justify-end gap-1">
            <button
              onClick={handleSave}
              className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 rounded"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className={`${cellClass} font-medium text-gray-900 dark:text-gray-100`}>
        {machine.machineNo}
      </td>
      <td className={`${cellClass} text-gray-700 dark:text-gray-300`}>
        {machine.machineName || '-'}
      </td>
      <td className={cellClass}>
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
          {machine.count || 0}
        </span>
      </td>
      <td className={`${cellClass} text-gray-700 dark:text-gray-300`}>
        {machine.yarnType || 'Cotton'}
      </td>
      <td className={`${cellClass} text-gray-700 dark:text-gray-300`}>
        {machine.spindles || 0}
      </td>
      <td className={`${cellClass} text-gray-700 dark:text-gray-300`}>
        {machine.speed || 0} RPM
      </td>
      <td className={cellClass}>
        <span className="text-purple-600 font-medium dark:text-purple-400">
          {machine.productionAt100 ? Number(machine.productionAt100).toFixed(5) : '0'}
        </span>
      </td>
      <td className={cellClass}>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${machine.isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
          {machine.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className={`${cellClass} text-right`}>
        <div className="flex justify-end gap-1">
          <button
            onClick={handleEdit}
            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Edit Configuration"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
            title="Delete Machine"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}, areEqual);

MachineRow.displayName = 'MachineRow';

export default MachineRow;
