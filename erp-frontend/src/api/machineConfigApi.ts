import apiClient from './httpClient';
const api = apiClient; // baseURL already set; endpoints below are root-relative

// Types for machine configuration
export interface MachineConfiguration {
  id: number;
  machineId: number;
  count: number;
  spindleCount: number;
  yarnType: string;
  speed: number;
  productionAt100: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMachineConfigurationData {
  count?: number;
  spindleCount: number;
  yarnType: string;
  speed?: number;
  efficiencyAt100Percent: number;
  startDate?: string;
  saveHistory?: boolean; // Flag to indicate if we should save configuration history
}

export interface UpdateMachineConfigurationData {
  count?: number;
  spindleCount?: number;
  yarnType?: string;
  speed?: number;
  efficiencyAt100Percent?: number;
  startDate?: string;
  endDate?: string | null;
}

// API client for machine configurations
export const machineConfigApi = {
  // Get all configurations for a machine
  getMachineConfigurations: async (machineId: number): Promise<MachineConfiguration[]> => {
    try {
      const response = await api.get(`/machines/${machineId}/configurations`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching machine configurations:', error);
      throw error;
    }
  },

  // Create a new configuration for a machine
  createMachineConfiguration: async (machineId: number, data: CreateMachineConfigurationData): Promise<MachineConfiguration> => {
    try {
      const response = await api.post(`/machines/${machineId}/configurations`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating machine configuration:', error);
      throw error;
    }
  },

  // Update an existing configuration
  updateMachineConfiguration: async (configId: number, data: UpdateMachineConfigurationData): Promise<MachineConfiguration> => {
    try {
      const response = await api.put(`/machine-configurations/${configId}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating machine configuration:', error);
      throw error;
    }
  },

  // Delete a configuration
  deleteMachineConfiguration: async (configId: number): Promise<void> => {
    try {
      await api.delete(`/machine-configurations/${configId}`);
    } catch (error) {
      console.error('Error deleting machine configuration:', error);
      throw error;
    }
  },

  // Helper function to calculate duration in days between two dates
  calculateDurationInDays: (startDate: string, endDate: string | null): number => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Return the difference in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Helper function to format a duration in days into readable text
  formatDuration: (days: number): string => {
    if (days < 7) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      return `${weeks} week${weeks !== 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return `${months} month${months !== 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`;
    } else {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      const months = Math.floor(remainingDays / 30);
      return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} month${months !== 1 ? 's' : ''}` : ''}`;
    }
  }
};
