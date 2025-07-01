import { ApiResponse, PaginatedResponse } from '../types/asu';
import {
  ASUDailyMachineData,
  ASUProductionEfficiency,
  ASUMainsReading,
  ASUWeeklyData,
  ASUFormData,
  ASUFilters
} from '../types/asu';  

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to validate token format
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

// Helper function to check if token is expired (basic check)
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < currentTime;
  } catch {
    return true; // If we can't decode, assume expired
  }
}

// API utility function
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = localStorage.getItem('token');
    console.log('🔑 Token status:', { hasToken: !!token, tokenLength: token?.length || 0 });

    // Validate token if it exists
    if (token && (!isValidToken(token) || isTokenExpired(token))) {
      console.warn('🔒 Token is invalid or expired, removing from storage');
      localStorage.removeItem('token');
    }

    const validToken = localStorage.getItem('token'); // Get fresh token after validation
    const headers = {
      'Content-Type': 'application/json',
      ...(validToken && { Authorization: `Bearer ${validToken}` }),
      ...options.headers,
    };

    console.log('📡 API Call:', { endpoint: `${API_BASE_URL}${endpoint}`, method: options.method || 'GET', hasAuth: !!validToken });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        console.log('❌ Error response:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
        
        // Special handling for auth errors
        if (response.status === 401) {
          console.warn('🔒 Authentication failed - token may be expired');
          // Optionally clear invalid token
          if (errorData.error === 'Invalid token' || errorData.error === 'Unauthorized') {
            localStorage.removeItem('token');
            errorMessage = 'Session expired. Please login again.';
          }
        }
      } catch (parseError) {
        // If we can't parse error response, use generic message
        console.warn('Failed to parse error response:', parseError);
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Success response:', { endpoint, dataKeys: Object.keys(data) });
    return { success: true, data };
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

function wrapPaginated<T>(res: ApiResponse<unknown>, page: number, limit: number): ApiResponse<PaginatedResponse<T>> {
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
          totalPages: 1
        }
      };
    }
  }
  return res as ApiResponse<PaginatedResponse<T>>;
}

export const asuApi = {
  submitDailyData: async (formData: ASUFormData): Promise<ApiResponse<{
    dailyMachine: ASUDailyMachineData;
    production: ASUProductionEfficiency;
    mainsReading: ASUMainsReading;
    weekly: ASUWeeklyData;
  }>> => {
    return await apiCall('/asu-unit2/daily', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  submitWeeklyData: async (weeklyData: ASUWeeklyData): Promise<ApiResponse<ASUWeeklyData>> => {
    return await apiCall('/asu-unit2/weekly', {
      method: 'POST',
      body: JSON.stringify(weeklyData),
    });
  },

  getDailyMachineData: async (
    filters: ASUFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<ASUDailyMachineData>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
      )
    });
    const res = await apiCall(`/asu-unit2/daily-machine?${params}`);
    return wrapPaginated<ASUDailyMachineData>(res, page, limit);
  },

  getProductionEfficiency: async (
    filters: ASUFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<ASUProductionEfficiency>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
      )
    });
    const res = await apiCall(`/asu-unit2/production?${params}`);
    return wrapPaginated<ASUProductionEfficiency>(res, page, limit);
  },

  getMainsReadings: async (
    filters: ASUFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<ASUMainsReading>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
      )
    });
    const res = await apiCall(`/asu-unit2/mains?${params}`);
    return wrapPaginated<ASUMainsReading>(res, page, limit);
  },

  getWeeklyData: async (
    filters: ASUFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<ASUWeeklyData>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
      )
    });
    const res = await apiCall(`/asu-unit2/weekly?${params}`);
    return wrapPaginated<ASUWeeklyData>(res, page, limit);
  },

  getStats: async (filters: ASUFilters = {}): Promise<ApiResponse<{
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
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
      )
    );
    return await apiCall(`/asu-unit2/stats?${params}`);
  },

  updateDailyMachineData: async (
    id: number,
    data: Partial<ASUDailyMachineData>
  ): Promise<ApiResponse<ASUDailyMachineData>> => {
    return await apiCall(`/asu-unit2/daily-machine/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateProductionEfficiency: async (
    id: number,
    data: Partial<ASUProductionEfficiency>
  ): Promise<ApiResponse<ASUProductionEfficiency>> => {
    return await apiCall(`/asu-unit2/production/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateMainsReading: async (
    id: number,
    data: Partial<ASUMainsReading>
  ): Promise<ApiResponse<ASUMainsReading>> => {
    return await apiCall(`/asu-unit2/mains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateWeeklyData: async (
    id: number,
    data: Partial<ASUWeeklyData>
  ): Promise<ApiResponse<ASUWeeklyData>> => {
    return await apiCall(`/asu-unit2/weekly/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteDailyMachineData: async (id: number): Promise<ApiResponse<void>> => {
    return await apiCall(`/asu-unit2/daily-machine/${id}`, {
      method: 'DELETE',
    });
  },

  deleteProductionEfficiency: async (id: number): Promise<ApiResponse<void>> => {
    return await apiCall(`/asu-unit2/production/${id}`, {
      method: 'DELETE',
    });
  },

  deleteMainsReading: async (id: number): Promise<ApiResponse<void>> => {
    return await apiCall(`/asu-unit2/mains/${id}`, {
      method: 'DELETE',
    });
  },

  deleteWeeklyData: async (id: number): Promise<ApiResponse<void>> => {
    return await apiCall(`/asu-unit2/weekly/${id}`, {
      method: 'DELETE',
    });
  },
};

export default asuApi;
