import {
  ProductionJob,
  DetailedProductionJob,
  ProductionJobFormData,
  ProductionJobFilters,
  ProductionJobStats,
  Machine,
  ApiResponse,
  PaginatedResponse
} from '../types/production';

const API_BASE_URL = 'http://localhost:5000/api';

// API utility function
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Production Job API
export const productionApi = {
  // Get all production jobs with filters and pagination
  getAll: async (
    filters: ProductionJobFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<ProductionJob>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
      )
    });

    return apiCall<PaginatedResponse<ProductionJob>>(`/production?${params}`);
  },

  // Get production job by ID
  getById: async (id: number): Promise<ApiResponse<DetailedProductionJob>> => {
    return apiCall<DetailedProductionJob>(`/production/${id}`);
  },

  // Create new production job
  create: async (jobData: ProductionJobFormData): Promise<ApiResponse<ProductionJob>> => {
    return apiCall<ProductionJob>('/production', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Create detailed production job with all job card data
  createDetailed: async (jobData: ProductionJobFormData): Promise<ApiResponse<DetailedProductionJob>> => {
    return apiCall<DetailedProductionJob>('/production/detailed', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Update production job
  update: async (id: number, jobData: Partial<ProductionJobFormData>): Promise<ApiResponse<ProductionJob>> => {
    return apiCall<ProductionJob>(`/production/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  // Update job status
  updateStatus: async (id: number, status: ProductionJob['status']): Promise<ApiResponse<ProductionJob>> => {
    return apiCall<ProductionJob>(`/production/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Start production job
  start: async (id: number): Promise<ApiResponse<ProductionJob>> => {
    return apiCall<ProductionJob>(`/production/${id}/start`, {
      method: 'POST',
    });
  },

  // Complete production job
  complete: async (id: number, completionData?: {
    actualHours?: number;
    finalUtilityReadings?: Record<string, string | number>;
    qualityControlData?: Record<string, string | number>;
    notes?: string;
  }): Promise<ApiResponse<ProductionJob>> => {
    return apiCall<ProductionJob>(`/production/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(completionData || {}),
    });
  },

  // Delete production job
  delete: async (id: number): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/production/${id}`, {
      method: 'DELETE',
    });
  },

  // Get production job statistics
  getStats: async (filters: ProductionJobFilters = {}): Promise<ApiResponse<ProductionJobStats>> => {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
      )
    );
    
    return apiCall<ProductionJobStats>(`/production/stats?${params}`);
  },

  // Add hourly efficiency entry
  addHourlyEfficiency: async (id: number, efficiencyData: {
    hour: number;
    actualProduction: number;
    targetProduction: number;
    downtimeMinutes?: number;
    qualityIssues?: number;
    notes?: string;
  }): Promise<ApiResponse<ProductionJob>> => {
    return apiCall<ProductionJob>(`/production/${id}/efficiency`, {
      method: 'POST',
      body: JSON.stringify(efficiencyData),
    });
  },

  // Add utility reading
  addUtilityReading: async (id: number, readingData: {
    timestamp?: string;
    steamPressure?: number;
    waterTemperature?: number;
    powerConsumption?: number;
    gasConsumption?: number;
    steamConsumption?: number;
    waterConsumption?: number;
  }): Promise<ApiResponse<ProductionJob>> => {
    return apiCall<ProductionJob>(`/production/${id}/utility-reading`, {
      method: 'POST',
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        ...readingData,
      }),
    });
  },
};

// Machine API
export const machineApi = {
  // Get all machines
  getAll: async (): Promise<ApiResponse<Machine[]>> => {
    return apiCall<Machine[]>('/production/machines');
  },

  // Get machine by ID
  getById: async (id: number): Promise<ApiResponse<Machine>> => {
    return apiCall<Machine>(`/production/machines/${id}`);
  },

  // Create new machine
  create: async (machineData: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Machine>> => {
    return apiCall<Machine>('/production/machines', {
      method: 'POST',
      body: JSON.stringify(machineData),
    });
  },

  // Update machine
  update: async (id: number, machineData: Partial<Machine>): Promise<ApiResponse<Machine>> => {
    return apiCall<Machine>(`/production/machines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(machineData),
    });
  },

  // Delete machine
  delete: async (id: number): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/production/machines/${id}`, {
      method: 'DELETE',
    });
  },

  // Get machines by type
  getByType: async (type: Machine['type']): Promise<ApiResponse<Machine[]>> => {
    return apiCall<Machine[]>(`/production/machines/type/${type}`);
  },

  // Get active machines
  getActive: async (): Promise<ApiResponse<Machine[]>> => {
    return apiCall<Machine[]>('/production/machines/active');
  },
};

// Export default
export default {
  production: productionApi,
  machines: machineApi,
};
