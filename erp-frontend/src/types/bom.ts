import axios from "axios";

const API = "http://localhost:5000/api/bom";

// ✅ Create a BOM
export const createBOM = async (data: {
  productId: string;
  materials: { name: string; quantity: number }[];
}) => {
  const token = localStorage.getItem("token");
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ Get all BOMs
export const getBOM = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ Delete a BOM by ID
export const deleteBOM = async (id: string) => {
  const token = localStorage.getItem("token");
  const res = await axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Optional: Interface for BOM Items (if you're using in other places)
export interface BOMItem {
  id: string;
  productName: string;
  components: string;
  quantity: number;
  unit: string;
}
