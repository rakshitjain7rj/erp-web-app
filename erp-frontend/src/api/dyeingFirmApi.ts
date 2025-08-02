// erp-frontend/src/api/dyeingFirmApi.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for dyeing firm APIs
const api = axios.create({
  baseURL: `${API_BASE_URL}/dyeing-firms`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Dyeing Firm API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// ==================== DYEING FIRM INTERFACES ====================
export interface DyeingFirm {
  id: number;
  name: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDyeingFirmRequest {
  name: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface FindOrCreateDyeingFirmRequest {
  name: string;
}

export interface FindOrCreateDyeingFirmResponse {
  success: boolean;
  message: string;
  data: DyeingFirm;
  created: boolean;
}

// ==================== DYEING FIRM API FUNCTIONS ====================
export const getAllDyeingFirms = async (): Promise<DyeingFirm[]> => {
  const response = await api.get('/');
  return response.data.data || response.data;
};

export const getDyeingFirmById = async (id: number): Promise<DyeingFirm> => {
  const response = await api.get(`/${id}`);
  return response.data.data || response.data;
};

export const createDyeingFirm = async (data: CreateDyeingFirmRequest): Promise<DyeingFirm> => {
  const response = await api.post('/', data);
  return response.data.data || response.data;
};

export const updateDyeingFirm = async (id: number, data: Partial<CreateDyeingFirmRequest>): Promise<DyeingFirm> => {
  const response = await api.put(`/${id}`, data);
  return response.data.data || response.data;
};

export const deleteDyeingFirm = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
};

export const findOrCreateDyeingFirm = async (data: FindOrCreateDyeingFirmRequest): Promise<FindOrCreateDyeingFirmResponse> => {
  const response = await api.post('/find-or-create', data);
  return response.data;
};

// ==================== UTILITY FUNCTIONS ====================
export const getDyeingFirmNames = async (): Promise<string[]> => {
  try {
    const dyeingFirms = await getAllDyeingFirms();
    return dyeingFirms.map(firm => firm.name).sort();
  } catch (error) {
    console.error('Failed to fetch dyeing firm names:', error);
    return [];
  }
};

export const searchDyeingFirms = async (query: string): Promise<DyeingFirm[]> => {
  try {
    const dyeingFirms = await getAllDyeingFirms();
    return dyeingFirms.filter(firm => 
      firm.name.toLowerCase().includes(query.toLowerCase()) ||
      firm.contactPerson?.toLowerCase().includes(query.toLowerCase()) ||
      firm.phoneNumber?.includes(query)
    );
  } catch (error) {
    console.error('Failed to search dyeing firms:', error);
    return [];
  }
};

export default api;
