import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Plus, Trash2, Clock, Settings, Users, Activity, Calculator } from 'lucide-react';
import { machineApi } from '../api/productionApi';
import { 
  YarnProductionJobCard, 
  YarnHourlyEfficiencyData, 
  YarnUtilityReadings,
  Machine
} from '../types/production';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobCard: YarnProductionJobCard) => void;
  editingJob?: YarnProductionJobCard | null;
}

const YarnJobCardForm: React.FC<Props> = ({ isOpen, onClose, onSave, editingJob }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [machines, setMachines] = useState<Machine[]>([]);
  
  // Main job data
  const [jobCard, setJobCard] = useState<Partial<YarnProductionJobCard>>({
    productType: 'Cotton Yarn',
    quantity: 0,
    unit: 'kg',
    priority: 'medium',
    status: 'pending',
    machineId: 0,
    workerId: 0,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    hourlyEfficiency: [],
    utilityReadings: [
      { timestamp: '08:00', readingType: 'start' as const, electricity: 0, steam: 0, water: 0 },
      { timestamp: '20:00', readingType: 'end' as const, electricity: 0, steam: 0, water: 0 }
    ],
    qualityData: {
      targetGrade: 'A' as const,
      defectRate: 0
    },
    theoreticalParams: {
      machineId: 0,
      numberOfThreads: 0,
      machineSpeed: 0,
      yarnWeight10Min: 0,
      ideal12HourTarget: 0,
      benchmarkEfficiency: 85,
      theoreticalHourlyRate: 0,
      lastUpdated: new Date().toISOString()
    },
    shiftData: {
      shift: 'A' as const,
      shiftLabel: 'Day Shift (6AM-6PM)',
      supervisor: '',
      operators: [],
      startTime: '06:00',
      endTime: '18:00'
    }
  });

  const [calculatedTargets, setCalculatedTargets] = useState({
    hourlyTarget: 0,
    efficiency85Target: 0,
    targetPerThread: 0
  });

  const calculateMetrics = useCallback(() => {
    if (!jobCard.hourlyEfficiency || !jobCard.theoreticalParams) return;

    const totalProduced = jobCard.hourlyEfficiency.reduce((sum, entry) => sum + entry.actualProduction, 0);
    const totalTarget = jobCard.hourlyEfficiency.reduce((sum, entry) => sum + entry.targetProduction, 0);
    const avgEfficiency = jobCard.hourlyEfficiency.length > 0 
      ? jobCard.hourlyEfficiency.reduce((sum, entry) => sum + entry.efficiency, 0) / jobCard.hourlyEfficiency.length
      : 0;

    // Update job card with calculated values
    setJobCard(prev => ({
      ...prev,
      totalActualProduction: totalProduced,
      totalTargetProduction: totalTarget,
      averageEfficiency: avgEfficiency,
      totalDowntime: jobCard.hourlyEfficiency?.reduce((sum, entry) => sum + entry.downtime, 0) || 0,
      qualityScore: 95 // Default quality score
    }));
  }, [jobCard.hourlyEfficiency, jobCard.theoreticalParams]);

  const updateCalculatedTargets = useCallback(() => {
    if (!jobCard.theoreticalParams) return;
    
    const hourlyTarget = jobCard.theoreticalParams.theoreticalHourlyRate || 
                        (jobCard.theoreticalParams.ideal12HourTarget / 12);
    const efficiency85Target = hourlyTarget * 0.85;
    const targetPerThread = jobCard.theoreticalParams.numberOfThreads > 0 
      ? hourlyTarget / jobCard.theoreticalParams.numberOfThreads 
      : 0;

    setCalculatedTargets({
      hourlyTarget,
      efficiency85Target,
      targetPerThread
    });
  }, [jobCard.theoreticalParams]);

  useEffect(() => {
    const loadMachines = async () => {
      try {
        const response = await machineApi.getAll();
        if (response.success && response.data) {
          setMachines(response.data);
        }
      } catch (error) {
        console.error('Failed to load machines:', error);
      }
    };
    
    if (isOpen) {
      loadMachines();
      if (editingJob) {
        setJobCard(editingJob);
      }
    }
  }, [isOpen, editingJob]);

  useEffect(() => {
    calculateMetrics();
    updateCalculatedTargets();
  }, [calculateMetrics, updateCalculatedTargets]);

  const generateHourlySlots = (): YarnHourlyEfficiencyData[] => {
    const slots = [];
    for (let hour = 6; hour <= 18; hour++) {
      slots.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        targetProduction: calculatedTargets.hourlyTarget,
        actualProduction: 0,
        efficiency: 0,
        downtime: 0,
        operatorName: '',
        machineSpeed: jobCard.theoreticalParams?.machineSpeed || 0,
        yarnBreaks: 0
      });
    }
    return slots;
  };

  const updateHourlyData = (index: number, field: keyof YarnHourlyEfficiencyData, value: string | number) => {
    if (!jobCard.hourlyEfficiency) return;
    
    const updated = [...jobCard.hourlyEfficiency];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate efficiency when production values change
    if (field === 'actualProduction' || field === 'targetProduction') {
      const target = field === 'targetProduction' ? Number(value) : updated[index].targetProduction;
      const actual = field === 'actualProduction' ? Number(value) : updated[index].actualProduction;
      updated[index].efficiency = target > 0 ? (actual / target) * 100 : 0;
    }
    
    setJobCard({ ...jobCard, hourlyEfficiency: updated });
  };

  const updateUtilityReading = (index: number, field: keyof YarnUtilityReadings, value: string | number) => {
    if (!jobCard.utilityReadings) return;
    
    const updated = [...jobCard.utilityReadings];
    updated[index] = { ...updated[index], [field]: value };
    setJobCard({ ...jobCard, utilityReadings: updated });
  };

  const addUtilityReading = () => {
    const newReading: YarnUtilityReadings = {
      timestamp: new Date().toISOString().slice(0, 16),
      readingType: 'hourly' as const,
      electricity: 0,
      steam: 0,
      water: 0
    };
    const readings = jobCard.utilityReadings || [];
    setJobCard({ ...jobCard, utilityReadings: [...readings, newReading] });
  };

  const handleSaveForm = () => {
    // Compile all data into YarnProductionJobCard format
    const finalJobCard: YarnProductionJobCard = {
      // Basic job properties
      id: editingJob?.id || 0,
      jobId: editingJob?.jobId || `YARN-${Date.now()}`,
      productType: jobCard.productType || 'Cotton Yarn',
      quantity: jobCard.quantity || 0,
      unit: jobCard.unit || 'kg',
      machineId: jobCard.machineId || 0,
      workerId: jobCard.workerId,
      status: jobCard.status || 'pending',
      priority: jobCard.priority || 'medium',
      startDate: jobCard.startDate,
      endDate: jobCard.endDate,
      dueDate: jobCard.dueDate,
      estimatedHours: jobCard.estimatedHours,
      actualHours: jobCard.actualHours,
      partyName: jobCard.partyName,
      dyeingOrderId: jobCard.dyeingOrderId,
      notes: jobCard.notes,
      createdAt: jobCard.createdAt,
      updatedAt: jobCard.updatedAt,
      machine: jobCard.machine,
      
      // Yarn-specific properties
      hourlyEfficiency: jobCard.hourlyEfficiency || [],
      utilityReadings: jobCard.utilityReadings || [],
      qualityData: jobCard.qualityData || { targetGrade: 'A' },
      theoreticalParams: jobCard.theoreticalParams || {
        machineId: jobCard.machineId || 0,
        numberOfThreads: 0,
        machineSpeed: 0,
        yarnWeight10Min: 0,
        ideal12HourTarget: 0,
        benchmarkEfficiency: 85,
        theoreticalHourlyRate: 0,
        lastUpdated: new Date().toISOString()
      },
      shiftData: jobCard.shiftData || {
        shift: 'A',
        supervisor: '',
        operators: [],
        startTime: '06:00',
        endTime: '18:00'
      },
      actualVsTheoretical: {
        efficiencyVariance: jobCard.averageEfficiency ? jobCard.averageEfficiency - (jobCard.theoreticalParams?.benchmarkEfficiency || 85) : 0,
        productionVariance: 0,
        qualityVariance: 0,
        overallPerformance: jobCard.averageEfficiency || 0,
        utilityEfficiency: 0,
        downtimePercentage: 0
      },
      
      // Production summary
      totalActualProduction: jobCard.totalActualProduction || 0,
      totalTargetProduction: jobCard.totalTargetProduction || 0,
      totalDowntime: jobCard.totalDowntime || 0,
      averageEfficiency: jobCard.averageEfficiency || 0,
      totalUtilityCost: 0,
      
      // Quality summary
      qualityScore: jobCard.qualityScore || 95,
      defectCount: 0,
      reworkRequired: false
    };

    onSave(finalJobCard);
  };

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Basic Info', icon: Settings },
    { id: 2, title: 'Theoretical Parameters', icon: Calculator },
    { id: 3, title: 'Hourly Efficiency', icon: Clock },
    { id: 4, title: 'Utility & Quality', icon: Activity },
    { id: 5, title: 'Shift & Performance', icon: Users }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 text-white bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {editingJob ? 'Edit Yarn Production Job Card' : 'Create Yarn Production Job Card'}
              </h2>
              <p className="mt-1 text-blue-100 dark:text-blue-200">Comprehensive yarn manufacturing job management</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 transition-colors rounded-lg hover:bg-white/20 dark:hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex justify-between mt-6">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 ${
                  currentStep >= step.id ? 'text-white' : 'text-blue-200 dark:text-blue-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id ? 'bg-white text-blue-600 dark:bg-gray-100 dark:text-blue-700' : 'bg-blue-500 dark:bg-blue-600'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <span className="hidden text-sm font-medium sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-white dark:bg-gray-900">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Job Information</h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Yarn Type/Product</label>
                  <input
                    type="text"
                    value={jobCard.productType || ''}
                    onChange={(e) => setJobCard({ ...jobCard, productType: e.target.value })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="e.g., 30s Cotton Combed"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Machine</label>
                  <select
                    value={jobCard.machineId || ''}
                    onChange={(e) => {
                      const machineId = Number(e.target.value);
                      setJobCard({ 
                        ...jobCard, 
                        machineId,
                        theoreticalParams: {
                          ...jobCard.theoreticalParams!,
                          machineId
                        }
                      });
                    }}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Select Machine</option>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.machineId} - {machine.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Target Quantity</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={jobCard.quantity || 0}
                      onChange={(e) => setJobCard({ ...jobCard, quantity: Number(e.target.value) })}
                      className="flex-1 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <select
                      value={jobCard.unit || 'kg'}
                      onChange={(e) => setJobCard({ ...jobCard, unit: e.target.value })}
                      className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="kg">kg</option>
                      <option value="tons">tons</option>
                      <option value="pounds">pounds</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                  <select
                    value={jobCard.priority || 'medium'}
                    onChange={(e) => setJobCard({ ...jobCard, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                  <input
                    type="date"
                    value={jobCard.dueDate?.split('T')[0] || ''}
                    onChange={(e) => setJobCard({ ...jobCard, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Party/Client</label>
                  <input
                    type="text"
                    value={jobCard.partyName || ''}
                    onChange={(e) => setJobCard({ ...jobCard, partyName: e.target.value })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Client name"
                  />
                </div>
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Job Notes</label>
                <textarea
                  value={jobCard.notes || ''}
                  onChange={(e) => setJobCard({ ...jobCard, notes: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                  rows={3}
                  placeholder="Additional notes or special instructions..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Theoretical Parameters */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Theoretical Efficiency Parameters</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">Updated weekly</span>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Number of Threads</label>
                  <input
                    type="number"
                    value={jobCard.theoreticalParams?.numberOfThreads || 0}
                    onChange={(e) => setJobCard({
                      ...jobCard,
                      theoreticalParams: {
                        ...jobCard.theoreticalParams!,
                        numberOfThreads: Number(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Machine Speed (RPM)</label>
                  <input
                    type="number"
                    value={jobCard.theoreticalParams?.machineSpeed || 0}
                    onChange={(e) => setJobCard({
                      ...jobCard,
                      theoreticalParams: {
                        ...jobCard.theoreticalParams!,
                        machineSpeed: Number(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">10-Min Yarn Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={jobCard.theoreticalParams?.yarnWeight10Min || 0}
                    onChange={(e) => setJobCard({
                      ...jobCard,
                      theoreticalParams: {
                        ...jobCard.theoreticalParams!,
                        yarnWeight10Min: Number(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Ideal 12-Hour Target (kg)</label>
                  <input
                    type="number"
                    value={jobCard.theoreticalParams?.ideal12HourTarget || 0}
                    onChange={(e) => setJobCard({
                      ...jobCard,
                      theoreticalParams: {
                        ...jobCard.theoreticalParams!,
                        ideal12HourTarget: Number(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Benchmark Efficiency (%)</label>
                  <input
                    type="number"
                    value={jobCard.theoreticalParams?.benchmarkEfficiency || 85}
                    onChange={(e) => setJobCard({
                      ...jobCard,
                      theoreticalParams: {
                        ...jobCard.theoreticalParams!,
                        benchmarkEfficiency: Number(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Theoretical Hourly Rate (kg/hr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={jobCard.theoreticalParams?.theoreticalHourlyRate || calculatedTargets.hourlyTarget}
                    onChange={(e) => setJobCard({
                      ...jobCard,
                      theoreticalParams: {
                        ...jobCard.theoreticalParams!,
                        theoreticalHourlyRate: Number(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Auto-calculated targets */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="mb-3 font-medium text-blue-900">Calculated Targets</h4>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <span className="text-blue-600">Hourly Target:</span>
                    <div className="text-lg font-medium">
                      {calculatedTargets.hourlyTarget.toFixed(2)} kg
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600">85% Target:</span>
                    <div className="text-lg font-medium">
                      {calculatedTargets.efficiency85Target.toFixed(2)} kg
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600">Per Thread Target:</span>
                    <div className="text-lg font-medium">
                      {calculatedTargets.targetPerThread.toFixed(2)} kg
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600">6-Min Production:</span>
                    <div className="text-lg font-medium">
                      {jobCard.theoreticalParams?.yarnWeight10Min 
                        ? (jobCard.theoreticalParams.yarnWeight10Min * 0.6).toFixed(2)
                        : '0.00'} kg
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Hourly Efficiency Tracking */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Hourly Efficiency Data Collection</h3>
                <button
                  onClick={() => setJobCard({ ...jobCard, hourlyEfficiency: generateHourlySlots() })}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Generate 6AM-6PM Slots
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Time</th>
                      <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Target (kg)</th>
                      <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Actual (kg)</th>
                      <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Efficiency %</th>
                      <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Downtime (min)</th>
                      <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Operator</th>
                      <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Speed (RPM)</th>
                      <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Breaks</th>
                      <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(jobCard.hourlyEfficiency || []).map((hour, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm font-medium">{hour.hour}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={hour.targetProduction}
                            onChange={(e) => updateHourlyData(index, 'targetProduction', Number(e.target.value))}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={hour.actualProduction}
                            onChange={(e) => updateHourlyData(index, 'actualProduction', Number(e.target.value))}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            hour.efficiency >= 85 ? 'bg-green-100 text-green-800' :
                            hour.efficiency >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {hour.efficiency.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={hour.downtime}
                            onChange={(e) => updateHourlyData(index, 'downtime', Number(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={hour.operatorName || ''}
                            onChange={(e) => updateHourlyData(index, 'operatorName', e.target.value)}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="Name"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={hour.machineSpeed || 0}
                            onChange={(e) => updateHourlyData(index, 'machineSpeed', Number(e.target.value))}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={hour.yarnBreaks || 0}
                            onChange={(e) => updateHourlyData(index, 'yarnBreaks', Number(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={hour.notes || ''}
                            onChange={(e) => updateHourlyData(index, 'notes', e.target.value)}
                            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="Notes"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Shift Summary */}
              {jobCard.hourlyEfficiency && jobCard.hourlyEfficiency.length > 0 && (
                <div className="p-4 rounded-lg bg-gray-50">
                  <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Shift Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Target:</span>
                      <div className="font-medium">
                        {jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.targetProduction, 0).toFixed(2)} kg
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Actual:</span>
                      <div className="font-medium">
                        {jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.actualProduction, 0).toFixed(2)} kg
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Average Efficiency:</span>
                      <div className="font-medium">
                        {jobCard.hourlyEfficiency.length > 0 
                          ? (jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.efficiency, 0) / jobCard.hourlyEfficiency.length).toFixed(1)
                          : '0.0'}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Downtime:</span>
                      <div className="font-medium">
                        {jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.downtime, 0)} min
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Breaks:</span>
                      <div className="font-medium">
                        {jobCard.hourlyEfficiency.reduce((sum, h) => sum + (h.yarnBreaks || 0), 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Utility Readings & Quality */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Utility Readings & Quality Parameters</h3>
              
              {/* Utility Readings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Daily Utility (Mains) Readings</h4>
                  <button
                    onClick={addUtilityReading}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    <Plus className="w-3 h-3" />
                    Add Reading
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(jobCard.utilityReadings || []).map((reading, index) => (
                    <div key={index} className="p-4 rounded-lg bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-7">
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-700">Time</label>
                          <input
                            type="datetime-local"
                            value={reading.timestamp?.slice(0, 16) || ''}
                            onChange={(e) => updateUtilityReading(index, 'timestamp', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-700">Electricity (kWh)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={reading.electricity}
                            onChange={(e) => updateUtilityReading(index, 'electricity', Number(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-700">Water (L)</label>
                          <input
                            type="number"
                            value={reading.water}
                            onChange={(e) => updateUtilityReading(index, 'water', Number(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-700">Steam (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={reading.steam}
                            onChange={(e) => updateUtilityReading(index, 'steam', Number(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-700">Gas (m³)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={reading.gas || 0}
                            onChange={(e) => updateUtilityReading(index, 'gas', Number(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium text-gray-700">Type</label>
                          <select
                            value={reading.readingType}
                            onChange={(e) => updateUtilityReading(index, 'readingType', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="start">Start</option>
                            <option value="end">End</option>
                            <option value="hourly">Hourly</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => {
                              const updated = jobCard.utilityReadings?.filter((_, i) => i !== index) || [];
                              setJobCard({ ...jobCard, utilityReadings: updated });
                            }}
                            className="p-1 text-red-600 rounded hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Parameters */}
              <div>
                <h4 className="mb-4 font-medium text-gray-900 dark:text-gray-100">Yarn Quality Control Parameters</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Target Grade</label>
                    <select
                      value={jobCard.qualityData?.targetGrade || 'A'}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        qualityData: { ...jobCard.qualityData!, targetGrade: e.target.value as 'A' | 'B' | 'C' }
                      })}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="A">Grade A</option>
                      <option value="B">Grade B</option>
                      <option value="C">Grade C</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Actual Grade</label>
                    <select
                      value={jobCard.qualityData?.actualGrade || ''}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        qualityData: { ...jobCard.qualityData!, actualGrade: e.target.value as 'A' | 'B' | 'C' }
                      })}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Not tested</option>
                      <option value="A">Grade A</option>
                      <option value="B">Grade B</option>
                      <option value="C">Grade C</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Defect Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={jobCard.qualityData?.defectRate || 0}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        qualityData: { ...jobCard.qualityData!, defectRate: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Yarn Count</label>
                    <input
                      type="number"
                      value={jobCard.qualityData?.yarnCount || 0}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        qualityData: { ...jobCard.qualityData!, yarnCount: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tensile Strength</label>
                    <input
                      type="number"
                      step="0.1"
                      value={jobCard.qualityData?.tensileStrength || 0}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        qualityData: { ...jobCard.qualityData!, tensileStrength: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Moisture (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={jobCard.qualityData?.moisture || 0}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        qualityData: { ...jobCard.qualityData!, moisture: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Twist (TPI)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={jobCard.qualityData?.twist || 0}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        qualityData: { ...jobCard.qualityData!, twist: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Elongation (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={jobCard.qualityData?.elongation || 0}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        qualityData: { ...jobCard.qualityData!, elongation: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Irregularity (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={jobCard.qualityData?.irregularity || 0}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        qualityData: { ...jobCard.qualityData!, irregularity: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Shift Information & Performance */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Shift Information & Performance Analysis</h3>
              
              {/* Shift Information */}
              <div>
                <h4 className="mb-4 font-medium text-gray-900 dark:text-gray-100">Shift Details</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Shift</label>
                    <select
                      value={jobCard.shiftData?.shift || 'A'}
                      onChange={(e) => {
                        const shift = e.target.value as 'A' | 'B' | 'C';
                        const shiftLabels = {
                          A: 'Morning (6AM-2PM)',
                          B: 'Afternoon (2PM-10PM)',
                          C: 'Night (10PM-6AM)'
                        };
                        setJobCard({
                          ...jobCard,
                          shiftData: { 
                            ...jobCard.shiftData!, 
                            shift,
                            shiftLabel: shiftLabels[shift]
                          }
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="A">Shift A (6AM-2PM)</option>
                      <option value="B">Shift B (2PM-10PM)</option>
                      <option value="C">Shift C (10PM-6AM)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Supervisor</label>
                    <input
                      type="text"
                      value={jobCard.shiftData?.supervisor || ''}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        shiftData: { ...jobCard.shiftData!, supervisor: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Supervisor name"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Operators (comma-separated)</label>
                    <input
                      type="text"
                      value={jobCard.shiftData?.operators?.join(', ') || ''}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        shiftData: { 
                          ...jobCard.shiftData!, 
                          operators: e.target.value.split(',').map(op => op.trim()).filter(op => op) 
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Operator1, Operator2, Operator3"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Actual Start Time</label>
                    <input
                      type="time"
                      value={jobCard.shiftData?.actualStartTime || ''}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        shiftData: { ...jobCard.shiftData!, actualStartTime: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Actual End Time</label>
                    <input
                      type="time"
                      value={jobCard.shiftData?.actualEndTime || ''}
                      onChange={(e) => setJobCard({
                        ...jobCard,
                        shiftData: { ...jobCard.shiftData!, actualEndTime: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Performance Analysis Summary */}
              <div className="p-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                <h4 className="mb-4 font-medium text-gray-900 dark:text-gray-100">Performance Analysis Summary</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(jobCard.hourlyEfficiency && jobCard.hourlyEfficiency.length > 0)
                        ? (jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.efficiency, 0) / jobCard.hourlyEfficiency.length).toFixed(1)
                        : '0.0'}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {jobCard.hourlyEfficiency?.reduce((sum, h) => sum + h.actualProduction, 0).toFixed(1) || '0.0'} kg
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Production</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {jobCard.hourlyEfficiency?.reduce((sum, h) => sum + h.downtime, 0) || 0} min
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Downtime</div>
                  </div>
                </div>
                
                <div className="p-4 mt-4 bg-white rounded-lg">
                  <h5 className="mb-2 font-medium">Variance Analysis</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Efficiency vs Benchmark:</span>
                      <span className={`ml-2 font-medium ${
                        ((jobCard.hourlyEfficiency && jobCard.hourlyEfficiency.length > 0)
                          ? (jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.efficiency, 0) / jobCard.hourlyEfficiency.length)
                          : 0) >= (jobCard.theoreticalParams?.benchmarkEfficiency || 85)
                        ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {(jobCard.hourlyEfficiency && jobCard.hourlyEfficiency.length > 0) && jobCard.theoreticalParams?.benchmarkEfficiency
                          ? ((jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.efficiency, 0) / jobCard.hourlyEfficiency.length) - jobCard.theoreticalParams.benchmarkEfficiency).toFixed(1)
                          : '0.0'}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Production vs Target:</span>
                      <span className={`ml-2 font-medium ${
                        (jobCard.hourlyEfficiency?.reduce((sum, h) => sum + h.actualProduction, 0) || 0) >= 
                        (jobCard.hourlyEfficiency?.reduce((sum, h) => sum + h.targetProduction, 0) || 0)
                        ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {(jobCard.hourlyEfficiency && jobCard.hourlyEfficiency.length > 0)
                          ? (((jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.actualProduction, 0) - 
                               jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.targetProduction, 0)) / 
                              (jobCard.hourlyEfficiency.reduce((sum, h) => sum + h.targetProduction, 0) || 1)) * 100).toFixed(1)
                          : '0.0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            
            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSaveForm}
                className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                <Save className="w-4 h-4" />
                Save Job Card
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YarnJobCardForm;
