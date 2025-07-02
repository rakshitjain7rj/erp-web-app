// types/asu.ts

// Core data interfaces
export interface ASUDailyMachineData {
  id?: number;
  machine: number; // 1–21
  karigarName: string;
  reading8AM: number;
  reading8PM: number;
  machineHoursWorked: number; // Auto-calculated: 8PM - 8AM
  extraHours?: number; // Optional: for overtime
  yarn: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ASUProductionEfficiency {
  id?: number;
  machine: number;
  kgsProduced: number;
  machineHoursWorking: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ASUMainsReading {
  id?: number;
  reading8AM: number;
  reading8PM: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ASUWeeklyData {
  id?: number;
  machine: number;
  numberOfThreads: number;
  tenMinWeight: number; // in grams
  ideal12Hr: number;     // 12hr production in kgs
  ideal85Percent: number; // 85% of 12hr production in kgs
  speed: number;
  weekStartDate: string;
  createdAt?: string;
  updatedAt?: string;
}

// Combined form data
export interface ASUFormData {
  dailyMachineData: ASUDailyMachineData;
  productionEfficiency: ASUProductionEfficiency;
  mainsReading: ASUMainsReading;
  weeklyData: ASUWeeklyData;
}

// Filtering utilities
export interface ASUFilters {
  machine?: number;
  karigarName?: string;
  dateFrom?: string;
  dateTo?: string;
  weekStartDate?: string;
  page?: number;
  limit?: number;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Paginated response structure
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Aliases for paginated types
export type ASUDailyMachinePaginated = PaginatedResponse<ASUDailyMachineData>;
export type ASUProductionEfficiencyPaginated = PaginatedResponse<ASUProductionEfficiency>;
export type ASUMainsReadingPaginated = PaginatedResponse<ASUMainsReading>;
export type ASUWeeklyPaginated = PaginatedResponse<ASUWeeklyData>;
