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
  machineNo: number;
  count: number;
  yarnType: string;
  spindles: number;
  speed: number;
  productionAt100: number;
  unit: number; // Always 1 (Unit 2 functionality removed)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ASUProductionEntry {
  id: number;
  machineId: number;    // This is mapped from machineNumber in the backend
  date: string;
  dayShift: number;     // This is mapped from actualProduction where shift='day'
  nightShift: number;   // This is mapped from actualProduction where shift='night'
  total: number;        // Sum of dayShift and nightShift
  percentage: number;   // Calculated from total and machine.productionAt100
  createdAt: string;
  updatedAt: string;
  machine?: ASUMachine;
  
  // Backend original fields that may be present
  machineNumber?: number;
  shift?: 'day' | 'night';
  actualProduction?: number;
  theoreticalProduction?: number;
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
  totalProduction: number;
  topPerformingMachine: {
    machineNo: number;
    percentage: number;
  };
}

export interface ProductionEntriesFilter {
  machineId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface UpdateASUMachineData {
  yarnType?: string;
  count?: number;
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
  
  // Update an existing machine
  updateMachine: async (id: number, data: Partial<ASUMachine>): Promise<ASUMachine> => {
    const response = await api.put(`/machines/${id}`, data);
    return response.data.success ? response.data.data : response.data;
  },

  // New API endpoint for getting all machines (including inactive)
  getAllMachines: async (): Promise<ASUMachine[]> => {
    const response = await api.get('/asu-machines');
    return response.data.success ? response.data.data : response.data;
  },
  
  // New API endpoint for updating machine yarn type and count
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
      
      // Group entries by date and machine
      rawEntries.forEach((entry: any) => {
        const key = `${entry.date}_${entry.machineNumber}`;
        if (!entriesByDateAndMachine[key]) {
          entriesByDateAndMachine[key] = {
            id: entry.id, // Use the first entry's ID
            machineId: entry.machineNumber,
            date: entry.date,
            dayShift: 0,
            nightShift: 0,
            total: 0,
            percentage: 0,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            machine: entry.machine
          };
        }
        
        // Add the production value to the appropriate shift
        if (entry.shift === 'day') {
          entriesByDateAndMachine[key].dayShift = entry.actualProduction || 0;
        } else if (entry.shift === 'night') {
          entriesByDateAndMachine[key].nightShift = entry.actualProduction || 0;
        }
        
        // Update the total
        entriesByDateAndMachine[key].total = 
          entriesByDateAndMachine[key].dayShift + entriesByDateAndMachine[key].nightShift;
        
        // Calculate percentage if possible
        const machine = entry.machine;
        if (machine && machine.productionAt100) {
          entriesByDateAndMachine[key].percentage = 
            (entriesByDateAndMachine[key].total / machine.productionAt100) * 100;
        }
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
    // Transform the data to match backend expectations
    const dayEntry = data.dayShift > 0 ? {
      machineNumber: data.machineId,
      date: data.date,
      shift: 'day',
      actualProduction: data.dayShift,
      theoreticalProduction: null
    } : null;
    
    const nightEntry = data.nightShift > 0 ? {
      machineNumber: data.machineId,
      date: data.date,
      shift: 'night',
      actualProduction: data.nightShift,
      theoreticalProduction: null
    } : null;
    
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
  deleteProductionEntry: async (id: number): Promise<void> => {
    await api.delete(`/production-entries/${id}`);
  },

  // Get production statistics
  getProductionStats: async (): Promise<ProductionStats> => {
    const response = await api.get('/stats');
    return response.data.success ? response.data.data : response.data;
  },
};
