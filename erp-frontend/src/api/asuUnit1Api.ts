// src/api/asuUnit1Api.ts

import apiClient from './httpClient';
import { PaginatedResponse } from '../types';

// Use shared api client; endpoints are relative to /asu-unit1
const api = apiClient;
const basePath = '/asu-unit1';

// Helper function to get a valid machine number from a machine object
const getMachineNumber = (machine: ASUMachine | undefined): number | null => {
  if (!machine) return null;
  
  console.log('Getting machine number from:', machine);
  
  // Handle machineNo field first - this is the primary field for database foreign key
  if (machine.machineNo !== undefined && machine.machineNo !== null) {
    // If machineNo exists, convert it to a number if it's a string
    const machineNo = typeof machine.machineNo === 'string' ? 
      parseInt(machine.machineNo, 10) : 
      machine.machineNo;
    
    if (!isNaN(machineNo)) {
      console.log(`Using machine.machineNo: ${machineNo}`);
      return machineNo;
    }
  } 
  
  // Fallback to machine_number field
  if (machine.machine_number !== undefined && machine.machine_number !== null) {
    // Convert to a number if it's a string
    const parsedNumber = parseInt(String(machine.machine_number), 10);
    if (!isNaN(parsedNumber)) {
      console.log(`Using machine.machine_number: ${parsedNumber}`);
      return parsedNumber;
    }
  }
  
  // Last resort: try to extract a number from the machine name
  if (machine.machineName) {
    const matches = machine.machineName.match(/\d+/);
    if (matches && matches[0]) {
      const extractedNumber = parseInt(matches[0], 10);
      if (!isNaN(extractedNumber)) {
        console.log(`Extracted number from machine name: ${extractedNumber}`);
        return extractedNumber;
      }
    }
  }
  
  // No valid machine number found
  console.warn('No valid machine number found for machine:', machine);
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
      console.log(`Using obj.machine.productionAt100: ${value}`);
      return value;
    }
  }
  
  // Handle direct machine object
  if (obj.productionAt100 !== undefined && obj.productionAt100 !== null) {
    // Convert to a number if it's a string
    const productionAt100Value = typeof obj.productionAt100 === 'string' ? 
      parseFloat(obj.productionAt100) : 
      obj.productionAt100;
    
    if (!isNaN(productionAt100Value) && productionAt100Value > 0) {
      console.log(`Using obj.productionAt100: ${productionAt100Value}`);
      return productionAt100Value;
    }
  }
  
  // Fallback to default value if no valid productionAt100 found
  console.warn('No valid productionAt100 found for object, using default value');
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
    
    console.log('Creating machine with sanitized data:', sanitizedData);
  const response = await api.post(`${basePath}/machines`, sanitizedData);
    return response.data.success ? response.data.data : response.data;
  },
  
  // Update an existing machine (deprecated - use updateMachineYarnTypeAndCount instead)
  // This function uses the wrong endpoint (/machines/${id}) and should not be used
  // Left for backwards compatibility
  updateMachineOld: async (id: number, data: Partial<ASUMachine>): Promise<ASUMachine> => {
  const response = await api.put(`${basePath}/machines/${id}`, data);
    return response.data.success ? response.data.data : response.data;
  },

  // New API endpoint for getting all machines (including inactive)
  getAllMachines: async (): Promise<ASUMachine[]> => {
    try {
      // First try the /asu-machines endpoint
      try {
  const response = await api.get(`${basePath}/asu-machines`);
        console.log('API response for getAllMachines from /asu-machines:', response.data);
        
        // Properly handle various response formats
        if (response.data.success && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          return response.data;
        }
      } catch (primaryError) {
        console.warn('Error with /asu-machines endpoint, trying fallback:', primaryError);
      }
      
      // Fallback to the /machines endpoint if the first one fails or returns invalid data
  const fallbackResponse = await api.get(`${basePath}/machines`);
      console.log('Fallback API response from /machines:', fallbackResponse.data);
      
      if (fallbackResponse.data.success && Array.isArray(fallbackResponse.data.data)) {
        return fallbackResponse.data.data;
      } else if (Array.isArray(fallbackResponse.data)) {
        return fallbackResponse.data;
      }
      
      // If we get here, both endpoints failed to return valid data
      console.warn('Neither endpoint returned valid machine data');
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
    return response.data.success ? response.data.data : response.data;
  },

  // Get production entries for a machine
  getProductionEntries: async (
    filters: ProductionEntriesFilter
  ): Promise<PaginatedResponse<ASUProductionEntry>> => {
    const params = new URLSearchParams();
    
    // The backend expects machineNumber (the machine_no field), not machineId (the id field)
    // So we need to look up the machine to get its machineNo
    if (filters.machineId) {
      try {
        // Get the selected machine to find its actual machine number
        const machines = await asuUnit1Api.getAllMachines();
        const selectedMachine = machines.find(m => m.id === filters.machineId);
        
        if (selectedMachine) {
          // Use machineNo (the actual machine number field) instead of the machine's ID
          const machineNumber = selectedMachine.machineNo || 
                               (selectedMachine.machine_number ? parseInt(selectedMachine.machine_number) : null);
                               
          console.log(`Looking up entries for machine ID ${filters.machineId} with machine number: ${machineNumber}`);
          
          if (machineNumber) {
            params.append('machineNumber', machineNumber.toString());
          } else {
            console.error(`Machine with ID ${filters.machineId} has no valid machine number`);
          }
        } else {
          console.error(`Machine with ID ${filters.machineId} not found in machines list`);
        }
      } catch (error) {
        console.error('Error getting machine number:', error);
      }
    }
    
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    console.log(`Querying production entries with params: ${params.toString()}`);
  const response = await api.get(`${basePath}/production-entries?${params.toString()}`);
    
    // Log the raw response data for debugging
    console.log('Raw API response for production entries:', response.data);
    if (response.data && response.data.data && response.data.data.items) {
      console.log('Number of raw production entries:', response.data.data.items.length);
      
      // Check if we have any night shift entries
      const nightEntries = response.data.data.items.filter((entry: any) => entry.shift === 'night');
      console.log('Number of night shift entries:', nightEntries.length);
      console.log('Night shift entries details:', nightEntries.map((entry: any) => ({
        id: entry.id,
        date: entry.date,
        shift: entry.shift,
        actualProduction: entry.actualProduction,
        machineNumber: entry.machineNumber
      })));
      
      // Check if we have any day shift entries
      const dayEntries = response.data.data.items.filter((entry: any) => entry.shift === 'day');
      console.log('Number of day shift entries:', dayEntries.length);
      console.log('Day shift entries details:', dayEntries.map((entry: any) => ({
        id: entry.id,
        date: entry.date,
        shift: entry.shift,
        actualProduction: entry.actualProduction,
        machineNumber: entry.machineNumber
      })));
    }
    
    // Transform the backend response into the expected frontend format
    // Backend returns separate entries for day and night shifts, frontend expects them combined
    if (response.data.success) {
      let rawEntries = response.data.data.items as any[];
      const entriesByDateAndMachine: Record<string, ASUProductionEntry> = {};
      
      if (!rawEntries || rawEntries.length === 0) {
        console.log(`No production entries found for the query parameters: ${params.toString()}`);
        
        // Check if we have any entries in localStorage
        if (filters.machineId) {
          const localStorageKey = `local_production_entries_${filters.machineId}`;
          const localEntries = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
          
          if (localEntries.length > 0) {
            console.log(`Found ${localEntries.length} production entries in localStorage`);
            // Transform localStorage entries into backend-like format
            rawEntries = localEntries.map((entry: any) => {
              // Create a day entry if dayShift exists
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
              // Create a night entry if nightShift exists
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
        console.log(`Found ${rawEntries.length} production entries`);
        
        // Analyze the entries to see if we have day and night shift entries
        const entriesByDateAndMachine: Record<string, { day: boolean, night: boolean }> = {};
        rawEntries.forEach((entry: any) => {
          const key = `${entry.date}_${entry.machineNumber}`;
          if (!entriesByDateAndMachine[key]) {
            entriesByDateAndMachine[key] = { day: false, night: false };
          }
          if (entry.shift === 'day') {
            entriesByDateAndMachine[key].day = true;
          } else if (entry.shift === 'night') {
            entriesByDateAndMachine[key].night = true;
          }
        });
        
        // Check if we're missing night shift entries
        const missingNightShiftKeys = Object.entries(entriesByDateAndMachine)
          .filter(([_, value]) => value.day && !value.night)
          .map(([key]) => key);
          
        console.log('Entries with missing night shift:', missingNightShiftKeys);
        
        // Create dummy night shift entries for any missing ones
        if (missingNightShiftKeys.length > 0) {
          const additionalEntries = [];
          
          for (const key of missingNightShiftKeys) {
            const [date, machineNumberStr] = key.split('_');
            const machineNumber = parseInt(machineNumberStr);
            const dayEntry = rawEntries.find((entry: any) => 
              entry.date === date && 
              entry.machineNumber === machineNumber && 
              entry.shift === 'day'
            );
            
            if (dayEntry) {
              console.log(`Creating missing night shift entry for ${key}`);
              additionalEntries.push({
                id: `${dayEntry.id}_night`,
                machineNumber: machineNumber,
                date: date,
                shift: 'night',
                actualProduction: 0, // Default to 0 for missing night shift
                theoreticalProduction: dayEntry.theoreticalProduction,
                machine: dayEntry.machine,
                createdAt: dayEntry.createdAt,
                updatedAt: dayEntry.updatedAt
              });
            }
          }
          
          // Add the missing night shift entries to rawEntries
          if (additionalEntries.length > 0) {
            console.log(`Adding ${additionalEntries.length} missing night shift entries`);
            rawEntries = [...rawEntries, ...additionalEntries];
          }
        }
      }
      
      console.log('Raw entries (including day and night shifts):', rawEntries);
      
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
            // Preserve the yarn type from the entry if available
            yarnType: entry.yarnType || entry.machine?.yarnType,
            // Store the production@100% value from the entry for historical accuracy
            productionAt100: entry.productionAt100,
            // Make sure we keep a reference to the machine
            machine: entry.machine 
          };
        }
        
        // Get the production value - check multiple possible field names
        const rawProd = entry.actualProduction || entry.production || 0;
        // Use Number instead of parseFloat to better handle zero values
        const productionValue = typeof rawProd === 'string' ? Number(rawProd) : Number(rawProd || 0);

        console.log(`Processing production value for ${entry.shift} shift: 
          - Raw value: ${rawProd}
          - Type: ${typeof rawProd}
          - Converted value: ${productionValue}
          - Converted type: ${typeof productionValue}`);
        
        // Add the production value to the appropriate shift and store the ID
        if (entry.shift === 'day') {
          entriesByDateAndMachine[key].dayShift = productionValue;
          entriesByDateAndMachine[key].dayShiftId = entry.id; // Store day shift entry ID
          console.log(`Set dayShift to ${productionValue} for ${key}`);
          // If this is the first entry we see for this key, use its ID as the main ID
          if (!entriesByDateAndMachine[key].id) {
            entriesByDateAndMachine[key].id = entry.id;
          }
        } else if (entry.shift === 'night') {
          // Extra logging for night shift values
          console.log(`NIGHT SHIFT VALUE PROCESSING - Entry ID ${entry.id}, Date ${entry.date}:`, {
            rawProd,
            productionValue,
            entryActualProduction: entry.actualProduction,
            entryProduction: entry.production,
            convertedValue: productionValue,
            entryObject: entry
          });
          
          // Ensure it's a proper number by using parseFloat
          const nightShiftValue = parseFloat(String(rawProd)) || 0;
          
          console.log(`SETTING NIGHT SHIFT for ${key}: ${nightShiftValue} (original: ${rawProd})`);
          
          entriesByDateAndMachine[key].nightShift = nightShiftValue;
          entriesByDateAndMachine[key].nightShiftId = entry.id; // Store night shift entry ID
          console.log(`Set nightShift to ${nightShiftValue} for ${key} (type: ${typeof nightShiftValue})`);
          
          // Log the current state of the entry
          console.log(`Current entry state for ${key}:`, entriesByDateAndMachine[key]);
          
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
        // Ensure correct numbers for calculations - convert any string values to numbers
        // Use Number instead of parseFloat to better handle zero values
        entry.dayShift = typeof entry.dayShift === 'string' ? Number(entry.dayShift) : Number(entry.dayShift || 0);
        
        // Special handling for night shift values to ensure they're processed correctly
        const rawNightShift = entry.nightShift;
        console.log('Processing night shift value for calculations:', {
          raw: rawNightShift,
          type: typeof rawNightShift,
          date: entry.date,
          entryId: entry.id
        });
        
        // Always ensure night shift is a proper number
        if (rawNightShift !== undefined && rawNightShift !== null) {
          entry.nightShift = typeof rawNightShift === 'string' ? 
            Number(rawNightShift) : Number(rawNightShift);
        } else {
          entry.nightShift = 0;
        }
        
        console.log(`Final night shift value: ${entry.nightShift} (${typeof entry.nightShift})`);
        
        console.log(`Calculating totals for entry:
          - Date: ${entry.date}
          - Day shift: ${entry.dayShift} (${typeof entry.dayShift})
          - Night shift: ${entry.nightShift} (${typeof entry.nightShift})`);
        
        // Update the total - explicitly calculate to ensure it's a number
        entry.total = entry.dayShift + entry.nightShift;
        
        console.log(`Calculated total: ${entry.total} (${typeof entry.total})`);
        
        // Calculate percentage using the stored productionAt100 value from the entry first,
        // then fall back to machine.productionAt100 for older entries
        let productionAt100Value = 0;
        
        // Prioritize the entry's stored productionAt100 value for historical accuracy
        if (entry.productionAt100 !== undefined && entry.productionAt100 !== null) {
          productionAt100Value = typeof entry.productionAt100 === 'string' 
            ? parseFloat(entry.productionAt100) 
            : entry.productionAt100;
        }
        // Fall back to machine's current productionAt100 for older entries
        else if (entry.machine && entry.machine.productionAt100) {
          productionAt100Value = typeof entry.machine.productionAt100 === 'string' 
            ? parseFloat(entry.machine.productionAt100) 
            : entry.machine.productionAt100;
        }
            
        if (!isNaN(productionAt100Value) && productionAt100Value > 0) {
          entry.percentage = (entry.total / productionAt100Value) * 100;
        } else {
          // Default to 0 if we can't calculate
          entry.percentage = 0;
          console.warn(`No valid productionAt100 value found for entry ${entry.id}. Entry value: ${entry.productionAt100}, Machine value: ${entry.machine?.productionAt100}`);
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
      
      // Final verification of night shift values
      transformedEntries.forEach(entry => {
        // Ensure night shift is never undefined, null, or NaN
        if (entry.nightShift === undefined || entry.nightShift === null || isNaN(Number(entry.nightShift))) {
          console.warn(`Fixing invalid night shift value for entry ${entry.id}, date ${entry.date}: ${entry.nightShift}`);
          entry.nightShift = 0;
        }
        
        // Force the value to be a proper number by using direct parseFloat
        entry.nightShift = parseFloat(String(entry.nightShift)) || 0;
        
        // Log the final entry data for debugging
        console.log(`Final verified entry for date ${entry.date}:`, {
          id: entry.id,
          dayShift: entry.dayShift,
          nightShift: entry.nightShift,
          nightShiftType: typeof entry.nightShift
        });
      });
      
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
    
    // Log detailed machine info for debugging
    console.log(`Creating production entry for machine:`, machine);
    console.log(`Machine details: ID=${machine.id}, machineNo=${machine.machineNo}, machine_number=${machine.machine_number}`);
    console.log(`Day shift: ${data.dayShift}, Night shift: ${data.nightShift}`);
    
    // Always use the machine's productionAt100 value for consistency - never use the value from form data
    let productionAt100Value = getProductionAt100(machine);
    console.log(`Using machine.productionAt100: ${productionAt100Value} for production entry`);
    
    // Make sure we have a valid value
    if (productionAt100Value <= 0) {
      console.warn('No valid productionAt100 value found, falling back to default 400');
      productionAt100Value = 400; // Fallback to a default value if nothing else works
    }
    
    // Get the actual machine number from the machine object using our helper function
    // This is critical for the foreign key constraint to work
    const machineNumber = getMachineNumber(machine);
    
    if (!machineNumber) {
      console.error('Machine has no valid machineNo value:', machine);
      throw new Error('Machine must have a valid machine number. Please check the machine details and ensure it has a valid machine number.');
    }
    
    console.log('Using machine number for production entry:', machineNumber);
    
    // Transform the data to match backend expectations
    // Make absolutely sure we're using the correct machine number format
    if (typeof machineNumber !== 'number' || isNaN(machineNumber) || machineNumber <= 0) {
      throw new Error(`Invalid machine number: ${machineNumber}. Please check the machine configuration.`);
    }
    
    // Double check that the machine number exists in the database
    console.log(`Verifying machine number ${machineNumber} exists in the database`);
    
    // Convert nightShift to a number and ensure it's properly handled
    // Use parseFloat for consistency with frontend
    const nightShiftValue = parseFloat(String(data.nightShift)) || 0;
    
    console.log('Night shift value in API:', {
      originalValue: data.nightShift,
      originalType: typeof data.nightShift,
      parsedValue: nightShiftValue,
      parsedType: typeof nightShiftValue
    });
    
    // Create entries only when there's actual production
    const entriesToCreate = [];
    
    // Use the provided yarn type or fall back to the machine's yarn type
    const entryYarnType = data.yarnType || machine.yarnType || 'Cotton';
    console.log(`Using yarn type for production entry: ${entryYarnType}`);
    
    if (data.dayShift > 0) {
      entriesToCreate.push({
        machineNumber: machineNumber,
        date: data.date,
        shift: 'day',
        actualProduction: parseFloat(String(data.dayShift)),
        theoreticalProduction: productionAt100Value,
        yarnType: entryYarnType
      });
    }
    
    if (nightShiftValue > 0) {
      entriesToCreate.push({
        machineNumber: machineNumber,
        date: data.date,
        shift: 'night',
        actualProduction: nightShiftValue,
        theoreticalProduction: productionAt100Value,
        yarnType: entryYarnType
      });
    }
    
    console.log('Entries to create:', entriesToCreate);
    
    if (entriesToCreate.length === 0) {
      throw new Error('At least one shift (day or night) must have a production value greater than 0');
    }
    
    try {
      const responses = [];
      
      // Create each entry one by one
      for (const entry of entriesToCreate) {
        console.log(`Creating ${entry.shift} entry:`, entry);
        try {
          const response = await api.post(`${basePath}/production-entries`, entry);
          console.log(`${entry.shift} entry created successfully:`, response.data);
          responses.push(response);
        } catch (error: any) {
          console.error(`Error creating ${entry.shift} entry:`, error);
          if (error.response) {
            console.error('Error response:', error.response.data);
          }
          throw new Error(`Failed to create ${entry.shift} entry: ${error.response?.data?.error || error.message}`);
        }
      }
      
      // Return the first successful response
      const firstResponse = responses[0];
      return firstResponse.data.success ? firstResponse.data.data : firstResponse.data;
    } catch (error) {
      console.error('Error creating production entry:', error);
      
      // Better error diagnostic for foreign key violations
      if (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object') {
            
        // Type assertion for better TypeScript support
        const errorResponse = error.response as any;
            
        // Log detailed error information for debugging
        console.error('API Response Error:', {
          status: errorResponse.status,
          statusText: errorResponse.statusText,
          data: errorResponse.data
        });
        
        // Handle specific error types
        if (errorResponse.status === 409) {
          // Extract specific error for duplicate entries
          throw error;
        } else if (errorResponse.status === 400 || errorResponse.status === 500) {
          // Check if this is a foreign key violation or missing table error
          const responseData = errorResponse.data;
          const errorText = typeof responseData === 'string' ? responseData : 
                           (responseData && typeof responseData === 'object' && 'error' in responseData) ? 
                           responseData.error : JSON.stringify(responseData);
          
          // Check for machine_configurations table missing error (should be resolved now)
          if (typeof errorText === 'string' && errorText.includes('relation "machine_configurations" does not exist')) {
            // This error should not occur anymore since we created the table
            console.error('machine_configurations table still missing despite migration. Please check database setup.');
            throw new Error('Database configuration error: machine_configurations table missing. Please contact system administrator.');
          }
          
          // Handle machine_configurations table missing error (should be resolved now)
          if (typeof errorText === 'string' && errorText.includes('relation "machine_configurations" does not exist')) {
            // This error should not occur anymore since we created the table
            console.error('machine_configurations table still missing despite migration. Please check database setup.');
            throw new Error('Database configuration error: machine_configurations table missing. Please contact system administrator.');
          }
          
          // Handle normal foreign key violation errors
          if (typeof errorText === 'string' && 
              (errorText.includes('foreign key constraint') || 
               errorText.includes('asu_production_entries_machine_no_fkey'))) {
            throw new Error(`Machine number mismatch: The machine number doesn't match any existing machine. Please check the machine configuration or try selecting a different machine.`);
          }
        }
      }
      
      // Extract error message with proper type handling
      let errorMessage = 'Failed to create production entry';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as any;
        if (errorResponse && typeof errorResponse === 'object' && 'data' in errorResponse &&
            errorResponse.data && typeof errorResponse.data === 'object' && 'error' in errorResponse.data) {
          const responseError = errorResponse.data.error;
          errorMessage = typeof responseError === 'string' ? responseError : 'Failed to create production entry';
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  // Update a production entry
  updateProductionEntry: async (
    id: number,
    data: UpdateProductionEntryData
  ): Promise<ASUProductionEntry> => {
    try {
      // First, get the existing entry to determine its shift
  const entryResponse = await api.get(`${basePath}/production-entries/${id}`);
      if (!entryResponse.data.success) {
        throw new Error('Failed to find production entry');
      }
      
      const existingEntry = entryResponse.data.data;
      const shift = existingEntry.shift; // 'day' or 'night'
      
      // Process the value being updated based on the shift
      let productionValue;
      if (shift === 'day') {
        productionValue = parseFloat(String(data.dayShift)) || 0;
      } else { // night shift
        productionValue = parseFloat(String(data.nightShift)) || 0;
      }
      
      console.log(`Updating ${shift} shift entry ${id}:`, {
        originalValue: shift === 'day' ? data.dayShift : data.nightShift,
        parsedValue: productionValue,
        shift: shift
      });
      
      // Prepare the update data based on the shift
      const updateData = {
        date: data.date || existingEntry.date,
        actualProduction: productionValue,
        yarnType: data.yarnType || existingEntry.yarnType
      };
      
      console.log('Sending update data to API:', updateData);
      
      // Update the entry
  const response = await api.put(`${basePath}/production-entries/${id}`, updateData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      // Check if this could be a localStorage entry by looking for entries with id matching
      // the pattern we use for local entries
      if (typeof id === 'number') {
        // Try to find this entry in localStorage
        // We need to check all possible machine IDs
        const allStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('local_production_entries_'));
        
        for (const key of allStorageKeys) {
          const localEntries = JSON.parse(localStorage.getItem(key) || '[]');
          const entryIndex = localEntries.findIndex((e: any) => e.id === id);
          
          if (entryIndex >= 0) {
            // Found the entry in localStorage, update it
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
            console.error(`Entry with ID ${id} not found in backend or as a combined entry`);
            throw new Error('Entry not found');
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
          history.push({...configuration, savedAt: new Date().toISOString()});
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
