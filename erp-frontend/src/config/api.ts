// Raw value from env (may or may not include /api as comment suggests)
let API_BASE_URL = import.meta.env.VITE_API_URL as string | undefined;

// Fallback if missing
if (!API_BASE_URL || !API_BASE_URL.trim()) {
  API_BASE_URL = '/api';
}

API_BASE_URL = API_BASE_URL.trim();

// If base does NOT already end with /api (optionally trailing slash), append it
if (!/\/api\/?$/.test(API_BASE_URL)) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api';
}

// Normalize duplicate slashes except protocol
API_BASE_URL = API_BASE_URL.replace(/([^:]\/)(\/)+/g, '$1');

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
  }
};

export { API_BASE_URL };
