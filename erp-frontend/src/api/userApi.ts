import apiClient from './httpClient';
const basePath = '/users';

// 1. Get all users
export const getAllUsers = async () => {
  const res = await apiClient.get(`${basePath}/`);
  return res.data;
};

// 2. Add new user
export const addUser = async (userData: {
  name: string;
  email: string;
  role: string;
  password?: string;
}) => {
  const res = await apiClient.post(`${basePath}/`, userData);
  return res.data;
};

// 3. Update user (role/status)
export const updateUser = async (
  userId: string,
  updates: { role?: string; status?: "active" | "inactive" }
) => {
  const res = await apiClient.patch(`${basePath}/${userId}`, updates);
  return res.data;
};

// 4. Delete user
export const deleteUser = async (userId: string) => {
  const res = await apiClient.delete(`${basePath}/${userId}`);
  return res.data;
};

// 5. Send invite email
export const sendInvite = async (email: string) => {
  const res = await apiClient.post(`${basePath}/invite`, { email });
  return res.data;
};

// 6. Reset password (generate temp password or trigger email)
export const resetPassword = async (userId: string, newPassword = "temp1234") => {
  const res = await apiClient.post(`${basePath}/${userId}/reset-password`, { newPassword });
  return res.data;
};

// 7. Get login history
export const fetchLoginHistory = async (userId: string) => {
  const res = await apiClient.get(`${basePath}/${userId}/logs`);
  return res.data;
};
