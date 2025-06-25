import axios from "axios";
import {
  ProductionJob,
  CreateProductionJobRequest,
  UpdateProductionJobRequest,
  ProductionDashboard,
  Machine,
  CreateMachineRequest,
  CreateDetailedJobRequest
} from "../types/production";

const API_BASE_URL = "http://localhost:5000/api/production";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== PRODUCTION JOB CRUD ====================
export const getAllProductionJobs = async (filters?: {
  status?: string;
  machineId?: number;
  assignedTo?: number;
  priority?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ jobs: ProductionJob[]; total: number; totalPages: number }> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/?${params.toString()}`);
  return response.data.data || response.data;
};

export const getProductionJobById = async (id: number): Promise<ProductionJob> => {
  const response = await api.get(`/${id}`);
  return response.data.data || response.data;
};

export const createProductionJob = async (data: CreateProductionJobRequest): Promise<ProductionJob> => {
  const response = await api.post('/', data);
  return response.data.data || response.data;
};

export const createDetailedProductionJob = async (data: CreateDetailedJobRequest): Promise<ProductionJob> => {
  const response = await api.post('/', data);
  return response.data.data || response.data;
};

export const updateProductionJob = async (
  id: number,
  data: UpdateProductionJobRequest
): Promise<ProductionJob> => {
  const response = await api.put(`/${id}`, data);
  return response.data.data || response.data;
};

export const updateJobStatus = async (
  id: number,
  status: string,
  notes?: string
): Promise<ProductionJob> => {
  const response = await api.patch(`/${id}/status`, { status, notes });
  return response.data.data || response.data;
};

export const deleteProductionJob = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
};

// ==================== DASHBOARD & ANALYTICS ====================
export const getProductionDashboard = async (): Promise<ProductionDashboard> => {
  const response = await api.get('/dashboard');
  return response.data.data || response.data;
};

export const getJobsByParty = async (partyName: string): Promise<ProductionJob[]> => {
  const response = await api.get(`/party/${encodeURIComponent(partyName)}`);
  return response.data.data || response.data;
};

// ==================== INTEGRATION ====================
export const createJobFromDyeingOrder = async (
  dyeingOrderId: number,
  jobData: Partial<CreateProductionJobRequest>
): Promise<ProductionJob> => {
  const response = await api.post(`/from-dyeing/${dyeingOrderId}`, jobData);
  return response.data.data || response.data;
};

// ==================== MACHINES ====================
export const getMachines = async (): Promise<Machine[]> => {
  const response = await api.get('/machines');
  return response.data.data || response.data;
};

export const createMachine = async (data: CreateMachineRequest): Promise<Machine> => {
  const response = await api.post('/machines', data);
  return response.data.data || response.data;
};

// ==================== UTILITIES ====================
export const getJobStatus = (job: ProductionJob): string => {
  return job.status;
};

export const isJobOverdue = (job: ProductionJob): boolean => {
  if (job.status === 'completed' || job.status === 'cancelled') return false;
  if (!job.dueDate) return false;
  
  const today = new Date();
  const dueDate = new Date(job.dueDate);
  return today > dueDate;
};

export const getJobPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800';
  }
};

export const getJobStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'on_hold': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800';
  }
};
