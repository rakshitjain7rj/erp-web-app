import axios from "axios";

const API = "http://localhost:5000/api/bom";

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

export const getBOM = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ This must be correctly placed and exported
export const deleteBOM = async (id: string) => {
  const token = localStorage.getItem("token");
  const res = await axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
