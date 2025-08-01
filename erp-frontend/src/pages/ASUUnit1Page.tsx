// src/pages/ASUUnit1Page.tsx

import React, { useState } from 'react';
import { Activity, Package, Settings } from 'lucide-react';
import { Badge } from '../components/ui/badge';

// Extracted components
import DailyProduction from '../components/asuUnit1/DailyProduction';
import YarnSummary from '../components/asuUnit1/YarnSummary';
import MachineManager from '../components/asuUnit1/MachineManager';

const ASUUnit1Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'production' | 'summary' | 'machines'>('production');
  
  // Machine management states
  const [editingMachine, setEditingMachine] = useState<ASUMachine | null>(null);
  
  // Advanced machine management states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hasRelatedEntries, setHasRelatedEntries] = useState(false);
  const [entriesCount, setEntriesCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  
  // Initial machine for the add form
  const initialMachine: ASUMachine = {
    id: 0,
    machine_name: '',
    machine_number: '',
    status: 'active',
    machineNo: 0,
    isActive: true,
    yarnType: '',
    count: 0,
    spindles: 0,
    productionAt100: 0,
    speed: 0,
    unit: 1,
    createdAt: '',
    updatedAt: ''
  };
  
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
      setLoading(true);
      // Use getAllMachines to ensure we get all machines including newly added ones
      const machines = await asuUnit1Api.getAllMachines();
      console.log("Fetched machines:", machines); // Debug to verify all machines are fetched
      
      // Show ALL machines in the dropdown, don't filter
      setMachines(machines || []);
      
      // If we have machines and no selected machine, select the first one by default
      if (machines && machines.length > 0 && !selectedMachine) {
        const firstMachine = machines[0];
        console.log("Selected first machine:", firstMachine);
        setSelectedMachine(firstMachine);
        setFormData(prev => ({ 
          ...prev, 
          machineId: firstMachine.id 
        }));
      }
    } catch (error) {
      console.error('Error loading machines:', error);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  }, [selectedMachine]);

  const loadProductionEntries = useCallback(async () => {
    if (!selectedMachine) return;
    
    try {
      setLoading(true);
      
      // Log machine details to help diagnose the issue
      console.log('Loading production entries for machine:', {
        id: selectedMachine.id,
        machineNo: selectedMachine.machineNo,
        machine_number: selectedMachine.machine_number
      });
      
      // Make sure the selected machine has a valid machineNo
      if (!selectedMachine.machineNo && !selectedMachine.machine_number) {
        console.warn(`Selected machine (ID: ${selectedMachine.id}) has no valid machine number`);
      }
      
      const data = await asuUnit1Api.getProductionEntries({
        machineId: selectedMachine.id,
        limit: 30
      });
      
      // Add debug logging to verify data integrity
      console.log('Loaded production entries:', data.items);
      
      // Ensure each entry has properly calculated totals and percentages
      const verifiedEntries = data.items.map(entry => {
        // Safely parse dayShift and nightShift values
        const dayShift = parseFloat(String(entry.dayShift || 0));
        const nightShift = parseFloat(String(entry.nightShift || 0));
        
        // Double-check the total calculation
        const calculatedTotal = calculateTotal(dayShift, nightShift);
        
        // Make sure we have machine data
        if (!entry.machine || !entry.machine.productionAt100) {
          console.warn(`Entry ${entry.id} has missing or incomplete machine data:`, entry.machine);
          
          // Try to find this machine in our machines list
          const machineFallback = machines.find(m => m.id === entry.machineId);
          if (machineFallback) {
            console.log(`Found machine ${machineFallback.id} in our cached machines list`);
            entry.machine = machineFallback;
          }
        }
        
        const productionAt100 = getProductionAt100(entry, selectedMachine);
        const calculatedPercentage = calculatePercentage(calculatedTotal, productionAt100);
        
        console.log(`Entry ${entry.id}: machine=${entry.machine?.machineNo || 'unknown'}, ` +
                   `dayShift=${dayShift}, nightShift=${nightShift}, ` +
                   `total=${calculatedTotal.toFixed(2)}, machine.productionAt100=${productionAt100}, ` +
                   `calculated percentage=${calculatedPercentage.toFixed(1)}%`);
                   
        // Return the entry with verified totals and properly parsed values
        return {
          ...entry,
          dayShift,      // Ensure these are numbers
          nightShift,    // Ensure these are numbers
          total: calculatedTotal,
          percentage: calculatedPercentage
        };
      });
      
      setProductionEntries(verifiedEntries);
    } catch (error) {
      console.error('Error loading production entries:', error);
      toast.error('Failed to load production entries');
    } finally {
      setLoading(false);
    }
  }, [selectedMachine, machines]);

  const loadStats = async () => {
    try {
      const stats = await asuUnit1Api.getProductionStats();
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Advanced Machine Management Functions
  
  // Get all machines for the machine manager tab
  const getAllMachines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await asuUnit1Api.getAllMachines();
      console.log('getAllMachines fetched:', data);
      
      if (!data || data.length === 0) {
        console.warn('No machines returned from API');
      }
      
      // Make sure we're setting the state even if the array is empty
      setMachines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading all machines:', error);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Add new machine
  const handleAddMachine = async () => {
    if (!editingMachine) return;
    
    // Validate machine number
    if (!editingMachine.machine_number) {
      toast.error('Machine number is required');
      return;
    }
    
    // Ensure machine number is valid
    const machineNumber = Number(editingMachine.machine_number);
    if (isNaN(machineNumber) || machineNumber <= 0) {
      toast.error('Machine number must be a positive number');
      return;
    }
    
    try {
      setLoading(true);
      
      // First check if a machine with this number already exists
      const existingMachines = await asuUnit1Api.getAllMachines();
      const duplicate = existingMachines.find(m => 
        (m.machineNo && Number(m.machineNo) === machineNumber) || 
        (m.machine_number && m.machine_number === editingMachine.machine_number)
      );
      
      if (duplicate) {
        toast.error(`Machine with number ${machineNumber} already exists`);
        setLoading(false);
        return;
      }
      
      await asuUnit1Api.addMachine({
        machine_name: editingMachine.machine_name || `Machine ${machineNumber}`,
        machine_number: String(machineNumber),  // Ensure it's a string for API consistency
        status: editingMachine.status || 'active',
        yarnType: editingMachine.yarnType || 'Cotton',
        count: editingMachine.count || 0,
        spindles: editingMachine.spindles || 0,
        speed: editingMachine.speed || 0,
        productionAt100: editingMachine.productionAt100 || 0
      });
      
      toast.success('Machine added successfully');
      setIsModalOpen(false);
      getAllMachines();
    } catch (error) {
      console.error('Error adding machine:', error);
      toast.error('Failed to add machine');
    } finally {
      setLoading(false);
    }
  };
  
  // Edit machine
  const handleEditMachine = (machine: ASUMachine) => {
    setEditingMachine(machine);
    setIsModalOpen(true);
    setModalMode('edit');
  };
  
  // Update machine
  const handleUpdateMachine = async () => {
    if (!editingMachine) return;
    
    try {
      setLoading(true);
      
      console.log('Updating machine with ID:', editingMachine.id, 'Data:', editingMachine);
      
      // Validate machine number
      const machineNumber = editingMachine.machine_number ? String(editingMachine.machine_number).trim() : '';
      if (!machineNumber) {
        toast.error('Machine number is required');
        setLoading(false);
        return;
      }
      
      // Validate machine name
      const machineName = editingMachine.machine_name ? String(editingMachine.machine_name).trim() : '';
      if (!machineName) {
        // If no machine name provided, create a default one from the machine number
        editingMachine.machine_name = `Machine ${machineNumber}`;
      }
      
      // Try to parse as number, but also send original string value
      const machineNoNumeric = Number(machineNumber);
      
      console.log('Sending update with machine name:', editingMachine.machine_name);
      console.log('Sending update with machine number:', machineNumber);
      
      // Use updateMachine which now uses the correct /machines/${id} endpoint
      await asuUnit1Api.updateMachine(editingMachine.id, {
        machineNo: !isNaN(machineNoNumeric) ? machineNoNumeric : undefined,
        machine_name: editingMachine.machine_name,
        machine_number: machineNumber, // Send the original string value
        isActive: editingMachine.status === 'active',
        yarnType: editingMachine.yarnType || 'Cotton',
        count: editingMachine.count || 0,
        spindles: editingMachine.spindles || 0,
        speed: editingMachine.speed || 0,
        productionAt100: editingMachine.productionAt100 || 0
      });
      
      toast.success('Machine updated successfully');
      setIsModalOpen(false);
      getAllMachines();
    } catch (error) {
      console.error('Error updating machine:', error);
      toast.error('Failed to update machine');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete machine
  const handleDeleteMachine = (id: number) => {
    setMachineToDelete(id);
    setShowConfirmDialog(true);
  };
  
  const confirmDeleteMachine = async (force: boolean = false) => {
    if (machineToDelete === null) return;
    
    try {
      setLoading(true);
      setDeleteError(null);
      
      // If force is true, we're explicitly trying to delete with related entries
      if (force && hasRelatedEntries) {
        console.log('Attempting forced deletion with related entries');
      }
      
      await asuUnit1Api.deleteMachine(machineToDelete, force);
      
      toast.success('Machine deleted successfully');
      setShowConfirmDialog(false);
      setHasRelatedEntries(false);
      setEntriesCount(0);
      getAllMachines();
    } catch (error: any) {
      console.error('Error deleting machine:', error);
      
      // Check for the specific 409 error (conflict due to foreign key constraint)
      if (error.response?.status === 409 && error.response?.data?.hasRelatedEntries) {
        setHasRelatedEntries(true);
        setEntriesCount(error.response.data.entriesCount || 0);
        setDeleteError(error.response?.data?.error || 
          `Cannot delete machine because it has ${error.response.data.entriesCount} production entries associated with it.`);
          
        // If we already tried with force=true and still got an error, show a different message
        if (force) {
          toast.error('Cannot delete machine even with force option. You must archive or migrate the production entries first.');
        }
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to delete machine';
        toast.error(errorMessage);
        setShowConfirmDialog(false);
      }
    } finally {
      setLoading(false);
      if (!hasRelatedEntries) {
        setMachineToDelete(null);
      }
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editingMachine) {
      setEditingMachine(null);
    }
  };

  // Load initial data
  useEffect(() => {
    // Use getAllMachines directly to ensure we get all machines
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const allMachines = await asuUnit1Api.getAllMachines();
        console.log("Initial machine load - all machines:", allMachines);
        
        if (!allMachines || allMachines.length === 0) {
          console.warn("No machines returned from API or empty array");
          setMachines([]);
          return;
        }
        
        // Show ALL machines in the dropdown, don't filter by isActive
        // This ensures all machines are visible in the UI
        setMachines(allMachines);
        
        // If we have machines and no selected machine, select the first one
        if (allMachines.length > 0 && !selectedMachine) {
          setSelectedMachine(allMachines[0]);
          setFormData(prev => ({ ...prev, machineId: allMachines[0].id }));
          console.log("Auto-selected first machine:", allMachines[0]);
        }
      } catch (error) {
        console.error("Error loading machines:", error);
        toast.error("Failed to load machines");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
    loadStats();
  }, []);

  // Load production entries when machine is selected
  useEffect(() => {
    if (selectedMachine) {
      loadProductionEntries();
    }
  }, [selectedMachine, loadProductionEntries]);
  
  // Load machines when machine tab is active or after modal closes
  useEffect(() => {
    if (activeTab === 'machines') {
      getAllMachines();
    }
  }, [activeTab, isModalOpen, getAllMachines]);

  const handleMachineSelect = (machineId: string) => {
    // Handle empty selection or "no-machines" placeholder
    if (!machineId || machineId === "no-machines") {
      setSelectedMachine(null);
      setFormData(prev => ({ ...prev, machineId: 0 }));  // Use 0 instead of undefined to match the type
      return;
    }
    
    const machineIdNum = parseInt(machineId);
    const machine = machines.find(m => m.id === machineIdNum);
    
    if (machine) {
      console.log("Machine selected:", machine); // Debug to verify selection
      setSelectedMachine(machine);
      setFormData(prev => ({ ...prev, machineId: machineIdNum }));
    } else {
      console.warn(`Machine with ID ${machineId} not found in machines list`);
      toast.error("Selected machine not found");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !formData.machineId) {
      toast.error('Please select a machine');
      return;
    }
    
    // Verify that machine has a machineNo (needed for production entries foreign key)
    if (!selectedMachine.machineNo && !selectedMachine.machine_number) {
      toast.error('Selected machine does not have a valid machine number');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating production entry with data:', formData);
      console.log('Selected machine:', selectedMachine);
      console.log('Machine number info:', {
        machineNo: selectedMachine.machineNo,
        machine_number: selectedMachine.machine_number
      });
      
      await asuUnit1Api.createProductionEntry(formData);
      
      toast.success('Production entry created successfully');
      setFormData({
        machineId: selectedMachine.id,
        date: new Date().toISOString().split('T')[0],
        dayShift: 0,
        nightShift: 0
      });
      
      console.log('About to reload production entries...');
      
      // Force a complete machine reload first to ensure we have the latest machine data
      // This is important for newly created machines
      await loadMachines();
      
      // Small delay to ensure machines are loaded first
      setTimeout(async () => {
        await loadProductionEntries();
        await loadStats();
      }, 300);
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
      console.log('Deleting production entry with ID:', id);
      
      // Find the entry in our local state
      const entryToDelete = productionEntries.find(entry => entry.id === id);
      console.log('Entry to delete from local state:', entryToDelete);
      
      if (!entryToDelete) {
        throw new Error('Entry not found in local state');
      }
      
      // The asuUnit1Api.deleteProductionEntry function now handles the deletion of both
      // day and night shift entries if they exist
      await asuUnit1Api.deleteProductionEntry(id);
      
      toast.success('Production entry deleted successfully');
      loadProductionEntries();
      loadStats();
    } catch (error) {
      console.error('Error deleting production entry:', error);
      // More detailed error logging
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Delete API response error:', (error as any).response?.data);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete production entry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (dayShift: number | string, nightShift: number | string) => {
    // Safely convert to numbers, handling both string and number inputs
    const dayValue = parseFloat(String(dayShift)) || 0;
    const nightValue = parseFloat(String(nightShift)) || 0;
    
    // Ensure the result is a valid number
    const total = dayValue + nightValue;
    return isNaN(total) ? 0 : total;
  };

  const calculatePercentage = (total: number | string, productionAt100: number | string) => {
    // Safely convert to numbers
    const totalValue = parseFloat(String(total)) || 0;
    const prodAt100 = parseFloat(String(productionAt100)) || 0;
    
    if (prodAt100 <= 0) return 0;
    
    const percentage = (totalValue / prodAt100) * 100;
    return isNaN(percentage) ? 0 : percentage;
  };

  // Helper function to safely get production at 100 value
  const getProductionAt100 = (entry: ASUProductionEntry, fallbackMachine?: ASUMachine | null) => {
    // Try entry.machine first, then fallback to selectedMachine
    const machine = entry.machine || fallbackMachine;
    return parseFloat(String(machine?.productionAt100)) || 0;
  };

  // Helper function to get efficiency badge color
  const getEfficiencyBadgeClass = (percentage: number) => {
    if (percentage >= 85) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    } else if (percentage >= 70) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    } else if (percentage >= 50) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    } else {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
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
                <h1 className="text-3xl font-bold text-white">ASU Unit 1 Production</h1>
                <p className="mt-2 text-blue-100">Manage and monitor production data for ASU Unit 1</p>
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-sm text-white bg-white/20 border-white/40">Unit 1</Badge>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('production')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'production'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Activity className="inline w-4 h-4 mr-2" />
              Daily Production
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Package className="inline w-4 h-4 mr-2" />
              Yarn Summary
            </button>
            <button
              onClick={() => setActiveTab('machines')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'machines'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Settings className="inline w-4 h-4 mr-2" />
              Machine Manager
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'production' ? (
          <>
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

        {/* Machine Selection & Production Entry Form */}
        <div className="mb-8 overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Production Entry</h2>
          </div>          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="machine" className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Machine</Label>
                      {loading && <span className="w-4 h-4 border-b-2 border-blue-500 rounded-full animate-spin"></span>}
                    </div>
                    <Select 
                      onValueChange={handleMachineSelect}
                      value={selectedMachine ? selectedMachine.id.toString() : ""}
                    >
                      <SelectTrigger 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                      >
                        <SelectValue placeholder="-- Select Machine --" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {machines && machines.length > 0 ? (
                          machines.map(machine => (
                            <SelectItem 
                              key={machine.id} 
                              value={machine.id.toString()}
                            >
                              Machine {machine.machineNo || '?'} - {machine.count || '?'} Count - {machine.yarnType || 'Cotton'}
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
                      <div className="lg:col-span-2">
                        <div className="p-4 mb-5 border border-blue-100 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800/30">
                          <h4 className="mb-3 text-sm font-semibold text-blue-800 dark:text-blue-300">Machine Details</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
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
                              <span className="font-medium text-gray-700 dark:text-gray-300">Yarn: <span className="font-bold text-blue-700 dark:text-blue-300">{selectedMachine.yarnType || 'Cotton'}</span></span>
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
                            <div className="flex items-center gap-2 md:col-span-2">
                              <span className="p-1 bg-blue-100 rounded-full dark:bg-blue-800/30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-700 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                </svg>
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Production @ 100%: <span className="font-bold text-blue-700 dark:text-blue-300">{selectedMachine.productionAt100} kg</span></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
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

                        <div>
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
                      </div>

                      <div className="lg:col-span-2">
                        <div className="p-4 mb-5 border border-green-100 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 dark:border-green-800/30">
                          <h4 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">Production Summary</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="p-1 bg-green-100 rounded-full dark:bg-green-800/30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-700 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Total: <span className="font-bold text-green-700 dark:text-green-300">
                                  {calculateTotal(formData.dayShift, formData.nightShift).toFixed(2)} kg
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="p-1 bg-green-100 rounded-full dark:bg-green-800/30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-700 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                </svg>
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Efficiency: <span className="font-bold text-green-700 dark:text-green-300">
                                  {calculatePercentage(calculateTotal(formData.dayShift, formData.nightShift), selectedMachine.productionAt100 || 0).toFixed(1)}%
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <Button 
                          type="submit" 
                          className="flex items-center justify-center w-full px-4 py-2 font-medium text-white transition-all duration-200 rounded-md shadow bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                          disabled={loading}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Production Entry
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </form>
            </div>
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
              <div className="w-full overflow-x-auto">
                <Table className="w-full min-w-full">
                  <TableHeader className="bg-gray-50 dark:bg-gray-800">
                    <TableRow className="border-b dark:border-gray-700">
                      <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Date</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Day Shift</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Night Shift</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Total</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">Efficiency</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase sm:px-6 dark:text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {productionEntries.map(entry => (
                      <TableRow key={entry.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
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
                        <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                          {editingEntry?.id === entry.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editingEntry.dayShift}
                              onChange={(e) => setEditingEntry({ ...editingEntry, dayShift: parseFloat(e.target.value) || 0 })}
                              className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">
                              {parseFloat(String(entry.dayShift || 0)).toFixed(2)} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                          {editingEntry?.id === entry.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editingEntry.nightShift}
                              onChange={(e) => setEditingEntry({ ...editingEntry, nightShift: parseFloat(e.target.value) || 0 })}
                              className="w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">
                              {parseFloat(String(entry.nightShift || 0)).toFixed(2)} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-medium whitespace-nowrap sm:px-6">
                          {editingEntry?.id === entry.id 
                            ? <span className="text-blue-600 dark:text-blue-400">
                                {calculateTotal(editingEntry.dayShift, editingEntry.nightShift).toFixed(2)} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span>
                              </span>
                            : <span className="text-blue-600 dark:text-blue-400">
                                {calculateTotal(entry.dayShift, entry.nightShift).toFixed(2)} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span>
                              </span>
                          }
                        </TableCell>
                        <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                          {editingEntry?.id === entry.id && selectedMachine
                            ? (() => {
                                const total = calculateTotal(editingEntry.dayShift, editingEntry.nightShift);
                                const productionAt100 = getProductionAt100({ machine: selectedMachine } as ASUProductionEntry, selectedMachine);
                                const percentage = calculatePercentage(total, productionAt100);
                                return (
                                  <Badge className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyBadgeClass(percentage)}`}>
                                    {percentage.toFixed(1)}%
                                  </Badge>
                                );
                              })()
                            : (() => {
                                const total = calculateTotal(entry.dayShift, entry.nightShift);
                                const productionAt100 = getProductionAt100(entry, selectedMachine);
                                const percentage = calculatePercentage(total, productionAt100);
                                return (
                                  <Badge className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyBadgeClass(percentage)}`}>
                                    {percentage.toFixed(1)}%
                                  </Badge>
                                );
                              })()
                          }
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
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
                                  className="p-1 text-white rounded-md bg-red-600 hover:bg-red-700 border border-red-700 dark:bg-red-900/70 dark:hover:bg-red-800 dark:text-red-200"
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
        </>
        ) : activeTab === 'summary' ? (
          /* Yarn Production Summary Tab */
          <div className="space-y-6">
            <YarnProductionSummary />
          </div>
        ) : (
          /* Machine Manager Tab */
          <div className="space-y-6">
            {/* Information Panel */}
            <div className="mb-6 overflow-hidden bg-white border border-blue-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-blue-900">
              <div className="p-4 border-b border-blue-100 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Machine Management</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Machine Management</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Create, edit, and manage machines for ASU Unit 1.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Machine Status</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Active machines are available for production entries. Inactive machines are hidden from the production form.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Machine Properties</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Configure machine name, number, and status. These properties are used throughout the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex justify-between mb-6">
              <div className="flex items-center gap-2">
                <Button
                  onClick={getAllMachines}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                  disabled={loading}
                >
                  Refresh Machines
                </Button>
              </div>
              <div>
                <Button
                  onClick={() => {
                    setEditingMachine(initialMachine);
                    setIsModalOpen(true);
                    setModalMode('add');
                  }}
                  className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Machine
                </Button>
              </div>
            </div>

            {/* Machines Table */}
            <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">ASU Unit 1 Machines</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage all machines for ASU Unit 1. Click on a machine to view or edit its details.
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
                          <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Machine Name</TableHead>
                          <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Machine Number</TableHead>
                          <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Status</TableHead>
                          <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Yarn Type</TableHead>
                          <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Count</TableHead>
                          <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Spindles</TableHead>
                          <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Speed</TableHead>
                          <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Production @ 100%</TableHead>
                          <TableHead className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {Array.isArray(machines) && machines.length > 0 ? (
                          machines.map((machine) => (
                            <TableRow key={machine.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {machine.machine_name || machine.machineNo || 'Unnamed'}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <span className="text-gray-700 dark:text-gray-300">
                                  {machine.machine_number || machine.machineNo || 'Not set'}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <Badge className={(machine.status === 'active' || machine.isActive) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {(machine.status === 'active' || machine.isActive) ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <span className="text-gray-700 dark:text-gray-300">{machine.yarnType || 'Not set'}</span>
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <span className="text-gray-700 dark:text-gray-300">{machine.count || 'Not set'}</span>
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <span className="text-gray-700 dark:text-gray-300">{machine.spindles || 'Not set'}</span>
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <span className="text-gray-700 dark:text-gray-300">{machine.speed || 'Not set'}</span>
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <span className="text-gray-700 dark:text-gray-300">{machine.productionAt100 || 'Not set'}</span>
                              </TableCell>
                              <TableCell className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    onClick={() => handleEditMachine(machine)}
                                    className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteMachine(machine.id)}
                                    className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                              No machines found. Click "Add Machine" to create a new machine.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Machine Edit/Add Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
                <div className="flex items-center justify-center min-h-screen p-4">
                  <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {modalMode === 'add' ? 'Add New Machine' : 'Edit Machine'}
                      </h3>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="p-1.5 text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="overflow-y-auto max-h-[90vh] px-1 py-2">
                      <div className="space-y-5">
                      {/* Machine Information Section */}
                      <div className="p-4 border border-gray-100 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Basic Machine Information</h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Machine Name
                            </label>
                            <Input
                              type="text"
                              value={editingMachine?.machine_name || ''}
                              onChange={(e) => setEditingMachine({
                                ...editingMachine!,
                                machine_name: e.target.value
                              })}
                              className="w-full text-gray-900 bg-white border-gray-300 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400"
                              placeholder="e.g. Main Production Unit"
                            />
                          </div>
                          
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Machine Number
                            </label>
                            <Input
                              type="text"
                              value={editingMachine?.machine_number || ''}
                              onChange={(e) => setEditingMachine({
                                ...editingMachine!,
                                machine_number: e.target.value
                              })}
                              className="w-full text-gray-900 bg-white border-gray-300 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400"
                              placeholder="e.g. ASU-001"
                            />
                          </div>
                          
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Status
                            </label>
                            <select
                              value={editingMachine?.status || 'active'}
                              onChange={(e) => setEditingMachine({
                                ...editingMachine!,
                                status: e.target.value as 'active' | 'inactive'
                              })}
                              className="w-full p-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      {/* Production Parameters Section */}
                      <div className="p-4 border border-gray-100 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Production Parameters</h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Yarn Type
                            </label>
                            <Input
                              type="text"
                              value={editingMachine?.yarnType || ''}
                              onChange={(e) => setEditingMachine({
                                ...editingMachine!,
                                yarnType: e.target.value
                              })}
                              className="w-full text-gray-900 bg-white border-gray-300 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400"
                              placeholder="e.g. Cotton"
                            />
                          </div>
                          
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Count
                            </label>
                            <Input
                              type="number"
                              value={editingMachine?.count || 0}
                              onChange={(e) => setEditingMachine({
                                ...editingMachine!,
                                count: Number(e.target.value)
                              })}
                              className="w-full text-gray-900 bg-white border-gray-300 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400"
                              placeholder="e.g. 30"
                            />
                          </div>
                          
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Spindles
                            </label>
                            <Input
                              type="number"
                              value={editingMachine?.spindles || 0}
                              onChange={(e) => setEditingMachine({
                                ...editingMachine!,
                                spindles: Number(e.target.value)
                              })}
                              className="w-full text-gray-900 bg-white border-gray-300 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400"
                              placeholder="e.g. 1000"
                            />
                          </div>
                          
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Speed (RPM)
                            </label>
                            <Input
                              type="number"
                              value={editingMachine?.speed || 0}
                              onChange={(e) => setEditingMachine({
                                ...editingMachine!,
                                speed: Number(e.target.value)
                              })}
                              className="w-full text-gray-900 bg-white border-gray-300 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400"
                              placeholder="e.g. 18000"
                            />
                          </div>
                          
                          <div className="sm:col-span-2">
                            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Production @ 100%
                            </label>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={editingMachine?.productionAt100 || 0}
                                onChange={(e) => setEditingMachine({
                                  ...editingMachine!,
                                  productionAt100: Number(e.target.value)
                                })}
                                className="w-full text-gray-900 bg-white border-gray-300 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400"
                                placeholder="e.g. 450"
                              />
                              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">kg/day</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end px-6 py-4 mt-2 space-x-3 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={modalMode === 'add' ? handleAddMachine : handleUpdateMachine}
                          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          {modalMode === 'add' ? 'Add Machine' : 'Update Machine'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Dialog */}
            <DeleteConfirmationDialog
              isOpen={showConfirmDialog}
              title="Confirm Delete Machine"
              message={hasRelatedEntries 
                ? "This machine has production entries associated with it."
                : "Are you sure you want to delete this machine? This action cannot be undone."}
              itemName={machineToDelete ? `Machine #${machineToDelete}` : "Machine"}
              hasRelatedItems={hasRelatedEntries}
              relatedItemsCount={entriesCount}
              relatedItemsType="production entries"
              onClose={() => {
                setShowConfirmDialog(false);
                setDeleteError(null);
                setHasRelatedEntries(false);
                setEntriesCount(0);
                setMachineToDelete(null);
              }}
              onConfirm={() => confirmDeleteMachine(hasRelatedEntries ? true : false)}
              onArchiveInstead={async () => {
                if (machineToDelete === null) return;
                try {
                  setLoading(true);
                  await asuUnit1Api.archiveMachine(machineToDelete);
                  toast.success('Machine archived successfully');
                  setShowConfirmDialog(false);
                  getAllMachines();
                } catch (error: any) {
                  console.error('Error archiving machine:', error);
                  const errorMessage = error.response?.data?.error || 'Failed to archive machine';
                  toast.error(errorMessage);
                } finally {
                  setLoading(false);
                  setMachineToDelete(null);
                  setHasRelatedEntries(false);
                  setEntriesCount(0);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ASUUnit1Page;
