// api/countProductApi.ts
import apiClient from './httpClient';
const api = apiClient;
const basePath = '/count-products';

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
  const response = await api.get(`${basePath}/`);
  return response.data.data || response.data;
};

export const getCountProductById = async (id: number): Promise<CountProduct> => {
  const response = await api.get(`${basePath}/${id}`);
  return response.data.data || response.data;
};

export const createCountProduct = async (data: CreateCountProductRequest): Promise<CountProduct> => {
  const response = await api.post(`${basePath}/`, data);
  return response.data.data || response.data;
};

export const updateCountProduct = async (id: number, data: Partial<CreateCountProductRequest>): Promise<CountProduct> => {
  console.log('\n🔥 AGGRESSIVE DEBUG - API UPDATE COUNT PRODUCT');
  console.log('📡 API call to update product ID:', id);
  console.log('📤 Data being sent to server:', JSON.stringify(data, null, 2));
  console.log('🔍 CRITICAL FIELDS IN API CALL:');
  console.log(`   customerName: "${data.customerName}"`);
  console.log(`   partyName: "${data.partyName}"`);
  
  const response = await api.put(`${basePath}/${id}`, data);
  
  console.log('📥 API response received:', JSON.stringify(response.data, null, 2));
  console.log('🔍 RESPONSE CRITICAL FIELDS:');
  const responseData = response.data.data || response.data;
  console.log(`   returned customerName: "${responseData.customerName}"`);
  console.log(`   returned partyName: "${responseData.partyName}"`);
  console.log('🔥 API UPDATE COMPLETE\n');
  
  return responseData;
};

export const deleteCountProduct = async (id: number): Promise<void> => {
  await api.delete(`${basePath}/${id}`);
};

export const getCountProductsByDyeingFirm = async (dyeingFirm: string): Promise<CountProduct[]> => {
  const response = await api.get(`${basePath}/dyeing-firm/${encodeURIComponent(dyeingFirm)}`);
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
  const response = await api.get(`${basePath}/${countProductId}/followups`);
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
  const response = await api.post(`${basePath}/${countProductId}/followups`, payload);
  return response.data.data || response.data;
};

export const deleteCountProductFollowUp = async (
  countProductId: number,
  followUpId: number
): Promise<void> => {
  await api.delete(`${basePath}/${countProductId}/followups/${followUpId}`);
};

export default api;
