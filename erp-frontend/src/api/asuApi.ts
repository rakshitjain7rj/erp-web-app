// src/api/asuApi.ts

import {
  ApiResponse,
  PaginatedResponse,
  ASUDailyMachineData,
  ASUProductionEfficiency,
  ASUMainsReading,
  ASUWeeklyData,
  ASUFormData,
  ASUFilters,
} from '../types/asu';

const API_BASE_URL = 'http://localhost:5000/api';

const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < currentTime;
  } catch {
    return true;
  }
};

const getUnitPath = (unit?: number): string => {
  if (unit === 1) return '/asu-unit1';
  if (unit === 2) return '/asu-unit2';
  console.warn('⚠️ [asuApi] No unit provided, defaulting to Unit 2');
  return '/asu-unit2';
};



const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = localStorage.getItem('token');
    if (token && (!isValidToken(token) || isTokenExpired(token))) {
      localStorage.removeItem('token');
    }

    const validToken = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(validToken && { Authorization: `Bearer ${validToken}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;

        if (response.status === 401 &&
            (errorData.error === 'Invalid token' || errorData.error === 'Unauthorized')) {
          localStorage.removeItem('token');
          errorMessage = 'Session expired. Please login again.';
        }
      } catch {
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const wrapPaginated = <T>(
  res: ApiResponse<unknown>,
  page: number,
  limit: number
): ApiResponse<PaginatedResponse<T>> => {
  if (res.success && res.data && typeof res.data === 'object' && res.data !== null) {
    const dataObj = res.data as Record<string, unknown>;
    if (!Array.isArray(dataObj.data)) {
      return {
        success: true,
        data: {
          data: res.data ? [res.data as T] : [],
          total: 1,
          page,
          limit,
          totalPages: 1,
        },
      };
    }
  }
  return res as ApiResponse<PaginatedResponse<T>>;
};

export const asuApi = {
  submitDailyData: async (
    formData: ASUFormData,
    unit: 1 | 2 
  ): Promise<ApiResponse<{
    dailyMachine: ASUDailyMachineData;
    production: ASUProductionEfficiency;
    mainsReading: ASUMainsReading;
    weekly: ASUWeeklyData;
  }>> => {
    return await apiCall(`${getUnitPath(unit)}/daily`, {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  submitWeeklyData: async (
    weeklyData: ASUWeeklyData,
    unit: 1 | 2
  ): Promise<ApiResponse<ASUWeeklyData>> => {
    return await apiCall(`${getUnitPath(unit)}/weekly`, {
      method: 'POST',
      body: JSON.stringify(weeklyData),
    });
  },

  getDailyMachineData: async (
    filters: ASUFilters = {},
    page = 1,
    limit = 20,
    unit: 1 | 2
  ): Promise<ApiResponse<PaginatedResponse<ASUDailyMachineData>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
      ),
    });
    const res = await apiCall(`${getUnitPath(unit)}/daily-machine?${params}`);
    return wrapPaginated<ASUDailyMachineData>(res, page, limit);
  },

  getProductionEfficiency: async (
    filters: ASUFilters = {},
    page = 1,
    limit = 20,
    unit: 1 | 2
  ): Promise<ApiResponse<PaginatedResponse<ASUProductionEfficiency>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
      ),
    });
    const res = await apiCall(`${getUnitPath(unit)}/production?${params}`);
    return wrapPaginated<ASUProductionEfficiency>(res, page, limit);
  },

  getMainsReadings: async (
    filters: ASUFilters = {},
    page = 1,
    limit = 20,
    unit: 1 | 2
  ): Promise<ApiResponse<PaginatedResponse<ASUMainsReading>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
      ),
    });
    const res = await apiCall(`${getUnitPath(unit)}/mains?${params}`);
    return wrapPaginated<ASUMainsReading>(res, page, limit);
  },

  getWeeklyData: async (
    filters: ASUFilters = {},
    page = 1,
    limit = 20,
    unit: 1 | 2
  ): Promise<ApiResponse<PaginatedResponse<ASUWeeklyData>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
      ),
    });
    const res = await apiCall(`${getUnitPath(unit)}/weekly?${params}`);
    return wrapPaginated<ASUWeeklyData>(res, page, limit);
  },

  getStats: async (
    filters: ASUFilters = {},
    unit: 1 | 2
  ): Promise<ApiResponse<{
    totalMachines: number;
    activeMachines: number;
    totalProduction: number;
    averageEfficiency: number;
    totalPowerConsumption: number;
    lastWeekComparison: {
      production: { current: number; previous: number; change: number };
      efficiency: { current: number; previous: number; change: number };
      power: { current: number; previous: number; change: number };
    };
  }>> => {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
      )
    );
    return await apiCall(`${getUnitPath(unit)}/stats?${params}`);
  },

  updateDailyMachineData: async (
    id: number,
    unit: 1 | 2,
    data: Partial<ASUDailyMachineData>
  ): Promise<ApiResponse<ASUDailyMachineData>> => {
    return await apiCall(`${getUnitPath(unit)}/daily-machine/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateProductionEfficiency: async (
    id: number,
    unit: 1 | 2,
    data: Partial<ASUProductionEfficiency>
  ): Promise<ApiResponse<ASUProductionEfficiency>> => {
    return await apiCall(`${getUnitPath(unit)}/production/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateMainsReading: async (
    id: number,
    unit: 1 | 2,
    data: Partial<ASUMainsReading>
  ): Promise<ApiResponse<ASUMainsReading>> => {
    return await apiCall(`${getUnitPath(unit)}/mains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateWeeklyData: async (
    id: number,
    unit: 1 | 2,
    data: Partial<ASUWeeklyData>
  ): Promise<ApiResponse<ASUWeeklyData>> => {
    return await apiCall(`${getUnitPath(unit)}/weekly/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteDailyMachineData: async (
    id: number,
    unit: 1 | 2
  ): Promise<ApiResponse<void>> => {
    return await apiCall(`${getUnitPath(unit)}/daily-machine/${id}`, {
      method: 'DELETE',
    });
  },

  deleteProductionEfficiency: async (
    id: number,
    unit: 1 | 2
  ): Promise<ApiResponse<void>> => {
    return await apiCall(`${getUnitPath(unit)}/production/${id}`, {
      method: 'DELETE',
    });
  },

  deleteMainsReading: async (
    id: number,
    unit: 1 | 2
  ): Promise<ApiResponse<void>> => {
    return await apiCall(`${getUnitPath(unit)}/mains/${id}`, {
      method: 'DELETE',
    });
  },

  deleteWeeklyData: async (
    id: number,
    unit: 1 | 2
  ): Promise<ApiResponse<void>> => {
    return await apiCall(`${getUnitPath(unit)}/weekly/${id}`, {
      method: 'DELETE',
    });
  },
};

export default asuApi;
