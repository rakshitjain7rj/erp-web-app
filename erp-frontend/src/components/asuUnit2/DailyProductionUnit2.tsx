// Simplified Unit2 specific placeholder until generic refactor is complete.
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Edit, Plus, Save, Trash2, X } from 'lucide-react';
import type { ASUMachine, ASUProductionEntry, ProductionStats } from '../../api/asuUnit1Api';
import { asuUnit2Api } from '../../api/asuUnit2Api';

interface EditingEntry {
  id: number;
  dayShift: number;
  nightShift: number;
  date: string;
  dayShiftId?: number;
  nightShiftId?: number;
}

interface Unit2FormData {
  machineId: number;
  date: string;
  dayShift: number;
  nightShift: number;
  yarnType?: string;
  // Unit 2 extras
  dayMains?: number;
  nightMains?: number;
  workerName?: string;
}

const DailyProductionUnit2: React.FC = () => {
  const [machines, setMachines] = useState<ASUMachine[]>([]);
  const [productionEntries, setProductionEntries] = useState<ASUProductionEntry[]>([]);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<ASUMachine | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const [machineYarnHistory, setMachineYarnHistory] = useState<{ [machineId: number]: {date: string, yarnType: string}[] }>({});
  const [formData, setFormData] = useState<Unit2FormData>({
    machineId: 0,
    date: new Date().toISOString().split('T')[0],
    dayShift: 0,
    nightShift: 0,
    yarnType: '',
    dayMains: undefined,
    nightMains: undefined,
    workerName: ''
  });

  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      const list = await asuUnit2Api.getAllMachines();
      setMachines(list || []);
      if (list && list.length > 0 && !selectedMachine) {
        const first = list[0];
        setSelectedMachine(first);
        setFormData(prev => ({ ...prev, machineId: first.id, yarnType: first.yarnType || 'Cotton' }));
      }
    } catch (e) {
      console.error('Error loading Unit 2 machines:', e);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  }, [selectedMachine]);

  const loadStats = useCallback(async () => {
    try {
      const s = await asuUnit2Api.getProductionStats();
      setStats(s as any);
    } catch (e) {
      console.error('Error loading Unit 2 stats:', e);
    }
  }, []);

  const storageKey = 'machineYarnHistory_unit2';
  const loadMachineYarnHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setMachineYarnHistory(JSON.parse(saved));
    } catch (e) {
      console.error('Error loading unit2 yarn history:', e);
    }
  }, []);
  const saveMachineYarnHistory = useCallback((history: {[machineId: number]: {date: string, yarnType: string}[]}) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving unit2 yarn history:', e);
    }
  }, []);

  const findHistoricalYarnType = (machineId: number, date: string): string | undefined => {
    if (!machineId || !date) return undefined;
    const list = machineYarnHistory[machineId] || [];
    if (!list.length) return undefined;
    const exact = list.find(h => h.date === date);
    if (exact) return exact.yarnType;
    const entryDate = new Date(date).getTime();
    const sorted = [...list].sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const h of sorted) {
      if (new Date(h.date).getTime() <= entryDate) return h.yarnType;
    }
    return sorted.length ? sorted[sorted.length - 1].yarnType : undefined;
  };

  const getProductionAt100Value = (obj: any): number => {
    if (!obj) return 400;
    if (obj.productionAt100 !== undefined && obj.productionAt100 !== null) {
      const v = typeof obj.productionAt100 === 'string' ? parseFloat(obj.productionAt100) : Number(obj.productionAt100);
      if (!isNaN(v) && v > 0) return v;
    }
    if (obj.machine && obj.machine.productionAt100) {
      const v = typeof obj.machine.productionAt100 === 'string' ? parseFloat(obj.machine.productionAt100) : Number(obj.machine.productionAt100);
      if (!isNaN(v) && v > 0) return v;
    }
    return 400;
  };

  const loadProductionEntries = useCallback(async () => {
    if (!selectedMachine) return;
    try {
      setLoading(true);
      const resp = await asuUnit2Api.getProductionEntries({ machineId: selectedMachine.id, limit: 30 } as any);
      const rawItems = resp?.items || resp?.data?.items || [];

      // Group backend day/night entries into combined entries
      const map: Record<string, any> = {};
      for (const entry of rawItems) {
        const key = `${entry.date}_${entry.machineNumber}`;
        if (!map[key]) {
          map[key] = {
            id: entry.id,
            originalId: entry.id,
            // Use DB machine id for history lookups; fall back to selectedMachine
            machineId: entry.machine?.id || selectedMachine?.id,
            date: entry.date,
            dayShift: 0,
            nightShift: 0,
            total: 0,
            percentage: 0,
            machine: entry.machine,
            yarnType: entry.yarnType,
            productionAt100: entry.productionAt100
          } as ASUProductionEntry & { dayShiftId?: number; nightShiftId?: number };
        }
        const prod = typeof entry.actualProduction === 'string' ? parseFloat(entry.actualProduction) : Number(entry.actualProduction || 0);
        if (entry.shift === 'day') {
          map[key].dayShift = prod;
          map[key].dayShiftId = entry.id;
        } else if (entry.shift === 'night') {
          map[key].nightShift = prod;
          map[key].nightShiftId = entry.id;
        }
        // update machine ref if present
        if (entry.machine && (!map[key].machine || entry.machine.productionAt100)) {
          map[key].machine = entry.machine;
        }
      }

      const combined: (ASUProductionEntry & { dayShiftId?: number; nightShiftId?: number })[] = Object.values(map).map((e: any) => {
        const day = typeof e.dayShift === 'string' ? parseFloat(e.dayShift) : Number(e.dayShift || 0);
        const night = typeof e.nightShift === 'string' ? parseFloat(e.nightShift) : Number(e.nightShift || 0);
        const total = day + night;
        const prod100 = getProductionAt100Value(e);
        const pct = prod100 > 0 ? (total / prod100) * 100 : 0;
        return { ...e, dayShift: day, nightShift: night, total, percentage: pct };
      }).sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());

      // Initialize yarn history if needed
      if (selectedMachine.yarnType && (!machineYarnHistory[selectedMachine.id] || machineYarnHistory[selectedMachine.id].length === 0)) {
        const newHistory = { ...machineYarnHistory, [selectedMachine.id]: [{ date: new Date().toISOString().split('T')[0], yarnType: selectedMachine.yarnType }] };
        setMachineYarnHistory(newHistory);
        saveMachineYarnHistory(newHistory);
      }

      setProductionEntries(combined as any);
    } catch (e) {
      console.error('Error loading Unit 2 entries:', e);
      toast.error('Failed to load production entries');
    } finally {
      setLoading(false);
    }
  }, [selectedMachine, machineYarnHistory, saveMachineYarnHistory]);

  useEffect(() => {
    loadMachines();
    loadStats();
    loadMachineYarnHistory();
  }, [loadMachines, loadStats, loadMachineYarnHistory]);

  useEffect(() => {
    if (selectedMachine) loadProductionEntries();
  }, [selectedMachine, loadProductionEntries]);

  const handleMachineSelect = (machineId: string) => {
    if (!machineId || machineId === 'no-machines') {
      setSelectedMachine(null);
      setFormData(prev => ({ ...prev, machineId: 0, yarnType: '' }));
      return;
    }
    const id = parseInt(machineId, 10);
    const m = machines.find(mm => mm.id === id);
    if (m) {
      setSelectedMachine(m);
      setFormData(prev => ({ ...prev, machineId: id, yarnType: m.yarnType || 'Cotton' }));
      if ((!machineYarnHistory[m.id] || machineYarnHistory[m.id].length === 0) && m.yarnType) {
        const today = new Date().toISOString().split('T')[0];
        const newHistory = { ...machineYarnHistory, [m.id]: [{ date: today, yarnType: m.yarnType }] };
        setMachineYarnHistory(newHistory);
        saveMachineYarnHistory(newHistory);
      }
    } else {
      toast.error('Selected machine not found');
    }
  };

  const calculateTotal = (day: number | string, night: number | string) => {
    const n = (v: any) => (v === undefined || v === null ? 0 : (typeof v === 'string' ? parseFloat(v) : Number(v))) || 0;
    return n(day) + n(night);
  };
  const calculatePercentage = (total: number | string, productionAt100: number | string) => {
    const t = parseFloat(String(total)) || 0;
    const p = parseFloat(String(productionAt100)) || 0;
    return p > 0 ? (t / p) * 100 : 0;
    };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !formData.machineId) {
      toast.error('Please select a machine');
      return;
    }
    try {
      setLoading(true);
      const productionAt100 = getProductionAt100Value({ machine: selectedMachine });
      const entryYarnType = selectedMachine.yarnType || 'Cotton';

      // Save yarn history for the date
      const machineHistory = machineYarnHistory[selectedMachine.id] || [];
      const exists = machineHistory.find(h => h.date === formData.date);
      const updated = exists 
        ? machineHistory.map(h => h.date === formData.date ? { ...h, yarnType: entryYarnType } : h)
        : [...machineHistory, { date: formData.date, yarnType: entryYarnType }];
      const newHistory = { ...machineYarnHistory, [selectedMachine.id]: updated };
      setMachineYarnHistory(newHistory);
      saveMachineYarnHistory(newHistory);

      // Build remarks string with Unit 2 extras
      const extras: string[] = [];
      if (formData.workerName) extras.push(`worker=${formData.workerName}`);
      if (formData.dayMains !== undefined && formData.dayMains !== null) extras.push(`dayMains=${formData.dayMains}`);
      if (formData.nightMains !== undefined && formData.nightMains !== null) extras.push(`nightMains=${formData.nightMains}`);
      const remarks = extras.join('; ');

      const requests: Promise<any>[] = [];
      // Prefer machine_number/machineNumber, fallback to machineNo. Coerce safely
      const machineNumber = Number(
        (selectedMachine as any).machine_number ??
        (selectedMachine as any).machineNumber ??
        selectedMachine.machineNo
      );
      if (!Number.isFinite(machineNumber) || machineNumber <= 0) throw new Error('Invalid machine number');

      const dayVal = parseFloat(String(formData.dayShift)) || 0;
      const nightVal = parseFloat(String(formData.nightShift)) || 0;

      if (dayVal > 0) {
        requests.push(
          asuUnit2Api.createProductionEntry({
            // backend expects machineNumber, date, shift, actualProduction, theoreticalProduction, yarnType, remarks
            // we pass with type override
            ...(undefined as any),
            machineNumber,
            date: formData.date,
            shift: 'day',
            actualProduction: dayVal,
            theoreticalProduction: productionAt100,
            yarnType: entryYarnType,
            remarks
          } as any)
        );
      }
      if (nightVal > 0) {
        requests.push(
          asuUnit2Api.createProductionEntry({
            ...(undefined as any),
            machineNumber,
            date: formData.date,
            shift: 'night',
            actualProduction: nightVal,
            theoreticalProduction: productionAt100,
            yarnType: entryYarnType,
            remarks
          } as any)
        );
      }

      if (requests.length === 0) {
        toast.error('Enter production for at least one shift');
        setLoading(false);
        return;
      }

      await Promise.all(requests);
      toast.success('Production entry created');

      // Reset form
      setFormData({
        machineId: selectedMachine.id,
        date: new Date().toISOString().split('T')[0],
        dayShift: 0,
        nightShift: 0,
        yarnType: selectedMachine.yarnType || 'Cotton',
        dayMains: undefined,
        nightMains: undefined,
        workerName: ''
      });

      await loadMachines();
      setTimeout(async () => {
        await loadProductionEntries();
        await loadStats();
      }, 200);
    } catch (error: any) {
      console.error('Error creating Unit 2 production entry:', error);
      if (error?.response?.status === 409) {
        toast.error(`Entry already exists for ${formData.date}. Edit instead.`);
      } else {
        toast.error(error?.response?.data?.error || error.message || 'Failed to create entry');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingEntry({
      id: entry.id,
      dayShift: parseFloat(String(entry.dayShift || 0)),
      nightShift: parseFloat(String(entry.nightShift || 0)),
      date: entry.date,
      dayShiftId: entry.dayShiftId,
      nightShiftId: entry.nightShiftId
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    try {
      setLoading(true);
      const updates: Promise<any>[] = [];
      const yarnTypeToUse = findHistoricalYarnType(selectedMachine?.id || 0, editingEntry.date) || selectedMachine?.yarnType || 'Cotton';

      if (editingEntry.dayShiftId) {
        updates.push(asuUnit2Api.updateProductionEntry(editingEntry.dayShiftId, {
          ...(undefined as any),
          date: editingEntry.date,
          dayShift: editingEntry.dayShift,
          yarnType: yarnTypeToUse
        } as any));
      }
      if (editingEntry.nightShiftId) {
        updates.push(asuUnit2Api.updateProductionEntry(editingEntry.nightShiftId, {
          ...(undefined as any),
          date: editingEntry.date,
          nightShift: editingEntry.nightShift,
          yarnType: yarnTypeToUse
        } as any));
      }
      await Promise.all(updates);
      toast.success('Production entry updated');
      setEditingEntry(null);
      await loadProductionEntries();
      await loadStats();
    } catch (e) {
      console.error('Error updating Unit 2 entry:', e);
      toast.error('Failed to update entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this production entry?')) return;
    try {
      setLoading(true);
      // Find the entry to get day/night IDs
      const row = productionEntries.find(e => e.id === id) as any;
      if (row?.dayShiftId) {
        try { await asuUnit2Api.deleteProductionEntry(row.dayShiftId); } catch {}
      }
      if (row?.nightShiftId) {
        try { await asuUnit2Api.deleteProductionEntry(row.nightShiftId); } catch {}
      }
      toast.success('Production entry deleted');
      await loadProductionEntries();
      await loadStats();
    } catch (e) {
      console.error('Error deleting Unit 2 entry:', e);
      toast.error('Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyBadgeClass = (percentage: number) => {
    if (percentage >= 85) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (percentage >= 70) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  const formatYarnType = (yarnType: string | undefined): string => {
    if (!yarnType) return 'Unknown';
    return yarnType
      .split(' ')
      .map(word => (['pp', 'cvc', 'pc'].includes(word.toLowerCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
      .join(' ');
  };

  return (
    <>
      {stats && (
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Machines</span>
              <span className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMachines}</span>
            </div>
          </div>
          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Machines</span>
              <span className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeMachines}</span>
            </div>
          </div>
          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Entries</span>
              <span className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.todayEntries}</span>
            </div>
          </div>
          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Efficiency</span>
              <span className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{(stats as any).averageEfficiency?.toFixed ? (stats as any).averageEfficiency.toFixed(1) : Number((stats as any).averageEfficiency || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 bg-green-50 dark:bg-green-900/20 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-base font-medium text-green-800 dark:text-green-200">Daily Production Entry (Unit 2)</h2>
          <div className="text-xs text-green-600 dark:text-green-300">Includes mains readings & worker</div>
        </div>
        <div className="p-5">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="machine" className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Machine</Label>
                    {loading && <span className="w-4 h-4 border-b-2 border-blue-500 rounded-full animate-spin"></span>}
                  </div>
                  <Select onValueChange={handleMachineSelect} value={selectedMachine ? selectedMachine.id.toString() : ''}>
                    <SelectTrigger className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                      {selectedMachine ? (
                        <span className="block truncate dark:text-gray-200">
                          {selectedMachine.machineName || `Machine ${selectedMachine.machineNo || '?'}`} - {selectedMachine.count || '?'} Count - {selectedMachine.yarnType || 'Cotton'}
                        </span>
                      ) : (
                        <SelectValue placeholder="-- Select Machine --" />
                      )}
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {machines && machines.length > 0 ? (
                        machines.map(m => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.machineName || `Machine ${m.machineNo || '?'}`} - {m.count || '?'} Count - {m.yarnType || 'Cotton'}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-machines">No machines available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedMachine && (
                  <>
                    <div>
                      <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Date</Label>
                      <Input id="date" type="date" value={formData.date} onChange={(e)=> setFormData({ ...formData, date: e.target.value })} className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dayShift" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Day Shift (kg)</Label>
                        <Input id="dayShift" type="number" step="0.01" value={formData.dayShift} onChange={(e)=> setFormData({ ...formData, dayShift: parseFloat(e.target.value) || 0 })} className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                      </div>
                      <div>
                        <Label htmlFor="nightShift" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Night Shift (kg)</Label>
                        <Input id="nightShift" type="number" step="0.01" value={formData.nightShift} onChange={(e)=> setFormData({ ...formData, nightShift: parseFloat(e.target.value) || 0 })} className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                      </div>
                    </div>

                    {/* Unit 2 specific fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="dayMains" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Day Mains Reading</Label>
                        <Input id="dayMains" type="number" step="0.01" value={formData.dayMains ?? ''} onChange={(e)=> setFormData({ ...formData, dayMains: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" placeholder="Optional" />
                      </div>
                      <div>
                        <Label htmlFor="nightMains" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Night Mains Reading</Label>
                        <Input id="nightMains" type="number" step="0.01" value={formData.nightMains ?? ''} onChange={(e)=> setFormData({ ...formData, nightMains: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" placeholder="Optional" />
                      </div>
                      <div>
                        <Label htmlFor="workerName" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Worker Name</Label>
                        <Input id="workerName" type="text" value={formData.workerName || ''} onChange={(e)=> setFormData({ ...formData, workerName: e.target.value })} className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" placeholder="Optional" />
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="p-4 mb-5 border border-green-100 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 dark:border-green-800/30">
                        <h4 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">Production Summary</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-green-100 rounded-full dark:bg-green-800/30">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-700 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Total: <span className="font-bold text-green-700 dark:text-green-300">{calculateTotal(formData.dayShift, formData.nightShift).toFixed(2)} kg</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-green-100 rounded-full dark:bg-green-800/30">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-700 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                            </span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Efficiency: <span className="font-bold text-green-700 dark:text-green-300">{calculatePercentage(calculateTotal(formData.dayShift, formData.nightShift), Number(selectedMachine?.productionAt100) || 0).toFixed(1)}%</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <Button type="submit" className="flex items-center justify-center w-full px-3 py-2 font-medium text-white rounded-md bg-green-600 hover:bg-green-700" disabled={loading || !selectedMachine}>
                        <Plus className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Add Production Entry'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-orange-50 dark:bg-orange-900/20 dark:border-gray-700">
          <h2 className="text-base font-medium text-orange-800 dark:text-orange-200">
            Production History {selectedMachine && ` - ${selectedMachine.machineName || `Machine ${selectedMachine.machineNo}`}`}
          </h2>
          {selectedMachine && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 rounded-sm border border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300">
              {selectedMachine.isActive ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <div className="w-5 h-5 border-b-2 border-orange-500 rounded-full animate-spin"></div>
                <span className="text-sm">Loading entries...</span>
              </div>
            </div>
          ) : productionEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <div className="p-2 mb-3 rounded-full bg-orange-50 dark:bg-orange-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-orange-500 dark:text-orange-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">{selectedMachine ? 'No production entries found' : 'Select a machine to view entries'}</p>
              <p className="max-w-md mt-1 text-sm text-gray-500 dark:text-gray-400">{selectedMachine ? 'Add production data using the form above.' : 'Choose a machine from the dropdown first.'}</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="w-full min-w-full">
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow className="border-b dark:border-gray-700">
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Date</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Yarn Type</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Day Shift</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Night Shift</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Total</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Efficiency</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase sm:px-6 dark:text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {productionEntries.map((entry: any) => (
                    <TableRow key={entry.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {editingEntry && editingEntry.id === entry.id ? (
                          <Input type="date" value={editingEntry.date} onChange={(e)=> setEditingEntry(prev => prev ? { ...prev, date: e.target.value } : prev)} className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(entry.date).toLocaleDateString()}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        <div className="flex items-center">
                          {(() => {
                            let displayYarnType = entry.yarnType || selectedMachine?.yarnType || 'Cotton';
                            const historical = findHistoricalYarnType(entry.machineId, entry.date);
                            if (!entry.yarnType && historical) displayYarnType = historical;
                            const current = selectedMachine?.yarnType || 'Cotton';
                            const isHistorical = displayYarnType !== current;
                            return (
                              <>
                                <div className={`w-2 h-2 mr-2 rounded-full ${isHistorical ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                <span className={`font-medium ${isHistorical ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>{formatYarnType(displayYarnType)}</span>
                                {isHistorical && <span className="ml-2 px-1.5 py-0.5 text-xs rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Historical</span>}
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {editingEntry && editingEntry.id === entry.id ? (
                          <Input type="number" step="0.01" value={editingEntry.dayShift} onChange={(e)=> setEditingEntry(prev => prev ? { ...prev, dayShift: parseFloat(e.target.value) || 0 } : prev)} className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">{parseFloat(String(entry.dayShift || 0)).toFixed(2)} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span></span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {editingEntry && editingEntry.id === entry.id ? (
                          <Input type="number" step="0.01" value={editingEntry.nightShift} onChange={(e)=> setEditingEntry(prev => prev ? { ...prev, nightShift: parseFloat(e.target.value) || 0 } : prev)} className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">{(Number.isNaN(Number(entry.nightShift)) ? 0 : Number(entry.nightShift)).toFixed(2)} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span></span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 font-medium whitespace-nowrap sm:px-6">
                        {editingEntry && editingEntry.id === entry.id
                          ? <span className="text-blue-600 dark:text-blue-400">{calculateTotal(editingEntry.dayShift, editingEntry.nightShift).toFixed(2)} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span></span>
                          : <span className="text-blue-600 dark:text-blue-400">{calculateTotal(entry.dayShift, entry.nightShift).toFixed(2)} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span></span>
                        }
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        {(() => {
                          const total = editingEntry && editingEntry.id === entry.id ? calculateTotal(editingEntry.dayShift, editingEntry.nightShift) : calculateTotal(entry.dayShift, entry.nightShift);
                          const productionAt100 = getProductionAt100Value(entry);
                          const pct = calculatePercentage(total, productionAt100);
                          return <Badge className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyBadgeClass(pct)}`}>{pct.toFixed(1)}%</Badge>;
                        })()}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
                        <div className="flex justify-end gap-2">
                          {editingEntry?.id === entry.id ? (
                            <>
                              <Button size="sm" onClick={handleSaveEdit} disabled={loading} className="p-1 text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-green-500"><Save className="w-4 h-4" /></Button>
                              <Button size="sm" onClick={() => setEditingEntry(null)} className="p-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"><X className="w-4 h-4" /></Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" onClick={() => handleEdit(entry)} className="p-1 text-blue-700 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-300"><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" onClick={() => handleDelete(entry.id)} className="p-1 text-white rounded-md bg-red-600 hover:bg-red-700 border border-red-700 dark:bg-red-900/70 dark:hover:bg-red-800 dark:text-red-200"><Trash2 className="w-4 h-4" /></Button>
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
    </>
  );
};

export default DailyProductionUnit2;
