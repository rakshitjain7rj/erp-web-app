import axios from "axios";

const API = "http://localhost:5000/api/inventory";

export interface InventoryItem {
  id: string;
  productName: string;
  rawMaterial: string;
  category: string;
  effectiveYarn: number;
  count: number;
  unitsProduced: number;
  initialQuantity: number;
  currentQuantity?: number;
  gsm?: number;
  costPerKg?: number;
  totalValue?: number;
  location?: string;
  warehouseLocation?: string;
  batchNumber?: string;
  supplierName?: string;
  manualQuantity?: boolean;
  manualValue?: boolean;
  manualYarn?: boolean;
  remarks?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
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
