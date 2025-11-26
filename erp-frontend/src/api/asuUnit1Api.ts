// src/api/asuUnit1Api.ts

import apiClient from './httpClient';
import { PaginatedResponse } from '../types';

// Use shared api client; endpoints are relative to /asu-unit1
const api = apiClient;
const basePath = '/asu-unit1';

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

// Get cached machines or fetch if cache expired
const getCachedMachines = async (): Promise<ASUMachine[]> => {
  const now = Date.now();
  if (machinesCache && (now - machinesCacheTime) < MACHINES_CACHE_TTL) {
    return machinesCache;
  }
  
  // Fetch fresh machines
  const machines = await asuUnit1Api.getAllMachines();
  machinesCache = machines;
  machinesCacheTime = now;
  return machines;
};

// Helper function to get a valid machine number from a machine object
const getMachineNumber = (machine: ASUMachine | undefined): number | null => {
  if (!machine) return null;

  // Handle machineNo field first - this is the primary field for database foreign key
  if (machine.machineNo !== undefined && machine.machineNo !== null) {
    const machineNo = typeof machine.machineNo === 'string' ?
      parseInt(machine.machineNo, 10) :
      machine.machineNo;

    if (!isNaN(machineNo)) {
      return machineNo;
    }
  }

  // Fallback to machine_number field
  if (machine.machine_number !== undefined && machine.machine_number !== null) {
    const parsedNumber = parseInt(String(machine.machine_number), 10);
    if (!isNaN(parsedNumber)) {
      return parsedNumber;
    }
  }

  // Last resort: try to extract a number from the machine name
  if (machine.machineName) {
    const matches = machine.machineName.match(/\d+/);
    if (matches && matches[0]) {
      const extractedNumber = parseInt(matches[0], 10);
      if (!isNaN(extractedNumber)) {
        return extractedNumber;
      }
    }
  }

  devWarn('No valid machine number found for machine:', machine);
  return null;
};

// Helper function to get a valid production@100% value from a machine or production entry
const getProductionAt100 = (obj: ASUMachine | ASUProductionEntry | any): number => {
  if (!obj) return 0;

  // Check if this is a production entry with a machine property
  if (obj.machine && obj.machine.productionAt100 !== undefined && obj.machine.productionAt100 !== null) {
    const value = typeof obj.machine.productionAt100 === 'string' ?
      parseFloat(obj.machine.productionAt100) :
      obj.machine.productionAt100;

    if (!isNaN(value) && value > 0) {
      return value;
    }
  }

  // Handle direct machine object
  if (obj.productionAt100 !== undefined && obj.productionAt100 !== null) {
    const productionAt100Value = typeof obj.productionAt100 === 'string' ?
      parseFloat(obj.productionAt100) :
      obj.productionAt100;

    if (!isNaN(productionAt100Value) && productionAt100Value > 0) {
      return productionAt100Value;
    }
  }

  // Fallback to default value if no valid productionAt100 found
  return 400; // Default value as fallback
};

export interface ASUMachine {
  id: number;
  machineNo?: string | number;
  machineName?: string;
  count?: number; // Backend requires a number
  yarnType?: string;
  spindles?: number | null;
  machine_name?: string;
  machine_number?: string;
  status?: string;
  speed?: string | number | null;
  productionAt100?: string | number;
  unit: number; // Always 1 (Unit 2 functionality removed)
  isActive: boolean;
  archivedAt?: string | null;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ASUProductionEntry {
  id: number;            // This MUST be the actual backend ID
  machineId: number;     // This is mapped from machineNumber in the backend
  date: string;
  dayShift: number;      // This is mapped from actualProduction where shift='day'
  nightShift: number;    // This is mapped from actualProduction where shift='night'
  total: number;         // Sum of dayShift and nightShift
  percentage: number;    // Calculated from total and machine.productionAt100
  createdAt: string;
  updatedAt: string;
  machine?: ASUMachine;
  yarnType: string;      // The yarn type explicitly associated with this production entry
  productionAt100?: number; // Production@100% value stored with this entry for historical accuracy

  // Backend original fields that may be present
  machineNumber?: number;
  shift?: 'day' | 'night';
  actualProduction?: number;
  theoreticalProduction?: number;

  // Reference to the original backend IDs (for day and night shifts)
  originalId?: number;   // Keep track of the original backend ID 
  dayShiftId?: number;   // Backend ID for day shift entry
  nightShiftId?: number; // Backend ID for night shift entry
}

export interface CreateProductionEntryData {
  machineId: number;
  date: string;
  dayShift: number;
  nightShift: number;
  productionAt100?: number; // Optional, as it's determined by the machine configuration
  yarnType: string;         // Required to track yarn type explicitly with production entries
}

export interface UpdateProductionEntryData {
  dayShift?: number;
  nightShift?: number;
  date?: string;
  yarnType: string;  // Required to ensure yarn type is always associated with entries
}

export interface ProductionStats {
  totalMachines: number;
  activeMachines: number;
  todayEntries: number;
  averageEfficiency: number;
}

export interface ProductionEntriesFilter {
  machineId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateASUMachineData {
  machine_name: string;
  machine_number: string;
  status: 'active' | 'inactive';
  yarnType?: string;
  count?: number;
  spindles?: number;
  speed?: number;
  productionAt100?: number;
}

export interface UpdateASUMachineData {
  // Original fields
  machine_name?: string;
  machine_number?: string;
  status?: 'active' | 'inactive';

  // Backend expected fields
  machineNo?: number;
  isActive?: boolean;
  yarnType?: string;
  count?: number;
  spindles?: number;
  speed?: number | string;
  productionAt100?: number | string;
}

// API Functions
export const asuUnit1Api = {
  // Get all ASU machines (always Unit 1)
  getMachines: async (): Promise<ASUMachine[]> => {
    const response = await api.get(`${basePath}/machines`);
    return response.data.success ? response.data.data : response.data;
  },

  // Create a new machine
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

  // Update an existing machine (deprecated - use updateMachineYarnTypeAndCount instead)
  // This function uses the wrong endpoint (/machines/${id}) and should not be used
  // Left for backwards compatibility
  updateMachineOld: async (id: number, data: Partial<ASUMachine>): Promise<ASUMachine> => {
    const response = await api.put(`${basePath}/machines/${id}`, data);
    return response.data.success ? response.data.data : response.data;
  },

  // New API endpoint for getting all machines (including inactive) - WITH CACHING
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

  // Update machine yarn type and count only using /asu-machines/:id endpoint
  updateMachineYarnTypeAndCount: async (id: number, data: UpdateASUMachineData): Promise<ASUMachine> => {
    const response = await api.put(`${basePath}/asu-machines/${id}`, data);
    invalidateMachinesCache(); // Invalidate cache after updating
    return response.data.success ? response.data.data : response.data;
  },

  // Get production entries for a machine - OPTIMIZED with caching
  getProductionEntries: async (
    filters: ProductionEntriesFilter
  ): Promise<PaginatedResponse<ASUProductionEntry>> => {
    const params = new URLSearchParams();

    // The backend expects machineNumber (the machine_no field), not machineId (the id field)
    // Use cached machines to avoid extra API call
    if (filters.machineId) {
      try {
        // Get the selected machine from cache
        const machines = await asuUnit1Api.getAllMachines(); // Now cached!
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
      const entriesByDateAndMachine: Record<string, ASUProductionEntry> = {};

      if (!rawEntries || rawEntries.length === 0) {
        // Check if we have any entries in localStorage
        if (filters.machineId) {
          const localStorageKey = `local_production_entries_${filters.machineId}`;
          const localEntries = JSON.parse(localStorage.getItem(localStorageKey) || '[]');

          if (localEntries.length > 0) {
            rawEntries = localEntries.map((entry: any) => {
              if (entry.dayShift > 0) {
                return {
                  id: `${entry.id}_day`,
                  machineNumber: entry.machineId,
                  date: entry.date,
                  shift: 'day',
                  actualProduction: entry.dayShift,
                  theoreticalProduction: entry.machine?.productionAt100 || 0,
                  machine: entry.machine,
                  createdAt: entry.createdAt,
                  updatedAt: entry.updatedAt
                };
              }
              return {
                id: `${entry.id}_night`,
                machineNumber: entry.machineId,
                date: entry.date,
                shift: 'night',
                actualProduction: entry.nightShift,
                theoreticalProduction: entry.machine?.productionAt100 || 0,
                machine: entry.machine,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt
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
                updatedAt: dayEntry.updatedAt
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
            machine: entry.machine
          };
        }

        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = Number(rawProd) || 0;

        if (entry.shift === 'day') {
          entriesByDateAndMachine[key].dayShift = productionValue;
          entriesByDateAndMachine[key].dayShiftId = entry.id;
          if (!entriesByDateAndMachine[key].id) entriesByDateAndMachine[key].id = entry.id;
        } else if (entry.shift === 'night') {
          entriesByDateAndMachine[key].nightShift = parseFloat(String(rawProd)) || 0;
          entriesByDateAndMachine[key].nightShiftId = entry.id;
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
        items: result as ASUProductionEntry[],
        total: response.data.data.total,
        page: response.data.data.page,
        limit: response.data.data.limit,
        totalPages: response.data.data.totalPages
      };
    }

    return response.data;
  },



  // Create a new production entry - OPTIMIZED
  createProductionEntry: async (
    data: CreateProductionEntryData
  ): Promise<ASUProductionEntry> => {
    // Get the machine from cache
    const machines = await asuUnit1Api.getAllMachines(); // Now uses cache!
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
    const entryYarnType = data.yarnType || machine.yarnType || 'Cotton';

    // Build entries to create
    const entriesToCreate: any[] = [];

    if (data.dayShift > 0) {
      entriesToCreate.push({
        machineNumber,
        date: data.date,
        shift: 'day',
        actualProduction: parseFloat(String(data.dayShift)),
        theoreticalProduction: productionAt100Value,
        yarnType: entryYarnType
      });
    }

    if (nightShiftValue > 0) {
      entriesToCreate.push({
        machineNumber,
        date: data.date,
        shift: 'night',
        actualProduction: nightShiftValue,
        theoreticalProduction: productionAt100Value,
        yarnType: entryYarnType
      });
    }

    if (entriesToCreate.length === 0) {
      throw new Error('At least one shift must have a production value greater than 0');
    }

    try {
      const responses = [];
      for (const entry of entriesToCreate) {
        try {
          const response = await api.post(`${basePath}/production-entries`, entry);
          responses.push(response);
        } catch (error: any) {
          if (error.response?.status === 409) throw error;
          throw new Error(`Failed to create ${entry.shift} entry: ${error.response?.data?.error || error.message}`);
        }
      }
      const firstResponse = responses[0];
      return firstResponse.data.success ? firstResponse.data.data : firstResponse.data;
    } catch (error: any) {
      // Handle specific error types
      if (error?.response?.status === 409) throw error;
      
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create production entry';
      throw new Error(errorMessage);
    }
  },

  // Update a production entry - ULTRA OPTIMIZED with batch endpoint (single API call)
  // Pass existingEntry to skip the GET call entirely for maximum speed
  updateProductionEntry: async (
    id: number,
    data: UpdateProductionEntryData,
    existingEntry?: { machineNumber?: number; machineId?: number; date: string; dayShift?: number; nightShift?: number; yarnType?: string }
  ): Promise<ASUProductionEntry> => {
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
        yarnType: data.yarnType || entryData.yarnType
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
        return asuUnit1Api.updateProductionEntryLegacy(id, data);
      }
      
      console.error('Error in updateProductionEntry:', error);
      throw error;
    }
  },

  // Legacy update method (fallback if batch endpoint unavailable)
  updateProductionEntryLegacy: async (
    id: number,
    data: UpdateProductionEntryData
  ): Promise<ASUProductionEntry> => {
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

      const updateData = {
        date: data.date || existingEntry.date,
        actualProduction: currentShiftValue,
        yarnType: data.yarnType || existingEntry.yarnType
      };

      const response = await api.put(`${basePath}/production-entries/${id}`, updateData);
      const updatedEntry = response.data.success ? response.data.data : response.data;

      // Handle the other shift
      const otherShift = currentShift === 'day' ? 'night' : 'day';
      const otherShiftValue = otherShift === 'day' 
        ? parseFloat(String(data.dayShift)) || 0 
        : parseFloat(String(data.nightShift)) || 0;

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
            yarnType: data.yarnType || otherEntry.yarnType
          });
        } else if (otherShiftValue > 0) {
          let theoreticalProduction = existingEntry.productionAt100 || existingEntry.theoreticalProduction;
          if (!theoreticalProduction) {
            const machines = await asuUnit1Api.getAllMachines(); // Uses cache
            const machine = machines.find(m => m.machineNo === machineNumber);
            theoreticalProduction = getProductionAt100(machine);
          }

          await api.post(`${basePath}/production-entries`, {
            machineNumber,
            date: data.date || entryDate,
            shift: otherShift,
            actualProduction: otherShiftValue,
            theoreticalProduction: theoreticalProduction || 400,
            yarnType: data.yarnType || existingEntry.yarnType
          });
        }
      }

      return updatedEntry;
    } catch (error) {
      console.error('Error in updateProductionEntry:', error);

      // Check localStorage fallback
      if (typeof id === 'number') {
        const allStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('local_production_entries_'));

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

            return updatedEntry as ASUProductionEntry;
          }
        }
      }

      // If we get here, we couldn't find a matching local entry, so propagate the original error
      throw error;
    }
  },

  // Delete a production entry
  // Modified to delete both day and night shift entries
  deleteProductionEntry: async (id: number): Promise<void> => {
    try {
      console.log('Frontend: Preparing to delete entry with ID:', id);

      // First check if this entry exists in localStorage
      const allStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('local_production_entries_'));
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

  // Get production statistics
  getProductionStats: async (): Promise<ProductionStats> => {
    const response = await api.get(`${basePath}/stats`);
    return response.data.success ? response.data.data : response.data;
  },

  // Machine management functions
  addMachine: async (data: CreateASUMachineData): Promise<ASUMachine> => {
    // Transform frontend format to backend format
    // Ensure machineNo is always set and is a valid number - this is critical for foreign key relationships
    const machineNumber = data.machine_number ? Number(data.machine_number) : 0;

    if (!machineNumber || isNaN(machineNumber)) {
      throw new Error('Machine Number is required and must be a valid number');
    }

    // Log the machine creation with the machine number being used
    console.log(`Creating machine with machineNo=${machineNumber}`);

    const apiData = {
      machineNo: machineNumber, // Always provide machineNo as a number
      machine_name: data.machine_name || `Machine ${machineNumber}`,
      machine_number: String(machineNumber), // Also provide as string for backwards compatibility
      count: data.count,
      yarnType: data.yarnType || 'Cotton',
      spindles: data.spindles || 0,
      speed: data.speed || 0,
      productionAt100: data.productionAt100 || 0,
      isActive: data.status === 'active'
    };

    console.log('Sending machine creation request with data:', apiData);
    const response = await api.post(`${basePath}/asu-machines`, apiData);
    return response.data.success ? response.data.data : response.data;
  },

  // Update machine with all fields using /machines/:id endpoint
  // Get machine configuration history from both localStorage and server
  getMachineConfigHistory: async (machineId: number): Promise<any[]> => {
    // For now, we're using localStorage for storing machine configuration history
    // But we also try to fetch from the server if available
    const historyKey = `machine_config_history_${machineId}`;
    try {
      // First check if this machine has any production entries
      const hasProductionEntries = await asuUnit1Api.checkMachineHasProductionEntries(machineId);

      // If there are no production entries, don't return any history
      if (!hasProductionEntries) {
        console.log(`No production entries for machine ${machineId}, returning empty history`);
        return [];
      }

      // Try to get data from localStorage first
      const localHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');

      try {
        // Also try to get data from the server (if the API endpoint exists)
        console.log(`Trying to fetch machine configuration history from server for machine ${machineId}`);
        const response = await api.get(`${basePath}/machine-configurations/${machineId}`);

        if (response.data.success) {
          console.log(`Retrieved configuration history from server for machine ${machineId}`);
          const serverHistory = response.data.data;

          // If we got data from the server, return it
          if (Array.isArray(serverHistory) && serverHistory.length > 0) {
            return serverHistory;
          }
        }
      } catch (serverError) {
        // If server request fails, just log and continue using localStorage
        console.log(`No server-side configuration history available for machine ${machineId}, using localStorage`);
      }

      // If server fetch failed or returned empty, fall back to localStorage
      return localHistory;
    } catch (error) {
      console.error('Error retrieving machine configuration history:', error);
      return [];
    }
  },

  // Check if a machine has any production entries
  checkMachineHasProductionEntries: async (machineId: number): Promise<boolean> => {
    try {
      // First get the machine to find its machine number
      const machines = await asuUnit1Api.getAllMachines();
      const machine = machines.find(m => m.id === machineId);

      if (!machine) {
        console.warn(`Machine with ID ${machineId} not found`);
        return false;
      }

      // Get the machine number which is used as a foreign key in production entries
      const machineNumber = getMachineNumber(machine);

      if (!machineNumber) {
        console.warn(`No valid machine number found for machine ID ${machineId}`);
        return false;
      }

      // Query production entries for this machine with a limit of 1
      const params = new URLSearchParams();
      params.append('machineNumber', machineNumber.toString());
      params.append('limit', '1');

      const response = await api.get(`${basePath}/production-entries?${params.toString()}`);

      if (response.data.success) {
        const entries = response.data.data.items;
        return Array.isArray(entries) && entries.length > 0;
      }

      return false;
    } catch (error) {
      console.error('Error checking if machine has production entries:', error);
      return false;
    }
  },

  // Save machine configuration to the server
  saveMachineConfiguration: async (machineId: number, configuration: any): Promise<any> => {
    try {
      console.log(`Saving configuration for machine ${machineId} to server:`, configuration);
      const response = await api.post(`${basePath}/machine-configurations`, {
        machineId,
        configuration: {
          ...configuration,
          // Make sure these fields are included and properly formatted
          count: configuration.count || 0,
          spindles: configuration.spindles || 0,
          speed: configuration.speed || 0,
          yarnType: configuration.yarnType || 'Cotton',
          productionAt100: configuration.productionAt100 || 0
        }
      });
      console.log('Machine configuration saved to server successfully');
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      // Log error but don't throw - this makes this function fail silently
      console.warn('Error saving machine configuration to server - this is non-critical:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as any;
        if (errorResponse?.data?.error?.includes('relation "machine_configurations" does not exist')) {
          console.warn('The machine_configurations table does not exist. Check MACHINE_CONFIGURATIONS_README.md for setup instructions.');
          // Store locally as backup
          const historyKey = `machine_config_history_${machineId}`;
          const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
          history.push({ ...configuration, savedAt: new Date().toISOString() });
          localStorage.setItem(historyKey, JSON.stringify(history));
          console.log('Configuration saved to local storage instead.');
        }
      }
      // Return empty success response instead of throwing
      return { success: true, message: 'Configuration saved to local storage only' };
    }
  },

  updateMachine: async (id: number, data: UpdateASUMachineData): Promise<ASUMachine> => {
    // Store the current state from what we're about to update
    try {
      // No need to fetch current machine data - use data that we already have
      const historyKey = `machine_config_history_${id}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

      // Add the new configuration to history with timestamp
      history.push({
        id: id,
        machineNo: data.machineNo,
        machineName: data.machine_name,
        count: data.count,
        spindles: data.spindles,
        speed: data.speed,
        yarnType: data.yarnType,
        productionAt100: data.productionAt100,
        isActive: data.isActive,
        savedAt: new Date().toISOString()
      });

      localStorage.setItem(historyKey, JSON.stringify(history));
      console.log('Machine configuration history saved successfully');
    } catch (error) {
      console.error('Error saving machine configuration history:', error);
      // Continue with the update even if history saving fails
    }

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

    console.log(`Sending update to /machines/${id} with data:`, apiData);
    const response = await api.put(`${basePath}/machines/${id}`, apiData);
    console.log('Update response:', response.data);
    return response.data.success ? response.data.data : response.data;
  },

  deleteMachine: async (id: number, force: boolean = false): Promise<void> => {
    await api.delete(`${basePath}/machines/${id}${force ? '?force=true' : ''}`);
  },

  // Archive a machine instead of deleting it
  archiveMachine: async (id: number): Promise<void> => {
    await api.post(`${basePath}/machines/${id}/archive`);
  },
};

// Export helper functions for use in components
export { getMachineNumber, getProductionAt100 };
