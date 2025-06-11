import axios from "axios";

const API = "http://localhost:5000/api/inventory";

export const addMaterial = async (data: { name: string; quantity: number }) => {
  const token = localStorage.getItem("token");
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getMaterials = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
    