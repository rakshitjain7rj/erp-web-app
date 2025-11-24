import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Edit, Plus, Save, Trash2, X } from 'lucide-react';
import { ASUMachine, ASUProductionEntry, ProductionStats, asuUnit1Api, CreateProductionEntryData } from '../../api/asuUnit1Api';

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
    [machineId: number]: { date: string, yarnType: string }[]
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
  const [importing, setImporting] = useState(false);

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
  const saveMachineYarnHistory = useCallback((history: { [machineId: number]: { date: string, yarnType: string }[] }) => {
    try {
      localStorage.setItem('machineYarnHistory', JSON.stringify(history));
      console.log('Saved machine yarn history to localStorage:', history);
    } catch (error) {
      console.error('Error saving machine yarn history:', error);
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
        limit: 300
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
  }, [loadMachines, loadMachineYarnHistory]);

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
        // Check if we already have history for this machine
        if (!machineYarnHistory[machine.id] || machineYarnHistory[machine.id].length === 0) {
          // Create initial history with today's date
          const today = new Date().toISOString().split('T')[0];
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

  // Helper function to safely get production at 100 value
  const getProductionAt100 = (entry: ASUProductionEntry, fallbackMachine?: ASUMachine | null) => {
    // PRIORITIZE the entry's stored productionAt100 value for historical accuracy
    if (entry.productionAt100 !== undefined && entry.productionAt100 !== null) {
      const storedValue = typeof entry.productionAt100 === 'string'
        ? parseFloat(entry.productionAt100)
        : entry.productionAt100;
      if (!isNaN(storedValue) && storedValue > 0) {
        return storedValue;
      }
    }

    // Fall back to machine's current value for older entries or new entry creation
    const machine = entry.machine || fallbackMachine;

    if (!machine) return 400; // Default fallback value

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
    return !isNaN(productionValue) && productionValue > 0 ? productionValue : 400; // Increased default fallback
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

  // Helper function to format yarn type display
  const formatYarnType = (yarnType: string | undefined): string => {
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

  // CSV import helpers (3 columns: date, day, night)
  const parseDateFlexible = (s: string): string => {
    const t = String(s || '').trim();
    if (!t) throw new Error('Empty date');
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t; // yyyy-mm-dd
    const parts = t.includes('/') ? t.split('/') : t.split('-');
    if (parts.length === 3) {
      const [a, b, c] = parts.map(x => x.trim());
      // yyyy/mm/dd
      if (a.length === 4) {
        const mm = b.padStart(2, '0');
        const dd = c.padStart(2, '0');
        return `${a}-${mm}-${dd}`;
      }
      // dd/mm/yyyy or mm/dd/yyyy -> try to infer
      const n1 = parseInt(a, 10);
      const n2 = parseInt(b, 10);
      const yyyy = c.length === 2 ? `20${c}` : c.padStart(4, '0');
      let day = n1, month = n2;
      if (n1 <= 12 && n2 > 12) { day = n2; month = n1; } // mm/dd/yyyy
      const mm2 = String(month).padStart(2, '0');
      const dd2 = String(day).padStart(2, '0');
      return `${yyyy}-${mm2}-${dd2}`;
    }
    const d = new Date(t);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    throw new Error(`Invalid date: ${s}`);
  };

  const handleImportCSV = async (file: File) => {
    try {
      setImporting(true);
      if (!selectedMachine) throw new Error('Please select a machine first');
      const text = await file.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) throw new Error('File is empty');
      const isHeader = /date|day|night/i.test(lines[0]) || /[a-zA-Z]/.test(lines[0]);
      const dataLines = isHeader ? lines.slice(1) : lines;

      const machineId = selectedMachine.id;
      const yarnType = selectedMachine.yarnType || 'Cotton';

      let ok = 0, skip = 0, fail = 0;
      for (const [idx, line] of dataLines.entries()) {
        if (!line) continue;
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 3) { fail++; continue; }
        const [dStr, dayStr, nightStr] = parts;
        try {
          const date = parseDateFlexible(dStr);
          const day = parseFloat(dayStr) || 0;
          const night = parseFloat(nightStr) || 0;
          if (day <= 0 && night <= 0) { skip++; continue; }

          try {
            await asuUnit1Api.createProductionEntry({
              machineId,
              date,
              dayShift: day,
              nightShift: night,
              yarnType
            });
            ok++;
          } catch (e: any) {
            if (e?.response?.status === 409) { skip++; } else { fail++; }
          }
        } catch (e) {
          console.warn(`Row ${idx + 1} parse error:`, e);
          fail++;
        }
      }

      toast.success(`Import finished: ${ok} created, ${skip} skipped, ${fail} failed`);
      await loadMachines();
      await loadProductionEntries();
      await loadStats();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  // Helper function to format night shift values safely
  const formatShiftValue = (val: any) => {
    let n = 0;
    if (val !== undefined && val !== null) {
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        n = isNaN(parsed) ? 0 : parsed;
      } else if (typeof val === 'number') {
        n = isNaN(val) ? 0 : val;
      }
    }
    return n.toFixed(2);
  };

  // Handler for adding current yarn type to history
  const handleAddCurrentYarn = () => {
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

    const newHistory = { ...machineYarnHistory };
    (newHistory as any)[machineId] = newMachineHistory;

    setMachineYarnHistory(newHistory);
    saveMachineYarnHistory(newHistory);
    toast.success(`Added yarn type "${yarnType}" for today's date`);
  };

  // Handler for removing yarn type history entry
  const handleRemoveYarnHistory = (index: number) => {
    // Remove this entry from history
    if (!selectedMachine?.id) return;

    const machineId = selectedMachine.id;
    const machineHistory = [...(machineYarnHistory[machineId] || [])];

    // Remove the entry at this index
    machineHistory.splice(index, 1);

    const newHistory = { ...machineYarnHistory };
    (newHistory as any)[machineId] = machineHistory;

    setMachineYarnHistory(newHistory);
    saveMachineYarnHistory(newHistory);
    toast.success("Removed yarn type history entry");
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Machines</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalMachines}</h3>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Machines</p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.activeMachines}</h3>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Entries</p>
                <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.todayEntries}</h3>
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Efficiency</p>
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.averageEfficiency.toFixed(1)}%</h3>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Header & Machine Selection */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex-1 w-full md:w-auto">
              <Label htmlFor="machine-select" className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Select Machine</Label>
              <div className="flex gap-2">
                <Select
                  onValueChange={handleMachineSelect}
                  value={selectedMachine ? selectedMachine.id.toString() : ""}
                >
                  <SelectTrigger
                    className="w-full md:w-[300px] bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  >
                    <SelectValue placeholder="Select a machine..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {machines && machines.length > 0 ? (
                      machines.map(machine => (
                        <SelectItem key={machine.id} value={machine.id.toString()}>
                          <span className="font-medium">{machine.machineName || `Machine ${machine.machineNo}`}</span>
                          <span className="text-gray-400 mx-2">|</span>
                          <span className="text-gray-500">{machine.count} Count</span>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-machines">No machines available</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <label className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border ${importing ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'}`}>
                  {importing ? 'Importing...' : 'Import CSV'}
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleImportCSV(e.target.files[0])} disabled={importing || !selectedMachine} />
                </label>
              </div>
            </div>

            {selectedMachine && (
              <div className="flex gap-4 text-sm bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="px-2">
                  <span className="block text-xs text-gray-500">Count</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedMachine.count}</span>
                </div>
                <div className="px-2 border-l border-gray-200 dark:border-gray-700">
                  <span className="block text-xs text-gray-500">Yarn</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedMachine.yarnType || 'Cotton'}</span>
                </div>
                <div className="px-2 border-l border-gray-200 dark:border-gray-700">
                  <span className="block text-xs text-gray-500">Speed</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedMachine.speed} RPM</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Entry Form */}
        {selectedMachine && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-900/10">
            <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-auto">
                <Label htmlFor="date" className="text-xs font-medium text-gray-500 mb-1.5 block">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full md:w-40 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              <div className="w-full md:w-32">
                <Label htmlFor="dayShift" className="text-xs font-medium text-gray-500 mb-1.5 block">Day Shift (kg)</Label>
                <Input
                  id="dayShift"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.dayShift || ''}
                  onChange={(e) => setFormData({ ...formData, dayShift: parseFloat(e.target.value) || 0 })}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="w-full md:w-32">
                <Label htmlFor="nightShift" className="text-xs font-medium text-gray-500 mb-1.5 block">Night Shift (kg)</Label>
                <Input
                  id="nightShift"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.nightShift || ''}
                  onChange={(e) => setFormData({ ...formData, nightShift: parseFloat(e.target.value) || 0 })}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[120px] py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</TableHead>
                <TableHead className="py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Yarn Type</TableHead>
                <TableHead className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Day Shift</TableHead>
                <TableHead className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Night Shift</TableHead>
                <TableHead className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</TableHead>
                <TableHead className="text-center py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Efficiency</TableHead>
                <TableHead className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !selectedMachine ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    Select a machine to view production entries
                  </TableCell>
                </TableRow>
              ) : productionEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    No entries found for this machine
                  </TableCell>
                </TableRow>
              ) : (
                productionEntries.map(entry => (
                  <TableRow key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                      {editingEntry?.id === entry.id ? (
                        <Input
                          type="date"
                          value={editingEntry.date}
                          onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                          className="h-8 w-full"
                        />
                      ) : (
                        new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const displayYarnType = entry.yarnType || findHistoricalYarnType(entry.machineId, entry.date) || entry.machine?.yarnType || 'Cotton';
                        const isHistorical = displayYarnType !== (selectedMachine?.yarnType || 'Cotton');
                        return (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${isHistorical ? 'text-purple-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                              {formatYarnType(displayYarnType)}
                            </span>
                            {isHistorical && (
                              <Badge variant="secondary" className="text-[10px] px-1 h-5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Hist</Badge>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingEntry?.id === entry.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editingEntry.dayShift}
                          onChange={(e) => setEditingEntry({ ...editingEntry, dayShift: parseFloat(e.target.value) || 0 })}
                          className="h-8 w-24 text-right ml-auto"
                        />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">{parseFloat(String(entry.dayShift || 0)).toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingEntry?.id === entry.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editingEntry.nightShift}
                          onChange={(e) => setEditingEntry({ ...editingEntry, nightShift: parseFloat(e.target.value) || 0 })}
                          className="h-8 w-24 text-right ml-auto"
                        />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">{formatShiftValue(entry.nightShift)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                      {editingEntry?.id === entry.id
                        ? calculateTotal(editingEntry.dayShift, editingEntry.nightShift).toFixed(2)
                        : calculateTotal(entry.dayShift, entry.nightShift).toFixed(2)
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const total = editingEntry?.id === entry.id
                          ? calculateTotal(editingEntry.dayShift, editingEntry.nightShift)
                          : calculateTotal(entry.dayShift, entry.nightShift);
                        const productionAt100 = getProductionAt100(entry, selectedMachine);
                        const percentage = calculatePercentage(total, productionAt100);
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${percentage >= 85 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            percentage >= 70 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {percentage.toFixed(1)}%
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {editingEntry?.id === entry.id ? (
                          <>
                            <Button size="sm" onClick={handleSaveEdit} className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700 text-white rounded-md">
                              <Save className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" onClick={() => setEditingEntry(null)} className="h-7 w-7 p-0 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md">
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(entry)} className="h-7 w-7 p-0 text-blue-600 border-transparent bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(entry.id)} className="h-7 w-7 p-0 text-red-600 border-transparent bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};

export default DailyProduction;
