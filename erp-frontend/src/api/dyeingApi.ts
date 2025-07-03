// src/api/dyeingApi.ts
import axios from "axios";
import {
  DyeingRecord,
  DyeingFollowUp,
  CreateDyeingRecordRequest,
  UpdateArrivalRequest,
  CreateFollowUpRequest,
  DyeingSummary,
} from "../types/dyeing";

const API_BASE_URL = "http://localhost:5000/api/dyeing";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== FOLLOW-UPS ====================
export const getFollowUpsByRecordId = async (
  dyeingRecordId: number
): Promise<DyeingFollowUp[]> => {
  const response = await api.get(`/${dyeingRecordId}/followups`);
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
  const response = await api.post(`/${dyeingRecordId}/followups`, payload);
  return response.data.data || response.data;
};

export const deleteFollowUp = async (
  dyeingRecordId: number,
  followUpId: number
): Promise<void> => {
  await api.delete(`/${dyeingRecordId}/followups/${followUpId}`);
};

// ==================== DYEING RECORDS ====================
export const getAllDyeingRecords = async (): Promise<DyeingRecord[]> => {
  const response = await api.get("/");
  return response.data.data || response.data;
};

export const getDyeingRecordById = async (
  id: number
): Promise<DyeingRecord> => {
  const response = await api.get(`/${id}`);
  return response.data.data || response.data;
};

export const createDyeingRecord = async (
  data: CreateDyeingRecordRequest
): Promise<DyeingRecord> => {
  const response = await api.post("/", data);
  return response.data.data || response.data;
};

export const updateDyeingRecord = async (
  id: number,
  data: CreateDyeingRecordRequest
): Promise<DyeingRecord> => {
  const response = await api.put(`/${id}`, data);
  return response.data.data || response.data;
};

export const updateArrivalDate = async (
  id: number,
  data: UpdateArrivalRequest
): Promise<DyeingRecord> => {
  const response = await api.put(`/${id}/arrival`, data);
  return response.data.data || response.data;
};

export const deleteDyeingRecord = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
};

// ==================== SUMMARY & ALERTS ====================
export const getDyeingSummary = async (
  startDate?: string,
  endDate?: string
): Promise<DyeingSummary> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get("/summary", { params });
  return response.data.data || response.data;
};

export const getDyeingSummaryByParty = async (
  startDate?: string,
  endDate?: string
): Promise<any[]> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get("/summary-by-party", { params });
  return response.data.data || response.data;
};

export const getDueAlerts = async (): Promise<DyeingRecord[]> => {
  const response = await api.get("/alerts/due");
  return response.data.data || response.data;
};

export const getOverdueDyeing = async (): Promise<DyeingRecord[]> => {
  const response = await api.get("/alerts/overdue");
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
  const response = await api.patch(`/${id}/reprocessing`, {
    isReprocessing: true,
    reprocessingDate: new Date().toISOString(),
    reprocessingReason: reason || "",
  });
  return response.data.data || response.data;
};

export const markReprocessingComplete = async (
  id: number
): Promise<DyeingRecord> => {
  const response = await api.patch(`/${id}/reprocessing`, {
    isReprocessing: false,
  });
  return response.data.data || response.data;
};

// ✅ Export alias for compatibility with `DyeingOrders.tsx`
export const completeReprocessing = markReprocessingComplete;

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
