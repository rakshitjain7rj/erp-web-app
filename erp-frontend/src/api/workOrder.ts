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
