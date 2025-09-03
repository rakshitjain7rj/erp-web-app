// src/api/dyeingApi.ts
import apiClient from './httpClient';
import {
  DyeingRecord,
  DyeingFollowUp,
  CreateDyeingRecordRequest,
  UpdateArrivalRequest,
  CreateFollowUpRequest,
} from "../types/dyeing";

const api = apiClient;
const basePath = '/dyeing';

// ==================== FOLLOW-UPS ====================
export const getFollowUpsByRecordId = async (
  dyeingRecordId: number
): Promise<DyeingFollowUp[]> => {
  const response = await api.get(`${basePath}/${dyeingRecordId}/followups`);
  return response.data.data || response.data;
};

export const createFollowUp = async (
  dyeingRecordId: number,
  data: CreateFollowUpRequest
): Promise<DyeingFollowUp> => {
  const payload = {
    ...data,
    followUpDate: data.followUpDate || new Date().toISOString(),
  };
  const response = await api.post(`${basePath}/${dyeingRecordId}/followups`, payload);
  return response.data.data || response.data;
};

export const deleteFollowUp = async (
  dyeingRecordId: number,
  followUpId: number
): Promise<void> => {
  await api.delete(`${basePath}/${dyeingRecordId}/followups/${followUpId}`);
};

// ==================== DYEING RECORDS ====================
export const getAllDyeingRecords = async (): Promise<DyeingRecord[]> => {
  // Add cache busting parameter to ensure fresh data
  const timestamp = Date.now();
  const response = await api.get(`${basePath}/?_t=${timestamp}`);
  return response.data.data || response.data;
};

export const getDyeingRecordById = async (
  id: number
): Promise<DyeingRecord> => {
  const response = await api.get(`${basePath}/${id}`);
  return response.data.data || response.data;
};

export const createDyeingRecord = async (
  data: CreateDyeingRecordRequest
): Promise<DyeingRecord> => {
  const response = await api.post(`${basePath}/`, data);
  return response.data.data || response.data;
};

export const updateDyeingRecord = async (
  id: number,
  data: CreateDyeingRecordRequest
): Promise<DyeingRecord> => {
  const response = await api.put(`${basePath}/${id}`, data);
  return response.data.data || response.data;
};

export const updateArrivalDate = async (
  id: number,
  data: UpdateArrivalRequest
): Promise<DyeingRecord> => {
  const response = await api.put(`${basePath}/${id}/arrival`, data);
  return response.data.data || response.data;
};

export const deleteDyeingRecord = async (id: number): Promise<void> => {
  console.log('🗑️ API: deleteDyeingRecord called with ID:', id);
  console.log('🌐 Making DELETE request to:', `${basePath}/${id}`);
  
  try {
  const response = await api.delete(`${basePath}/${id}`);
    console.log('✅ API: Delete response:', response);
    console.log('✅ API: Delete successful, status:', response.status);
  } catch (error: any) {
    console.error('❌ API: Delete error:', error);
    console.error('❌ API: Error response:', error.response);
    console.error('❌ API: Error status:', error.response?.status);
    console.error('❌ API: Error data:', error.response?.data);
    throw error;
  }
};

// ==================== SUMMARY & ALERTS ====================
// Removed dedicated getDyeingSummary consumer page; retaining API call (typed as any) for backward compatibility
export const getDyeingSummary = async (
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get(`${basePath}/summary`, { params });
  return response.data.data || response.data;
};

export const getDyeingSummaryByParty = async (
  startDate?: string,
  endDate?: string
): Promise<any[]> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get(`${basePath}/summary-by-party`, { params });
  return response.data.data || response.data;
};

export const getDueAlerts = async (): Promise<DyeingRecord[]> => {
  const response = await api.get(`${basePath}/alerts/due`);
  return response.data.data || response.data;
};

export const getOverdueDyeing = async (): Promise<DyeingRecord[]> => {
  const response = await api.get(`${basePath}/alerts/overdue`);
  return response.data.data || response.data;
};

// ==================== UTILITIES ====================
export const markAsArrived = async (id: number): Promise<DyeingRecord> => {
  const now = new Date().toISOString();
  return await updateArrivalDate(id, { arrivalDate: now });
};

export const markAsReprocessing = async (
  id: number,
  reason?: string
): Promise<DyeingRecord> => {
  const response = await api.patch(`${basePath}/${id}/reprocessing`, {
    isReprocessing: true,
    reprocessingDate: new Date().toISOString(),
    reprocessingReason: reason || "",
  });
  return response.data.data || response.data;
};

export const markReprocessingComplete = async (
  id: number
): Promise<DyeingRecord> => {
  const response = await api.patch(`${basePath}/${id}/reprocessing`, {
    isReprocessing: false,
  });
  return response.data.data || response.data;
};

// ✅ Accepts second argument for reprocessingReason
export const completeReprocessing = async (
  id: number,
  payload: { reprocessingReason: string }
): Promise<DyeingRecord> => {
  const response = await api.patch(`${basePath}/${id}/reprocessing`, {
    isReprocessing: false,
    reprocessingReason: payload.reprocessingReason,
  });
  return response.data.data || response.data;
};

export const getDyeingStatus = (record: DyeingRecord): string => {
  if (record.arrivalDate) return "Arrived";
  if (record.isReprocessing) return "Reprocessing";
  if (isRecordOverdue(record)) return "Overdue";
  return "Pending";
};

export const isRecordOverdue = (record: DyeingRecord): boolean => {
  if (record.arrivalDate || record.isReprocessing) return false;
  const today = new Date();
  const expectedDate = new Date(record.expectedArrivalDate);
  return today > expectedDate;
};

export const isRecordOverdueByDate = (
  expectedArrivalDate: string
): boolean => {
  const today = new Date();
  const expectedDate = new Date(expectedArrivalDate);
  return today > expectedDate;
};
