// ASU Unit 2 Types
export interface ASUDailyMachineData {
  id?: number;
  machine: number; // 1-21
  karigarName: string;
  reading8AM: number;
  reading8PM: number;
  machineHoursWorked: number; // Auto-calculated: 8PM - 8AM
  extraHours?: number; // Optional: for overtime/extra hours
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
  ideal12Hr: number; // 24hr production in kgs (keeping field name for DB compatibility)
  ideal85Percent: number; // 85% of 24hr production in kgs
  speed: number;
  weekStartDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ASUFormData {
  dailyMachineData: ASUDailyMachineData;
  productionEfficiency: ASUProductionEfficiency;
  mainsReading: ASUMainsReading;
  weeklyData: ASUWeeklyData;
}

export interface ASUFilters {
  machine?: number;
  karigarName?: string;
  dateFrom?: string;
  dateTo?: string;
  weekStartDate?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Paginated type aliases for easier use
export type ASUDailyMachinePaginated = PaginatedResponse<ASUDailyMachineData>;
export type ASUProductionEfficiencyPaginated = PaginatedResponse<ASUProductionEfficiency>;
export type ASUMainsReadingPaginated = PaginatedResponse<ASUMainsReading>;
export type ASUWeeklyPaginated = PaginatedResponse<ASUWeeklyData>;
  limit: number;
  totalPages: number;
}
