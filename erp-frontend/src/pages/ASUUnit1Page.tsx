// src/pages/ASUUnit1Page.tsx

import React, { useState, useEffect, useCallback } from 'react';
//import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

import { 
  asuUnit1Api, 
  ASUMachine, 
  ASUProductionEntry, 
  CreateProductionEntryData,
  ProductionStats 
} from '../api/asuUnit1Api';

interface EditingEntry {
  id: number;
  dayShift: number;
  nightShift: number;
  date: string;
}

const ASUUnit1Page: React.FC = () => {
  const [machines, setMachines] = useState<ASUMachine[]>([]);
  const [productionEntries, setProductionEntries] = useState<ASUProductionEntry[]>([]);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<ASUMachine | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateProductionEntryData>({
    machineId: 0,
    date: new Date().toISOString().split('T')[0],
    dayShift: 0,
    nightShift: 0
  });

  // Define functions first
  const loadMachines = useCallback(async () => {
    try {
      const machines = await asuUnit1Api.getMachines();
      setMachines(machines);
      
      // If we have machines and no selected machine, select the first one by default
      if (machines.length > 0 && !selectedMachine) {
        const firstMachine = machines[0];
        setSelectedMachine(firstMachine);
        setFormData(prev => ({ 
          ...prev, 
          machineId: firstMachine.id 
        }));
      }
    } catch (error) {
      console.error('Error loading machines:', error);
      toast.error('Failed to load machines');
    }
  }, [selectedMachine]);

  const loadProductionEntries = useCallback(async () => {
    if (!selectedMachine) return;
    
    try {
      setLoading(true);
      const data = await asuUnit1Api.getProductionEntries({
        machineId: selectedMachine.id,
        limit: 30
      });
      
      setProductionEntries(data.items);
    } catch (error) {
      console.error('Error loading production entries:', error);
      toast.error('Failed to load production entries');
    } finally {
      setLoading(false);
    }
  }, [selectedMachine]);

  const loadStats = async () => {
    try {
      const stats = await asuUnit1Api.getProductionStats();
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    loadMachines();
    loadStats();
  }, [loadMachines]);

  // Load production entries when machine is selected
  useEffect(() => {
    if (selectedMachine) {
      loadProductionEntries();
    }
  }, [selectedMachine, loadProductionEntries]);

  const handleMachineSelect = (machineId: string) => {
    const machine = machines.find(m => m.id === parseInt(machineId));
    setSelectedMachine(machine || null);
    setFormData(prev => ({ ...prev, machineId: parseInt(machineId) }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !formData.machineId) {
      toast.error('Please select a machine');
      return;
    }

    try {
      setLoading(true);
      await asuUnit1Api.createProductionEntry(formData);
      
      toast.success('Production entry created successfully');
      setFormData({
        machineId: selectedMachine.id,
        date: new Date().toISOString().split('T')[0],
        dayShift: 0,
        nightShift: 0
      });
      loadProductionEntries();
      loadStats();
    } catch (error) {
      console.error('Error creating production entry:', error);

      // Check for specific duplicate entry error
      if (typeof error === 'object' && error !== null && 'response' in error && (error as any).response?.status === 409) {
        toast.error(`Production entry already exists for ${formData.date}. Please edit the existing entry instead.`);
      } else {
        const errorMessage =
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as any).response?.data?.error || (error as any).message || 'Failed to create production entry'
            : error instanceof Error
            ? error.message
            : 'Failed to create production entry';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: ASUProductionEntry) => {
    setEditingEntry({
      id: entry.id,
      dayShift: entry.dayShift,
      nightShift: entry.nightShift,
      date: entry.date
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    try {
      setLoading(true);
      await asuUnit1Api.updateProductionEntry(editingEntry.id, {
        dayShift: editingEntry.dayShift,
        nightShift: editingEntry.nightShift,
        date: editingEntry.date
      });

      toast.success('Production entry updated successfully');
      setEditingEntry(null);
      loadProductionEntries();
      loadStats();
    } catch (error) {
      console.error('Error updating production entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update production entry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this production entry?')) {
      return;
    }

    try {
      setLoading(true);
      await asuUnit1Api.deleteProductionEntry(id);
      
      toast.success('Production entry deleted successfully');
      loadProductionEntries();
      loadStats();
    } catch (error) {
      console.error('Error deleting production entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete production entry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (dayShift: number, nightShift: number) => {
    return dayShift + nightShift;
  };

  const calculatePercentage = (total: number, productionAt100: number) => {
    if (productionAt100 === 0) return 0;
    return (total / productionAt100) * 100;
  };

  return (
    <div className="min-h-screen p-4 transition-colors duration-200 bg-gray-50 dark:bg-gray-900 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="relative mb-8 overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          <div className="relative px-6 py-8 sm:px-8 sm:py-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">ASU Unit 1 Production</h1>
                <p className="mt-2 text-blue-100">Manage and monitor production data for ASU Unit 1</p>
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-sm text-white bg-white/20 border-white/40">Unit 1</Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Machines</span>
                <span className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMachines}</span>
              </div>
              <div className="absolute bottom-0 right-0 p-2 text-blue-500 opacity-10 -rotate-12">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                  <rect x="9" y="9" width="6" height="6"></rect>
                  <line x1="9" y1="1" x2="9" y2="4"></line>
                  <line x1="15" y1="1" x2="15" y2="4"></line>
                  <line x1="9" y1="20" x2="9" y2="23"></line>
                  <line x1="15" y1="20" x2="15" y2="23"></line>
                  <line x1="20" y1="9" x2="23" y2="9"></line>
                  <line x1="20" y1="14" x2="23" y2="14"></line>
                  <line x1="1" y1="9" x2="4" y2="9"></line>
                  <line x1="1" y1="14" x2="4" y2="14"></line>
                </svg>
              </div>
            </div>
            
            <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Machines</span>
                <span className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeMachines}</span>
              </div>
              <div className="absolute bottom-0 right-0 p-2 text-emerald-500 opacity-10 -rotate-12">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
            
            <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Entries</span>
                <span className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.todayEntries}</span>
              </div>
              <div className="absolute bottom-0 right-0 p-2 text-orange-500 opacity-10 -rotate-12">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
            
            <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Efficiency</span>
                <span className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.averageEfficiency.toFixed(1)}%</span>
              </div>
              <div className="absolute bottom-0 right-0 p-2 text-blue-500 opacity-10 -rotate-12">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10"></path>
                  <path d="M18 20V4"></path>
                  <path d="M6 20v-4"></path>
                </svg>
              </div>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Machine Selection & Production Entry Form */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Production Entry</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="mb-4">
                <Label htmlFor="machine" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Select Machine</Label>
                <Select 
                  onValueChange={handleMachineSelect}
                  value={selectedMachine ? selectedMachine.id.toString() : undefined}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map(machine => (
                      <SelectItem key={machine.id} value={machine.id.toString()}>
                        Machine {machine.machineNo} - {machine.count} Count - {machine.yarnType || 'Cotton'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMachine && (
                <>
                  <div className="p-4 mb-5 border border-blue-100 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800/30">
                    <h4 className="mb-3 text-sm font-semibold text-blue-800 dark:text-blue-300">Machine Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-blue-100 rounded-full dark:bg-blue-800/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-700 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Count: <span className="font-bold text-blue-700 dark:text-blue-300">{selectedMachine.count}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-blue-100 rounded-full dark:bg-blue-800/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-700 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                          </svg>
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Yarn Type: <span className="font-bold text-blue-700 dark:text-blue-300">{selectedMachine.yarnType || 'Cotton'}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-blue-100 rounded-full dark:bg-blue-800/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-700 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V4z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Spindles: <span className="font-bold text-blue-700 dark:text-blue-300">{selectedMachine.spindles}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-blue-100 rounded-full dark:bg-blue-800/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-700 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Speed: <span className="font-bold text-blue-700 dark:text-blue-300">{selectedMachine.speed} RPM</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-blue-100 rounded-full dark:bg-blue-800/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-700 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Production @ 100%: <span className="font-bold text-blue-700 dark:text-blue-300">{selectedMachine.productionAt100} kg</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="dayShift" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Day Shift (kg)</Label>
                    <Input
                      id="dayShift"
                      type="number"
                      step="0.01"
                      value={formData.dayShift}
                      onChange={(e) => setFormData({ ...formData, dayShift: parseFloat(e.target.value) || 0 })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="nightShift" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Night Shift (kg)</Label>
                    <Input
                      id="nightShift"
                      type="number"
                      step="0.01"
                      value={formData.nightShift}
                      onChange={(e) => setFormData({ ...formData, nightShift: parseFloat(e.target.value) || 0 })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                      required
                    />
                  </div>

                  <div className="p-4 mb-5 border border-green-100 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 dark:border-green-800/30">
                    <h4 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">Production Summary</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-green-100 rounded-full dark:bg-green-800/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-700 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Total: <span className="font-bold text-green-700 dark:text-green-300">{calculateTotal(formData.dayShift, formData.nightShift)} kg</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-green-100 rounded-full dark:bg-green-800/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-700 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Efficiency: <span className="font-bold text-green-700 dark:text-green-300">{calculatePercentage(calculateTotal(formData.dayShift, formData.nightShift), selectedMachine.productionAt100).toFixed(1)}%</span></span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="flex items-center justify-center w-full px-4 py-2 font-medium text-white transition-all duration-200 rounded-md shadow bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Production Entry
                  </Button>
                </>
              )}
            </form>
          </div>
        </div>

        {/* Production Entries Table */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Production Entries
              {selectedMachine && ` - Machine ${selectedMachine.machineNo}`}
            </h2>
            {selectedMachine && (
              <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
                {selectedMachine.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                  <span className="text-lg">Loading entries...</span>
                </div>
              </div>
            ) : productionEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {selectedMachine ? 'No production entries found for this machine' : 'Select a machine to view production entries'}
                </p>
                <p className="max-w-md mt-2 text-gray-500 dark:text-gray-400">
                  {selectedMachine ? 'Add production data using the form to keep track of machine performance.' : 'Choose a machine from the dropdown to see its production history.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-800">
                    <TableRow className="border-b dark:border-gray-700">
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Date</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Day Shift</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Night Shift</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Total</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Efficiency</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {productionEntries.map(entry => (
                      <TableRow key={entry.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {editingEntry?.id === entry.id ? (
                            <Input
                              type="date"
                              value={editingEntry.date}
                              onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            />
                          ) : (
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {editingEntry?.id === entry.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editingEntry.dayShift}
                              onChange={(e) => setEditingEntry({ ...editingEntry, dayShift: parseFloat(e.target.value) || 0 })}
                              className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">{entry.dayShift} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span></span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {editingEntry?.id === entry.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editingEntry.nightShift}
                              onChange={(e) => setEditingEntry({ ...editingEntry, nightShift: parseFloat(e.target.value) || 0 })}
                              className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">{entry.nightShift} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span></span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 font-medium whitespace-nowrap">
                          {editingEntry?.id === entry.id 
                            ? <span className="text-blue-600 dark:text-blue-400">{calculateTotal(editingEntry.dayShift, editingEntry.nightShift)} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span></span>
                            : <span className="text-blue-600 dark:text-blue-400">{entry.total} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span></span>
                          }
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {editingEntry?.id === entry.id && selectedMachine
                            ? <Badge className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                calculatePercentage(calculateTotal(editingEntry.dayShift, editingEntry.nightShift), selectedMachine.productionAt100) >= 85 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                  : calculatePercentage(calculateTotal(editingEntry.dayShift, editingEntry.nightShift), selectedMachine.productionAt100) >= 70
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : calculatePercentage(calculateTotal(editingEntry.dayShift, editingEntry.nightShift), selectedMachine.productionAt100) >= 50
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                            >
                              {calculatePercentage(calculateTotal(editingEntry.dayShift, editingEntry.nightShift), selectedMachine.productionAt100).toFixed(1)}%
                            </Badge>
                            : <Badge className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                entry.percentage >= 85 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                  : entry.percentage >= 70
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : entry.percentage >= 50
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                            >
                              {entry.percentage.toFixed(1)}%
                            </Badge>
                          }
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            {editingEntry?.id === entry.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={handleSaveEdit} 
                                  disabled={loading} 
                                  className="p-1 text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-green-500"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => setEditingEntry(null)} 
                                  className="p-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleEdit(entry)}
                                  className="p-1 text-blue-700 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-300"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleDelete(entry.id)}
                                  className="p-1 text-red-700 rounded-md bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
      </div>
    </div>
  </div>
  );
};

export default ASUUnit1Page;
