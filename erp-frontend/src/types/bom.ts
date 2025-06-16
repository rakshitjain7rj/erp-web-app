import axios from "axios";

const API = "http://localhost:5000/api/bom";

export const createBOM = async (data: {
  product: string;
  materials: { materialId: string; quantity: number }[];
}) => {
  const token = localStorage.getItem("token");
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getBOMs = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export interface BOMItem {
  id: string;
  productName: string;
  components: string;
  quantity: number;
  unit: string;
}

