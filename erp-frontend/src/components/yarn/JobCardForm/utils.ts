// Calculation and memo helpers for Yarn Job Card
import { YarnProductionJobCard } from '../../../types/production';

export function calculateMetrics(jobCard: Partial<YarnProductionJobCard>) {
  if (!jobCard.hourlyEfficiency || jobCard.hourlyEfficiency.length === 0) return jobCard;

  // Calculate totals and averages from hourly data
  const totalTarget = jobCard.hourlyEfficiency.reduce((sum, hour) => sum + (hour.targetProduction || 0), 0);
  const totalActual = jobCard.hourlyEfficiency.reduce((sum, hour) => sum + (hour.actualProduction || 0), 0);
  const totalDowntime = jobCard.hourlyEfficiency.reduce((sum, hour) => sum + (hour.downtime || 0), 0);
  const totalBreaks = jobCard.hourlyEfficiency.reduce((sum, hour) => sum + (hour.yarnBreaks || 0), 0);
  
  // Calculate overall efficiency
  const overallEfficiency = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  // Return updated job card with calculated metrics
  return {
    ...jobCard,
    totalTargetProduction: totalTarget,
    totalActualProduction: totalActual,
    totalDowntime: totalDowntime,
    totalYarnBreaks: totalBreaks,
    overallEfficiency: overallEfficiency
  };
}

export function updateCalculatedTargets(jobCard: Partial<YarnProductionJobCard>) {
  if (!jobCard.theoreticalParams || !jobCard.machineId) return jobCard;

  const {
    machineSpeed,
    numberOfThreads,
    benchmarkEfficiency
  } = jobCard.theoreticalParams || {};

  // Calculate theoretical production target if all parameters exist
  if (machineSpeed && numberOfThreads && benchmarkEfficiency) {
    // Simple formula: (machineSpeed * numberOfThreads * benchmarkEfficiency) / 1000
    const theoreticalHourlyRate = 
      (machineSpeed * numberOfThreads * benchmarkEfficiency) / 1000;
    
    return {
      ...jobCard,
      theoreticalHourlyRate
    };
  }
  
  return jobCard;
}

// Generate efficiency percentage from target and actual
export function calculateEfficiency(target: number, actual: number): number {
  return target > 0 ? (actual / target) * 100 : 0;
}
