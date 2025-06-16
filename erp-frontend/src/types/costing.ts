import axios from "axios";

const API = "http://localhost:5000/api/costing";

export const calculateCost = async (data: {
  workOrderId: string;
  materialCost: number;
  laborCost: number;
}) => {
  const token = localStorage.getItem("token");
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getCostByWorkOrder = async (workOrderId: string) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API}/${workOrderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
