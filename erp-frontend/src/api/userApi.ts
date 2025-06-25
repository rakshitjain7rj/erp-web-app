import axios from "axios";

const API = axios.create({
  baseURL: "/api/users", // Adjust if your base URL is different
  withCredentials: true,
});

// 1. Get all users
export const getAllUsers = async () => {
  const res = await API.get("/");
  return res.data;
};

// 2. Add new user
export const addUser = async (userData: {
  name: string;
  email: string;
  role: string;
  password?: string;
}) => {
  const res = await API.post("/", userData); // changed "/add" to "/"
  return res.data;
};

// 3. Update user (role/status)
export const updateUser = async (
  userId: string,
  updates: { role?: string; status?: "active" | "inactive" }
) => {
  const res = await API.patch(`/${userId}`, updates);
  return res.data;
};

// 4. Delete user
export const deleteUser = async (userId: string) => {
  const res = await API.delete(`/${userId}`);
  return res.data;
};

// 5. Send invite email
export const sendInvite = async (email: string) => {
  const res = await API.post("/invite", { email });
  return res.data;
};

// 6. Reset password (generate temp password or trigger email)
export const resetPassword = async (userId: string, newPassword = "temp1234") => {
  const res = await API.post(`/${userId}/reset-password`, { newPassword });
  return res.data;
};

// 7. Get login history
export const fetchLoginHistory = async (userId: string) => {
  const res = await API.get(`/${userId}/logs`);
  return res.data;
};
