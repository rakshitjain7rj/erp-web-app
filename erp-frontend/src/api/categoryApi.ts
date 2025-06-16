import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getCategories = async () => {
  const res = await axios.get(`${API}/categories`);
  return res.data;
};
