// src/api/asuUnit2Api.ts
// Updated to match ASU Unit 1 API implementation for consistency and robustness.

import apiClient from './httpClient';
import { PaginatedResponse } from '../types';
import { getMachineNumber, getProductionAt100 } from './asuUnit1Api';

// Re-export shared types that haven't changed
export type { ASUMachine, ProductionStats, ProductionEntriesFilter, CreateASUMachineData, UpdateASUMachineData } from './asuUnit1Api';
import type { ASUMachine, ProductionStats, ProductionEntriesFilter, CreateASUMachineData, UpdateASUMachineData } from './asuUnit1Api';

const api = apiClient;
const basePath = '/asu-unit2';

// === UNIT 2 SPECIFIC TYPES ===

export interface ASUProductionEntryUnit2 {
  id: number;
  machineId: number;
  date: string;
  dayShift: number;
  nightShift: number;
  total: number;
  percentage: number;
  createdAt: string;
  updatedAt: string;
  machine?: ASUMachine;
  yarnType: string;
  productionAt100?: number;

  // Unit 2 Specific Fields
  dayShiftWorker?: string;
  nightShiftWorker?: string;
  dayMainsReading?: number;
  nightMainsReading?: number;

  // Backend original fields
  machineNumber?: number;
  shift?: 'day' | 'night';
  actualProduction?: number;
  theoreticalProduction?: number;
  workerName?: string;
  mainsReading?: number;

  originalId?: number;
  dayShiftId?: number;
  nightShiftId?: number;
}

export interface CreateProductionEntryDataUnit2 {
  machineId: number;
  date: string;
  dayShift: number;
  nightShift: number;
  productionAt100?: number;
  yarnType: string;
  
  // Unit 2 Specific Fields
  dayShiftWorker?: string;
  nightShiftWorker?: string;
  dayMainsReading?: number;
  nightMainsReading?: number;
}

export interface UpdateProductionEntryDataUnit2 {
  dayShift?: number;
  nightShift?: number;
  date?: string;
  yarnType: string;
  
  // Unit 2 Specific Fields
  dayShiftWorker?: string;
  nightShiftWorker?: string;
  dayMainsReading?: number;
  nightMainsReading?: number;
}

// === PERFORMANCE OPTIMIZATIONS ===
// Machine cache to avoid repeated API calls
let machinesCache: ASUMachine[] | null = null;
let machinesCacheTime = 0;
const MACHINES_CACHE_TTL = 60000; // 1 minute cache

// Dev mode check for conditional logging
const isDev = import.meta.env?.DEV ?? false;
const devLog = (...args: any[]) => isDev && console.log(...args);
const devWarn = (...args: any[]) => isDev && console.warn(...args);

// Invalidate machine cache (call after machine CRUD operations)
export const invalidateMachinesCache = () => {
  machinesCache = null;
  machinesCacheTime = 0;
};

export const asuUnit2Api = {
  // Machines
  getMachines: async (): Promise<ASUMachine[]> => {
    const response = await api.get(`${basePath}/machines`);
    return response.data.success ? response.data.data : response.data;
  },

  getAllMachines: async (): Promise<ASUMachine[]> => {
    // Return cached data if available and fresh
    const now = Date.now();
    if (machinesCache && (now - machinesCacheTime) < MACHINES_CACHE_TTL) {
      return machinesCache;
    }
    
    try {
      // First try the /asu-machines endpoint
      try {
        const response = await api.get(`${basePath}/asu-machines`);

        // Properly handle various response formats
        if (response.data.success && Array.isArray(response.data.data)) {
          machinesCache = response.data.data;
          machinesCacheTime = now;
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          machinesCache = response.data;
          machinesCacheTime = now;
          return response.data;
        }
      } catch (primaryError) {
        devWarn('Error with /asu-machines endpoint, trying fallback');
      }

      // Fallback to the /machines endpoint if the first one fails or returns invalid data
      const fallbackResponse = await api.get(`${basePath}/machines`);

      if (fallbackResponse.data.success && Array.isArray(fallbackResponse.data.data)) {
        machinesCache = fallbackResponse.data.data;
        machinesCacheTime = now;
        return fallbackResponse.data.data;
      } else if (Array.isArray(fallbackResponse.data)) {
        machinesCache = fallbackResponse.data;
        machinesCacheTime = now;
        return fallbackResponse.data;
      }

      // If we get here, both endpoints failed to return valid data
      devWarn('Neither endpoint returned valid machine data');
      return [];
    } catch (error) {
      console.error('Error fetching machines from both endpoints:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  createMachine: async (data: Omit<ASUMachine, 'id'>): Promise<ASUMachine> => {
    // Ensure machineNo and count are explicitly sent as numbers for the backend
    const sanitizedData = {
      ...data,
      machineNo: typeof data.machineNo === 'string' ? parseInt(data.machineNo, 10) : Number(data.machineNo),
      // Convert count to a number (allow decimals like 0.65)
      count: typeof data.count === 'string'
        ? (() => { const m = String(data.count).match(/\d*\.?\d+/); return m ? parseFloat(m[0]) : 0; })()
        : Number(data.count || 0),
      // Handle potentially null spindles and speed - convert to 0 if null
      spindles: data.spindles !== null ? Number(data.spindles || 0) : 0,
      speed: data.speed !== null ? Number(data.speed || 0) : 0
    };

    devLog('Creating machine with sanitized data:', sanitizedData);
    const response = await api.post(`${basePath}/machines`, sanitizedData);
    invalidateMachinesCache(); // Invalidate cache after creating
    return response.data.success ? response.data.data : response.data;
  },

  updateMachine: async (id: number, data: UpdateASUMachineData): Promise<ASUMachine> => {
    // Clean up the data to match what the API expects
    const apiData = {
      ...(data.machineNo !== undefined && { machineNo: data.machineNo }),
      ...(data.machine_name !== undefined && { machine_name: data.machine_name }),
      ...(data.machine_number !== undefined && { machine_number: data.machine_number }),
      // Send both isActive and status to ensure the backend correctly processes it
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isActive !== undefined && { status: data.isActive ? 'active' : 'inactive' }),
      ...(data.yarnType !== undefined && { yarnType: data.yarnType }),
      ...(data.count !== undefined && { count: typeof data.count === 'string' ? parseFloat(data.count as any) : Number(data.count) }),
      ...(data.spindles !== undefined && { spindles: data.spindles }),
      ...(data.speed !== undefined && { speed: data.speed }),
      ...(data.productionAt100 !== undefined && { productionAt100: data.productionAt100 })
    };

    const response = await api.put(`${basePath}/machines/${id}`, apiData);
    invalidateMachinesCache();
    return response.data.success ? response.data.data : response.data;
  },

  deleteMachine: async (id: number, force: boolean = false): Promise<void> => {
    await api.delete(`${basePath}/machines/${id}${force ? '?force=true' : ''}`);
    invalidateMachinesCache();
  },

  archiveMachine: async (id: number): Promise<void> => {
    await api.post(`${basePath}/machines/${id}/archive`);
    invalidateMachinesCache();
  },

  // Production entries - OPTIMIZED with caching and transformation
  getProductionEntries: async (
    filters: ProductionEntriesFilter
  ): Promise<PaginatedResponse<ASUProductionEntryUnit2>> => {
    const params = new URLSearchParams();

    // The backend expects machineNumber (the machine_no field), not machineId (the id field)
    // Use cached machines to avoid extra API call
    if (filters.machineId) {
      try {
        // Get the selected machine from cache
        const machines = await asuUnit2Api.getAllMachines(); // Now cached!
        const selectedMachine = machines.find(m => m.id === filters.machineId);

        if (selectedMachine) {
          const machineNumber = selectedMachine.machineNo ||
            (selectedMachine.machine_number ? parseInt(selectedMachine.machine_number) : null);

          if (machineNumber) {
            params.append('machineNumber', machineNumber.toString());
          }
        }
      } catch (error) {
        console.error('Error getting machine number:', error);
      }
    }

    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`${basePath}/production-entries?${params.toString()}`);

    // Transform the backend response into the expected frontend format
    // Backend returns separate entries for day and night shifts, frontend expects them combined
    if (response.data.success) {
      let rawEntries = response.data.data.items as any[];
      const entriesByDateAndMachine: Record<string, ASUProductionEntryUnit2> = {};

      if (!rawEntries || rawEntries.length === 0) {
        // Check if we have any entries in localStorage
        if (filters.machineId) {
          const localStorageKey = `local_production_entries_u2_${filters.machineId}`;
          const localEntries = JSON.parse(localStorage.getItem(localStorageKey) || '[]');

          if (localEntries.length > 0) {
            rawEntries = localEntries.map((entry: any) => {
              // Map local storage format to backend format for processing
              const baseEntry = {
                machineNumber: entry.machineId,
                date: entry.date,
                theoreticalProduction: entry.machine?.productionAt100 || 0,
                machine: entry.machine,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
                workerName: entry.shift === 'day' ? entry.dayShiftWorker : entry.nightShiftWorker,
                mainsReading: entry.shift === 'day' ? entry.dayMainsReading : entry.nightMainsReading
              };

              if (entry.dayShift > 0) {
                return {
                  ...baseEntry,
                  id: `${entry.id}_day`,
                  shift: 'day',
                  actualProduction: entry.dayShift,
                  workerName: entry.dayShiftWorker,
                  mainsReading: entry.dayMainsReading
                };
              }
              return {
                ...baseEntry,
                id: `${entry.id}_night`,
                shift: 'night',
                actualProduction: entry.nightShift,
                workerName: entry.nightShiftWorker,
                mainsReading: entry.nightMainsReading
              };
            });
          }
        }
      } else {
        // Analyze entries to find missing night shifts
        const shiftsByDateMachine: Record<string, { day: boolean, night: boolean }> = {};
        rawEntries.forEach((entry: any) => {
          const key = `${entry.date}_${entry.machineNumber}`;
          if (!shiftsByDateMachine[key]) {
            shiftsByDateMachine[key] = { day: false, night: false };
          }
          if (entry.shift === 'day') shiftsByDateMachine[key].day = true;
          else if (entry.shift === 'night') shiftsByDateMachine[key].night = true;
        });

        // Create missing night shift entries
        const missingNightShiftKeys = Object.entries(shiftsByDateMachine)
          .filter(([_, value]) => value.day && !value.night)
          .map(([key]) => key);

        if (missingNightShiftKeys.length > 0) {
          const additionalEntries: any[] = [];
          for (const key of missingNightShiftKeys) {
            const [date, machineNumberStr] = key.split('_');
            const machineNumber = parseInt(machineNumberStr);
            const dayEntry = rawEntries.find((entry: any) =>
              entry.date === date &&
              entry.machineNumber === machineNumber &&
              entry.shift === 'day'
            );

            if (dayEntry) {
              additionalEntries.push({
                id: `${dayEntry.id}_night`,
                machineNumber,
                date,
                shift: 'night',
                actualProduction: 0,
                theoreticalProduction: dayEntry.theoreticalProduction,
                machine: dayEntry.machine,
                createdAt: dayEntry.createdAt,
                updatedAt: dayEntry.updatedAt,
                workerName: '',
                mainsReading: 0
              });
            }
          }
          rawEntries = [...rawEntries, ...additionalEntries];
        }
      }

      // Group entries by date and machine - OPTIMIZED with minimal logging
      rawEntries.forEach((entry: any) => {
        const key = `${entry.date}_${entry.machineNumber}`;

        if (!entriesByDateAndMachine[key]) {
          entriesByDateAndMachine[key] = {
            id: entry.id,
            originalId: entry.id,
            machineId: entry.machineNumber,
            machineNumber: entry.machineNumber || entry.machine_no,
            date: entry.date,
            dayShift: 0,
            nightShift: 0,
            total: 0,
            percentage: 0,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            yarnType: entry.yarnType || entry.machine?.yarnType,
            productionAt100: entry.productionAt100,
            machine: entry.machine,
            // Initialize Unit 2 specific fields
            dayShiftWorker: '',
            nightShiftWorker: '',
            dayMainsReading: 0,
            nightMainsReading: 0
          };
        }

        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = Number(rawProd) || 0;

        if (entry.shift === 'day') {
          entriesByDateAndMachine[key].dayShift = productionValue;
          entriesByDateAndMachine[key].dayShiftId = entry.id;
          entriesByDateAndMachine[key].dayShiftWorker = entry.workerName || entry.worker_name || '';
          entriesByDateAndMachine[key].dayMainsReading = Number(entry.mainsReading || entry.mains_reading || 0);
          if (!entriesByDateAndMachine[key].id) entriesByDateAndMachine[key].id = entry.id;
        } else if (entry.shift === 'night') {
          entriesByDateAndMachine[key].nightShift = parseFloat(String(rawProd)) || 0;
          entriesByDateAndMachine[key].nightShiftId = entry.id;
          entriesByDateAndMachine[key].nightShiftWorker = entry.workerName || entry.worker_name || '';
          entriesByDateAndMachine[key].nightMainsReading = Number(entry.mainsReading || entry.mains_reading || 0);
          if (!entriesByDateAndMachine[key].id) entriesByDateAndMachine[key].id = entry.id;
        }

        // Update machine data if more complete
        if (entry.machine && (!entriesByDateAndMachine[key].machine ||
            (entry.machine.productionAt100 && !entriesByDateAndMachine[key].machine.productionAt100))) {
          entriesByDateAndMachine[key].machine = { ...entry.machine };
        }
      });

      // Calculate totals and percentages - OPTIMIZED
      Object.values(entriesByDateAndMachine).forEach(entry => {
        entry.dayShift = Number(entry.dayShift) || 0;
        entry.nightShift = Number(entry.nightShift) || 0;
        entry.total = entry.dayShift + entry.nightShift;

        // Calculate percentage
        let productionAt100Value = 0;
        if (entry.productionAt100 != null) {
          productionAt100Value = Number(entry.productionAt100);
        } else if (entry.machine?.productionAt100) {
          productionAt100Value = Number(entry.machine.productionAt100);
        }

        entry.percentage = productionAt100Value > 0 ? (entry.total / productionAt100Value) * 100 : 0;
      });

      // Convert and sort
      const result = Object.values(entriesByDateAndMachine).sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return {
        items: result as ASUProductionEntryUnit2[],
        total: response.data.data.total,
        page: response.data.data.page,
        limit: response.data.data.limit,
        totalPages: response.data.data.totalPages
      };
    }

    return response.data;
  },

  createProductionEntry: async (
    data: CreateProductionEntryDataUnit2
  ): Promise<ASUProductionEntryUnit2> => {
    // Get the machine from cache
    const machines = await asuUnit2Api.getAllMachines(); // Now uses cache!
    const machine = machines.find(m => m.id === data.machineId);

    if (!machine) {
      throw new Error('Machine not found');
    }

    // Get productionAt100 value
    let productionAt100Value = getProductionAt100(machine);
    if (productionAt100Value <= 0) {
      productionAt100Value = 400; // Fallback
    }

    // Get machine number
    const machineNumber = getMachineNumber(machine);
    if (!machineNumber) {
      throw new Error('Machine must have a valid machine number.');
    }

    if (typeof machineNumber !== 'number' || isNaN(machineNumber) || machineNumber <= 0) {
      throw new Error(`Invalid machine number: ${machineNumber}.`);
    }

    const nightShiftValue = parseFloat(String(data.nightShift)) || 0;
    const dayShiftValue = parseFloat(String(data.dayShift)) || 0;
    const entryYarnType = data.yarnType || machine.yarnType || 'Cotton';

    if (dayShiftValue <= 0 && nightShiftValue <= 0) {
      throw new Error('At least one shift must have a production value greater than 0');
    }

    try {
      // Use the optimized batch create endpoint - single API call handles both shifts
      const batchData = {
        machineNumber,
        date: data.date,
        dayShift: dayShiftValue,
        nightShift: nightShiftValue,
        yarnType: entryYarnType,
        productionAt100: productionAt100Value,
        dayShiftWorker: data.dayShiftWorker,
        nightShiftWorker: data.nightShiftWorker,
        dayMainsReading: data.dayMainsReading,
        nightMainsReading: data.nightMainsReading
      };

      const response = await api.post(`${basePath}/production-entries/batch/create`, batchData);
      
      if (response.data.success) {
        // The backend returns { day: entry, night: entry }
        // We need to transform this into the combined format expected by the frontend
        const dayEntry = response.data.data.day;
        const nightEntry = response.data.data.night;
        
        // Use either entry as base, or construct one if only one exists
        const baseEntry = dayEntry || nightEntry;
        
        if (!baseEntry) {
           throw new Error('Failed to create entry');
        }

        // Construct the combined entry object
        const combinedEntry: ASUProductionEntryUnit2 = {
            id: baseEntry.id, // Use ID from one of them
            machineId: data.machineId,
            machineNumber: machineNumber,
            date: data.date,
            dayShift: dayShiftValue,
            nightShift: nightShiftValue,
            total: dayShiftValue + nightShiftValue,
            percentage: productionAt100Value > 0 ? ((dayShiftValue + nightShiftValue) / productionAt100Value) * 100 : 0,
            createdAt: baseEntry.createdAt,
            updatedAt: baseEntry.updatedAt,
            machine: machine,
            yarnType: entryYarnType,
            productionAt100: productionAt100Value,
            dayShiftWorker: data.dayShiftWorker,
            nightShiftWorker: data.nightShiftWorker,
            dayMainsReading: data.dayMainsReading,
            nightMainsReading: data.nightMainsReading,
            // Store original IDs for future updates/deletes
            dayShiftId: dayEntry?.id,
            nightShiftId: nightEntry?.id
        };

        return combinedEntry;
      }
      
      throw new Error('Batch create failed');
    } catch (error: any) {
      // Handle specific error types
      if (error?.response?.status === 409) throw error;
      
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create production entry';
      throw new Error(errorMessage);
    }
  },

  updateProductionEntry: async (
    id: number,
    data: UpdateProductionEntryDataUnit2,
    existingEntry?: { machineNumber?: number; machineId?: number; date: string; dayShift?: number; nightShift?: number; yarnType?: string }
  ): Promise<ASUProductionEntryUnit2> => {
    try {
      // If we have existingEntry passed from the hook, use it directly (no GET needed!)
      let entryData = existingEntry;
      
      // Only fetch if we don't have the entry data
      if (!entryData || (!entryData.machineNumber && !entryData.machineId)) {
        try {
          const entryResponse = await api.get(`${basePath}/production-entries/${id}`);
          if (entryResponse.data.success) {
            entryData = entryResponse.data.data;
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            throw new Error(`Production entry ${id} not found.`);
          }
          throw error;
        }
      }

      if (!entryData) {
        throw new Error('Failed to find production entry');
      }

      // Use machineNumber or machineId (frontend uses machineId, backend uses machineNumber)
      const machineNumber = entryData.machineNumber || entryData.machineId;

      // Use the optimized batch update endpoint - single API call handles both shifts
      const batchData = {
        machineNumber,
        date: data.date || entryData.date,
        dayShift: data.dayShift ?? entryData.dayShift ?? 0,
        nightShift: data.nightShift ?? entryData.nightShift ?? 0,
        yarnType: data.yarnType || entryData.yarnType,
        // New fields
        dayShiftWorker: data.dayShiftWorker,
        nightShiftWorker: data.nightShiftWorker,
        dayMainsReading: data.dayMainsReading,
        nightMainsReading: data.nightMainsReading
      };

      const response = await api.put(`${basePath}/production-entries/batch/update`, batchData);
      
      if (response.data.success) {
        // Return the day entry or night entry, whichever exists
        return response.data.data.day || response.data.data.night;
      }
      
      throw new Error('Batch update failed');
    } catch (error: any) {
      // Fallback to old method if batch endpoint fails
      if (error?.response?.status === 404 && error?.config?.url?.includes('/batch/')) {
        devWarn('Batch endpoint not available, falling back to sequential updates');
        return asuUnit2Api.updateProductionEntryLegacy(id, data);
      }
      
      console.error('Error in updateProductionEntry:', error);
      throw error;
    }
  },

  updateProductionEntryLegacy: async (
    id: number,
    data: UpdateProductionEntryDataUnit2
  ): Promise<ASUProductionEntryUnit2> => {
    try {
      // Get the existing entry
      let existingEntry;
      try {
        const entryResponse = await api.get(`${basePath}/production-entries/${id}`);
        if (entryResponse.data.success) {
          existingEntry = entryResponse.data.data;
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          throw new Error(`Production entry ${id} not found.`);
        }
        throw error;
      }

      if (!existingEntry) {
        throw new Error('Failed to find production entry');
      }

      const currentShift = existingEntry.shift;
      const machineNumber = existingEntry.machineNumber;
      const entryDate = existingEntry.date;

      // Update the current entry
      const currentShiftValue = currentShift === 'day' 
        ? parseFloat(String(data.dayShift)) || 0 
        : parseFloat(String(data.nightShift)) || 0;
      
      const currentWorker = currentShift === 'day' ? data.dayShiftWorker : data.nightShiftWorker;
      const currentMains = currentShift === 'day' ? data.dayMainsReading : data.nightMainsReading;

      const updateData = {
        date: data.date || existingEntry.date,
        actualProduction: currentShiftValue,
        yarnType: data.yarnType || existingEntry.yarnType,
        workerName: currentWorker,
        mainsReading: currentMains
      };

      const response = await api.put(`${basePath}/production-entries/${id}`, updateData);
      const updatedEntry = response.data.success ? response.data.data : response.data;

      // Handle the other shift
      const otherShift = currentShift === 'day' ? 'night' : 'day';
      const otherShiftValue = otherShift === 'day' 
        ? parseFloat(String(data.dayShift)) || 0 
        : parseFloat(String(data.nightShift)) || 0;
      
      const otherWorker = otherShift === 'day' ? data.dayShiftWorker : data.nightShiftWorker;
      const otherMains = otherShift === 'day' ? data.dayMainsReading : data.nightMainsReading;

      // Find the other shift entry
      const params = new URLSearchParams();
      params.append('machineNumber', machineNumber.toString());
      params.append('dateFrom', entryDate);
      params.append('dateTo', entryDate);
      params.append('limit', '10');

      const listResponse = await api.get(`${basePath}/production-entries?${params.toString()}`);

      if (listResponse.data.success) {
        const entries = listResponse.data.data.items;
        const otherEntry = entries.find((e: any) => e.shift === otherShift && e.date === entryDate);

        if (otherEntry) {
          await api.put(`${basePath}/production-entries/${otherEntry.id}`, {
            date: data.date || otherEntry.date,
            actualProduction: otherShiftValue,
            yarnType: data.yarnType || otherEntry.yarnType,
            workerName: otherWorker,
            mainsReading: otherMains
          });
        } else if (otherShiftValue > 0) {
          let theoreticalProduction = existingEntry.productionAt100 || existingEntry.theoreticalProduction;
          if (!theoreticalProduction) {
            const machines = await asuUnit2Api.getAllMachines(); // Uses cache
            const machine = machines.find(m => m.machineNo === machineNumber);
            theoreticalProduction = getProductionAt100(machine);
          }

          await api.post(`${basePath}/production-entries`, {
            machineNumber,
            date: data.date || entryDate,
            shift: otherShift,
            actualProduction: otherShiftValue,
            theoreticalProduction: theoreticalProduction || 400,
            yarnType: data.yarnType || existingEntry.yarnType,
            workerName: otherWorker,
            mainsReading: otherMains
          });
        }
      }

      return updatedEntry;
    } catch (error) {
      console.error('Error in updateProductionEntry:', error);

      // Check localStorage fallback
      if (typeof id === 'number') {
        const allStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('local_production_entries_u2_'));

        for (const key of allStorageKeys) {
          const localEntries = JSON.parse(localStorage.getItem(key) || '[]');
          const entryIndex = localEntries.findIndex((e: any) => e.id === id);

          if (entryIndex >= 0) {
            const updatedEntry = {
              ...localEntries[entryIndex],
              ...data,
              updatedAt: new Date().toISOString()
            };

            localEntries[entryIndex] = updatedEntry;
            localStorage.setItem(key, JSON.stringify(localEntries));
            console.log('Updated local production entry:', updatedEntry);

            return updatedEntry as ASUProductionEntryUnit2;
          }
        }
      }

      // If we get here, we couldn't find a matching local entry, so propagate the original error
      throw error;
    }
  },



  deleteProductionEntry: async (id: number): Promise<void> => {
    try {
      console.log('Frontend: Preparing to delete entry with ID:', id);

      // First check if this entry exists in localStorage
      const allStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('local_production_entries_u2_'));
      let foundInLocalStorage = false;

      for (const key of allStorageKeys) {
        const localEntries = JSON.parse(localStorage.getItem(key) || '[]');
        const entryIndex = localEntries.findIndex((e: any) => e.id === id);

        if (entryIndex >= 0) {
          // Found the entry in localStorage, remove it
          console.log('Found entry to delete in localStorage:', localEntries[entryIndex]);
          localEntries.splice(entryIndex, 1);
          localStorage.setItem(key, JSON.stringify(localEntries));
          console.log('Deleted production entry from localStorage');
          foundInLocalStorage = true;
          return; // Exit after removing from localStorage
        }
      }

      // If not found in localStorage, proceed with backend deletion
      if (!foundInLocalStorage) {
        // Get the original entries from the backend
        const originalResponse = await api.get(`${basePath}/production-entries?limit=300`);
        const allEntries = originalResponse.data.data.items;

        console.log(`Found ${allEntries.length} entries in backend`);

        // Find the entry with the given ID in the backend
        let entryToDelete = allEntries.find((entry: any) => entry.id === id);

        // If we couldn't find the entry directly (it might be a frontend combined ID),
        // we need to find both day and night shifts from our combined entries
        if (!entryToDelete) {
          console.warn(`Direct backend entry with ID ${id} not found, looking for day/night shift IDs`);

          // Get our frontend combined entries to find dayShiftId or nightShiftId
          const entriesResponse = await api.get(`${basePath}/production-entries?limit=300`);

          // Transform backend response to combined frontend entries
          const rawEntries = entriesResponse.data.data.items;
          const entriesByDateAndMachine: Record<string, any> = {};

          // Group entries by date and machine just like in getProductionEntries
          rawEntries.forEach((entry: any) => {
            const key = `${entry.date}_${entry.machineNumber}`;

            if (!entriesByDateAndMachine[key]) {
              entriesByDateAndMachine[key] = {
                id: entry.id,
                machineId: entry.machineNumber,
                date: entry.date,
                dayShift: 0,
                nightShift: 0,
                dayShiftId: null,
                nightShiftId: null
              };
            }

            if (entry.shift === 'day') {
              entriesByDateAndMachine[key].dayShift = entry.actualProduction || 0;
              entriesByDateAndMachine[key].dayShiftId = entry.id;
            } else if (entry.shift === 'night') {
              entriesByDateAndMachine[key].nightShift = entry.actualProduction || 0;
              entriesByDateAndMachine[key].nightShiftId = entry.id;
            }
          });

          // Find the combined entry with our target ID
          const combinedEntry = Object.values(entriesByDateAndMachine).find(
            (entry: any) => entry.id === id || entry.dayShiftId === id || entry.nightShiftId === id
          );

          if (combinedEntry) {
            console.log('Found combined entry:', combinedEntry);

            // If we found a combined entry, delete both day and night shifts
            if (combinedEntry.dayShiftId) {
              try {
                console.log(`Deleting day shift with ID ${combinedEntry.dayShiftId}`);
                await api.delete(`${basePath}/production-entries/${combinedEntry.dayShiftId}`);
              } catch (e) {
                console.error('Error deleting day shift:', e);
              }
            }

            if (combinedEntry.nightShiftId) {
              try {
                console.log(`Deleting night shift with ID ${combinedEntry.nightShiftId}`);
                await api.delete(`${basePath}/production-entries/${combinedEntry.nightShiftId}`);
              } catch (e) {
                console.error('Error deleting night shift:', e);
              }
            }

            return;
          } else {
            console.warn(`Entry with ID ${id} not found in list (limit=300), attempting direct delete`);
            // Try direct delete as a fallback
            const deleteResponse = await api.delete(`${basePath}/production-entries/${id}`);
            return deleteResponse.data;
          }
        }

        console.log('Found entry to delete:', entryToDelete);

        // Delete the specific entry we found
        const deleteResponse = await api.delete(`${basePath}/production-entries/${id}`);
        console.log('Delete response for ID', id, ':', deleteResponse.data);

        // Also delete any matching entry for the opposite shift
        if (entryToDelete.shift === 'day' || entryToDelete.shift === 'night') {
          const oppositeShift = entryToDelete.shift === 'day' ? 'night' : 'day';
          const matchingEntry = allEntries.find((entry: any) =>
            entry.date === entryToDelete.date &&
            entry.machineNumber === entryToDelete.machineNumber &&
            entry.shift === oppositeShift
          );

          if (matchingEntry) {
            console.log(`Found matching ${oppositeShift} shift entry to delete:`, matchingEntry);
            try {
              const deleteMatchingResponse = await api.delete(`${basePath}/production-entries/${matchingEntry.id}`);
              console.log(`Delete response for matching ${oppositeShift} shift:`, deleteMatchingResponse.data);
            } catch (matchingError) {
              console.error(`Error deleting matching ${oppositeShift} shift entry:`, matchingError);
              // Don't throw here - we already deleted the primary entry
            }
          }
        }

        return deleteResponse.data;
      }
    } catch (error) {
      console.error('Frontend: Error in deleteProductionEntry:', error);
      throw error;
    }
  },

  // Stats
  getProductionStats: async (filters: { machineNumber?: number; dateFrom?: string; dateTo?: string } = {}): Promise<ProductionStats> => {
    const params = new URLSearchParams();
    if (filters.machineNumber) params.set('machineNumber', String(filters.machineNumber));
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    const response = await api.get(`${basePath}/stats?${params.toString()}`);
    return response.data.success ? response.data.data : response.data;
  },
};

export default asuUnit2Api;

