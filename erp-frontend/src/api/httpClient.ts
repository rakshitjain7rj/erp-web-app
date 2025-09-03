// Centralized axios HTTP client
// Base URL comes from Vite env: VITE_API_URL (must already include /api)
// All API modules should import { apiClient } from './httpClient';
import axios, { AxiosError, AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_URL; // per requirement includes /api

if (!baseURL) {
  // Fail fast so misconfiguration is obvious in development
  // eslint-disable-next-line no-console
  console.warn('[httpClient] VITE_API_URL is not defined. API calls will likely fail.');
}

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach auth token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unified error handling / logging (non-invasive)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // eslint-disable-next-line no-console
      console.error('[API Error]', error.response.status, error.response.data);
      if (error.response.status === 401) {
        // Token likely invalid/expired
        localStorage.removeItem('token');
      }
    } else if (error.request) {
      // eslint-disable-next-line no-console
      console.error('[API Error] No response received');
    } else {
      // eslint-disable-next-line no-console
      console.error('[API Error] Request setup failed', error.message);
    }
    return Promise.reject(error);
  }
);

// Re-export helpful axios utilities
export { AxiosError } from 'axios';
export const isAxiosError = axios.isAxiosError;

// Helper to build paths safely (avoids double slashes)
export const apiPath = (...parts: string[]) =>
  parts
    .filter(Boolean)
    .map(p => p.replace(/(^\/|\/$)/g, ''))
    .join('/')
    .replace(/\/+/g, '/');

export default apiClient;
