import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Label } from '../ui/label';
import { Plus, Edit, Save, Trash2, X, RotateCcw } from 'lucide-react';
import type { ASUMachine } from '../../api/asuUnit1Api';
import { asuUnit2Api } from '../../api/asuUnit2Api';
import MachineFormModal from './MachineFormModal';
// Re‑use Unit1 history component & types for consistency
import { MachineConfigurationHistory, MachineConfiguration } from './MachineConfigurationHistory';

interface EditingMachine {
  id: number;
  machineNo: number;
  machineName?: string;
  count: number;
  countDisplay?: string;
  spindles: number | null;
  speed: number | null;
  yarnType: string;
  isActive: boolean;
  productionAt100: number;
}

const yarnTypes = ['Cotton', 'PC', 'CVC', 'Tencel', 'Polyester', 'Viscose', 'Cotton/Poly', 'Rayon', 'Blended', 'Acrylic', 'Linen'];

const MachineManagerUnit2: React.FC = () => {
  const [machines, setMachines] = useState<ASUMachine[]>([]);
  const [configurations, setConfigurations] = useState<MachineConfiguration[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<ASUMachine | null>(null);
  const [hasProductionEntries, setHasProductionEntries] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingMachine, setEditingMachine] = useState<EditingMachine | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      const list = await asuUnit2Api.getAllMachines();
      setMachines(list || []);
    } catch (error) {
      console.error('Error loading Unit 2 machines:', error);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMachines(); }, [loadMachines]);

  // Load configuration history (always show snapshots if exist; inject current state)
  const loadConfigurations = useCallback(async () => {
    if (!selectedMachine) { setConfigurations([]); setHasProductionEntries(false); return; }
    try {
      setLoading(true);
      let hasEntries = false;
      try {
        const resp = await asuUnit2Api.getProductionEntries({ machineId: selectedMachine.id, limit: 2 } as any);
        if (Array.isArray(resp)) hasEntries = resp.length > 0;
        else if ((resp as any)?.entries) hasEntries = (resp as any).entries.length > 0;
        else if ((resp as any)?.data) hasEntries = (resp as any).data.length > 0;
      } catch { /* ignore */ }
      setHasProductionEntries(hasEntries);
      const historyKey = `machine_config_history_unit2_${selectedMachine.id}`;
      const historyRaw = localStorage.getItem(historyKey);
      const history: any[] = historyRaw ? JSON.parse(historyRaw) : [];
      const configs: MachineConfiguration[] = history.map((item, idx) => ({
        id: item.id || idx,
        machineId: selectedMachine.id,
        count: item.count ?? 0,
        spindles: item.spindles ?? 0,
        speed: item.speed ?? 0,
        yarnType: item.yarnType || '',
        productionAt100: item.productionAt100 ?? 0,
        machineName: item.machineName || selectedMachine.machineName || '',
        createdAt: item.savedAt || item.createdAt || item.updatedAt || new Date().toISOString(),
        updatedAt: item.updatedAt || item.createdAt || item.savedAt || new Date().toISOString(),
        savedAt: item.savedAt
      }));
      const currentEntry: MachineConfiguration = {
        id: Date.now(),
        machineId: selectedMachine.id,
        count: selectedMachine.count ?? 0,
        spindles: selectedMachine.spindles ?? 0,
        speed: selectedMachine.speed ?? 0,
        yarnType: selectedMachine.yarnType || '',
        productionAt100: selectedMachine.productionAt100 ?? 0,
        machineName: selectedMachine.machineName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
        isActive: true
      } as any;
      if (configs.length === 0 || ['count', 'yarnType', 'spindles', 'speed', 'productionAt100'].some(k => String((configs[0] as any)[k]) !== String((currentEntry as any)[k]))) {
        configs.unshift(currentEntry);
      }
      configs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setConfigurations(configs);
    } finally { setLoading(false); }
  }, [selectedMachine]);

  useEffect(() => { if (selectedMachine) loadConfigurations(); }, [selectedMachine, loadConfigurations]);

  const handleMachineCreate = async (formData: any) => {
    const existing = machines.find(m => Number(m.machineNo) === Number(formData.machineNo));
    if (existing) { toast.error(`Machine ${formData.machineNo} already exists`); return; }
    try {
      setLoading(true);
      const machineData = {
        ...formData,
        machineNo: Number(formData.machineNo),
        unit: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const newMachine = await asuUnit2Api.createMachine(machineData);
      toast.success(`Machine ${newMachine.machineNo} created successfully`);
      setIsAddModalOpen(false);
      await loadMachines();
      setSelectedMachine(newMachine);
    } catch (error: any) {
      console.error('Error creating Unit 2 machine:', error);
      toast.error(error?.response?.data?.error || error.message || 'Failed to create machine');
    } finally { setLoading(false); }
  };

  const handleEdit = (machine: ASUMachine) => {
    const numericCount = typeof machine.count === 'string'
      ? (() => { const m = String(machine.count).match(/\d*\.?\d+/); return m ? parseFloat(m[0]) : 0; })()
      : (Number(machine.count) || 0);
    setEditingMachine({ id: machine.id, machineNo: Number(machine.machineNo) || 0, machineName: machine.machineName || '', count: numericCount, countDisplay: String(machine.count || numericCount), spindles: machine.spindles || 0, speed: Number(machine.speed) || 0, yarnType: machine.yarnType || 'Cotton', isActive: machine.isActive || false, productionAt100: Number(machine.productionAt100) || 0 });
  };

  // Snapshot helpers
  const saveSnapshot = (machine: ASUMachine) => {
    try {
      const historyKey = `machine_config_history_unit2_${machine.id}`;
      const history: any[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.push({ ...machine, savedAt: new Date().toISOString() });
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch { }
  };
  const configsDiffer = (a: ASUMachine, b: EditingMachine) => ['count', 'yarnType', 'spindles', 'speed', 'productionAt100', 'machineName', 'machineNo'].some(k => String((a as any)[k]) !== String((b as any)[k]));

  const handleSaveEdit = async () => {
    if (!editingMachine) return;
    try {
      setLoading(true);
      let previousMachine: ASUMachine | null = null;
      if (selectedMachine && selectedMachine.id === editingMachine.id && configsDiffer(selectedMachine, editingMachine)) {
        previousMachine = { ...selectedMachine };
        saveSnapshot(selectedMachine); // before update
      }
      await asuUnit2Api.updateMachine(editingMachine.id, {
        machineNo: editingMachine.machineNo,
        machine_name: editingMachine.machineName,
        count: editingMachine.count,
        spindles: editingMachine.spindles !== null ? editingMachine.spindles : 0,
        speed: editingMachine.speed !== null ? editingMachine.speed : 0,
        yarnType: editingMachine.yarnType,
        isActive: editingMachine.isActive,
        productionAt100: editingMachine.productionAt100
      } as any);
      toast.success('Machine updated successfully');
      setEditingMachine(null);
      if (selectedMachine && selectedMachine.id === editingMachine.id) {
        const updatedMachine = { ...selectedMachine, ...editingMachine };
        setSelectedMachine(updatedMachine);
        if (previousMachine && configsDiffer(previousMachine, editingMachine)) {
          saveSnapshot(updatedMachine as ASUMachine); // after update
        }
      }
      await loadMachines();
      if (selectedMachine && selectedMachine.id === editingMachine.id) await loadConfigurations();
    } catch (error: any) {
      console.error('Error updating Unit 2 machine:', error);
      toast.error(error?.response?.data?.error || error.message || 'Failed to update machine');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this machine? This will also delete all associated production data.')) return;
    try {
      setLoading(true);
      try { await asuUnit2Api.deleteMachine(id); } catch { await asuUnit2Api.deleteMachine(id, true); }
      toast.success('Machine deleted successfully');
      if (selectedMachine && selectedMachine.id === id) setSelectedMachine(null);
      await loadMachines();
    } catch (error: any) {
      console.error('Error deleting Unit 2 machine:', error);
      toast.error(error?.response?.data?.error || error.message || 'Failed to delete machine');
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Add Machine Modal (reusing Unit 1 modal) */}
      <MachineFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleMachineCreate}
        loading={loading}
        title="Add New Machine (Unit 2)"
      />

      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">Machine List (Unit 2)</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)} className="flex items-center text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                <Plus className="w-3 h-3 mr-1" />
                Add Machine
              </Button>
              <Button variant="outline" size="sm" onClick={loadMachines} disabled={loading} className="flex items-center text-xs">
                <RotateCcw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {loading && !machines.length ? (
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <div className="w-5 h-5 border-b-2 border-green-500 rounded-full animate-spin"></div>
                <span className="text-sm">Loading machines...</span>
              </div>
            </div>
          ) : machines.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <div className="p-2 mb-3 rounded-full bg-green-50 dark:bg-green-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">No machines found</p>
              <p className="max-w-md mt-1 text-sm text-gray-500 dark:text-gray-400">Click on "Add Machine" button to get started.</p>
              <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center mt-4 px-3 py-2 text-sm font-medium text-white transition-all duration-200 rounded-md bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-1.5" />Add Machine</Button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="w-full min-w-full">
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow className="border-b dark:border-gray-700">
                    <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Machine #</TableHead>
                    <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Name</TableHead>
                    <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Count</TableHead>
                    <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Yarn Type</TableHead>
                    <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Spindles</TableHead>
                    <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Speed</TableHead>
                    <TableHead className="px-3 py-2 text-xs font-medium text-left text-gray-500 sm:px-4 dark:text-gray-400">Prod @ 100%</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Status</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase sm:px-6 dark:text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {machines.map(machine => (
                    <TableRow key={machine.id} className={`transition-colors cursor-pointer ${selectedMachine?.id === machine.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`} onClick={() => setSelectedMachine(machine)}>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {editingMachine?.id === machine.id ? (
                          <Input type="number" value={editingMachine.machineNo} onChange={(e) => setEditingMachine({ ...editingMachine, machineNo: parseInt(e.target.value) || 0 })} className="w-20 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-gray-100">{machine.machineNo}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {editingMachine?.id === machine.id ? (
                          <Input type="text" value={editingMachine.machineName || ''} onChange={(e) => setEditingMachine({ ...editingMachine, machineName: e.target.value })} className="w-32 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">{machine.machineName || ''}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {editingMachine?.id === machine.id ? (
                          <Input type="text" value={editingMachine.countDisplay || editingMachine.count} onChange={(e) => { const displayValue = e.target.value; const numericMatch = displayValue.match(/^\d*\.?\d+/); const numericValue = numericMatch ? parseFloat(numericMatch[0]) : 0; setEditingMachine({ ...editingMachine, count: numericValue, countDisplay: displayValue }); }} className="w-20 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" onClick={(e) => e.stopPropagation()} placeholder="e.g., 30s or 0.65" />
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">{machine.count}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {editingMachine?.id === machine.id ? (
                          <div className="relative">
                            <Input type="text" value={editingMachine.yarnType || ''} onChange={(e) => setEditingMachine({ ...editingMachine, yarnType: e.target.value })} className="w-28 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" onClick={(e) => e.stopPropagation()} placeholder="Enter yarn type" />
                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm p-1 z-50 w-auto min-w-[120px]">
                              <div className="flex flex-wrap gap-1">
                                {yarnTypes.map(type => (
                                  <button key={type} type="button" onClick={(e) => { e.stopPropagation(); setEditingMachine({ ...editingMachine, yarnType: type }); }} className="px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded">{type}</button>
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
                          <Input type="number" value={editingMachine.spindles || ''} onChange={(e) => { const val = e.target.value.trim(); setEditingMachine({ ...editingMachine, spindles: val ? parseInt(val) : null }); }} className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">{machine.spindles}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {editingMachine?.id === machine.id ? (
                          <Input type="number" step="0.01" value={editingMachine.speed || ''} onChange={(e) => { const val = e.target.value.trim(); setEditingMachine({ ...editingMachine, speed: val ? parseFloat(val) : null }); }} className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">{machine.speed} RPM</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {editingMachine?.id === machine.id ? (
                          <Input type="number" step="0.00001" value={editingMachine.productionAt100 || ''} onChange={(e) => { const val = e.target.value.trim(); setEditingMachine({ ...editingMachine, productionAt100: val ? parseFloat(val) : 0 }); }} className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <span className="text-purple-600 font-medium dark:text-purple-400">{machine.productionAt100 ? Number(machine.productionAt100).toFixed(5) : 'N/A'}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {editingMachine?.id === machine.id ? (
                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={editingMachine.isActive} onChange={(e) => setEditingMachine({ ...editingMachine, isActive: e.target.checked })} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-400" />
                            <Label className="text-sm text-gray-700 dark:text-gray-300">Active</Label>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${machine.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{machine.isActive ? 'Active' : 'Inactive'}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
                        <div className="flex justify-end gap-2">
                          {editingMachine?.id === machine.id ? (
                            <>
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} disabled={loading} className="p-1 text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-green-500"><Save className="w-4 h-4" /></Button>
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); setEditingMachine(null); }} className="p-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"><X className="w-4 h-4" /></Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(machine); }} className="p-1 text-white rounded-md bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 dark:bg-indigo-900/70 dark:hover:bg-indigo-800 dark:text-indigo-200"><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(machine.id); }} className="p-1 text-white rounded-md bg-red-600 hover:bg-red-700 border border-red-700 dark:bg-red-900/70 dark:hover:bg-red-800 dark:text-red-200"><Trash2 className="w-4 h-4" /></Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      {/* Configuration History Section */}
      {selectedMachine && (
        <div className="mt-6">
          <MachineConfigurationHistory
            machine={selectedMachine as any}
            configurations={configurations}
            loading={loading}
            hasProductionEntries={hasProductionEntries}
          />
        </div>
      )}
    </>
  );
};

export default MachineManagerUnit2;
