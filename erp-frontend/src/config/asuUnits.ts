// src/config/asuUnits.ts
// Central configuration for ASU Units so components can stay generic.

export interface ASUUnitConfig {
  key: 'unit1' | 'unit2';
  label: string;
  productionEndpoint: string; // endpoint for production entries CRUD
  machinesEndpoint: string;   // endpoint for machines list
  hasMainsReadings: boolean;  // whether to show day/night mains reading inputs
  hasWorkerName: boolean;     // whether to show worker name inputs
}

export const ASU_UNITS: Record<'unit1'|'unit2', ASUUnitConfig> = {
  unit1: {
    key: 'unit1',
    label: 'ASU Unit 1',
    productionEndpoint: '/asu-unit1/production-entries',
    machinesEndpoint: '/asu-unit1/machines',
    hasMainsReadings: false,
    hasWorkerName: false,
  },
  unit2: {
    key: 'unit2',
    label: 'ASU Unit 2',
    productionEndpoint: '/asu-unit2/production-entries',
    machinesEndpoint: '/asu-unit2/machines',
    hasMainsReadings: true,
    hasWorkerName: true,
  }
};
