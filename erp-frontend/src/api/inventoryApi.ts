import axios from "axios";
import { InventoryItem } from "../types/inventory";

const API_BASE = "http://localhost:5000/api/inventory";

export const getInventory = async () => {
  const res = await axios.get(API_BASE);
  return res.data;
};


export const createInventoryItem = async (item: Omit<InventoryItem, "id">) => {
  const res = await axios.post(API_BASE, item);
  return res.data;
};

export const updateInventoryItem = async (id: string, item: Partial<InventoryItem>) => {
  const res = await axios.put(`${API_BASE}/${id}`, item); // ✅ use backticks here
  return res.data;
};
export const deleteInventoryItem = async (id: string) => {
  const response = await fetch(`/api/inventory/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete inventory item");
  }
};
