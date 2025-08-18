// api/countProductApi.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for count product APIs
const api = axios.create({
  baseURL: `${API_BASE_URL}/count-products`,
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
    console.error('Count Product API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// ==================== COUNT PRODUCT INTERFACES ====================
export interface CountProduct {
  id: number;
  partyName: string;
  dyeingFirm: string;
  yarnType: string;
  count: string;
  shade: string;
  quantity: number;
  sentQuantity?: number;  // Separate field for sent to dye quantity
  completedDate: string;
  qualityGrade: 'A' | 'B' | 'C';
  remarks?: string;
  lotNumber: string;
  processedBy: string;
  customerName: string;
  sentToDye: boolean;
  sentDate: string;
  received: boolean;
  receivedDate: string;
  receivedQuantity: number;
  dispatch: boolean;
  dispatchDate: string;
  dispatchQuantity: number;
  middleman: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCountProductRequest {
  partyName: string;
  dyeingFirm: string;
  yarnType: string;
  count: string;
  shade: string;
  quantity: number;
  completedDate: string;
  qualityGrade: 'A' | 'B' | 'C';
  remarks?: string;
  lotNumber: string;
  processedBy?: string;
  customerName: string;
  sentToDye?: boolean;
  sentDate?: string;
  received?: boolean;
  receivedDate?: string;
  receivedQuantity?: number;
  dispatch?: boolean;
  dispatchDate?: string;
  dispatchQuantity?: number;
  middleman?: string;
}

// ==================== COUNT PRODUCT API FUNCTIONS ====================
export const getAllCountProducts = async (): Promise<CountProduct[]> => {
  const response = await api.get('/');
  return response.data.data || response.data;
};

export const getCountProductById = async (id: number): Promise<CountProduct> => {
  const response = await api.get(`/${id}`);
  return response.data.data || response.data;
};

export const createCountProduct = async (data: CreateCountProductRequest): Promise<CountProduct> => {
  const response = await api.post('/', data);
  return response.data.data || response.data;
};

export const updateCountProduct = async (id: number, data: Partial<CreateCountProductRequest>): Promise<CountProduct> => {
  const response = await api.put(`/${id}`, data);
  return response.data.data || response.data;
};

export const deleteCountProduct = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
};

export const getCountProductsByDyeingFirm = async (dyeingFirm: string): Promise<CountProduct[]> => {
  const response = await api.get(`/dyeing-firm/${encodeURIComponent(dyeingFirm)}`);
  return response.data.data || response.data;
};

// ==================== FOLLOW-UP INTERFACES ====================
export interface CountProductFollowUp {
  id: number;
  countProductId: number;
  followUpDate: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  addedBy: number;
  addedByName: string;
}

export interface CreateCountProductFollowUpRequest {
  remarks: string;
  followUpDate?: string;
}

// ==================== FOLLOW-UP API FUNCTIONS ====================
export const getCountProductFollowUps = async (
  countProductId: number
): Promise<CountProductFollowUp[]> => {
  const response = await api.get(`/${countProductId}/followups`);
  return response.data.data || response.data;
};

export const createCountProductFollowUp = async (
  countProductId: number,
  data: CreateCountProductFollowUpRequest
): Promise<CountProductFollowUp> => {
  const payload = {
    ...data,
    followUpDate: data.followUpDate || new Date().toISOString(),
  };
  const response = await api.post(`/${countProductId}/followups`, payload);
  return response.data.data || response.data;
};

export const deleteCountProductFollowUp = async (
  countProductId: number,
  followUpId: number
): Promise<void> => {
  await api.delete(`/${countProductId}/followups/${followUpId}`);
};

export default api;
