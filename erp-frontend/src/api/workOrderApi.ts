// api/workOrderApi.ts
import axios from "axios";
import { WorkOrder } from "../types/workOrder";

const BASE_URL = "/api/workorders";

export const getWorkOrders = async (): Promise<WorkOrder[]> => {
  const res = await axios.get(BASE_URL);
  return res.data;
};

export const createWorkOrder = async (data: Omit<WorkOrder, "id">) => {
  await axios.post(BASE_URL, data);
};

export const updateWorkOrder = async (id: string, data: Partial<WorkOrder>) => {
  await axios.put(`${BASE_URL}/${id}`, data);
};

export const deleteWorkOrder = async (id: string) => {
  await axios.delete(`${BASE_URL}/${id}`);
};
