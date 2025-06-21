// api/dyeingApi.ts - UPDATED VERSION WITH EXPECTED ARRIVAL DATE
import axios from "axios";
import {
  DyeingRecord,
  DyeingFollowUp,
  CreateDyeingRecordRequest,
  UpdateArrivalRequest,
  CreateFollowUpRequest,
  DyeingSummary
} from "../types/dyeing";

const API_BASE_URL = "http://localhost:5000/api/dyeing";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
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

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== FOLLOW-UPS ====================

export const getFollowUpsByRecordId = async (dyeingRecordId: number): Promise<DyeingFollowUp[]> => {
  const response = await api.get(`/${dyeingRecordId}/followups`);
  return response.data.data || response.data;
};

export const createFollowUp = async (
  dyeingRecordId: number, 
  data: CreateFollowUpRequest
): Promise<DyeingFollowUp> => {
  const payload = {
    ...data,
    followUpDate: data.followUpDate || new Date().toISOString()
  };
  
  console.log('Creating follow-up with payload:', payload);
  
  const response = await api.post(`/${dyeingRecordId}/followups`, payload);
  return response.data.data || response.data;
};

export const deleteFollowUp = async (dyeingRecordId: number, followUpId: number): Promise<void> => {
  await api.delete(`/${dyeingRecordId}/followups/${followUpId}`);
};

// ==================== DYEING RECORDS ====================

export const getAllDyeingRecords = async (): Promise<DyeingRecord[]> => {
  const response = await api.get('/');
  return response.data.data || response.data;
};

export const getDyeingRecordById = async (id: number): Promise<DyeingRecord> => {
  const response = await api.get(`/${id}`);
  return response.data.data || response.data;
};

export const createDyeingRecord = async (data: CreateDyeingRecordRequest): Promise<DyeingRecord> => {
  const response = await api.post('/', data);
  return response.data.data || response.data;
};

export const updateArrivalDate = async (id: number, data: UpdateArrivalRequest): Promise<DyeingRecord> => {
  const response = await api.put(`/${id}/arrival`, data);
  return response.data.data || response.data;
};

export const deleteDyeingRecord = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
};

// ==================== SUMMARY & ALERTS ====================

export const getDyeingSummary = async (): Promise<DyeingSummary> => {
  const response = await api.get('/summary');
  return response.data.data || response.data;
};

export const getDueAlerts = async (): Promise<DyeingRecord[]> => {
  const response = await api.get('/alerts/due');
  return response.data.data || response.data;
};

export const getOverdueDyeing = async (): Promise<DyeingRecord[]> => {
  const response = await api.get('/alerts/overdue');
  return response.data.data || response.data;
};

// ==================== UTILITY FUNCTIONS ====================

export const markAsArrived = async (id: number): Promise<DyeingRecord> => {
  const now = new Date().toISOString();
  const result = await updateArrivalDate(id, { arrivalDate: now });
  console.log('API response:', result);
  return result;
};

export const getDyeingStatus = (record: DyeingRecord): string => {
  if (record.arrivalDate) {
    return 'Arrived';
  }
  
  // Check if overdue based on expected arrival date
  if (isRecordOverdue(record)) {
    return 'Overdue';
  }
  
  return 'Pending';
};

// Updated to use expectedArrivalDate instead of calculating from sentDate
export const isRecordOverdue = (record: DyeingRecord): boolean => {
  // If already arrived, not overdue
  if (record.arrivalDate) {
    return false;
  }
  
  // Check if current date has passed the expected arrival date
  const today = new Date();
  const expectedDate = new Date(record.expectedArrivalDate);
  
  return today > expectedDate;
};

// Legacy function for backward compatibility - now uses expectedArrivalDate
export const isRecordOverdueByDate = (expectedArrivalDate: string): boolean => {
  const today = new Date();
  const expectedDate = new Date(expectedArrivalDate);
  return today > expectedDate;
};