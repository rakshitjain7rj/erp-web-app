import axios from "axios";

// Use the environment variable with a fallback that includes the /api prefix
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; 

export const loginUser = async (email: string, password: string) => {
  console.log(`Making login request to: ${API}/auth/login`);
  const res = await axios.post(`${API}/auth/login`, { email, password });
  return res.data;
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  console.log(`Making register request to: ${API}/auth/register`);
  const res = await axios.post(`${API}/auth/register`, data);
  return res.data;
};
