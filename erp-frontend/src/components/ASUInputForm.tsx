import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { ASUDailyMachineData, ASUProductionEfficiency, ASUMainsReading, ASUWeeklyData, ASUFormData } from '../types/asu';
import { ChevronLeft, ChevronRight, Save, Calendar } from 'lucide-react';

// Validation schemas using Zod
const dailyMachineSchema = z.object({
  machine: z.number().min(1).max(21),
  karigarName: z.string().min(1, 'Karigar name is required'),
  reading8AM: z.number().min(0),
  reading8PM: z.number().min(0),
  machineHoursWorked: z.number().min(0).max(24), // Auto-calculated: 8PM - 8AM
  extraHours: z.number().min(0).max(24).optional(), // Optional extra/overtime hours
  yarn: z.string().min(1, 'Yarn type is required'),
  date: z.string().min(1, 'Date is required')
});

const productionEfficiencySchema = z.object({
  machine: z.number().min(1).max(21),
  kgsProduced: z.number().min(0),
  machineHoursWorking: z.number().min(0).max(24),
  date: z.string().min(1, 'Date is required')
});

const mainsReadingSchema = z.object({
  reading8AM: z.number().min(0),
  reading8PM: z.number().min(0),
  date: z.string().min(1, 'Date is required')
});

const weeklyDataSchema = z.object({
  machine: z.number().min(1).max(21),
  numberOfThreads: z.number().min(0),
  tenMinWeight: z.number().min(0),
  ideal12Hr: z.number().min(0),
  ideal85Percent: z.number().min(0),
  speed: z.number().min(0),
  weekStartDate: z.string().min(1, 'Week start date is required')
});

interface ASUInputFormProps {
  onSubmit: (data: ASUFormData) => Promise<void>;
  isLoading?: boolean;
}

const ASUInputForm: React.FC<ASUInputFormProps> = ({ onSubmit, isLoading = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get start of current week (Monday)
  const getWeekStartDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    return monday.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<ASUFormData>({
    dailyMachineData: {
      machine: 1,
      karigarName: '',
      reading8AM: 0,
      reading8PM: 0,
      machineHoursWorked: 0,
      extraHours: 0,
      yarn: '',
      date: getTodayDate()
    },
    productionEfficiency: {
      machine: 1,
      kgsProduced: 0,
      machineHoursWorking: 0,
      date: getTodayDate()
    },
    mainsReading: {
      reading8AM: 0,
      reading8PM: 0,
      date: getTodayDate()
    },
    weeklyData: {
      machine: 1,
      numberOfThreads: 0,
      tenMinWeight: 0,
      ideal12Hr: 0,
      ideal85Percent: 0,
      speed: 0,
      weekStartDate: getWeekStartDate()
    }
  });

  // Auto-calculate fields
  useEffect(() => {
    const { tenMinWeight } = formData.weeklyData;
    if (tenMinWeight > 0) {
      // Calculate for 24 hours and convert to kgs
      const ideal24Hr = (tenMinWeight * 6 * 24) / 1000; // 10 min -> 1 hour (6x), then 24 hours, convert grams to kgs
      const ideal85Percent = ideal24Hr * 0.85;
      
      setFormData(prev => ({
        ...prev,
        weeklyData: {
          ...prev.weeklyData,
          ideal12Hr: ideal24Hr, // Keeping the field name but using 24hr calculation
          ideal85Percent
        }
      }));
    }
  }, [formData.weeklyData.tenMinWeight]);

  // Auto-calculate machine hours worked (8PM - 8AM)
  useEffect(() => {
    const { reading8AM, reading8PM } = formData.dailyMachineData;
    if (reading8PM > reading8AM) {
      const machineHoursWorked = reading8PM - reading8AM;
      
      setFormData(prev => ({
        ...prev,
        dailyMachineData: {
          ...prev.dailyMachineData,
          machineHoursWorked
        }
      }));
    }
  }, [formData.dailyMachineData.reading8AM, formData.dailyMachineData.reading8PM]);

  const machineOptions = Array.from({ length: 21 }, (_, i) => i + 1);

  const yarnOptions = [
    'Cotton 20s',
    'Cotton 30s',
    'Cotton 40s',
    'Polyester 150D',
    'Polyester 300D',
    'Viscose 30s',
    'Blended 20s',
    'Other'
  ];

  const updateFormData = (section: keyof ASUFormData, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear errors for this field
    const errorKey = `${section}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateCurrentPage = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      switch (currentPage) {
        case 1:
          dailyMachineSchema.parse(formData.dailyMachineData);
          break;
        case 2:
          productionEfficiencySchema.parse(formData.productionEfficiency);
          break;
        case 3:
          mainsReadingSchema.parse(formData.mainsReading);
          break;
        case 4:
          weeklyDataSchema.parse(formData.weeklyData);
          break;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const section = currentPage === 1 ? 'dailyMachineData' : 
                         currentPage === 2 ? 'productionEfficiency' :
                         currentPage === 3 ? 'mainsReading' : 'weeklyData';
          newErrors[`${section}.${err.path[0]}`] = err.message;
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentPage()) {
      setCurrentPage(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentPage()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        dailyMachineData: {
          machine: 1,
          karigarName: '',
          reading8AM: 0,
          reading8PM: 0,
          machineHoursWorked: 0,
          extraHours: 0,
          yarn: '',
          date: getTodayDate()
        },
        productionEfficiency: {
          machine: 1,
          kgsProduced: 0,
          machineHoursWorking: 0,
          date: getTodayDate()
        },
        mainsReading: {
          reading8AM: 0,
          reading8PM: 0,
          date: getTodayDate()
        },
        weeklyData: {
          machine: 1,
          numberOfThreads: 0,
          tenMinWeight: 0,
          ideal12Hr: 0,
          ideal85Percent: 0,
          speed: 0,
          weekStartDate: getWeekStartDate()
        }
      });
      setCurrentPage(1);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPage1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Daily Machine Data Entry
      </h3>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Machine
          </label>
          <select
            value={formData.dailyMachineData.machine}
            onChange={(e) => updateFormData('dailyMachineData', 'machine', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {machineOptions.map(num => (
              <option key={num} value={num}>Machine {num}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Date
          </label>
          <input
            type="date"
            value={formData.dailyMachineData.date}
            onChange={(e) => updateFormData('dailyMachineData', 'date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Karigar Name
          </label>
          <input
            type="text"
            value={formData.dailyMachineData.karigarName}
            onChange={(e) => updateFormData('dailyMachineData', 'karigarName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter karigar name"
          />
          {errors['dailyMachineData.karigarName'] && (
            <p className="mt-1 text-sm text-red-600">{errors['dailyMachineData.karigarName']}</p>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Yarn Type
          </label>
          <select
            value={formData.dailyMachineData.yarn}
            onChange={(e) => updateFormData('dailyMachineData', 'yarn', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select yarn type</option>
            {yarnOptions.map(yarn => (
              <option key={yarn} value={yarn}>{yarn}</option>
            ))}
          </select>
          {errors['dailyMachineData.yarn'] && (
            <p className="mt-1 text-sm text-red-600">{errors['dailyMachineData.yarn']}</p>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            8:00 AM Machine Reading
          </label>
          <input
            type="number"
            value={formData.dailyMachineData.reading8AM}
            onChange={(e) => updateFormData('dailyMachineData', 'reading8AM', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            8:00 PM Machine Reading
          </label>
          <input
            type="number"
            value={formData.dailyMachineData.reading8PM}
            onChange={(e) => updateFormData('dailyMachineData', 'reading8PM', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            step="0.01"
            min="0"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Machine Hours Working (Auto-calculated)
          </label>
          <input
            type="number"
            value={formData.dailyMachineData.machineHoursWorked}
            readOnly
            className="w-full px-3 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm cursor-not-allowed dark:bg-gray-600 dark:border-gray-600 dark:text-white"
            step="0.1"
            min="0"
            max="24"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Calculated as: 8PM Reading - 8AM Reading
          </p>
          {errors['dailyMachineData.machineHoursWorked'] && (
            <p className="mt-1 text-sm text-red-600">{errors['dailyMachineData.machineHoursWorked']}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Extra Hours (Optional)
          </label>
          <input
            type="number"
            value={formData.dailyMachineData.extraHours || 0}
            onChange={(e) => updateFormData('dailyMachineData', 'extraHours', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            step="0.1"
            min="0"
            max="24"
            placeholder="0.0"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Additional hours for overtime or extra work
          </p>
          {errors['dailyMachineData.extraHours'] && (
            <p className="mt-1 text-sm text-red-600">{errors['dailyMachineData.extraHours']}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPage2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Production-wise Efficiency
      </h3>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Machine
          </label>
          <select
            value={formData.productionEfficiency.machine}
            onChange={(e) => updateFormData('productionEfficiency', 'machine', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {machineOptions.map(num => (
              <option key={num} value={num}>Machine {num}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Date
          </label>
          <input
            type="date"
            value={formData.productionEfficiency.date}
            onChange={(e) => updateFormData('productionEfficiency', 'date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Kgs Produced
          </label>
          <input
            type="number"
            value={formData.productionEfficiency.kgsProduced}
            onChange={(e) => updateFormData('productionEfficiency', 'kgsProduced', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Machine Hours Working
          </label>
          <input
            type="number"
            value={formData.productionEfficiency.machineHoursWorking}
            onChange={(e) => updateFormData('productionEfficiency', 'machineHoursWorking', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            step="0.1"
            min="0"
            max="24"
          />
        </div>
      </div>

      {/* Show efficiency calculation */}
      {formData.productionEfficiency.kgsProduced > 0 && formData.productionEfficiency.machineHoursWorking > 0 && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">Calculated Efficiency</h4>
          <p className="text-blue-700 dark:text-blue-300">
            Production Rate: {(formData.productionEfficiency.kgsProduced / formData.productionEfficiency.machineHoursWorking).toFixed(2)} kg/hour
          </p>
        </div>
      )}
    </div>
  );

  const renderPage3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Mains Reading (Daily)
      </h3>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Date
          </label>
          <input
            type="date"
            value={formData.mainsReading.date}
            onChange={(e) => updateFormData('mainsReading', 'date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div></div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            8:00 AM Mains Reading
          </label>
          <input
            type="number"
            value={formData.mainsReading.reading8AM}
            onChange={(e) => updateFormData('mainsReading', 'reading8AM', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            8:00 PM Mains Reading
          </label>
          <input
            type="number"
            value={formData.mainsReading.reading8PM}
            onChange={(e) => updateFormData('mainsReading', 'reading8PM', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      {/* Show daily consumption */}
      {formData.mainsReading.reading8PM > formData.mainsReading.reading8AM && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
          <h4 className="mb-2 font-medium text-green-900 dark:text-green-100">Daily Consumption</h4>
          <p className="text-green-700 dark:text-green-300">
            Total Units: {(formData.mainsReading.reading8PM - formData.mainsReading.reading8AM).toFixed(2)} units
          </p>
        </div>
      )}
    </div>
  );

  const renderPage4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Weekly Calculated Inputs
      </h3>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Machine
          </label>
          <select
            value={formData.weeklyData.machine}
            onChange={(e) => updateFormData('weeklyData', 'machine', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {machineOptions.map(num => (
              <option key={num} value={num}>Machine {num}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Week Start Date (Monday)
          </label>
          <input
            type="date"
            value={formData.weeklyData.weekStartDate}
            onChange={(e) => updateFormData('weeklyData', 'weekStartDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            No. of Threads
          </label>
          <input
            type="number"
            value={formData.weeklyData.numberOfThreads}
            onChange={(e) => updateFormData('weeklyData', 'numberOfThreads', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            min="0"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            10 Min Weight (grams)
          </label>
          <input
            type="number"
            value={formData.weeklyData.tenMinWeight}
            onChange={(e) => updateFormData('weeklyData', 'tenMinWeight', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            step="0.1"
            min="0"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Speed (RPM)
          </label>
          <input
            type="number"
            value={formData.weeklyData.speed}
            onChange={(e) => updateFormData('weeklyData', 'speed', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            step="0.1"
            min="0"
          />
        </div>

        <div></div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Ideal 24 Hr (kgs) - Auto Calculated
          </label>
          <input
            type="number"
            value={formData.weeklyData.ideal12Hr}
            onChange={(e) => updateFormData('weeklyData', 'ideal12Hr', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-800"
            step="0.1"
            min="0"
            readOnly
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Ideal 85% (kgs) - Auto Calculated
          </label>
          <input
            type="number"
            value={formData.weeklyData.ideal85Percent}
            onChange={(e) => updateFormData('weeklyData', 'ideal85Percent', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-800"
            step="0.1"
            min="0"
            readOnly
          />
        </div>
      </div>

      {/* Show calculation explanation */}
      {formData.weeklyData.tenMinWeight > 0 && (
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <h4 className="mb-2 font-medium text-purple-900 dark:text-purple-100">Calculation Info</h4>
          <div className="space-y-1 text-purple-700 dark:text-purple-300">
            <p>• 10 min weight × 6 × 24 ÷ 1000 = Ideal 24 Hr production (kgs)</p>
            <p>• Ideal 24 Hr × 85% = Target production at 85% efficiency (kgs)</p>
          </div>
        </div>
      )}
    </div>
  );

  const pageProgress = (currentPage / 4) * 100;

  return (
    <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-lg dark:bg-gray-800">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ASU Unit 2 Data Entry
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Page {currentPage} of 4</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
          <div 
            className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
            style={{ width: `${pageProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Form Content */}
      <div className="min-h-[400px]">
        {currentPage === 1 && renderPage1()}
        {currentPage === 2 && renderPage2()}
        {currentPage === 3 && renderPage3()}
        {currentPage === 4 && renderPage4()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="flex items-center px-4 py-2 space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex space-x-2">
          {[1, 2, 3, 4].map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        {currentPage < 4 ? (
          <button
            onClick={handleNext}
            className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="flex items-center px-6 py-2 space-x-2 text-white transition-colors bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit All Data'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ASUInputForm;
