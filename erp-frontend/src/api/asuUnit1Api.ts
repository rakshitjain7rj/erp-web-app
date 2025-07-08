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
  spindles: number;
  speed: number;
  productionAt100: number;
  unit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ASUProductionEntry {
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

// API Functions
export const asuUnit1Api = {
  // Get all ASU machines for Unit 1
  getMachines: async (): Promise<ASUMachine[]> => {
    const response = await api.get('/machines?unit=1');
    return response.data.success ? response.data.data : response.data;
  },

  // Get production entries for a machine
  getProductionEntries: async (
    filters: ProductionEntriesFilter
  ): Promise<PaginatedResponse<ASUProductionEntry>> => {
    const params = new URLSearchParams();
    
    if (filters.machineId) params.append('machineId', filters.machineId.toString());
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/production-entries?${params.toString()}`);
    return response.data.success ? response.data.data : response.data;
  },

  // Create a new production entry
  createProductionEntry: async (
    data: CreateProductionEntryData
  ): Promise<ASUProductionEntry> => {
    const response = await api.post('/production-entries', data);
    return response.data.success ? response.data.data : response.data;
  },

  // Update a production entry
  updateProductionEntry: async (
    id: number,
    data: UpdateProductionEntryData
  ): Promise<ASUProductionEntry> => {
    const response = await api.put(`/production-entries/${id}`, data);
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
