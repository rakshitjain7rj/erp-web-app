import React from 'react';
import { StepProps } from './types';
import { Machine } from '../../../types/production';

interface Props extends StepProps {
  machines: Machine[];
}

// Helper function to find a machine by ID
const findMachineById = (machines: Machine[], id?: number): Machine | undefined => {
  if (!id) return undefined;
  return machines.find(machine => machine.id === id);
};

const Step1_TheoreticalParams: React.FC<Props> = ({ jobCard, setJobCard, machines }) => {
  // Debug log to see what machines are available
  React.useEffect(() => {
    console.log('Machines available for selection:', machines);
    console.log('Current selected machineId:', jobCard.machineId);
    
    // Find the selected machine
    const selectedMachine = findMachineById(machines, jobCard.machineId);
    console.log('Selected machine object:', selectedMachine);
    
    // If we have a selected machine but theoreticalParams is not initialized,
    // initialize it with machine data
    if (selectedMachine && !jobCard.theoreticalParams) {
      setJobCard(prev => ({
        ...prev,
        theoreticalParams: {
          machineId: selectedMachine.id,
          efficiency: 85, // Default efficiency
          // Initialize other required fields
          numberOfThreads: 0,
          machineSpeed: 0,
          yarnWeight10Min: 0,
          ideal12HourTarget: 0,
          benchmarkEfficiency: 85,
          theoreticalHourlyRate: 0,
          lastUpdated: new Date().toISOString()
        }
      }));
    }
  }, [machines, jobCard.machineId, jobCard.theoreticalParams, setJobCard]);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Basic Information & Theoretical Parameters
      </h3>

      {/* Machine Selection */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Machine <span className="text-red-600">*</span>
        </label>
        <select
          name="machine-select"
          value={jobCard.machineId?.toString() || ''}
          onChange={e => {
            const selectedId = Number(e.target.value);
            setJobCard({ 
              ...jobCard, 
              machineId: selectedId,
              // Also update theoreticalParams to include machineId if it exists
              theoreticalParams: {
                ...jobCard.theoreticalParams || {},
                machineId: selectedId
              }
            });
            console.log(`Selected machine ID: ${selectedId}`);
          }}
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">-- Select a Machine --</option>
          {machines.map(machine => (
            <option key={machine.id} value={machine.id.toString()}>
              {machine.machineId} - {machine.name} {machine.location ? `(${machine.location})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Product Type */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Product Type <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={jobCard.productType || ''}
          onChange={e => setJobCard({ ...jobCard, productType: e.target.value })}
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Yarn"
        />
      </div>

      {/* Planned Quantity */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Planned Quantity (kg) <span className="text-red-600">*</span>
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={jobCard.quantity ?? ''}
          onChange={e => {
            const value = parseFloat(e.target.value);
            setJobCard({ 
              ...jobCard, 
              quantity: isNaN(value) ? undefined : value 
            });
          }}
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Enter quantity (min 0.01)"
          required
        />
      </div>

      {/* Theoretical Efficiency */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Theoretical Efficiency (%)</label>
        <input
          type="number"
          value={jobCard.theoreticalParams?.efficiency ?? ''}
          onChange={e =>
            setJobCard({
              ...jobCard,
              theoreticalParams: {
                ...jobCard.theoreticalParams,
                efficiency: Number(e.target.value)
              }
            })
          }
          className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="e.g. 95"
        />
      </div>
    </div>
  );
};

export default Step1_TheoreticalParams;
