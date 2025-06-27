import React, { useState, useCallback, useEffect } from 'react';
import Step1_TheoreticalParams from './Step1_TheoreticalParams';
import Step2_HourlyEfficiency from './Step2_HourlyEfficiency';
import Step3_ShiftSummary from './Step3_ShiftSummary';
import Step4_UtilitiesAndQuality from './Step4_UtilitiesAndQuality';
import Step5_ShiftPerformance from './Step5_ShiftPerformance';
import StepFooter from './StepFooter';
import StepIndicator from './StepIndicator';
import { YarnJobCardFormProps, YarnJobCardData } from './types';
import { YarnProductionJobCard, YarnHourlyEfficiencyData, Machine } from '../../../types/production';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, title: 'Basic Info' },
  { id: 2, title: 'Hourly Efficiency' },
  { id: 3, title: 'Shift Summary' },
  { id: 4, title: 'Utilities & Quality' },
  { id: 5, title: 'Shift & Performance' }
];

const YarnJobCardForm: React.FC<YarnJobCardFormProps> = ({ isOpen, onClose, onSave, editingJob }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [jobCard, setJobCard] = useState<YarnJobCardData>(() => {
    // Initialize with default values for critical nested objects
    const defaultData: YarnJobCardData = {
      ...editingJob || {},
      // Ensure shift data is initialized with proper structure
      shiftData: {
        ...(editingJob?.shiftData || {}),
        shift: editingJob?.shiftData?.shift || 'A',
        shiftLabel: editingJob?.shiftData?.shiftLabel || 'Morning (6AM-2PM)',
        operators: Array.isArray(editingJob?.shiftData?.operators) ? editingJob.shiftData.operators : [],
        supervisor: editingJob?.shiftData?.supervisor || ''
      }
    };
    return defaultData;
  });
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Define fetchMachines function
  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      
      // Using API url directly since productionApi structure might differ
      const response = await fetch('http://localhost:5000/api/production/machines');
      if (!response.ok) {
        throw new Error('Failed to fetch machines');
      }
      const result = await response.json();
      
      // Check API response structure - it might be wrapped in a data property
      const machinesArray = Array.isArray(result) ? result : 
                        (result.data && Array.isArray(result.data)) ? result.data : [];
      
      console.log('API response:', result);
      console.log('Fetched machines array:', machinesArray);
      
      // In production, we wouldn't use mock data, but would show users an appropriate message
      if (machinesArray.length === 0) {
        console.warn('No machines found in API response');
        // Let the component render with empty machines array
        // The warning UI will be displayed to inform the user
      }
      
      // Filter for yarn/spinning machines if needed
      const yarnMachines = machinesArray.filter((machine: Machine) => 
        machine && machine.type === 'spinning'
      );
      
      setMachines(yarnMachines.length ? yarnMachines : machinesArray);
    } catch (error) {
      console.error("Failed to fetch machines:", error);
      const errorMsg = "Could not load machines. Please try again or contact support if the issue persists.";
      toast.error(errorMsg);
      setApiError(errorMsg);
      
      // For critical error tracking in production
      // We would use a logging service in production
      // Example: if (import.meta.env.PROD) { Sentry.captureException(error); }
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch machines on component mount
  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  // Generate time slots from 6 AM to 6 PM
  const generateHourlySlots = useCallback(() => {
    const slots: YarnHourlyEfficiencyData[] = [];
    // Default target production per hour (can be calculated from job parameters)
    const defaultTarget = 10; // Example value, should be calculated from machine parameters
    
    // Start from 6 AM (6) to 6 PM (18)
    for (let hour = 6; hour < 18; hour++) {
      const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({
        hour: formattedHour,
        targetProduction: defaultTarget,
        actualProduction: 0,
        efficiency: 0,
        downtime: 0,
        operatorName: '',
        machineSpeed: 0,
        yarnBreaks: 0,
        notes: ''
      });
    }
    return slots;
  }, []);

  // Update hourly data and recalculate efficiency
  const updateHourlyData = useCallback((index: number, field: keyof YarnHourlyEfficiencyData, value: string | number) => {
    setJobCard(prev => {
      const hourlyEfficiency = [...(prev.hourlyEfficiency || [])];
      
      // Create a copy of the current hour data
      const hourData = { ...hourlyEfficiency[index] } as YarnHourlyEfficiencyData;
      
      // Update the specified field with proper type handling
      if (field === 'hour' || field === 'operatorName' || field === 'notes' || field === 'downtimeReason') {
        hourData[field] = value as string;
      } else if (field === 'targetProduction' || field === 'actualProduction' || 
                field === 'efficiency' || field === 'downtime' || 
                field === 'machineSpeed' || field === 'yarnBreaks') {
        hourData[field] = Number(value);
      }
      
      // Recalculate efficiency if target or actual production changes
      if (field === 'targetProduction' || field === 'actualProduction') {
        const target = Number(hourData.targetProduction);
        const actual = Number(hourData.actualProduction);
        hourData.efficiency = target > 0 ? (actual / target) * 100 : 0;
      }
      
      // Update the hour data in the array
      hourlyEfficiency[index] = hourData;
      
      // Return updated job card
      return {
        ...prev,
        hourlyEfficiency
      };
    });
  }, []);
  // End of updateHourlyData function

  // Add utility reading
  const addUtilityReading = useCallback(() => {
    setJobCard(prev => ({
      ...prev,
      utilityReadings: [
        ...(prev.utilityReadings || []),
        {
          timestamp: new Date().toISOString(),
          electricity: 0, 
          water: 0,
          steam: 0,
          gas: 0,
          readingType: 'hourly'
        }
      ]
    }));
  }, []);

  // Update utility reading
  const updateUtilityReading = useCallback((index: number, field: string, value: string | number) => {
    setJobCard(prev => {
      const utilityReadings = [...(prev.utilityReadings || [])];
      utilityReadings[index] = { ...utilityReadings[index], [field]: value };
      return { ...prev, utilityReadings };
    });
  }, []);

  // Render the appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {loading && (
              <div className="p-2 mb-4 text-blue-700 rounded-md bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300">
                Loading machines...
              </div>
            )}
            {!loading && apiError && (
              <div className="p-4 mb-4 text-red-700 rounded-md bg-red-50 dark:bg-red-900/30 dark:text-red-300">
                <p><strong>Error:</strong> {apiError}</p>
                <p className="mt-2 text-sm">You can still try to create the job card, but machine selection may not work properly.</p>
                <button 
                  onClick={fetchMachines}
                  className="px-4 py-2 mt-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Retry Loading Machines
                </button>
              </div>
            )}
            {!loading && !apiError && machines.length === 0 && (
              <div className="p-4 mb-4 text-yellow-700 rounded-md bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300">
                No machines found. Please make sure machines are configured in the system.
              </div>
            )}
            <Step1_TheoreticalParams jobCard={jobCard} setJobCard={setJobCard} machines={machines} />
          </>
        );
      case 2:
        return <Step2_HourlyEfficiency 
                 jobCard={jobCard} 
                 setJobCard={setJobCard} 
                 updateHourlyData={updateHourlyData} 
                 generateHourlySlots={generateHourlySlots} 
               />;
      case 3:
        return <Step3_ShiftSummary jobCard={jobCard} setJobCard={setJobCard} />;
      case 4:
        return <Step4_UtilitiesAndQuality 
                 jobCard={jobCard} 
                 setJobCard={setJobCard} 
                 updateUtilityReading={updateUtilityReading} 
                 addUtilityReading={addUtilityReading} 
               />;
      case 5:
        return <Step5_ShiftPerformance jobCard={jobCard} setJobCard={setJobCard} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 text-white bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700">
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {editingJob ? 'Edit Yarn Production Job Card' : 'Create Yarn Production Job Card'}
              </h2>
              <p className="mt-1 text-purple-100">Comprehensive yarn manufacturing job management</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 transition-colors rounded-lg hover:bg-white/20 dark:hover:bg-white/10"
            >
              X
            </button>
          </div>
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>
        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-white dark:bg-gray-800">
          {renderStep()}
        </div>
        {/* Footer */}
        <StepFooter
          currentStep={currentStep}
          stepsLength={steps.length}
          onPrev={() => setCurrentStep(currentStep - 1)}
          onNext={() => setCurrentStep(currentStep + 1)}
          onSave={() => {
            // Validate machine selection
            if (!jobCard.machineId || jobCard.machineId === 0) {
              toast.error("Machine selection is required. Please select a machine before saving the job.");
              setCurrentStep(1); // Redirect to step 1
              
              // Add focus to the machine dropdown when we return to step 1
              setTimeout(() => {
                const machineSelect = document.querySelector('select[name="machine-select"]');
                if (machineSelect) {
                  (machineSelect as HTMLSelectElement).focus();
                }
              }, 100);
              return;
            }
            
            // Validate theoretical parameters
            if (!jobCard.theoreticalParams) {
              toast.error("Theoretical parameters are missing. Please complete the form.");
              setCurrentStep(1);
              return;
            }
            
            // Validate required fields
            if (!jobCard.quantity || jobCard.quantity < 0.01) {
              toast.error("Please enter a valid quantity (minimum 0.01).");
              setCurrentStep(1);
              return;
            }
            
            // Validate product type
            if (!jobCard.productType) {
              toast.error("Please enter a yarn type/product name.");
              setCurrentStep(1);
              return;
            }

            // Update last updated timestamp and ensure required fields have valid values
            const updatedJobCard = {
              ...jobCard,
              // Ensure critical fields are properly set
              quantity: parseFloat(String(jobCard.quantity)), // Explicitly convert to number
              unit: jobCard.unit || 'kg',
              priority: jobCard.priority || 'medium',
              theoreticalParams: {
                ...jobCard.theoreticalParams,
                lastUpdated: new Date().toISOString()
              }
            };
            
            // Final validation
            console.log("Job data being submitted:", updatedJobCard);
            
            // Proceed with saving if validation passes
            onSave(updatedJobCard as YarnProductionJobCard);
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default YarnJobCardForm;
