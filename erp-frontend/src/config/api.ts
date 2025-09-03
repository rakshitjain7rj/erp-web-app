const API_BASE_URL = import.meta.env.VITE_API_URL; // Must include /api

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
  }
};

export { API_BASE_URL };
