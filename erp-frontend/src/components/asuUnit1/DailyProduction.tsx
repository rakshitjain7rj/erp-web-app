import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Edit, Plus, Save, Trash2, X } from 'lucide-react';
import { ASUMachine, ASUProductionEntry, ProductionStats, asuUnit1Api, CreateProductionEntryData, getProductionAt100 } from '../../api/asuUnit1Api';

interface EditingEntry {
  id: number;
  dayShift: number;
  nightShift: number;
  date: string;
}

const DailyProduction: React.FC = () => {
  const [machines, setMachines] = useState<ASUMachine[]>([]);
  const [productionEntries, setProductionEntries] = useState<ASUProductionEntry[]>([]);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<ASUMachine | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  // Add state for historical yarn type data
  const [machineYarnHistory, setMachineYarnHistory] = useState<{
    [machineId: number]: {date: string, yarnType: string}[]
  }>({});
  
  // Add state for historical machine configuration data (productionAt100, etc.)
  const [machineConfigHistory, setMachineConfigHistory] = useState<{
    [machineId: number]: {date: string, yarnType: string, productionAt100: number}[]
  }>({});
  const [formData, setFormData] = useState<CreateProductionEntryData>({
    machineId: 0,
    date: new Date().toISOString().split('T')[0],
    dayShift: 0,
    nightShift: 0,
    yarnType: '', // Include the current machine's yarn type
    // productionAt100 is not needed in the form as it comes from machine configuration
    productionAt100: 0 // Kept for backward compatibility only
  });
  
  // Define functions for data loading
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
        setFormData(prev => ({ ...prev, machineId: firstMachine.id }));
      }
    } catch (error) {
      console.error('Error loading machines:', error);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  }, [selectedMachine]);

  // Helper function to sort production entries by date (newest first)
  const sortEntriesByDate = (entries: ASUProductionEntry[]) => {
    return [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  // Function to load machine yarn history from localStorage
  const loadMachineYarnHistory = useCallback(() => {
    try {
      const savedHistory = localStorage.getItem('machineYarnHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        console.log('Loaded machine yarn history from localStorage:', parsedHistory);
        setMachineYarnHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading machine yarn history:', error);
    }
  }, []);

  // Function to save machine yarn history to localStorage
  const saveMachineYarnHistory = useCallback((history: {[machineId: number]: {date: string, yarnType: string}[]}) => {
    try {
      localStorage.setItem('machineYarnHistory', JSON.stringify(history));
      console.log('Saved machine yarn history to localStorage:', history);
    } catch (error) {
      console.error('Error saving machine yarn history:', error);
    }
  }, []);

  // Function to load machine configuration history from localStorage
  const loadMachineConfigHistory = useCallback(() => {
    try {
      const savedConfigHistory = localStorage.getItem('machineConfigHistory');
      if (savedConfigHistory) {
        const parsedConfigHistory = JSON.parse(savedConfigHistory);
        console.log('Loaded machine configuration history from localStorage:', parsedConfigHistory);
        setMachineConfigHistory(parsedConfigHistory);
      }
    } catch (error) {
      console.error('Error loading machine configuration history:', error);
    }
  }, []);

  // Function to save machine configuration history to localStorage
  const saveMachineConfigHistory = useCallback((configHistory: {[machineId: number]: {date: string, yarnType: string, productionAt100: number}[]}) => {
    try {
      localStorage.setItem('machineConfigHistory', JSON.stringify(configHistory));
      console.log('Saved machine configuration history to localStorage:', configHistory);
    } catch (error) {
      console.error('Error saving machine configuration history:', error);
    }
  }, []);

  // Helper function to find historical yarn type for a specific date and machine
  const findHistoricalYarnType = (machineId: number, date: string): string | undefined => {
    // If no machine ID or date provided, return undefined
    if (!machineId || !date) return undefined;
    
    try {
      // Check if this machine has history entries
      if (!machineYarnHistory[machineId] || machineYarnHistory[machineId].length === 0) {
        return undefined;
      }
      
      // Find machine configuration history for this specific date
      const exactMatch = machineYarnHistory[machineId].find(entry => entry.date === date);
      if (exactMatch) {
        return exactMatch.yarnType;
      }
      
      // If no exact match, find the most recent history entry before this date
      const entryDate = new Date(date);
      
      // Sort history by date in descending order (newest first)
      const sortedHistory = [...machineYarnHistory[machineId]].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Find the most recent configuration before or on the entry date
      for (const historyEntry of sortedHistory) {
        const historyDate = new Date(historyEntry.date);
        if (historyDate <= entryDate) {
          return historyEntry.yarnType;
        }
      }
      
      // If all history entries are after this date, use the oldest history entry
      // This is a fallback option
      const oldestEntry = [...machineYarnHistory[machineId]].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )[0];
      
      return oldestEntry?.yarnType;
    } catch (error) {
      console.error("Error finding historical yarn type:", error);
      return undefined;
    }
  };

  // Helper function to find historical machine configuration for a specific date and machine
  const findHistoricalMachineConfig = (machineId: number, date: string): {yarnType: string, productionAt100: number} | undefined => {
    // If no machine ID or date provided, return undefined
    if (!machineId || !date) return undefined;
    
    try {
      // Check if this machine has configuration history entries
      if (!machineConfigHistory[machineId] || machineConfigHistory[machineId].length === 0) {
        return undefined;
      }
      
      // Find machine configuration history for this specific date
      const exactMatch = machineConfigHistory[machineId].find(entry => entry.date === date);
      if (exactMatch) {
        return {
          yarnType: exactMatch.yarnType,
          productionAt100: exactMatch.productionAt100
        };
      }
      
      // If no exact match, find the most recent configuration before this date
      const entryDate = new Date(date);
      
      // Sort history by date in descending order (newest first)
      const sortedHistory = [...machineConfigHistory[machineId]].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Find the most recent configuration before or on the entry date
      for (const historyEntry of sortedHistory) {
        const historyDate = new Date(historyEntry.date);
        if (historyDate <= entryDate) {
          return {
            yarnType: historyEntry.yarnType,
            productionAt100: historyEntry.productionAt100
          };
        }
      }
      
      // If all history entries are after this date, use the oldest history entry
      // This is a fallback option
      const oldestEntry = [...machineConfigHistory[machineId]].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )[0];
      
      if (oldestEntry) {
        return {
          yarnType: oldestEntry.yarnType,
          productionAt100: oldestEntry.productionAt100
        };
      }
      
      return undefined;
    } catch (error) {
      console.error("Error finding historical machine configuration:", error);
      return undefined;
    }
  };

  const loadProductionEntries = useCallback(async () => {
    if (!selectedMachine) return;
    
    try {
      setLoading(true);
      
      // Log machine details to help diagnose the issue
      console.log('Loading production entries for machine:', {
        id: selectedMachine.id,
        machineNo: selectedMachine.machineNo,
        machine_number: selectedMachine.machine_number,
        yarnType: selectedMachine.yarnType
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
      
      // Update yarn history if not already present for this machine
      if (selectedMachine.yarnType && (!machineYarnHistory[selectedMachine.id] || machineYarnHistory[selectedMachine.id].length === 0)) {
        // If we don't have any history for this machine, create an initial history entry with today's date
        const newHistory = {
          ...machineYarnHistory,
          [selectedMachine.id]: [
            { date: new Date().toISOString().split('T')[0], yarnType: selectedMachine.yarnType }
          ]
        };
        setMachineYarnHistory(newHistory);
        saveMachineYarnHistory(newHistory);
        console.log(`Created initial yarn history for machine ${selectedMachine.id}:`, newHistory[selectedMachine.id]);
      }
      
        // Process entries to enhance with historical yarn type data
        data.items.forEach((entry: ASUProductionEntry) => {
          // Log entry details
          console.log(`Processing entry for date ${entry.date}:`, {
            id: entry.id,
            machineId: entry.machineId,
            dayShift: entry.dayShift,
            nightShift: entry.nightShift,
            nightShiftType: typeof entry.nightShift,
            total: entry.total,
            yarnType: entry.yarnType, // Log the entry's own yarn type if present
            machineYarnType: entry.machine?.yarnType // Log machine's current yarn type
          });
          
          // IMPORTANT: If the entry has its own yarn type, prioritize it over machine's yarn type
          // This ensures historical accuracy
          if (entry.yarnType && entry.machineId) {
            console.log(`Entry has its own yarn type: ${entry.yarnType} for date ${entry.date}`);
            
            // Still maintain history for backward compatibility
            const machineHistory = machineYarnHistory[entry.machineId] || [];
            const existingEntry = machineHistory.find(h => h.date === entry.date);
            
            if (!existingEntry) {
              console.log(`Adding entry's yarn type ${entry.yarnType} to history for date ${entry.date}`);
              const newMachineHistory = [
                ...machineHistory,
                { date: entry.date, yarnType: entry.yarnType }
              ];
              
              const newHistory = {
                ...machineYarnHistory,
                [entry.machineId]: newMachineHistory
              };
              
              setMachineYarnHistory(newHistory);
              saveMachineYarnHistory(newHistory);
            }
          }
          // Only fall back to machine yarn type if entry doesn't have one
          else if (entry.machine?.yarnType && !entry.yarnType && !findHistoricalYarnType(entry.machineId, entry.date)) {
            console.log(`Entry missing yarn type, adding machine's yarn type for date ${entry.date}:`, entry.machine.yarnType);
            const machineHistory = machineYarnHistory[entry.machineId] || [];
            const newMachineHistory = [
              ...machineHistory,
              { date: entry.date, yarnType: entry.machine.yarnType }
            ];
            
            const newHistory = {
              ...machineYarnHistory,
              [entry.machineId]: newMachineHistory
            };
            
            setMachineYarnHistory(newHistory);
            saveMachineYarnHistory(newHistory);
          }
        });      // Sort entries by date in descending order (newest first)
      const sortedEntries = sortEntriesByDate(data.items);
      
      setProductionEntries(sortedEntries);
    } catch (error) {
      console.error('Error loading production entries:', error);
      toast.error('Failed to load production entries');
    } finally {
      setLoading(false);
    }
  }, [selectedMachine, machineYarnHistory, saveMachineYarnHistory]);

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
    loadMachineYarnHistory(); // Load saved yarn history from localStorage
    loadMachineConfigHistory(); // Load saved machine configuration history from localStorage
  }, [loadMachines, loadMachineYarnHistory, loadMachineConfigHistory]);

  // Load production entries when machine is selected
  useEffect(() => {
    if (selectedMachine) {
      loadProductionEntries();
    }
  }, [selectedMachine, loadProductionEntries]);

  const handleMachineSelect = (machineId: string) => {
    // Handle empty selection or "no-machines" placeholder
    if (!machineId || machineId === "no-machines") {
      setSelectedMachine(null);
      setFormData(prev => ({ ...prev, machineId: 0, yarnType: '' }));
      return;
    }
    
    const machineIdNum = parseInt(machineId);
    const machine = machines.find(m => m.id === machineIdNum);
    
    if (machine) {
      console.log("Machine selected:", machine);
      
      // Check if this is a different machine than the previously selected one
      const isNewMachine = !selectedMachine || selectedMachine.id !== machine.id;
      
      // Update selected machine
      setSelectedMachine(machine);
      
      // Update form with machine ID and current yarn type (not historical)
      setFormData(prev => ({ 
        ...prev, 
        machineId: machineIdNum,
        yarnType: machine.yarnType || 'Cotton' // Always use current machine yarn type
      }));
      
      // If this is a new machine selection and it has a yarn type, make sure we have history for it
      if (isNewMachine && machine.yarnType) {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if we already have yarn type history for this machine
        if (!machineYarnHistory[machine.id] || machineYarnHistory[machine.id].length === 0) {
          // Create initial history with today's date
          const newHistory = {
            ...machineYarnHistory,
            [machine.id]: [
              { date: today, yarnType: machine.yarnType }
            ]
          };
          
          setMachineYarnHistory(newHistory);
          saveMachineYarnHistory(newHistory);
          console.log(`Created initial yarn history for machine ${machine.id}:`, newHistory[machine.id]);
        }

        // Check if we already have configuration history for this machine
        if (!machineConfigHistory[machine.id] || machineConfigHistory[machine.id].length === 0) {
          // Create initial configuration history with today's date
          const productionAt100Value = getProductionAt100({ machine } as ASUProductionEntry, machine);
          
          const newConfigHistory = {
            ...machineConfigHistory,
            [machine.id]: [
              { 
                date: today, 
                yarnType: machine.yarnType,
                productionAt100: productionAt100Value
              }
            ]
          };
          
          setMachineConfigHistory(newConfigHistory);
          saveMachineConfigHistory(newConfigHistory);
          console.log(`Created initial configuration history for machine ${machine.id}:`, newConfigHistory[machine.id]);
        } else {
          // Check if current configuration is different from the latest recorded configuration
          const latestConfig = [...machineConfigHistory[machine.id]]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          const currentProductionAt100 = getProductionAt100({ machine } as ASUProductionEntry, machine);
          
          // If configuration has changed, add a new history entry
          if (latestConfig && 
              (latestConfig.yarnType !== machine.yarnType || 
               latestConfig.productionAt100 !== currentProductionAt100)) {
            
            const newConfigEntry = {
              date: today,
              yarnType: machine.yarnType,
              productionAt100: currentProductionAt100
            };
            
            const updatedConfigHistory = {
              ...machineConfigHistory,
              [machine.id]: [...machineConfigHistory[machine.id], newConfigEntry]
            };
            
            setMachineConfigHistory(updatedConfigHistory);
            saveMachineConfigHistory(updatedConfigHistory);
            console.log(`Added new configuration history entry for machine ${machine.id}:`, newConfigEntry);
          }
        }
      }
      
      console.log(`Machine selected: ${machineIdNum}`);
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
      
      // Add the productionAt100 value explicitly to ensure it's available
      // This helps prevent the "Missing productionAt100" error
      const prodAt100Value = getProductionAt100({ machine: selectedMachine } as ASUProductionEntry, selectedMachine);
      
      // For NEW production entries, ALWAYS use the current machine configuration's yarn type
      // This ensures that when machine configurations change, new entries reflect the current state
      const entryYarnType = selectedMachine.yarnType || 'Cotton';
      
      console.log('Creating new production entry with current machine yarn type:', {
        machineId: selectedMachine.id,
        currentMachineYarnType: selectedMachine.yarnType,
        entryYarnType,
        date: formData.date
      });
      
      // Add yarn type history entry for this date with current machine configuration
      const machineHistory = machineYarnHistory[selectedMachine.id] || [];
      
      // Check if we already have an entry for this exact date
      const existingHistoryEntry = machineHistory.find(h => h.date === formData.date);
      
      if (!existingHistoryEntry) {
        const newMachineHistory = [
          ...machineHistory,
          { date: formData.date, yarnType: entryYarnType }
        ];
        
        const newHistory = {
          ...machineYarnHistory,
          [selectedMachine.id]: newMachineHistory
        };
        
        setMachineYarnHistory(newHistory);
        saveMachineYarnHistory(newHistory);
        console.log(`Added yarn type history for date ${formData.date}:`, entryYarnType);
      } else {
        // Update existing history entry with current machine yarn type
        const updatedHistory = machineHistory.map(h => 
          h.date === formData.date ? { ...h, yarnType: entryYarnType } : h
        );
        
        const newHistory = {
          ...machineYarnHistory,
          [selectedMachine.id]: updatedHistory
        };
        
        setMachineYarnHistory(newHistory);
        saveMachineYarnHistory(newHistory);
        console.log(`Updated yarn type history for date ${formData.date}:`, entryYarnType);
      }

      // Add machine configuration history entry for this date with current machine configuration
      const configHistory = machineConfigHistory[selectedMachine.id] || [];
      
      // Check if we already have a configuration entry for this exact date
      const existingConfigEntry = configHistory.find(h => h.date === formData.date);
      
      if (!existingConfigEntry) {
        const newConfigEntry = {
          date: formData.date,
          yarnType: entryYarnType,
          productionAt100: prodAt100Value
        };
        
        const newConfigHistory = [
          ...configHistory,
          newConfigEntry
        ];
        
        const newMachineConfigHistory = {
          ...machineConfigHistory,
          [selectedMachine.id]: newConfigHistory
        };
        
        setMachineConfigHistory(newMachineConfigHistory);
        saveMachineConfigHistory(newMachineConfigHistory);
        console.log(`Added machine configuration history for date ${formData.date}:`, newConfigEntry);
      } else {
        // Update existing configuration entry with current machine configuration
        const updatedConfigHistory = configHistory.map(h => 
          h.date === formData.date 
            ? { ...h, yarnType: entryYarnType, productionAt100: prodAt100Value } 
            : h
        );
        
        const newMachineConfigHistory = {
          ...machineConfigHistory,
          [selectedMachine.id]: updatedConfigHistory
        };
        
        setMachineConfigHistory(newMachineConfigHistory);
        saveMachineConfigHistory(newMachineConfigHistory);
        console.log(`Updated machine configuration history for date ${formData.date}:`, { yarnType: entryYarnType, productionAt100: prodAt100Value });
      }
      
      // Explicitly convert night shift value to ensure it's properly handled
      // Full detailed logging of night shift value processing
      const rawNightShift = formData.nightShift;
      
      console.log('Processing night shift for submission:', {
        rawValue: rawNightShift,
        type: typeof rawNightShift
      });
      
      // Use regular parseFloat to be consistent with day shift handling
      const nightShiftValue = parseFloat(String(rawNightShift)) || 0;
      
      console.log('Processed night shift value:', {
        value: nightShiftValue,
        type: typeof nightShiftValue,
        isZero: nightShiftValue === 0,
        isFalsy: !nightShiftValue
      });
      
      // Check if there's already an entry for this date and machine
      const existingEntries = productionEntries.filter(entry => 
        entry.machineId === selectedMachine.id && entry.date === formData.date
      );
      
      if (existingEntries.length > 0) {
        // Entry already exists, ask user if they want to update instead
        const confirm = window.confirm(
          `A production entry for ${selectedMachine.machineName || 'Machine ' + selectedMachine.machineNo} on ${formData.date} already exists. Do you want to update it instead?`
        );
        
        if (confirm) {
          // Update the existing entry
          const existingEntry = existingEntries[0];
          
          // For updates, use current machine yarn type to reflect any configuration changes
          const entryYarnType = selectedMachine.yarnType || 'Cotton';
          
          const updateData = {
            dayShift: parseFloat(String(formData.dayShift)) || 0,
            nightShift: nightShiftValue,
            productionAt100: prodAt100Value || 87,
            yarnType: entryYarnType // Use current machine yarn type for updates
          };
          
          console.log('Updating existing entry:', existingEntry.id, updateData);
          
          await asuUnit1Api.updateProductionEntry(existingEntry.id, updateData);
          toast.success('Production entry updated successfully');
          await loadProductionEntries();
          
          // Reset form with current machine yarn type
          setFormData({
            machineId: selectedMachine.id,
            date: new Date().toISOString().split('T')[0],
            dayShift: 0,
            nightShift: 0,
            yarnType: selectedMachine.yarnType || 'Cotton', // Use current machine yarn type
            productionAt100: 0
          });
          
          setLoading(false);
          return;
        } else {
          // User chose not to update, cancel submission
          toast.error('Form submission cancelled');
          setLoading(false);
          return;
        }
      }
      
      const submissionData = {
        machineId: formData.machineId,
        date: formData.date,
        dayShift: parseFloat(String(formData.dayShift)) || 0,
        nightShift: nightShiftValue,
        productionAt100: prodAt100Value || 87, 
        // Include yarn type explicitly for historical record - use historical yarn type if available
        yarnType: entryYarnType
      };
      
      console.log('Creating production entry with data:', submissionData);
      console.log('Form night shift details:', {
        originalFormValue: formData.nightShift,
        originalType: typeof formData.nightShift,
        processedValue: nightShiftValue,
        processedType: typeof nightShiftValue,
        submissionValue: submissionData.nightShift,
        submissionType: typeof submissionData.nightShift
      });
      console.log('Selected machine:', selectedMachine);
      console.log('Machine number info:', {
        machineNo: selectedMachine.machineNo,
        machine_number: selectedMachine.machine_number,
        productionAt100: prodAt100Value,
        yarnType: selectedMachine.yarnType
      });
      
      // CRITICAL DEBUG: Log the exact data being sent to the API
      console.log('=== CRITICAL DEBUG: Data being sent to createProductionEntry ===');
      console.log('submissionData object:', JSON.stringify(submissionData, null, 2));
      console.log('submissionData.nightShift value:', submissionData.nightShift);
      console.log('submissionData.nightShift type:', typeof submissionData.nightShift);
      console.log('=== END CRITICAL DEBUG ===');
      
      await asuUnit1Api.createProductionEntry(submissionData);
      
      toast.success('Production entry created successfully');
      
      // Reset the form data after submission with current machine yarn type
      setFormData({
        machineId: selectedMachine.id,
        date: new Date().toISOString().split('T')[0],
        dayShift: 0,
        nightShift: 0,
        yarnType: selectedMachine.yarnType || 'Cotton', // Use current machine yarn type
        productionAt100: 0  // This field is only kept for API compatibility
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
    // Ensure numeric values are properly parsed
    setEditingEntry({
      id: entry.id,
      dayShift: parseFloat(String(entry.dayShift || 0)),
      nightShift: parseFloat(String(entry.nightShift || 0)),
      date: entry.date
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    try {
      setLoading(true);
      
      // Find the original entry to get its yarn type
      const originalEntry = productionEntries.find(entry => entry.id === editingEntry.id);
      
      // Get the yarn type from the original entry, or use a fallback
      const yarnTypeToUse = 
        originalEntry?.yarnType || 
        findHistoricalYarnType(originalEntry?.machineId || 0, editingEntry.date) || 
        selectedMachine?.yarnType || 
        'Cotton';
      
      // Log the values before sending to API
      console.log('Saving edited entry:', {
        id: editingEntry.id,
        dayShift: editingEntry.dayShift,
        nightShift: editingEntry.nightShift,
        dayShiftType: typeof editingEntry.dayShift,
        nightShiftType: typeof editingEntry.nightShift,
        yarnType: yarnTypeToUse
      });
      
      // Ensure values are properly formatted as numbers
      const dataToUpdate = {
        dayShift: parseFloat(String(editingEntry.dayShift)) || 0,
        nightShift: parseFloat(String(editingEntry.nightShift)) || 0,
        date: editingEntry.date,
        // Include the original yarn type in the update
        yarnType: yarnTypeToUse
      };
      
      console.log('Sending update data:', dataToUpdate);
      
      await asuUnit1Api.updateProductionEntry(editingEntry.id, dataToUpdate);

      toast.success('Production entry updated successfully');
      setEditingEntry(null);
      
      // Ensure production entries are reloaded and sorted
      await loadProductionEntries();
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
      await loadProductionEntries();
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
    // Robust value conversion that handles all edge cases
    const convertToNumber = (value: any): number => {
      if (value === undefined || value === null) return 0;
      if (typeof value === 'number') return isNaN(value) ? 0 : value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
    const dayValue = convertToNumber(dayShift);
    const nightValue = convertToNumber(nightShift);
    
    return dayValue + nightValue;
  };

  const calculatePercentage = (total: number | string, productionAt100: number | string) => {
    // Safely convert to numbers
    const totalValue = parseFloat(String(total)) || 0;
    const prodAt100 = parseFloat(String(productionAt100)) || 0;
    
    if (prodAt100 <= 0) return 0;
    
    const percentage = (totalValue / prodAt100) * 100;
    return isNaN(percentage) ? 0 : percentage;
  };

  // Helper function to safely get production at 100 value with historical support
  const getProductionAt100 = (entry: ASUProductionEntry, fallbackMachine?: ASUMachine | null) => {
    // First, try to get historical configuration for this specific entry date and machine
    if (entry.machineId && entry.date) {
      const historicalConfig = findHistoricalMachineConfig(entry.machineId, entry.date);
      if (historicalConfig && historicalConfig.productionAt100 > 0) {
        console.log(`Using historical productionAt100 for machine ${entry.machineId} on ${entry.date}:`, historicalConfig.productionAt100);
        return historicalConfig.productionAt100;
      }
    }
    
    // Try entry.machine first, then fallback to selectedMachine
    const machine = entry.machine || fallbackMachine;
    
    if (!machine) return 87; // Default fallback
    
    // Handle both string and number types of productionAt100
    let productionValue = 0;
    
    if (machine.productionAt100 !== undefined && machine.productionAt100 !== null) {
      if (typeof machine.productionAt100 === 'string') {
        productionValue = parseFloat(machine.productionAt100);
      } else {
        productionValue = machine.productionAt100 as number;
      }
    }
    
    // Default to a sensible value if the value is invalid
    return !isNaN(productionValue) && productionValue > 0 ? productionValue : 87; // Default to 87 as fallback
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

  // Helper function to format yarn type display with historical support
  const formatYarnType = (entry: ASUProductionEntry): string => {
    // First try to get the yarn type from the entry itself
    if (entry.yarnType) {
      return formatYarnTypeString(entry.yarnType);
    }
    
    // If no yarn type in entry, try to get historical yarn type
    if (entry.machineId && entry.date) {
      const historicalYarnType = findHistoricalYarnType(entry.machineId, entry.date);
      if (historicalYarnType) {
        return formatYarnTypeString(historicalYarnType);
      }
    }
    
    // Fall back to machine's current yarn type
    if (entry.machine?.yarnType) {
      return formatYarnTypeString(entry.machine.yarnType);
    }
    
    return 'Unknown';
  };

  // Helper function to format yarn type string
  const formatYarnTypeString = (yarnType: string | undefined): string => {
    if (!yarnType) return 'Unknown';
    
    // Format the yarn type to look better (capitalize first letter of each word)
    return yarnType
      .split(' ')
      .map(word => {
        // Special case for common abbreviations that should be uppercase
        if (['pp', 'cvc', 'pc'].includes(word.toLowerCase())) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  return (
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
      {/* Production Entry Form */}
      <div className="mb-6 overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 bg-green-50 dark:bg-green-900/20 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-base font-medium text-green-800 dark:text-green-200">Daily Production Entry</h2>
          <div className="text-xs text-green-600 dark:text-green-300">Record today's production</div>
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
                  <Select 
                    onValueChange={handleMachineSelect}
                    value={selectedMachine ? selectedMachine.id.toString() : ""}
                  >
                    <SelectTrigger 
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                    >
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
                        machines.map(machine => (
                          <SelectItem 
                            key={machine.id} 
                            value={machine.id.toString()}
                          >
                            {machine.machineName || `Machine ${machine.machineNo || '?'}`} - {machine.count || '?'} Count - {machine.yarnType || 'Cotton'}
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
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-purple-100 rounded-full dark:bg-purple-800/30">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-700 dark:text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Prod @ 100%: <span className="font-bold text-purple-700 dark:text-purple-300">
                              {selectedMachine.productionAt100 ? Number(selectedMachine.productionAt100).toFixed(2) : 'N/A'}
                            </span></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Yarn Type History Section */}
                    <div className="lg:col-span-2">
                      <div className="p-4 mb-5 border border-purple-100 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 dark:border-purple-800/30">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300">Yarn Type History</h4>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs bg-white dark:bg-gray-800"
                            onClick={() => {
                              // Add a new entry with today's date and current yarn type
                              if (!selectedMachine?.id || !selectedMachine?.yarnType) return;
                              
                              const today = new Date().toISOString().split('T')[0];
                              const machineId = selectedMachine.id;
                              const yarnType = selectedMachine.yarnType;
                              
                              // Create a new history entry
                              const machineHistory = machineYarnHistory[machineId] || [];
                              const newMachineHistory = [
                                ...machineHistory,
                                { date: today, yarnType }
                              ];
                              
                              const newHistory = {
                                ...machineYarnHistory,
                                [machineId]: newMachineHistory
                              };
                              
                              setMachineYarnHistory(newHistory);
                              saveMachineYarnHistory(newHistory);
                              toast.success(`Added yarn type "${yarnType}" for today's date`);
                            }}
                          >
                            Add Current Yarn
                          </Button>
                        </div>
                        
                        {selectedMachine?.id && machineYarnHistory[selectedMachine.id] && machineYarnHistory[selectedMachine.id].length > 0 ? (
                          <div className="max-h-40 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-purple-200 dark:border-purple-800/30">
                                  <th className="px-2 py-1 text-left text-xs font-medium text-purple-700 dark:text-purple-300">Date</th>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-purple-700 dark:text-purple-300">Yarn Type</th>
                                  <th className="px-2 py-1 text-right text-xs font-medium text-purple-700 dark:text-purple-300">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {machineYarnHistory[selectedMachine.id]
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date, newest first
                                  .map((entry, index) => (
                                    <tr key={`${entry.date}-${index}`} className="border-b border-purple-100 dark:border-purple-800/20">
                                      <td className="px-2 py-1 text-gray-700 dark:text-gray-300">
                                        {new Date(entry.date).toLocaleDateString()}
                                      </td>
                                      <td className="px-2 py-1 font-medium text-purple-700 dark:text-purple-300">
                                        {formatYarnTypeString(entry.yarnType)}
                                      </td>
                                      <td className="px-2 py-1 text-right">
                                        <button 
                                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                          onClick={() => {
                                            // Remove this entry from history
                                            if (!selectedMachine?.id) return;
                                            
                                            const machineId = selectedMachine.id;
                                            const machineHistory = [...(machineYarnHistory[machineId] || [])];
                                            
                                            // Remove the entry at this index
                                            machineHistory.splice(index, 1);
                                            
                                            const newHistory = {
                                              ...machineYarnHistory,
                                              [machineId]: machineHistory
                                            };
                                            
                                            setMachineYarnHistory(newHistory);
                                            saveMachineYarnHistory(newHistory);
                                            toast.success("Removed yarn type history entry");
                                          }}
                                          title="Delete this history entry"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                            No yarn type history available for this machine
                          </div>
                        )}
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
                          onChange={(e) => {
                            // Robust night shift input handling
                            const inputValue = e.target.value;
                            let nightShiftValue = 0;
                            
                            if (inputValue !== '' && inputValue !== null && inputValue !== undefined) {
                              const parsed = parseFloat(inputValue);
                              nightShiftValue = isNaN(parsed) ? 0 : parsed;
                            }
                            
                            console.log('Night shift input change:', {
                              inputValue,
                              parsedValue: nightShiftValue,
                              type: typeof nightShiftValue
                            });
                            
                            setFormData({ ...formData, nightShift: nightShiftValue });
                          }}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                        />
                      </div>
                    </div>
                    
                    {/* Production@100% field removed - Value comes from machine configuration */}

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
                                {calculatePercentage(calculateTotal(formData.dayShift, formData.nightShift), Number(selectedMachine?.productionAt100) || 0).toFixed(1)}%
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <Button 
                        type="submit" 
                        className="flex items-center justify-center w-full px-3 py-2 font-medium text-white rounded-md bg-green-600 hover:bg-green-700" 
                        disabled={loading || !selectedMachine}
                      >
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

      {/* Production Entries Table */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-orange-50 dark:bg-orange-900/20 dark:border-gray-700">
          <h2 className="text-base font-medium text-orange-800 dark:text-orange-200">
            Production History
            {selectedMachine && ` - ${selectedMachine.machineName || `Machine ${selectedMachine.machineNo}`}`}
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
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-orange-500 dark:text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                {selectedMachine ? 'No production entries found' : 'Select a machine to view entries'}
              </p>
              <p className="max-w-md mt-1 text-sm text-gray-500 dark:text-gray-400">
                {selectedMachine ? 'Add production data using the form above.' : 'Choose a machine from the dropdown first.'}
              </p>
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
                        <div className="flex items-center">
                          {(() => {
                            // Determine which yarn type to display
                            let displayYarnType = 'Cotton'; // Default to Cotton
                            
                            // First check if the entry has its own yarnType field (most reliable source)
                            if (entry.yarnType) {
                              // Entry has its own yarn type (explicitly saved with the entry)
                              displayYarnType = entry.yarnType;
                              console.log(`Using entry's own yarn type: ${displayYarnType}`);
                            } else {
                              // Try to find a historical yarn type for this date
                              const historicalYarnType = findHistoricalYarnType(entry.machineId, entry.date);
                              
                              if (historicalYarnType) {
                                displayYarnType = historicalYarnType;
                                console.log(`Using historical yarn type: ${displayYarnType}`);
                              } else {
                                // Fall back to machine's current yarn type
                                displayYarnType = entry.machine?.yarnType || selectedMachine?.yarnType || 'Cotton';
                                console.log(`Using machine's current yarn type: ${displayYarnType}`);
                              }
                            }
                            
                            // Current yarn type from machine
                            const currentYarnType = entry.machine?.yarnType || selectedMachine?.yarnType || 'Cotton';
                            
                            // Check if this is different from the current yarn type
                            const isHistoricalYarnType = displayYarnType !== currentYarnType;
                            
                            return (
                              <>
                                <div className={`w-2 h-2 mr-2 rounded-full ${isHistoricalYarnType ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                <span className={`font-medium ${isHistoricalYarnType ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                  {formatYarnTypeString(displayYarnType)}
                                </span>
                                {isHistoricalYarnType && (
                                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                    Historical
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
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
                            {(() => {
                              // Robust night shift value processing
                              let nightValue = 0;
                              
                              if (entry.nightShift !== undefined && entry.nightShift !== null) {
                                if (typeof entry.nightShift === 'string') {
                                  // Handle string values (including empty strings)
                                  const parsed = parseFloat(entry.nightShift);
                                  nightValue = isNaN(parsed) ? 0 : parsed;
                                } else if (typeof entry.nightShift === 'number') {
                                  // Handle number values (including NaN)
                                  nightValue = isNaN(entry.nightShift) ? 0 : entry.nightShift;
                                } else {
                                  // Handle other types
                                  nightValue = 0;
                                }
                              }
                              
                              return nightValue.toFixed(2);
                            })()} <span className="text-xs text-gray-500 dark:text-gray-400">kg</span>
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
          
          {/* Legend for yarn type indicators */}
          {productionEntries.length > 0 && (
            <div className="mt-4 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Legend</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Current Yarn Type</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Historical Yarn Type</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    Historical
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Production with previous machine configuration</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>Note:</strong> Production entries store the yarn type used at the time of creation. 
                  If a machine's yarn type is changed later, historical entries will still show the original yarn type.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DailyProduction;
