import apiClient from './httpClient';
import { InventoryItem } from "../types/inventory";

// Base path relative to centralized /api base URL
const API_BASE = "/inventory";

// Use shared client
const api = apiClient;

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error Request:', error.request);
    } else {
      // Something else happened
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Test connection to backend
export const testConnection = async () => {
  try {
    const res = await api.get("/api/test");
    console.log("✅ Backend connection test successful:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Backend connection test failed:", error);
    throw error;
  }
};

// Get all inventory items
export const getInventory = async (): Promise<InventoryItem[]> => {
  try {
    console.log("📡 Fetching inventory from:", API_BASE);
    const res = await api.get(API_BASE);
    console.log("✅ Inventory data received:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch inventory:", error);
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Unable to connect to server. Please ensure the backend is running on port 5000.');
    }
    throw error;
  }
};

// Create new inventory item
export const createInventoryItem = async (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">): Promise<InventoryItem> => {
  try {
    console.log("📡 Creating inventory item:", item);
    const res = await api.post(API_BASE, item);
    console.log("✅ Inventory item created:", res.data);
    return res.data.data || res.data; // Handle different response formats
  } catch (error: any) {
    console.error("❌ Failed to create inventory item:", error);
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Unable to connect to server. Please ensure the backend is running on port 5000.');
    }
    throw error;
  }
};

// Update inventory item
export const updateInventoryItem = async (id: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
  try {
    console.log("📡 Updating inventory item:", id, item);
    const res = await api.put(`${API_BASE}/${id}`, item);
    console.log("✅ Inventory item updated:", res.data);
    return res.data.data || res.data;
  } catch (error: any) {
    console.error("❌ Failed to update inventory item:", error);
    throw error;
  }
};

// Delete inventory item
export const deleteInventoryItem = async (id: string): Promise<void> => {
  try {
    console.log("📡 Deleting inventory item:", id);
    await api.delete(`${API_BASE}/${id}`);
    console.log("✅ Inventory item deleted");
  } catch (error: any) {
    console.error("❌ Failed to delete inventory item:", error);
    throw error;
  }
};
