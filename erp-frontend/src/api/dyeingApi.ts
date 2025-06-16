import axios from "axios";
import { DyeingOrder } from "../types/dyeing";

const BASE_URL = "http://localhost:5000/api/dyeing-orders";

export const updateOrderStatus = async (id: string, status: string) => {
  const res = await axios.patch(`${BASE_URL}/${id}/status`, { status });
  return res.data;
};

export const fetchDyeingOrders = async (): Promise<DyeingOrder[]> => {
  const response = await axios.get("/api/dyeing-orders");
  return response.data;
};
