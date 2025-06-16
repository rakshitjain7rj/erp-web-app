import axios from "axios";

const API = "http://localhost:5000/api/inventory";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  location: string;
}

export const getMaterials = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Get all inventory items
export const getInventory = async (): Promise<InventoryItem[]> => {
  const token = localStorage.getItem("token");
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Create new inventory item
export const createInventoryItem = async (
  data: Omit<InventoryItem, "id">
): Promise<InventoryItem> => {
  const token = localStorage.getItem("token");
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Update existing inventory item
export const updateInventoryItem = async (
  id: string,
  data: Omit<InventoryItem, "id">
): Promise<InventoryItem> => {
  const token = localStorage.getItem("token");
  const res = await axios.put(`${API}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
