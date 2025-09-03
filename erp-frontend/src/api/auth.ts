import apiClient from './httpClient';

// All endpoints relative to baseURL (which already contains /api)
export const loginUser = async (email: string, password: string) => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const res = await apiClient.post('/auth/register', data);
  return res.data;
};
