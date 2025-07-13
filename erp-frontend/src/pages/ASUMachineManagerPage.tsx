// src/pages/ASUMachineManagerPage.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'react-hot-toast';
import { Save, Edit, X } from 'lucide-react';
import { 
  asuUnit1Api, 
  ASUMachine,
  UpdateASUMachineData
} from '../api/asuUnit1Api';

interface EditingMachine {
  id: number;
  yarnType: string;
  count: number;
  productionAt100: number;
}

const ASUMachineManagerPage: React.FC = () => {
  const [machines, setMachines] = useState<ASUMachine[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingMachine, setEditingMachine] = useState<EditingMachine | null>(null);
  
  // Load machines on component mount
  useEffect(() => {
    loadMachines();
  }, []);

  // Function to load all machines
  const loadMachines = async () => {
    try {
      setLoading(true);
      const data = await asuUnit1Api.getAllMachines();
      setMachines(data);
    } catch (error) {
      console.error('Error loading machines:', error);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  // Start editing a machine
  const handleEdit = (machine: ASUMachine) => {
    setEditingMachine({
      id: machine.id,
      yarnType: machine.yarnType || 'Cotton',
      count: machine.count || 0,
      productionAt100: machine.productionAt100 || 0
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMachine(null);
  };

  // Save machine changes
  const handleSaveMachine = async (id: number) => {
    if (!editingMachine) return;
    
    try {
      setLoading(true);
      
      // Validate inputs
      if (!editingMachine.yarnType || editingMachine.yarnType.trim() === '') {
        toast.error('Yarn type cannot be empty');
        return;
      }
      
      if (isNaN(editingMachine.count) || editingMachine.count < 0) {
        toast.error('Count must be a valid non-negative number');
        return;
      }
      
      if (isNaN(editingMachine.productionAt100) || editingMachine.productionAt100 < 0) {
        toast.error('Production at 100% must be a valid non-negative number');
        return;
      }
      
      // Prepare data for update
      const updateData: UpdateASUMachineData = {
        yarnType: editingMachine.yarnType,
        count: editingMachine.count,
        productionAt100: editingMachine.productionAt100
      };
      
      // Update the machine
      await asuUnit1Api.updateMachineYarnTypeAndCount(id, updateData);
      
      toast.success('Machine updated successfully');
      setEditingMachine(null);
      
      // Reload machines to get updated data
      await loadMachines();
    } catch (error) {
      console.error('Error updating machine:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update machine';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editingMachine) {
      setEditingMachine(null);
    }
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
                <h1 className="text-3xl font-bold text-white">ASU Machine Manager</h1>
                <p className="mt-2 text-blue-100">Configure machine details like yarn type and count</p>
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-sm text-white bg-white/20 border-white/40">Unit 1</Badge>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="mb-6 overflow-hidden bg-white border border-blue-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-blue-900">
          <div className="p-4 bg-blue-50 border-b border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Machine Parameters</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Yarn Type</h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  The type of yarn processed by this machine, e.g. Cotton, Polyester, Blend, etc.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Count</h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  The yarn count number representing the thickness/fineness of the yarn being produced.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Production @ 100%</h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  The expected output in kg when the machine operates at 100% efficiency. Used to calculate daily efficiency.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              onClick={loadMachines}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              disabled={loading}
            >
              Refresh Machines
            </Button>
          </div>
          <div>
            <Button
              onClick={toggleEditMode}
              className={`px-4 py-2 ${
                editMode
                  ? 'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700'
                  : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
              }`}
            >
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            </Button>
          </div>
        </div>

        {/* Machines Table */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">ASU Unit 1 Machines</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configure machine properties. "Production @ 100%" is the expected output in kg when the machine operates at 100% efficiency.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                <span className="text-lg">Loading machines...</span>
              </div>
            </div>
          ) : machines.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                No machines found
              </p>
              <p className="max-w-md mt-2 text-gray-500 dark:text-gray-400">
                There are no ASU machines in the database. Please add machines first.
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-800">
                    <TableRow className="border-b dark:border-gray-700">
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Machine No</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Yarn Type</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Count</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Prod. @ 100% (kg)</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Spindles</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Speed (RPM)</TableHead>
                      <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Status</TableHead>
                      {editMode && (
                        <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {machines.map((machine) => (
                      <TableRow key={machine.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            Machine {machine.machineNo}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {editingMachine?.id === machine.id ? (
                            <Input
                              value={editingMachine.yarnType}
                              onChange={(e) => setEditingMachine({ ...editingMachine, yarnType: e.target.value })}
                              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">
                              {machine.yarnType || 'Cotton'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {editingMachine?.id === machine.id ? (
                            <Input
                              type="number"
                              value={editingMachine.count}
                              onChange={(e) => setEditingMachine({ 
                                ...editingMachine, 
                                count: parseInt(e.target.value) || 0 
                              })}
                              className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">
                              {machine.count || 0}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {editingMachine?.id === machine.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editingMachine.productionAt100}
                              onChange={(e) => setEditingMachine({ 
                                ...editingMachine, 
                                productionAt100: parseFloat(e.target.value) || 0 
                              })}
                              className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">
                              {machine.productionAt100 || 0}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-700 dark:text-gray-300">
                            {machine.spindles}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-700 dark:text-gray-300">
                            {machine.speed}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              machine.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {machine.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        {editMode && (
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {editingMachine?.id === machine.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveMachine(machine.id)}
                                    className="p-1 text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-green-500"
                                    disabled={loading}
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    className="p-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleEdit(machine)}
                                  className="p-1 text-blue-700 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-300"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ASUMachineManagerPage;
