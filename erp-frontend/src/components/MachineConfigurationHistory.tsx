import React, { useState } from 'react';
import { MachineConfiguration, CreateMachineConfigurationData, UpdateMachineConfigurationData } from '../api/machineConfigApi';
import { machineConfigApi } from '../api/machineConfigApi';
import { ASUMachine } from '../api/asuUnit1Api';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface MachineConfigurationHistoryProps {
  machine: ASUMachine | null;
  onConfigurationUpdated?: () => void;
}

const MachineConfigurationHistory: React.FC<MachineConfigurationHistoryProps> = ({ 
  machine,
  onConfigurationUpdated 
}) => {
  const [configurations, setConfigurations] = useState<MachineConfiguration[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedConfig, setSelectedConfig] = useState<MachineConfiguration | null>(null);
  const [formData, setFormData] = useState<CreateMachineConfigurationData>({
    spindleCount: 0,
    yarnType: '',
    efficiencyAt100Percent: 0
  });

  // Fetch configurations when machine is selected
  React.useEffect(() => {
    if (machine?.id) {
      fetchConfigurations();
    } else {
      setConfigurations([]);
    }
  }, [machine]);

  const fetchConfigurations = async () => {
    if (!machine) return;
    
    try {
      setLoading(true);
      const data = await machineConfigApi.getMachineConfigurations(machine.id);
      setConfigurations(data);
    } catch (error) {
      console.error('Error fetching machine configurations:', error);
      toast.error('Failed to load machine configuration history');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    if (!machine) return;
    
    setFormData({
      spindleCount: machine.spindles || 0,
      yarnType: machine.yarnType || 'Cotton',
      efficiencyAt100Percent: Number(machine.productionAt100) || 0,
      startDate: new Date().toISOString().split('T')[0]
    });
    
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (config: MachineConfiguration) => {
    setSelectedConfig(config);
    setFormData({
      spindleCount: config.spindleCount,
      yarnType: config.yarnType,
      efficiencyAt100Percent: config.efficiencyAt100Percent,
      startDate: config.startDate
    });
    
    setIsEditModalOpen(true);
  };

  const handleAddConfiguration = async () => {
    if (!machine) return;
    
    try {
      setLoading(true);
      // Add saveHistory=true to ensure we save this configuration in the history
      const configData = {
        ...formData,
        saveHistory: true
      };
      await machineConfigApi.createMachineConfiguration(machine.id, configData);
      toast.success('Configuration added successfully');
      setIsAddModalOpen(false);
      fetchConfigurations();
      if (onConfigurationUpdated) onConfigurationUpdated();
    } catch (error) {
      console.error('Error adding configuration:', error);
      toast.error('Failed to add configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfiguration = async () => {
    if (!selectedConfig) return;
    
    try {
      setLoading(true);
      await machineConfigApi.updateMachineConfiguration(selectedConfig.id, formData as UpdateMachineConfigurationData);
      toast.success('Configuration updated successfully');
      setIsEditModalOpen(false);
      fetchConfigurations();
      if (onConfigurationUpdated) onConfigurationUpdated();
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfiguration = async (configId: number) => {
    try {
      setLoading(true);
      await machineConfigApi.deleteMachineConfiguration(configId);
      toast.success('Configuration deleted successfully');
      fetchConfigurations();
    } catch (error: any) {
      console.error('Error deleting configuration:', error);
      toast.error(error.response?.data?.error || 'Failed to delete configuration');
    } finally {
      setLoading(false);
    }
  };

  if (!machine) {
    return <div className="text-center py-6 text-gray-500">Select a machine to view configuration history</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Configuration History</h3>
        <Button 
          onClick={handleOpenAddModal}
          className="px-3 py-1 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded"
        >
          Add New Configuration
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : configurations.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 dark:bg-yellow-900/20 dark:border-yellow-900/30">
          <p className="text-yellow-800 dark:text-yellow-200">No configuration history available. Add a new configuration to start tracking changes.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-md border dark:bg-gray-800 dark:border-gray-700">
          <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Start Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">End Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Duration</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Spindles</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Yarn Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">100% Efficiency</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {configurations.map((config) => {
                const isActive = config.endDate === null;
                const duration = machineConfigApi.calculateDurationInDays(config.startDate, config.endDate);
                const formattedDuration = machineConfigApi.formatDuration(duration);
                
                return (
                  <tr 
                    key={config.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(config.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isActive ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Active
                        </span>
                      ) : (
                        new Date(config.endDate!).toLocaleDateString()
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formattedDuration}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{config.spindleCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{config.yarnType}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{config.efficiencyAt100Percent}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(config)}
                          disabled={isActive}
                          className={`p-1 text-xs rounded ${
                            isActive ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/20'
                          }`}
                          title={isActive ? "Can't edit active configuration" : "Edit configuration"}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteConfiguration(config.id)}
                          disabled={isActive}
                          className={`p-1 text-xs rounded ${
                            isActive ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20'
                          }`}
                          title={isActive ? "Can't delete active configuration" : "Delete configuration"}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Configuration Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Configuration
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-4">
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                This will close the current active configuration and create a new one.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right text-gray-700 dark:text-gray-300">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, startDate: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="spindleCount" className="text-right text-gray-700 dark:text-gray-300">
                    Spindles
                  </Label>
                  <Input
                    id="spindleCount"
                    type="number"
                    value={formData.spindleCount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, spindleCount: parseInt(e.target.value) || 0 })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="yarnType" className="text-right text-gray-700 dark:text-gray-300">
                    Yarn Type
                  </Label>
                  <Input
                    id="yarnType"
                    value={formData.yarnType}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, yarnType: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="efficiencyAt100Percent" className="text-right text-gray-700 dark:text-gray-300">
                    100% Efficiency
                  </Label>
                  <Input
                    id="efficiencyAt100Percent"
                    type="number"
                    step="0.01"
                    value={formData.efficiencyAt100Percent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, efficiencyAt100Percent: parseFloat(e.target.value) || 0 })}
                    className="col-span-3"
                  />
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setIsAddModalOpen(false)}
                className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddConfiguration}
                disabled={loading}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {loading ? "Adding..." : "Add Configuration"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Configuration Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Configuration
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-4">
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Edit historical configuration details.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editStartDate" className="text-right text-gray-700 dark:text-gray-300">
                    Start Date
                  </Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, startDate: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editSpindleCount" className="text-right text-gray-700 dark:text-gray-300">
                    Spindles
                  </Label>
                  <Input
                    id="editSpindleCount"
                    type="number"
                    value={formData.spindleCount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, spindleCount: parseInt(e.target.value) || 0 })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editYarnType" className="text-right text-gray-700 dark:text-gray-300">
                    Yarn Type
                  </Label>
                  <Input
                    id="editYarnType"
                    value={formData.yarnType}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, yarnType: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editEfficiencyAt100Percent" className="text-right text-gray-700 dark:text-gray-300">
                    100% Efficiency
                  </Label>
                  <Input
                    id="editEfficiencyAt100Percent"
                    type="number"
                    step="0.01"
                    value={formData.efficiencyAt100Percent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, efficiencyAt100Percent: parseFloat(e.target.value) || 0 })}
                    className="col-span-3"
                  />
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateConfiguration}
                disabled={loading}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {loading ? "Updating..." : "Update Configuration"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineConfigurationHistory;
