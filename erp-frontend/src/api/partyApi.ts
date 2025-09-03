import apiClient from './httpClient';

// Use a scoped instance for parties to keep relative path clean
const partyApi = apiClient; // baseURL already includes /api
const basePath = '/parties';

// Party API functions
export const getAllPartiesSummary = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await partyApi.get(`${basePath}/summary?${params.toString()}`);
  return response.data;
};

export const getArchivedPartiesSummary = async () => {
  const response = await partyApi.get(`${basePath}/archived/summary`);
  return response.data;
};

export const getPartyDetails = async (partyName: string) => {
  const response = await partyApi.get(`${basePath}/${encodeURIComponent(partyName)}/details`);
  return response.data;
};

export const getAllPartyNames = async () => {
  const response = await partyApi.get(`${basePath}/names`);
  return response.data;
};

export const getPartyStatistics = async () => {
  const response = await partyApi.get(`${basePath}/statistics`);
  return response.data;
};

export const createParty = async (partyData: {
  name: string;
  dyeingFirm?: string;
  address?: string;
  contact?: string;
}) => {
  const response = await partyApi.post(`${basePath}/`, partyData);
  return response.data;
};

export const updateParty = async (partyName: string, partyData: {
  name?: string;
  dyeingFirm?: string;
  address?: string;
  contact?: string;
  totalOrders?: number;
  totalYarn?: number;
  pendingYarn?: number;
  reprocessingYarn?: number;
  arrivedYarn?: number;
}) => {
  const response = await partyApi.put(`${basePath}/${encodeURIComponent(partyName)}`, partyData);
  return response.data;
};

export const deleteParty = async (partyName: string) => {
  const response = await partyApi.delete(`${basePath}/${encodeURIComponent(partyName)}`);
  return response.data;
};

export const archiveParty = async (partyName: string) => {
  const response = await partyApi.post(`${basePath}/${encodeURIComponent(partyName)}/archive`);
  return response.data;
};

export const restoreParty = async (partyName: string) => {
  const response = await partyApi.post(`${basePath}/${encodeURIComponent(partyName)}/restore`);
  return response.data;
};

export const downloadPartyAsJSON = async (partyName: string) => {
  const response = await partyApi.get(`${basePath}/${encodeURIComponent(partyName)}/export`, {
    responseType: 'blob'
  });
  return response.data;
};

export const downloadPartyAsCSV = async (partyName: string) => {
  const response = await partyApi.get(`${basePath}/${encodeURIComponent(partyName)}/export/csv`, {
    responseType: 'blob'
  });
  return response.data;
};

export const deletePermanently = async (partyName: string) => {
  const response = await partyApi.delete(`${basePath}/${encodeURIComponent(partyName)}/permanent`);
  return response.data;
};

// For backward compatibility, create an alias
export const getDyeingSummaryByParty = getAllPartiesSummary;

export default {
  getAllPartiesSummary,
  getArchivedPartiesSummary,
  getPartyDetails,
  getAllPartyNames,
  getPartyStatistics,
  createParty,
  updateParty,
  deleteParty,
  archiveParty,
  restoreParty,
  downloadPartyAsJSON,
  downloadPartyAsCSV,
  deletePermanently,
  getDyeingSummaryByParty, // backward compatibility
};
