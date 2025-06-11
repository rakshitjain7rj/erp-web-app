import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const loginUser = async (email: string, password: string) => {
  const res = await axios.post(`${API}/login`, { email, password });
  return res.data;
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const res = await axios.post(`${API}/register`, data);
  return res.data;
};
