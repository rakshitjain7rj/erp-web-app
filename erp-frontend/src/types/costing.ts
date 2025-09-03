import apiClient from '../api/httpClient';
const API = '/costing';

export const calculateCost = async (data: {
  workOrderId: string;
  materialCost: number;
  laborCost: number;
}) => {
  const token = localStorage.getItem("token");
  const res = await apiClient.post(API, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getCostByWorkOrder = async (workOrderId: string) => {
  const token = localStorage.getItem("token");
  const res = await apiClient.get(`${API}/${workOrderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
