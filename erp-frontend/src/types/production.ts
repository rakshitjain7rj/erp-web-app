// Production Types for Job Cards System

export interface Machine {
  id: number;
  machineId: string;
  name: string;
  type: 'dyeing' | 'spinning' | 'weaving' | 'finishing' | 'other';
  location?: string;
  capacity?: number;
  status: 'active' | 'maintenance' | 'inactive';
  specifications?: Record<string, string | number>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionJob {
  id: number;
  jobId: string;
  productType: string;
  quantity: number;
  unit: string;
  machineId: number;
  workerId?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  partyName?: string;
  dyeingOrderId?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  machine?: Machine;
}

// Detailed Job Card Types
export interface TheoreticalEfficiency {
  targetEfficiencyPercent: number;
  standardProductionRate: number; // units per hour
  idealCycleTime: number; // minutes
  qualityTargetPercent: number;
}

export interface QualityTargets {
  colorMatchingTolerance: number;
  strengthRetention: number;
  shrinkageLimit: number;
  defectRate: number; // max allowed percentage
}

export interface ShiftAssignment {
  shiftNumber: number;
  startTime: string;
  endTime: string;
  operatorId?: number;
  operatorName?: string;
  supervisorId?: number;
  supervisorName?: string;
}

export interface UtilityReading {
  timestamp: string;
  steamPressure?: number;
  waterTemperature?: number;
  powerConsumption?: number;
  gasConsumption?: number;
  steamConsumption?: number;
  waterConsumption?: number;
}

export interface HourlyEfficiency {
  hour: number;
  actualProduction: number;
  targetProduction: number;
  efficiencyPercent: number;
  downtimeMinutes: number;
  qualityIssues: number;
  notes?: string;
}

export interface DetailedProductionJob extends ProductionJob {
  // Theoretical benchmarks
  theoreticalEfficiency?: TheoreticalEfficiency;
  
  // Quality specifications
  qualityTargets?: QualityTargets;
  
  // Shift planning
  shiftAssignments?: ShiftAssignment[];
  
  // Utility readings
  initialUtilityReadings?: UtilityReading;
  finalUtilityReadings?: UtilityReading;
  hourlyUtilityReadings?: UtilityReading[];
  
  // Hourly efficiency tracking
  hourlyEfficiency?: HourlyEfficiency[];
  
  // Overall performance metrics
  overallEfficiency?: number;
  totalDowntime?: number;
  qualityScore?: number;
  costPerUnit?: number;
  
  // Process parameters
  processParameters?: Record<string, string | number>;
  
  // Quality control data
  qualityControlData?: Record<string, string | number>;
}

// Form types for job creation
export interface ProductionJobFormData {
  // Basic job info
  productName: string;
  productType: string;
  quantity: number;
  unit: string;
  machineId: number;
  assignedTo?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  estimatedHours?: number;
  partyName?: string;
  dyeingOrderId?: number;
  notes?: string;
  
  // Detailed job card data
  theoreticalEfficiency?: TheoreticalEfficiency;
  qualityTargets?: QualityTargets;
  shiftAssignments?: ShiftAssignment[];
  initialUtilityReadings?: UtilityReading;
  processParameters?: Record<string, string | number>;
}

export interface ProductionJobFilters {
  status?: string;
  machineId?: number;
  priority?: string;
  startDate?: string;
  endDate?: string;
  partyName?: string;
  search?: string;
}

export interface ProductionJobStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  pendingJobs: number;
  averageEfficiency: number;
  totalDowntime: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Yarn Manufacturing Specific Types

export interface YarnHourlyEfficiencyData {
  hour: string; // "08:00", "09:00", etc.
  targetProduction: number; // kg
  actualProduction: number; // kg
  efficiency: number; // percentage
  downtime: number; // minutes
  downtimeReason?: string;
  operatorId?: string;
  operatorName?: string;
  qualityIssues?: string;
  machineSpeed?: number; // RPM
  yarnBreaks?: number;
  notes?: string;
}

export interface YarnUtilityReadings {
  timestamp: string;
  electricity: number; // kWh
  water: number; // liters
  steam: number; // kg
  gas?: number; // cubic meters
  readingType: 'start' | 'end' | 'hourly';
  meterReading?: string;
  costPerUnit?: number;
}

export interface YarnTheoreticalParameters {
  machineId: number;
  numberOfThreads: number;
  machineSpeed: number; // RPM or m/min
  yarnWeight10Min: number; // kg per 10 minutes
  ideal12HourTarget: number; // kg for 12 hours
  benchmarkEfficiency: number; // default 85%
  theoreticalHourlyRate: number; // kg/hour
  lastUpdated: string;
  updatedBy?: string;
}

export interface YarnQualityParameters {
  tensileStrength?: number;
  yarnCount?: number;
  twist?: number;
  moisture?: number;
  elongation?: number;
  irregularity?: number;
  targetGrade: 'A' | 'B' | 'C';
  actualGrade?: 'A' | 'B' | 'C';
  defectRate?: number;
  colorFastness?: number;
  testResults?: Record<string, number>;
}

export interface YarnShiftData {
  shift: 'A' | 'B' | 'C';
  shiftLabel?: string; // "Morning (6AM-2PM)"
  supervisor: string;
  supervisorId?: string;
  operators: string[];
  operatorIds?: string[];
  startTime: string;
  endTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  shiftNotes?: string;
}

export interface YarnPerformanceAnalysis {
  efficiencyVariance: number; // actual vs theoretical
  productionVariance: number; // actual vs target production
  qualityVariance: number; // actual vs target quality
  overallPerformance: number; // combined score
  utilityEfficiency: number; // cost per kg
  downtimePercentage: number;
  recommendations?: string[];
}

// Enhanced Production Job Card for Yarn Manufacturing
export interface YarnProductionJobCard extends ProductionJob {
  // Daily data collection
  hourlyEfficiency: YarnHourlyEfficiencyData[];
  utilityReadings: YarnUtilityReadings[];
  qualityData: YarnQualityParameters;
  
  // Weekly theoretical parameters
  theoreticalParams: YarnTheoreticalParameters;
  
  // Analysis results
  actualVsTheoretical: YarnPerformanceAnalysis;
  
  // Shift data
  shiftData: YarnShiftData;
  
  // Production summary
  totalActualProduction: number;
  totalTargetProduction: number;
  totalDowntime: number;
  averageEfficiency: number;
  totalUtilityCost: number;
  
  // Quality summary
  qualityScore: number;
  defectCount: number;
  reworkRequired: boolean;
  
  // Completion data
  completedBy?: string;
  supervisorApproval?: boolean;
  approvedBy?: string;
  approvalDate?: string;
}
