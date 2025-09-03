// erp-frontend/src/api/dyeingFirmApi.ts
import apiClient from './httpClient';
const api = apiClient;
const basePath = '/dyeing-firms';

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
  const response = await api.get(`${basePath}/`);
  return response.data.data || response.data;
};

export const getDyeingFirmById = async (id: number): Promise<DyeingFirm> => {
  const response = await api.get(`${basePath}/${id}`);
  return response.data.data || response.data;
};

export const createDyeingFirm = async (data: CreateDyeingFirmRequest): Promise<DyeingFirm> => {
  const response = await api.post(`${basePath}/`, data);
  return response.data.data || response.data;
};

export const updateDyeingFirm = async (id: number, data: Partial<CreateDyeingFirmRequest>): Promise<DyeingFirm> => {
  const response = await api.put(`${basePath}/${id}`, data);
  return response.data.data || response.data;
};

export const deleteDyeingFirm = async (id: number): Promise<void> => {
  await api.delete(`${basePath}/${id}`);
};

export const findOrCreateDyeingFirm = async (data: FindOrCreateDyeingFirmRequest): Promise<FindOrCreateDyeingFirmResponse> => {
  const response = await api.post(`${basePath}/find-or-create`, data);
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
