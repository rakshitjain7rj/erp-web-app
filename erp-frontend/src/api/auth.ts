import axios from "axios";

const API = import.meta.env.VITE_API_URL; 

export const loginUser = async (email: string, password: string) => {
  const res = await axios.post(`${API}/auth/login`, { email, password });
  return res.data;
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const res = await axios.post(`${API}/auth/register`, data);
  return res.data;
};
