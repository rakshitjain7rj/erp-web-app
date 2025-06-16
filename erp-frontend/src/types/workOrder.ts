// types/workOrder.ts
import axios from "axios";

const API = "http://localhost:5000/api/workorders";

export const createWorkOrder = async (data: {
  bomId: string;
  quantity: number;
}) => {
  const token = localStorage.getItem("token");
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getWorkOrders = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateWorkOrder = async (
  id: string,
  data: { quantity?: number; status?: string }
) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(`${API}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteWorkOrder = async (id: string) => {
  const token = localStorage.getItem("token");
  const res = await axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
