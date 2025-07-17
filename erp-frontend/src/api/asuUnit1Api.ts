// src/api/asuUnit1Api.ts

import axios from 'axios';
import { PaginatedResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/asu-unit1`;

// Create axios instance with interceptors (consistent with other API files)
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('ASU Unit 1 API Error:', error.response?.data || error.message);
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export interface ASUMachine {
  id: number;
  machineNo?: string | number;
  count?: number;
  yarnType?: string;
  spindles?: number;
  machine_name?: string;
  machine_number?: string;
  status?: 'active' | 'inactive';
  speed?: number;
  productionAt100?: number;
  unit: number; // Always 1 (Unit 2 functionality removed)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
}

export interface UpdateProductionEntryData {
  dayShift?: number;
  nightShift?: number;
  date?: string;
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
    const response = await api.get('/machines');
    return response.data.success ? response.data.data : response.data;
  },
  
  // Create a new machine
  createMachine: async (data: Omit<ASUMachine, 'id'>): Promise<ASUMachine> => {
    const response = await api.post('/machines', data);
    return response.data.success ? response.data.data : response.data;
  },
  
  // Update an existing machine (deprecated - use updateMachineYarnTypeAndCount instead)
  // This function uses the wrong endpoint (/machines/${id}) and should not be used
  // Left for backwards compatibility
  updateMachineOld: async (id: number, data: Partial<ASUMachine>): Promise<ASUMachine> => {
    const response = await api.put(`/machines/${id}`, data);
    return response.data.success ? response.data.data : response.data;
  },

  // New API endpoint for getting all machines (including inactive)
  getAllMachines: async (): Promise<ASUMachine[]> => {
    try {
      const response = await api.get('/asu-machines');
      console.log('API response for getAllMachines:', response.data);
      
      // Properly handle various response formats
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Unexpected response format from /asu-machines:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching machines from /asu-machines:', error);
      throw error;
    }
  },
  
  // Update machine yarn type and count only using /asu-machines/:id endpoint
  updateMachineYarnTypeAndCount: async (id: number, data: UpdateASUMachineData): Promise<ASUMachine> => {
    const response = await api.put(`/asu-machines/${id}`, data);
    return response.data.success ? response.data.data : response.data;
  },

  // Get production entries for a machine
  getProductionEntries: async (
    filters: ProductionEntriesFilter
  ): Promise<PaginatedResponse<ASUProductionEntry>> => {
    const params = new URLSearchParams();
    
    if (filters.machineId) params.append('machineNumber', filters.machineId.toString());
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/production-entries?${params.toString()}`);
    
    // Transform the backend response into the expected frontend format
    // Backend returns separate entries for day and night shifts, frontend expects them combined
    if (response.data.success) {
      const rawEntries = response.data.data.items as any[];
      const entriesByDateAndMachine: Record<string, ASUProductionEntry> = {};
      
      console.log('Raw entries from backend:', rawEntries);
      
      // Group entries by date and machine
      rawEntries.forEach((entry: any) => {
        const key = `${entry.date}_${entry.machineNumber}`;
        console.log('Processing entry:', entry);
        console.log('Entry keys:', Object.keys(entry));
        console.log('Entry.actualProduction:', entry.actualProduction);
        console.log('entry.actualProduction:', entry.actualProduction);
        console.log('Entry shift:', entry.shift);
        
        if (!entriesByDateAndMachine[key]) {
          // Initialize the combined entry
          entriesByDateAndMachine[key] = {
            id: entry.id, // Use the first entry's ID by default
            originalId: entry.id, // Keep the original backend ID for reference
            machineId: entry.machineNumber,
            date: entry.date,
            dayShift: 0,
            nightShift: 0,
            total: 0,
            percentage: 0,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            // Make sure we keep a reference to the machine
            machine: entry.machine 
          };
        }
        
        // Get the production value - check multiple possible field names
        //
        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = typeof rawProd === 'string' ? parseFloat(rawProd) : rawProd;

        console.log(`Production value for ${entry.shift} shift: ${productionValue}`);
        
        // Add the production value to the appropriate shift and store the ID
        if (entry.shift === 'day') {
          entriesByDateAndMachine[key].dayShift = Number(productionValue) || 0;
          entriesByDateAndMachine[key].dayShiftId = entry.id; // Store day shift entry ID
          console.log(`Set dayShift to ${productionValue} for ${key}`);
          // If this is the first entry we see for this key, use its ID as the main ID
          if (!entriesByDateAndMachine[key].id) {
            entriesByDateAndMachine[key].id = entry.id;
          }
        } else if (entry.shift === 'night') {
          entriesByDateAndMachine[key].nightShift = Number(productionValue) || 0;
          entriesByDateAndMachine[key].nightShiftId = entry.id; // Store night shift entry ID
          console.log(`Set nightShift to ${productionValue} for ${key}`);
          // If this is the first entry we see for this key, use its ID as the main ID
          if (!entriesByDateAndMachine[key].id) {
            entriesByDateAndMachine[key].id = entry.id;
          }
        }
        
        // Always update the machine data to ensure we have it
        if (entry.machine) {
          // Only update if we don't have machine data yet or if this machine data is more complete
          if (!entriesByDateAndMachine[key].machine || 
              (entry.machine.productionAt100 && !entriesByDateAndMachine[key].machine.productionAt100)) {
            console.log(`Updating machine data for ${key} with:`, entry.machine);
            entriesByDateAndMachine[key].machine = { ...entry.machine };
          }
        }
      });
      
      // Now that we've gathered all data, calculate totals and percentages
      Object.values(entriesByDateAndMachine).forEach(entry => {
        // Ensure correct numbers for calculations
        entry.dayShift = typeof entry.dayShift === 'number' ? entry.dayShift : 0;
        entry.nightShift = typeof entry.nightShift === 'number' ? entry.nightShift : 0;
        
        // Update the total - explicitly calculate to ensure it's a number
        const dayShiftValue = entry.dayShift || 0;
        const nightShiftValue = entry.nightShift || 0;
        entry.total = dayShiftValue + nightShiftValue;
        
        // Calculate percentage using machine.productionAt100
        if (entry.machine && typeof entry.machine.productionAt100 === 'number' && entry.machine.productionAt100 > 0) {
          entry.percentage = (entry.total / entry.machine.productionAt100) * 100;
        } else {
          // Default to 0 if we can't calculate
          entry.percentage = 0;
          console.warn(`Missing productionAt100 for machine ${entry.machineId}, cannot calculate percentage accurately`);
        }
        
        // Debug info
        console.log(`Entry ${entry.id}: dayShift=${entry.dayShift}, nightShift=${entry.nightShift}, ` +
                    `total=${entry.total}, machine=${entry.machine ? JSON.stringify({
                      id: entry.machine.id,
                      machineNo: entry.machine.machineNo,
                      productionAt100: entry.machine.productionAt100
                    }) : 'missing'}, ` +
                    `percentage=${entry.percentage}`);
      });
      
      // Convert the grouped entries back to an array
      const transformedEntries = Object.values(entriesByDateAndMachine);
      
      return {
        items: transformedEntries as ASUProductionEntry[],
        total: response.data.data.total,
        page: response.data.data.page,
        limit: response.data.data.limit,
        totalPages: response.data.data.totalPages
      };
    }
    
    return response.data;
  },

  // Create a new production entry
  createProductionEntry: async (
    data: CreateProductionEntryData
  ): Promise<ASUProductionEntry> => {
    // Get the machine to access its productionAt100
    const machines = await asuUnit1Api.getAllMachines(); // Use getAllMachines to get both active and inactive machines
    const machine = machines.find(m => m.id === data.machineId);
    
    if (!machine) {
      throw new Error('Machine not found');
    }
    
    console.log(`Creating production entry for machine:`, machine);
    console.log(`Day shift: ${data.dayShift}, Night shift: ${data.nightShift}`);
    
    // Ensure productionAt100 is valid
    if (!machine.productionAt100 || machine.productionAt100 <= 0) {
      throw new Error('Machine must have a valid productionAt100 value');
    }
    
    // Transform the data to match backend expectations
    const dayEntry = data.dayShift > 0 ? {
      machineNumber: data.machineId,
      date: data.date,
      shift: 'day',
      actualProduction: data.dayShift,
      theoreticalProduction: machine.productionAt100
    } : null;
    
    const nightEntry = data.nightShift > 0 ? {
      machineNumber: data.machineId,
      date: data.date,
      shift: 'night',
      actualProduction: data.nightShift,
      theoreticalProduction: machine.productionAt100
    } : null;
    
    console.log('Day entry to create:', dayEntry);
    console.log('Night entry to create:', nightEntry);
    
    try {
      // If both shifts have data, we need to create two entries
      if (dayEntry && nightEntry) {
        const dayResponse = await api.post('/production-entries', dayEntry);
        // Still create the night entry but we don't need to use the response
        await api.post('/production-entries', nightEntry);
        
        // Return the day entry response as the primary result
        return dayResponse.data.success ? dayResponse.data.data : dayResponse.data;
      } 
      // Otherwise create just one entry for the shift that has data
      else if (dayEntry) {
        const response = await api.post('/production-entries', dayEntry);
        return response.data.success ? response.data.data : response.data;
      }
      else if (nightEntry) {
        const response = await api.post('/production-entries', nightEntry);
        return response.data.success ? response.data.data : response.data;
      }
      else {
        throw new Error('At least one shift must have production data');
      }
    } catch (error) {
      // Make sure error is properly propagated
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response && 
          error.response.status === 409) {
        // Extract specific error for duplicate entries
        throw error;
      } else {
        const errorMessage = error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'data' in error.response &&
          error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ?
          error.response.data.error : 'Failed to create production entry';
        
        throw new Error(errorMessage);
      }
    }
  },

  // Update a production entry
  updateProductionEntry: async (
    id: number,
    data: UpdateProductionEntryData
  ): Promise<ASUProductionEntry> => {
    // First, get the existing entry to determine its shift
    const entryResponse = await api.get(`/production-entries/${id}`);
    if (!entryResponse.data.success) {
      throw new Error('Failed to find production entry');
    }
    
    const existingEntry = entryResponse.data.data;
    const shift = existingEntry.shift; // 'day' or 'night'
    
    // Prepare the update data based on the shift
    const updateData = {
      date: data.date || existingEntry.date,
      actualProduction: shift === 'day' ? data.dayShift : data.nightShift
    };
    
    // Update the entry
    const response = await api.put(`/production-entries/${id}`, updateData);
    return response.data.success ? response.data.data : response.data;
  },

  // Delete a production entry
  // Modified to delete both day and night shift entries
  deleteProductionEntry: async (id: number): Promise<void> => {
    try {
      console.log('Frontend: Preparing to delete entry with ID:', id);
      
      // First, determine if this is a combined ID from our frontend state, or an actual backend ID
      // We'll query the backend to get both day and night entries for this date and machine
      
      // Get the original entries from the backend
      const originalResponse = await api.get(`/production-entries?limit=300`);
      const allEntries = originalResponse.data.data.items;
      
      console.log(`Found ${allEntries.length} entries in backend`);
      
      // Find the entry with the given ID in the backend
      let entryToDelete = allEntries.find((entry: any) => entry.id === id);
      
      // If we couldn't find the entry directly (it might be a frontend combined ID),
      // we need to find both day and night shifts from our combined entries
      if (!entryToDelete) {
        console.warn(`Direct backend entry with ID ${id} not found, looking for day/night shift IDs`);
        
        // Get our frontend combined entries to find dayShiftId or nightShiftId
        const entriesResponse = await api.get(`/production-entries?limit=300`);
        
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
              await api.delete(`/production-entries/${combinedEntry.dayShiftId}`);
            } catch (e) {
              console.error('Error deleting day shift:', e);
            }
          }
          
          if (combinedEntry.nightShiftId) {
            try {
              console.log(`Deleting night shift with ID ${combinedEntry.nightShiftId}`);
              await api.delete(`/production-entries/${combinedEntry.nightShiftId}`);
            } catch (e) {
              console.error('Error deleting night shift:', e);
            }
          }
          
          return;
        } else {
          console.error(`Entry with ID ${id} not found in backend or as a combined entry`);
          throw new Error('Entry not found');
        }
      }
      
      console.log('Found entry to delete:', entryToDelete);
      
      // Delete the specific entry we found
      const deleteResponse = await api.delete(`/production-entries/${id}`);
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
            const deleteMatchingResponse = await api.delete(`/production-entries/${matchingEntry.id}`);
            console.log(`Delete response for matching ${oppositeShift} shift:`, deleteMatchingResponse.data);
          } catch (matchingError) {
            console.error(`Error deleting matching ${oppositeShift} shift entry:`, matchingError);
            // Don't throw here - we already deleted the primary entry
          }
        }
      }
      
      return deleteResponse.data;
    } catch (error) {
      console.error('Frontend: Error in deleteProductionEntry:', error);
      throw error;
    }
  },

  // Get production statistics
  getProductionStats: async (): Promise<ProductionStats> => {
    const response = await api.get('/stats');
    return response.data.success ? response.data.data : response.data;
  },

  // Machine management functions
  addMachine: async (data: CreateASUMachineData): Promise<ASUMachine> => {
    // Transform frontend format to backend format
    const apiData = {
      machineNo: data.machine_number ? Number(data.machine_number) : undefined,
      count: data.count,
      yarnType: data.yarnType || 'Cotton',
      spindles: data.spindles,
      speed: data.speed,
      productionAt100: data.productionAt100,
      isActive: data.status === 'active'
    };
    
    console.log('Sending machine creation request with data:', apiData);
    const response = await api.post('/asu-machines', apiData);
    return response.data.success ? response.data.data : response.data;
  },
  
  // Update machine with all fields using /machines/:id endpoint
  // This is the correct function to use for updating all machine fields
  updateMachine: async (id: number, data: UpdateASUMachineData): Promise<ASUMachine> => {
    // Clean up the data to match what the API expects
    const apiData = {
      ...(data.machineNo !== undefined && { machineNo: data.machineNo }),
      ...(data.machine_name !== undefined && { machine_name: data.machine_name }),
      ...(data.machine_number !== undefined && { machine_number: data.machine_number }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.yarnType !== undefined && { yarnType: data.yarnType }),
      ...(data.count !== undefined && { count: data.count }),
      ...(data.spindles !== undefined && { spindles: data.spindles }),
      ...(data.speed !== undefined && { speed: data.speed }),
      ...(data.productionAt100 !== undefined && { productionAt100: data.productionAt100 })
    };
    
    console.log(`Sending update to /machines/${id} with data:`, apiData);
    const response = await api.put(`/machines/${id}`, apiData);
    console.log('Update response:', response.data);
    return response.data.success ? response.data.data : response.data;
  },
  
  deleteMachine: async (id: number): Promise<void> => {
    await api.delete(`/asu-machines/${id}`);
  },
};
