export interface MachineLite {
  id: number;
  yarnType?: string;
  isActive: boolean;
}

export interface YarnProductionEntryLite {
  date: string;
  yarnBreakdown: { [key: string]: number };
  totalProduction: number;
  machines: number;
  avgEfficiency: number;
  machineId?: number;
}

export interface YarnProductionSummaryRow {
  date: string;
  yarnTypes: { [key: string]: number };
  totalProductionForDate: number;
  machineCount: number;
  averageEfficiency: number;
}

export interface YarnSummaryStats {
  totalProduction: number;
  totalDays: number;
  yarnTypes: number;
  averageDaily: number;
}
