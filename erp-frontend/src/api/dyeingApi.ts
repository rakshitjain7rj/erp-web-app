// api/dyeingApi.ts - FIXED VERSION
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

// ==================== FOLLOW-UPS - FIXED ====================

export const getFollowUpsByRecordId = async (dyeingRecordId: number): Promise<DyeingFollowUp[]> => {
  const response = await api.get(`/${dyeingRecordId}/followups`);
  // Handle both response structures
  return response.data.data || response.data;
};

export const createFollowUp = async (
  dyeingRecordId: number, 
  data: CreateFollowUpRequest
): Promise<DyeingFollowUp> => {
  // ✅ FIX: Add followUpDate if not provided
  const payload = {
    ...data,
    followUpDate: data.followUpDate || new Date().toISOString()
  };
  
  console.log('Creating follow-up with payload:', payload); // Debug log
  
  const response = await api.post(`/${dyeingRecordId}/followups`, payload);
  
  // ✅ FIX: Handle different response structures
  return response.data.data || response.data;
};

export const deleteFollowUp = async (dyeingRecordId: number, followUpId: number): Promise<void> => {
  await api.delete(`/${dyeingRecordId}/followups/${followUpId}`);
};

// ==================== OTHER FUNCTIONS - ALSO UPDATED ====================

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
  return await updateArrivalDate(id, { arrivalDate: now });
};

export const getDyeingStatus = (record: DyeingRecord): string => {
  if (record.arrivalDate) {
    return 'Arrived';
  }
  if (record.isOverdue) {
    return 'Overdue';
  }
  return 'Pending';
};

export const isRecordOverdue = (sentDate: string): boolean => {
  const sent = new Date(sentDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 7;
};