import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const partyApi = axios.create({
  baseURL: `${API_BASE_URL}/parties`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
partyApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Party API functions
export const getAllPartiesSummary = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await partyApi.get(`/summary?${params.toString()}`);
  return response.data;
};

export const getPartyDetails = async (partyName: string) => {
  const response = await partyApi.get(`/${encodeURIComponent(partyName)}/details`);
  return response.data;
};

export const getAllPartyNames = async () => {
  const response = await partyApi.get('/names');
  return response.data;
};

export const getPartyStatistics = async () => {
  const response = await partyApi.get('/statistics');
  return response.data;
};

// For backward compatibility, create an alias
export const getDyeingSummaryByParty = getAllPartiesSummary;

export default {
  getAllPartiesSummary,
  getPartyDetails,
  getAllPartyNames,
  getPartyStatistics,
  getDyeingSummaryByParty, // backward compatibility
};
