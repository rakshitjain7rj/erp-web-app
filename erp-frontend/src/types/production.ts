// types/production.ts

export interface ProductionJob {
  id: number;
  jobId: string; // Auto-generated unique job ID
  productName: string;
  quantity: number;
  unit: string;
  machineId?: number;
  machineName?: string;
  assignedTo?: number;
  assignedToName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
  qualityRating?: number; // 1-5 scale
  partyName?: string; // Link to Party Master
  dyeingOrderId?: number; // Link to Dyeing Order
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductionJobRequest {
  productName: string;
  quantity: number;
  unit: string;
  machineId?: number;
  assignedTo?: number;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedHours?: number;
  notes?: string;
  partyName?: string;
  dyeingOrderId?: number;
}

export interface UpdateProductionJobRequest {
  productName?: string;
  quantity?: number;
  unit?: string;
  machineId?: number;
  assignedTo?: number;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
  qualityRating?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
}

export interface ProductionDashboard {
  totalJobs: number;
  statusCounts: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    on_hold: number;
  };
  machineUtilization: Array<{
    machineId: number;
    machineName: string;
    activeJobs: number;
    utilization: number; // percentage
  }>;
  workerProductivity: Array<{
    userId: number;
    userName: string;
    activeJobs: number;
    completedJobs: number;
    avgQualityRating: number;
  }>;
  overdueJobs: ProductionJob[];
  recentCompletions: ProductionJob[];
  upcomingDeadlines: ProductionJob[];
}

export interface Machine {
  id: number;
  machineId: string;
  machineName: string;
  machineType: string;
  status: 'Active' | 'Maintenance' | 'Breakdown' | 'Idle';
  capacity?: number;
  capacityUnit?: string;
  location?: string;
  operatorId?: number;
  operatorName?: string;
  manufacturingDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  specifications?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMachineRequest {
  name: string;
  type: string;
  status?: 'Active' | 'Maintenance' | 'Breakdown' | 'Idle';
  capacity?: number;
  location?: string;
  operatorId?: number;
}

// For dropdown selections and filters
export interface ProductionFilter {
  status?: string;
  machineId?: number;
  assignedTo?: number;
  priority?: string;
  startDate?: string;
  endDate?: string;
  partyName?: string;
}

// For integration with other modules
export interface JobFromDyeingOrder {
  dyeingOrderId: number;
  dyeingOrder: {
    id: number;
    yarnType: string;
    quantity: number;
    shade: string;
    count: string;
    lot: string;
    partyName: string;
  };
  suggestedProductName: string;
  suggestedQuantity: number;
}

// Extended types for comprehensive production job card system

// Hourly efficiency tracking
export interface HourlyEfficiency {
  hour: number; // 1-24 or specific time slots
  machineEfficiency: number; // percentage
  actualProduction: number; // kg
  workingMinutes: number; // actual working time in minutes
  downtime?: number; // minutes of downtime
  downtimeReason?: string;
}

// Daily utility readings
export interface DailyUtilityReading {
  readingTime: '08:00' | '20:00'; // 8:00 AM or 8:00 PM
  electricityReading: number;
  gasReading?: number;
  waterReading?: number;
  steamReading?: number;
}

// Theoretical machine efficiency parameters
export interface TheoreticalEfficiency {
  numberOfThreads: number;
  yarnWeight10Min: number; // calculated yarn weight in 10 minutes (kg)
  idealPerformance12Hours: number; // ideal production target for 12 hours (kg)
  benchmarkEfficiency: number; // benchmark percentage (default 85%)
  machineSpeed: number; // RPM or meters/min
  theoreticalCapacity: number; // theoretical maximum capacity per hour
}

// Comprehensive production job card
export interface DetailedProductionJob extends ProductionJob {
  // Efficiency tracking
  hourlyEfficiency?: HourlyEfficiency[];
  dailyUtilityReadings?: DailyUtilityReading[];
  theoreticalEfficiency?: TheoreticalEfficiency;
  
  // Performance metrics
  actualEfficiency?: number; // calculated actual efficiency %
  efficiencyVariance?: number; // difference from benchmark
  totalDowntime?: number; // total downtime in minutes
  
  // Quality metrics
  qualityParameters?: {
    yarnCount: string;
    strength: number;
    elongation: number;
    unevenness: number;
    hairiness: number;
  };
  
  // Shift-wise data
  shiftData?: {
    shift: 'A' | 'B' | 'C';
    supervisor: string;
    operators: string[];
    shiftProduction: number;
    shiftEfficiency: number;
  }[];
}

// Form data structure for creating detailed jobs
export interface CreateDetailedJobRequest extends CreateProductionJobRequest {
  // Machine specifications
  theoreticalEfficiency: Omit<TheoreticalEfficiency, 'theoreticalCapacity'>;
  
  // Initial readings
  initialUtilityReadings?: Partial<DailyUtilityReading>;
  
  // Quality targets
  qualityTargets?: {
    targetYarnCount: string;
    minStrength: number;
    maxUnevenness: number;
    maxHairiness: number;
  };
  
  // Shift assignments
  shiftAssignments?: {
    shift: 'A' | 'B' | 'C';
    supervisor?: string;
    operators?: string[];
  }[];
}
