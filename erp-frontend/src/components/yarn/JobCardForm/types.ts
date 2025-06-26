// Local types for Yarn Job Card steps
import { YarnProductionJobCard, YarnHourlyEfficiencyData, YarnUtilityReadings } from '../../../types/production';

export interface StepProps {
  jobCard: Partial<YarnProductionJobCard>;
  setJobCard: React.Dispatch<React.SetStateAction<Partial<YarnProductionJobCard>>>;
  machines?: any[];
  calculatedTargets?: any;
  updateHourlyData?: (index: number, field: keyof YarnHourlyEfficiencyData, value: string | number) => void;
  updateUtilityReading?: (index: number, field: keyof YarnUtilityReadings, value: string | number) => void;
  addUtilityReading?: () => void;
  generateHourlySlots?: () => YarnHourlyEfficiencyData[];
}
