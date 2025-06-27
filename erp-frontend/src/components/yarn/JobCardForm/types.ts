// Local types for Yarn Job Card steps
import { YarnProductionJobCard, YarnHourlyEfficiencyData, YarnUtilityReadings } from '../../../types/production';

export interface YarnJobCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobCard: YarnProductionJobCard) => void;
  editingJob: YarnProductionJobCard | null;
}

export type YarnJobCardData = Partial<YarnProductionJobCard>;

export interface StepProps {
  jobCard: YarnJobCardData;
  setJobCard: React.Dispatch<React.SetStateAction<YarnJobCardData>>;
  machines?: any[];
  calculatedTargets?: any;
  updateHourlyData?: (index: number, field: keyof YarnHourlyEfficiencyData, value: string | number) => void;
  updateUtilityReading?: (index: number, field: keyof YarnUtilityReadings, value: string | number) => void;
  addUtilityReading?: () => void;
  generateHourlySlots?: () => YarnHourlyEfficiencyData[];
}
