// src/api/asuUnit2Api.ts
// Minimal initial API wrapper for ASU Unit 2 to separate data from Unit 1.
// We will expand with needed methods as components are parameterized.

import axios from 'axios';
import type { ASUMachine, ASUProductionEntry, CreateProductionEntryData, UpdateProductionEntryData, ProductionStats, ProductionEntriesFilter } from './asuUnit1Api';
import { getMachineNumber as getMachineNumberFromUnit1 } from './asuUnit1Api';

const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/asu-unit2`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(r => r, err => Promise.reject(err));

export const asuUnit2Api = {
  // Machines
  getMachines: async (): Promise<ASUMachine[]> => {
    const r = await api.get('/machines');
    return r.data.success ? r.data.data : r.data;
  },
  getAllMachines: async (): Promise<ASUMachine[]> => {
    try {
      const r = await api.get('/asu-machines');
      if (r.data.success && Array.isArray(r.data.data)) return r.data.data;
    } catch {}
    try {
      const r2 = await api.get('/machines');
      if (r2.data.success && Array.isArray(r2.data.data)) return r2.data.data;
      if (Array.isArray(r2.data)) return r2.data;
    } catch {}
    return [];
  },
  createMachine: async (data: Omit<ASUMachine, 'id'>): Promise<ASUMachine> => {
    const sanitized = {
      ...data,
      machineNo: typeof data.machineNo === 'string' ? parseInt(data.machineNo, 10) : Number(data.machineNo),
      count: typeof data.count === 'string' ? parseInt(String(data.count).replace(/[^0-9]/g, '') || '0', 10) : Number(data.count || 0),
      spindles: data.spindles !== null ? Number(data.spindles || 0) : 0,
      speed: data.speed !== null ? Number(data.speed || 0) : 0
    };
    const r = await api.post('/machines', sanitized);
    return r.data.success ? r.data.data : r.data;
  },
  updateMachine: async (id: number, data: Partial<ASUMachine>): Promise<ASUMachine> => {
    const r = await api.put(`/machines/${id}`, data);
    return r.data.success ? r.data.data : r.data;
  },
  deleteMachine: async (id: number, force: boolean = false): Promise<void> => {
    await api.delete(`/machines/${id}${force ? '?force=true' : ''}`);
  },
  archiveMachine: async (id: number): Promise<void> => {
    await api.post(`/machines/${id}/archive`);
  },

  // Production entries
  getProductionEntries: async (filters: ProductionEntriesFilter) => {
    const params = new URLSearchParams();
    // Map machineId to machineNumber for backend
    if (filters.machineId) {
      try {
        const machines = await asuUnit2Api.getAllMachines();
        const selectedMachine = machines.find(m => m.id === filters.machineId);
        if (selectedMachine) {
          const machineNumber = getMachineNumberFromUnit1(selectedMachine as any);
          if (machineNumber) params.set('machineNumber', String(machineNumber));
        }
      } catch {}
    }
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const r = await api.get(`/production-entries?${params.toString()}`);
    return r.data.success ? r.data.data : r.data;
  },
  createProductionEntry: async (data: CreateProductionEntryData): Promise<ASUProductionEntry> => {
    const r = await api.post('/production-entries', data);
    return r.data.success ? r.data.data : r.data;
  },
  updateProductionEntry: async (id: number, data: UpdateProductionEntryData): Promise<ASUProductionEntry> => {
    const r = await api.put(`/production-entries/${id}`, data as any);
    return r.data.success ? r.data.data : r.data;
  },
  deleteProductionEntry: async (id: number): Promise<void> => {
    await api.delete(`/production-entries/${id}`);
    return;
  },

  // Stats
  getProductionStats: async (filters: { machineNumber?: number; dateFrom?: string; dateTo?: string } = {}): Promise<ProductionStats> => {
    const params = new URLSearchParams();
    if (filters.machineNumber) params.set('machineNumber', String(filters.machineNumber));
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    const r = await api.get(`/stats?${params.toString()}`);
    return r.data.success ? r.data.data : r.data;
  },
};

export default asuUnit2Api;
