// src/api/asuUnit2Api.ts
// Minimal initial API wrapper for ASU Unit 2 to separate data from Unit 1.
// We will expand with needed methods as components are parameterized.

import axios from 'axios';
import type { ASUMachine, ASUProductionEntry, CreateProductionEntryData, UpdateProductionEntryData, ProductionStats, ProductionEntriesFilter, CreateASUMachineData, UpdateASUMachineData } from './asuUnit1Api';

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
  deleteMachine: async (id: number, force: boolean = false): Promise<void> => {
    await api.delete(`/machines/${id}${force ? '?force=true' : ''}`);
  },
};

export default asuUnit2Api;
