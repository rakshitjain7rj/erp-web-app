// Centralized axios HTTP client
// Base URL comes from Vite env: VITE_API_URL (must already include /api)
// All API modules should import { apiClient } from './httpClient';
import axios, { AxiosError, AxiosInstance } from 'axios';

// Resolve base URL with safety:
// 1. Use VITE_API_URL if provided.
// 2. If missing, fall back to '/api' so relative calls still hit backend (prevents 404 /auth/*).
// 3. Normalize to ensure it ends with /api (some deploys may set just domain root).
const rawEnv = import.meta.env.VITE_API_URL as string | undefined;
let resolvedBase = rawEnv && rawEnv.trim() ? rawEnv.trim() : '/api';

// If it doesn't already include /api segment at the end, append it.
if (!/\/api\/?$/.test(resolvedBase)) {
  resolvedBase = resolvedBase.replace(/\/$/, '') + '/api';
}

// Basic normalization (remove duplicate slashes except protocol)
resolvedBase = resolvedBase.replace(/([^:]\/)\/+/g, '$1/');

if (!rawEnv) {
  // eslint-disable-next-line no-console
  console.warn(`[httpClient] VITE_API_URL not set. Using fallback baseURL: ${resolvedBase}`);
} else {
  // eslint-disable-next-line no-console
  console.log('[httpClient] Using API base URL:', resolvedBase);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: resolvedBase,
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
