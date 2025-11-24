import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Edit, Save, Trash2, X, RotateCcw } from 'lucide-react';
import { ASUMachine, asuUnit1Api } from '../../api/asuUnit1Api';
import { MachineConfigurationHistory, MachineConfiguration } from './MachineConfigurationHistory';
import MachineFormModal from './MachineFormModal';

interface EditingMachine {
  id: number;
  machineNo: number;
  machineName?: string;
  count: number; // Backend requires a number
  countDisplay?: string; // Optional display version
  spindles: number | null;
  speed: number | null;
  yarnType: string;
  isActive: boolean;
  productionAt100: number;
}

const yarnTypes = ['Cotton', 'PC', 'CVC', 'Tencel', 'Polyester', 'Viscose', 'Cotton/Poly', 'Rayon', 'Blended', 'Acrylic', 'Linen'];

const MachineManager: React.FC = () => {
  const [machines, setMachines] = useState<ASUMachine[]>([]);
  const [configurations, setConfigurations] = useState<MachineConfiguration[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<ASUMachine | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingMachine, setEditingMachine] = useState<EditingMachine | null>(null);
  const [hasProductionEntries, setHasProductionEntries] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load machines data
  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      const machines = await asuUnit1Api.getAllMachines();
      setMachines(machines || []);
    } catch (error) {
      console.error('Error loading machines:', error);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load machine configurations 
  // Load configuration history for the selected machine
  const loadConfigurations = useCallback(async () => {
    if (!selectedMachine) return;

    try {
      setLoading(true);

      // First check if the machine has any production entries
      const hasEntries = await asuUnit1Api.checkMachineHasProductionEntries(selectedMachine.id);
      setHasProductionEntries(hasEntries);

      // If there are no production entries, don't show any configuration history
      if (!hasEntries) {
        console.log('No production entries for this machine, clearing configuration history');
        setConfigurations([]);
        setLoading(false);
        return;
      }

      // Load the configuration history
      const history = await asuUnit1Api.getMachineConfigHistory(selectedMachine.id);

      // Convert history items to MachineConfiguration format
      const configs: MachineConfiguration[] = history.map((item, index) => ({
        id: index,
        machineId: selectedMachine.id,
        count: item.count || 0,
        spindles: item.spindles || 0,
        speed: item.speed || 0,
        yarnType: item.yarnType || '',
        productionAt100: item.productionAt100 || 0,
        machineName: item.machineName || '',
        createdAt: item.savedAt || new Date(item.updated_at || item.createdAt || '').toISOString(),
        updatedAt: item.updated_at || item.updatedAt || ''
      }));

      // Sort configurations in reverse chronological order (newest first)
      configs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setConfigurations(configs);
    } catch (error) {
      console.error('Error loading machine configurations:', error);
      toast.error('Failed to load machine configuration history');
      setHasProductionEntries(false);
      setConfigurations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMachine]);

  // Initial data loading
  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  // Load configurations when a machine is selected
  useEffect(() => {
    if (selectedMachine) {
      loadConfigurations();
    }
  }, [selectedMachine, loadConfigurations]);

  const handleMachineSelect = async (machineId: string) => {
    if (!machineId || machineId === "no-machines") {
      setSelectedMachine(null);
      setHasProductionEntries(false);
      return;
    }

    const machineIdNum = parseInt(machineId);
    const machine = machines.find(m => m.id === machineIdNum);

    if (machine) {
      setSelectedMachine(machine);

      // Reset production entries flag when selecting a new machine
      // It will be updated properly when loadConfigurations runs
      setHasProductionEntries(false);
    } else {
      console.warn(`Machine with ID ${machineId} not found`);
      toast.error("Selected machine not found");
    }
  };

  const handleMachineCreate = async (formData: any) => {
    // Check if machine number already exists
    const existingMachine = machines.find(m => m.machineNo === formData.machineNo);
    if (existingMachine) {
      toast.error(`Machine ${formData.machineNo} already exists`);
      return;
    }

    try {
      setLoading(true);

      // Create the new machine with required fields - ensure machineNo is properly cast to number
      const machineData = {
        ...formData,
        machineNo: Number(formData.machineNo), // Explicitly ensure machineNo is a number
        unit: 1, // Default to unit 1
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Submitting new machine with machineNo:', machineData.machineNo);

      const newMachine = await asuUnit1Api.createMachine(machineData);
      toast.success(`Machine ${newMachine.machineNo} created successfully`);

      // Close the modal
      setIsAddModalOpen(false);

      // Reload machines
      await loadMachines();

      // Select the newly created machine
      setSelectedMachine(newMachine);
    } catch (error) {
      console.error('Error creating machine:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create machine';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (machine: ASUMachine) => {
    const numericCount = typeof machine.count === 'string'
      ? (() => { const m = String(machine.count).match(/\d*\.?\d+/); return m ? parseFloat(m[0]) : 0; })()
      : (Number(machine.count) || 0);

    setEditingMachine({
      id: machine.id,
      machineNo: Number(machine.machineNo) || 0,
      machineName: machine.machineName || '',
      count: numericCount,
      countDisplay: String(machine.count || numericCount), // Keep original display format
      spindles: machine.spindles || 0,
      speed: Number(machine.speed) || 0,
      yarnType: machine.yarnType || 'Cotton',
      isActive: machine.isActive || false,
      productionAt100: Number(machine.productionAt100) || 0
    });
  };

  // Helper function to manually save configuration history
  // Only saves if there's an actual change in the configuration AND production entries exist
  const saveConfigurationHistory = async (machine: ASUMachine) => {
    try {
      // First check if this machine has any production entries
      const hasProductionEntries = await asuUnit1Api.checkMachineHasProductionEntries(machine.id);

      // If there are no production entries, don't save the configuration
      if (!hasProductionEntries) {
        console.log('No production entries exist for this machine, skipping configuration history save');
        return;
      }

      // Save to localStorage for backward compatibility
      const historyKey = `machine_config_history_${machine.id}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

      // Check if we have a previous configuration
      if (history.length > 0) {
        const lastConfig = history[history.length - 1];

        // Check if important values have changed
        const sameCount = String(lastConfig.count) === String(machine.count);
        const sameYarnType = lastConfig.yarnType === machine.yarnType;
        const sameSpindles = String(lastConfig.spindles) === String(machine.spindles);
        const sameSpeed = String(lastConfig.speed) === String(machine.speed);
        const sameProduction = String(lastConfig.productionAt100) === String(machine.productionAt100);

        // If all values are the same, don't save a new entry
        if (sameCount && sameYarnType && sameSpindles && sameSpeed && sameProduction) {
          console.log('No changes detected in configuration, skipping history save');
          return;
        }
      }

      // Prepare the new configuration entry
      const configEntry = {
        ...machine,
        savedAt: new Date().toISOString()
      };

      // Save to localStorage for backward compatibility
      history.push(configEntry);
      localStorage.setItem(historyKey, JSON.stringify(history));
      console.log('Configuration history saved to localStorage');

      // Also try to save to the server if the endpoint exists
      try {
        console.log('Attempting to save configuration to server...');
        await asuUnit1Api.saveMachineConfiguration(machine.id, configEntry);
        console.log('Configuration history saved to server');
      } catch (serverError) {
        console.log('Could not save configuration to server, but saved to localStorage:', serverError);
      }
    } catch (error) {
      console.error('Error saving configuration history:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMachine) return;

    try {
      setLoading(true);

      // If we're updating a selected machine, save its current state to history before update
      if (selectedMachine && selectedMachine.id === editingMachine.id) {
        // This is now an async call
        await saveConfigurationHistory(selectedMachine);
      }

      await asuUnit1Api.updateMachine(editingMachine.id, {
        machineNo: editingMachine.machineNo,
        machine_name: editingMachine.machineName,
        count: editingMachine.count,
        // Send default values if null to prevent backend errors
        spindles: editingMachine.spindles !== null ? editingMachine.spindles : 0,
        speed: editingMachine.speed !== null ? editingMachine.speed : 0,
        yarnType: editingMachine.yarnType,
        isActive: editingMachine.isActive,
        productionAt100: editingMachine.productionAt100
      });

      toast.success('Machine updated successfully');
      setEditingMachine(null);

      // Update the selected machine if it's the one that was edited
      if (selectedMachine && selectedMachine.id === editingMachine.id) {
        const updatedMachine = { ...selectedMachine, ...editingMachine };
        setSelectedMachine(updatedMachine);
      }

      await loadMachines();

      // Also reload configurations if we modified the selected machine
      if (selectedMachine && selectedMachine.id === editingMachine.id) {
        await loadConfigurations();
      }
    } catch (error) {
      console.error('Error updating machine:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update machine';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this machine? This will also delete all associated production data.')) {
      return;
    }

    try {
      setLoading(true);

      try {
        // First try normal delete
        await asuUnit1Api.deleteMachine(id);
      } catch (initialError) {
        console.warn('Initial delete failed, trying with force option:', initialError);
        // If normal delete fails, try with force=true
        await asuUnit1Api.deleteMachine(id, true);
      }

      toast.success('Machine deleted successfully');

      // If the deleted machine was selected, clear the selection
      if (selectedMachine && selectedMachine.id === id) {
        setSelectedMachine(null);
      }

      await loadMachines();
    } catch (error) {
      console.error('Error deleting machine:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete machine';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Production at 100% is now manually entered by the user

  // Keeping the calculation function for reference, but not auto-applying it
  // Users will now enter the productionAt100 value manually

  const calculateProductionAt100Reference = (count: number, spindles: number, speed: number) => {
    // Formula: (Spindles × Speed × 0.84 × 24) / (count × 14400)
    const production = (spindles * speed * 0.84 * 24) / (count * 14400);
    return Math.round(production * 100) / 100; // Round to 2 decimal places
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Machine Management</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Machine
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                <TableHead className="w-[100px]">Machine No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Yarn Type</TableHead>
                <TableHead>Spindles</TableHead>
                <TableHead>Speed (RPM)</TableHead>
                <TableHead>Prod @ 100%</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : machines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                    No machines found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                machines.map((machine) => (
                  <TableRow
                    key={machine.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selectedMachine?.id === machine.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    onClick={() => handleMachineSelect(machine.id.toString())}
                  >
                    <TableCell className="font-medium">
                      {editingMachine?.id === machine.id ? (
                        <Input
                          type="number"
                          value={editingMachine.machineNo}
                          onChange={(e) => setEditingMachine({ ...editingMachine, machineNo: parseInt(e.target.value) || 0 })}
                          className="w-20 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        machine.machineNo
                      )}
                    </TableCell>
                    <TableCell>
                      {editingMachine?.id === machine.id ? (
                        <Input
                          type="text"
                          value={editingMachine.machineName || ''}
                          onChange={(e) => setEditingMachine({ ...editingMachine, machineName: e.target.value })}
                          className="w-32 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Name"
                        />
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">{machine.machineName || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingMachine?.id === machine.id ? (
                        <Input
                          type="number"
                          value={editingMachine.count}
                          onChange={(e) => setEditingMachine({ ...editingMachine, count: parseInt(e.target.value) || 0 })}
                          className="w-20 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {machine.count}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingMachine?.id === machine.id ? (
                        <div className="relative">
                          <Input
                            type="text"
                            value={editingMachine.yarnType || ''}
                            onChange={(e) => setEditingMachine({ ...editingMachine, yarnType: e.target.value })}
                            className="w-28 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Enter yarn type"
                          />
                          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm p-1 z-50 w-auto min-w-[120px]">
                            <div className="flex flex-wrap gap-1">
                              {yarnTypes.map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingMachine({ ...editingMachine, yarnType: type });
                                  }}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">{machine.yarnType}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                      {editingMachine?.id === machine.id ? (
                        <Input
                          type="number"
                          value={editingMachine.spindles || ''}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setEditingMachine({
                              ...editingMachine,
                              spindles: val ? parseInt(val) : null
                            });
                          }}
                          className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">{machine.spindles}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                      {editingMachine?.id === machine.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editingMachine.speed || ''}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setEditingMachine({
                              ...editingMachine,
                              speed: val ? parseFloat(val) : null
                            });
                          }}
                          className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">{machine.speed} RPM</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                      {editingMachine?.id === machine.id ? (
                        <Input
                          type="number"
                          value={editingMachine.productionAt100 || ''}
                          step="0.00001"
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setEditingMachine({
                              ...editingMachine,
                              productionAt100: val ? parseFloat(val) : 0
                            });
                          }}
                          className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-purple-600 font-medium dark:text-purple-400">
                          {machine.productionAt100 ? Number(machine.productionAt100).toFixed(5) : 'N/A'}
                        </span>
                      )}
                    </TableCell>
                    {/* Status field */}
                    <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                      {editingMachine?.id === machine.id ? (
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={editingMachine.isActive}
                            onChange={(e) => setEditingMachine({ ...editingMachine, isActive: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-400"
                          />
                          <Label className="text-sm text-gray-700 dark:text-gray-300">Active</Label>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${machine.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                          {machine.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
                      <div className="flex justify-end gap-2">
                        {editingMachine?.id === machine.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit();
                              }}
                              disabled={loading}
                              className="p-1 text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-green-500"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMachine(null);
                              }}
                              className="p-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(machine);
                              }}
                              className="p-1 text-blue-600 border-transparent bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(machine.id);
                              }}
                              className="p-1 text-red-600 border-transparent bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Configuration History */}
      {selectedMachine && (
        <div className="mt-6">
          <MachineConfigurationHistory
            machine={selectedMachine}
            configurations={configurations}
            loading={loading}
            hasProductionEntries={hasProductionEntries}
          />
        </div>
      )}

      <MachineFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleMachineCreate}
        loading={loading}
      />
    </div>
  );
};

export default MachineManager;
