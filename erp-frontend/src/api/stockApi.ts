import axios from "axios";
import { StockLog } from "../types/inventory";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/inventory`;

export interface StockInData {
  quantity: number;
  date: string;
  remarks?: string;
  source?: string;
}

export interface StockOutData {
  quantity: number;
  date: string;
  remarks?: string;
  usagePurpose: string;
}

export interface SpoilageData {
  quantity: number;
  date: string;
  remarks?: string;
  reason: string;
}

// Get stock logs for an inventory item
export const getStockLogs = async (inventoryId: string): Promise<StockLog[]> => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_BASE}/${inventoryId}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Add stock to inventory
export const addStock = async (
  inventoryId: string,
  data: StockInData
): Promise<{ success: boolean; message: string; updatedItem?: any }> => {
  const token = localStorage.getItem("token");
  const res = await axios.post(`${API_BASE}/${inventoryId}/stock-in`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Remove stock from inventory
export const removeStock = async (
  inventoryId: string,
  data: StockOutData
): Promise<{ success: boolean; message: string; updatedItem?: any }> => {
  const token = localStorage.getItem("token");
  const res = await axios.post(`${API_BASE}/${inventoryId}/stock-out`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Log spoilage
export const logSpoilage = async (
  inventoryId: string,
  data: SpoilageData
): Promise<{ success: boolean; message: string; updatedItem?: any }> => {
  const token = localStorage.getItem("token");
  const res = await axios.post(`${API_BASE}/${inventoryId}/spoilage`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Get stock summary for an inventory item
export const getStockSummary = async (inventoryId: string) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_BASE}/${inventoryId}/stock-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
