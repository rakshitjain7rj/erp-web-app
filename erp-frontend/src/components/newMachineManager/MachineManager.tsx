// MachineManager.tsx - Config manager with Add/Delete support
import React, { useState, memo, useCallback } from 'react';
import { Settings, History, Plus, RotateCcw } from 'lucide-react';
import { useMachineData } from './useMachineData';
import MachineTable from './MachineTable';
import ConfigHistoryTab from './ConfigHistoryTab';
import MachineFormModal, { MachineFormData } from './MachineFormModal';
import { Button } from '../ui/Button';

type TabType = 'config' | 'history';

const MachineManager: React.FC = () => {
  const { machines, loading, updateMachine, createMachine, deleteMachine, loadMachines } = useMachineData();
  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleMachineCreate = async (formData: MachineFormData) => {
    if (formData.machineNo === null) return;
    console.log('Machines:', machines);

    // Check if machine already exists (check both machineNo and machine_number)
    const existing = machines.find(m => {
      const mNo = Number(m.machineNo !== undefined ? m.machineNo : m.machine_number);
      return mNo === Number(formData.machineNo);
    });

    if (existing) {
      alert(`Machine ${formData.machineNo} already exists in the list!`);
      return;
    }

    const newMachine = await createMachine({
      machineNo: formData.machineNo,
      machineName: formData.machineName,
      count: formData.count,
      yarnType: formData.yarnType,
      spindles: formData.spindles || 0,
      speed: formData.speed || 0,
      productionAt100: formData.productionAt100 || 0,
      isActive: formData.isActive,
      unit: 1
    });

    if (newMachine) {
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <MachineFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleMachineCreate}
        loading={loading}
        title="Add New Machine (Unit 1)"
      />

      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Machine Configuration
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure count, yarn type, spindles, speed, and production settings
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Machine
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMachines}
              disabled={loading}
              className="flex items-center text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Tab buttons */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => handleTabChange('config')}
              className={`px-4 py-2 flex items-center gap-2 rounded-md text-sm font-medium transition-all ${activeTab === 'config'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'
                }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configuration</span>
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`px-4 py-2 flex items-center gap-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'
                }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'config' ? (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
            {machines.length} machine{machines.length !== 1 ? 's' : ''}
          </div>
          <MachineTable
            machines={machines}
            loading={loading}
            onUpdate={updateMachine}
            onDelete={deleteMachine}
          />
        </>
      ) : (
        <ConfigHistoryTab machines={machines} />
      )}
    </div>
  );
};

export default memo(MachineManager);
