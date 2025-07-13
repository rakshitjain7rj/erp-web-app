// src/api/yarnProductionApi.ts

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/yarn`;

// Create axios instance with interceptors
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
    console.error('Yarn Production API Error:', error.response?.data || error.message);
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    
    return Promise.reject(error);
  }
);

export interface YarnProductionSummaryItem {
  id: number;
  date: string;
  yarnType: string;
  totalProduction: number;
  machineCount: number;
  averageEfficiency: number;
}

export interface YarnProductionStats {
  totalProduction: number;
  totalDays: number;
  yarnTypes: number;
  averageDaily: number;
}

export interface YarnSummaryResponse {
  summary: YarnProductionSummaryItem[];
  stats: YarnProductionStats;
}

export interface YarnProductionTrend {
  date: string;
  totalProduction: number;
  yarnTypeBreakdown: Record<string, number>;
  averageEfficiency: number;
}

export interface YarnSummaryFilters {
  dateFrom?: string;
  dateTo?: string;
  yarnType?: string;
  minEfficiency?: number;
  limit?: number;
  page?: number;
}

// API Functions
export const yarnProductionApi = {
  // Get yarn production summary
  getSummary: async (filters?: YarnSummaryFilters): Promise<YarnSummaryResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.yarnType) params.append('yarnType', filters.yarnType);
    if (filters?.minEfficiency) params.append('minEfficiency', filters.minEfficiency.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/summary?${params.toString()}`);
    return response.data.success ? response.data.data : response.data;
  },

  // Get yarn types available in the system
  getYarnTypes: async (): Promise<string[]> => {
    const response = await api.get('/types');
    return response.data.success ? response.data.data : response.data;
  },

  // Get production trends over time
  getProductionTrends: async (days: number = 30): Promise<YarnProductionTrend[]> => {
    const response = await api.get(`/trends?days=${days}`);
    return response.data.success ? response.data.data : response.data;
  },

  // Export yarn production summary to CSV/Excel
  exportSummary: async (format: 'csv' | 'excel' = 'csv', filters?: YarnSummaryFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.yarnType) params.append('yarnType', filters.yarnType);
    if (filters?.minEfficiency) params.append('minEfficiency', filters.minEfficiency.toString());

    const response = await api.get(`/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }
};

// Mock data generator for development/testing
export const generateMockYarnData = (): YarnSummaryResponse => {
  const yarnTypes = ['Cotton', 'Polyester', 'Blended', 'Silk'];
  const summary: YarnProductionSummaryItem[] = [];
  
  // Generate data for last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Generate 1-3 yarn types per day
    const numYarnTypes = Math.floor(Math.random() * 3) + 1;
    const selectedYarnTypes = yarnTypes.sort(() => 0.5 - Math.random()).slice(0, numYarnTypes);
    
    selectedYarnTypes.forEach((yarnType, index) => {
      summary.push({
        id: i * 10 + index,
        date: dateString,
        yarnType,
        totalProduction: Math.round((Math.random() * 200 + 100) * 100) / 100,
        machineCount: Math.floor(Math.random() * 3) + 1,
        averageEfficiency: Math.round((Math.random() * 20 + 75) * 10) / 10
      });
    });
  }
  
  // Calculate stats
  const totalProduction = summary.reduce((sum, item) => sum + item.totalProduction, 0);
  const uniqueDates = new Set(summary.map(item => item.date)).size;
  const uniqueYarnTypes = new Set(summary.map(item => item.yarnType)).size;
  const averageDaily = totalProduction / uniqueDates;
  
  const stats: YarnProductionStats = {
    totalProduction,
    totalDays: uniqueDates,
    yarnTypes: uniqueYarnTypes,
    averageDaily
  };
  
  return { summary, stats };
};
