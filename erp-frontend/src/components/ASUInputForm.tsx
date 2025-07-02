import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { ASUDailyMachineData, ASUFormData } from '../types/asu';
import { ChevronLeft, ChevronRight, Save, Calendar, CheckCircle, AlertCircle, X } from 'lucide-react';

// Enhanced error types for better user feedback
interface ValidationError {
  field: string;
  message: string;
  section: keyof ASUFormData;
}

interface ApiError {
  message: string;
  statusCode?: number;
  details?: string;
}

interface FormState {
  errors: Record<string, string>;
  validationErrors: ValidationError[];
  apiError: ApiError | null;
  isSubmitting: boolean;
  submitSuccess: boolean;
  showNotification: boolean;
  notificationType: 'success' | 'error' | 'warning';
  notificationMessage: string;
}

// Validation schemas using Zod - Lenient for navigation, strict for submission
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

// Lenient schemas for navigation - only check basic data types and ranges
const dailyMachineNavigationSchema = z.object({
  machine: z.number().min(1).max(21),
  karigarName: z.string(), // Allow empty for navigation
  reading8AM: z.number().min(0),
  reading8PM: z.number().min(0),
  machineHoursWorked: z.number().min(0).max(24),
  extraHours: z.number().min(0).max(24).optional(),
  yarn: z.string(), // Allow empty for navigation
  date: z.string().min(1, 'Date is required')
});

const productionEfficiencySchema = z.object({
  machine: z.number().min(1).max(21),
  kgsProduced: z.number().min(0),
  machineHoursWorking: z.number().min(0).max(24),
  date: z.string().min(1, 'Date is required')
});

const productionEfficiencyNavigationSchema = z.object({
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

const mainsReadingNavigationSchema = z.object({
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

const weeklyDataNavigationSchema = z.object({
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
  onError?: (error: ApiError) => void;
  onSuccess?: () => void;
  onCancel?: () => void; // Added onCancel prop type
}

const ASUInputForm: React.FC<ASUInputFormProps> = ({ 
  onSubmit, 
  isLoading = false, 
  onError,
  onSuccess,
  ...props // Spread props to access onCancel
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Enhanced form state management
  const [formState, setFormState] = useState<FormState>({
    errors: {},
    validationErrors: [],
    apiError: null,
    isSubmitting: false,
    submitSuccess: false,
    showNotification: false,
    notificationType: 'success',
    notificationMessage: ''
  });

  // Enhanced notification system
  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setFormState(prev => ({
      ...prev,
      showNotification: true,
      notificationType: type,
      notificationMessage: message
    }));

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setFormState(prev => ({ ...prev, showNotification: false }));
    }, 5000);
  }, []);

  // Error handling helpers
  const clearErrors = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      errors: {},
      validationErrors: [],
      apiError: null
    }));
  }, []);

  const setFieldError = useCallback((section: keyof ASUFormData, field: string, message: string) => {
    const errorKey = `${section}.${field}`;
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [errorKey]: message }
    }));
  }, []);

  const clearFieldError = useCallback((section: keyof ASUFormData, field: string) => {
    const errorKey = `${section}.${field}`;
    setFormState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[errorKey];
      return { ...prev, errors: newErrors };
    });
  }, []);
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = useCallback(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Get start of current week (Monday)
  const getWeekStartDate = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    return monday.toISOString().split('T')[0];
  }, []);

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

  // Form persistence - save to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('asuFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as ASUFormData;
        // Only restore if data is from today or more recent
        const today = getTodayDate();
        if (parsedData.dailyMachineData.date >= today) {
          setFormData(parsedData);
        }
      } catch (error) {
        console.warn('Failed to restore form data from localStorage:', error);
        localStorage.removeItem('asuFormData');
      }
    }
  }, [getTodayDate]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('asuFormData', JSON.stringify(formData));
      } catch (error) {
        console.warn('Failed to save form data to localStorage:', error);
      }
    }, 1000); // Debounce saves to avoid excessive localStorage writes

    return () => clearTimeout(timeoutId);
  }, [formData]);
  // Auto-calculate fields with proper dependency management
  useEffect(() => {
    const { tenMinWeight, ideal12Hr, ideal85Percent } = formData.weeklyData;
    if (tenMinWeight > 0) {
      // Calculate for 24 hours and convert to kgs
      const ideal24Hr = (tenMinWeight * 6 * 24) / 1000; // 10 min -> 1 hour (6x), then 24 hours, convert grams to kgs
      const ideal85PercentCalc = ideal24Hr * 0.85;
      
      // Only update if the calculated values are different
      if (Math.abs(ideal12Hr - ideal24Hr) > 0.001 || Math.abs(ideal85Percent - ideal85PercentCalc) > 0.001) {
        setFormData(prev => ({
          ...prev,
          weeklyData: {
            ...prev.weeklyData,
            ideal12Hr: ideal24Hr, // Keeping the field name but using 24hr calculation
            ideal85Percent: ideal85PercentCalc
          }
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.weeklyData.tenMinWeight]); // Only depend on the input value that triggers calculation

  // Auto-calculate machine hours worked (8PM - 8AM) with proper dependency management
  useEffect(() => {
    const { reading8AM, reading8PM, machineHoursWorked } = formData.dailyMachineData;
    if (reading8PM > reading8AM) {
      const calculatedHours = reading8PM - reading8AM;
      
      // Only update if the calculated value is different
      if (Math.abs(machineHoursWorked - calculatedHours) > 0.001) {
        setFormData(prev => ({
          ...prev,
          dailyMachineData: {
            ...prev.dailyMachineData,
            machineHoursWorked: calculatedHours
          }
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.dailyMachineData.reading8AM, formData.dailyMachineData.reading8PM]); // Only depend on the input values

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

  // Enhanced form data update with real-time validation
  const updateFormData = useCallback((section: keyof ASUFormData, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear field error when user starts typing
    clearFieldError(section, field);
    
    // Real-time validation for important fields
    if (field === 'karigarName' && typeof value === 'string' && value.trim().length === 0) {
      setFieldError(section, field, 'Karigar name is required');
    } else if (field === 'yarn' && typeof value === 'string' && value.trim().length === 0) {
      setFieldError(section, field, 'Yarn type is required');
    } else if (field === 'reading8PM' && section === 'dailyMachineData' && typeof value === 'number') {
      const reading8AM = (formData[section] as ASUDailyMachineData).reading8AM;
      if (value <= reading8AM && reading8AM > 0) {
        setFieldError(section, field, '8PM reading must be greater than 8AM reading');
      }
    }
  }, [formData, clearFieldError, setFieldError]);

  // Validation for all pages on submit
  const validateAllPages = useCallback(() => {
    const allValidationErrors: ValidationError[] = [];
    const allErrors: Record<string, string> = {};
    let firstInvalidPage: number | null = null;

    const pageSchemas: { page: number, schema: z.ZodSchema, sectionKey: keyof ASUFormData }[] = [
      { page: 1, schema: dailyMachineSchema, sectionKey: 'dailyMachineData' },
      { page: 2, schema: productionEfficiencySchema, sectionKey: 'productionEfficiency' },
      { page: 3, schema: mainsReadingSchema, sectionKey: 'mainsReading' },
      { page: 4, schema: weeklyDataSchema, sectionKey: 'weeklyData' },
    ];

    pageSchemas.forEach(({ page, schema, sectionKey }) => {
      try {
        schema.parse(formData[sectionKey]);
      } catch (error) {
        if (firstInvalidPage === null) firstInvalidPage = page;
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            const errorKey = `${sectionKey}.${err.path[0]}`;
            allErrors[errorKey] = err.message;
            allValidationErrors.push({
              field: err.path[0] as string,
              message: err.message,
              section: sectionKey
            });
          });
        }
      }
    });
    
    // Business logic validation
    const dailyData = formData.dailyMachineData;
    if (dailyData.reading8PM <= dailyData.reading8AM && dailyData.reading8AM > 0) {
        if (firstInvalidPage === null) firstInvalidPage = 1;
        const errorKey = 'dailyMachineData.reading8PM';
        const message = '8PM reading must be greater than 8AM reading';
        if (!allErrors[errorKey]) {
            allErrors[errorKey] = message;
            allValidationErrors.push({ field: 'reading8PM', message, section: 'dailyMachineData' });
        }
    }

    const mainsData = formData.mainsReading;
    if (mainsData.reading8PM <= mainsData.reading8AM && mainsData.reading8AM > 0) {
        if (firstInvalidPage === null) firstInvalidPage = 3;
        const errorKey = 'mainsReading.reading8PM';
        const message = '8PM reading must be greater than 8AM reading';
        if (!allErrors[errorKey]) {
            allErrors[errorKey] = message;
            allValidationErrors.push({ field: 'reading8PM', message, section: 'mainsReading' });
        }
    }

    setFormState(prev => ({
      ...prev,
      errors: allErrors,
      validationErrors: allValidationErrors,
      apiError: null
    }));

    return { isValid: firstInvalidPage === null, firstInvalidPage };
  }, [formData]);

  // Enhanced validation with better error handling
  const validateCurrentPage = useCallback((isNavigation = true) => {
    const newErrors: Record<string, string> = {};
    const validationErrors: ValidationError[] = [];
    
    try {
      let schema: z.ZodSchema;
      let sectionKey: keyof ASUFormData;
      
      switch (currentPage) {
        case 1:
          schema = isNavigation ? dailyMachineNavigationSchema : dailyMachineSchema;
          sectionKey = 'dailyMachineData';
          break;
        case 2:
          schema = isNavigation ? productionEfficiencyNavigationSchema : productionEfficiencySchema;
          sectionKey = 'productionEfficiency';
          break;
        case 3:
          schema = isNavigation ? mainsReadingNavigationSchema : mainsReadingSchema;
          sectionKey = 'mainsReading';
          break;
        case 4:
          schema = isNavigation ? weeklyDataNavigationSchema : weeklyDataSchema;
          sectionKey = 'weeklyData';
          break;
        default:
          return true;
      }
      
      const data = formData[sectionKey];
      schema.parse(data);
      
      // Lenient business logic validation for navigation
      if (isNavigation) {
        if (currentPage === 1) {
          const dailyData = formData.dailyMachineData;
          if (dailyData.reading8PM > 0 && dailyData.reading8AM > 0 && dailyData.reading8PM <= dailyData.reading8AM) {
            const errorKey = 'dailyMachineData.reading8PM';
            const message = '8PM reading should be greater than 8AM reading.';
            newErrors[errorKey] = message;
            validationErrors.push({ field: 'reading8PM', message, section: 'dailyMachineData' });
          }
        } else if (currentPage === 3) {
          const mainsData = formData.mainsReading;
          if (mainsData.reading8PM > 0 && mainsData.reading8AM > 0 && mainsData.reading8PM <= mainsData.reading8AM) {
            const errorKey = 'mainsReading.reading8PM';
            const message = '8PM reading should be greater than 8AM reading.';
            newErrors[errorKey] = message;
            validationErrors.push({ field: 'reading8PM', message, section: 'mainsReading' });
          }
        }
      }
      
      if (Object.keys(newErrors).length > 0) {
        setFormState(prev => ({
          ...prev,
          errors: { ...prev.errors, ...newErrors },
          validationErrors: [...prev.validationErrors, ...validationErrors]
        }));
        return false;
      }
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const sectionKey = currentPage === 1 ? 'dailyMachineData' : 
                          currentPage === 2 ? 'productionEfficiency' :
                          currentPage === 3 ? 'mainsReading' : 'weeklyData';
        
        error.errors.forEach(err => {
          const errorKey = `${sectionKey}.${err.path[0]}`;
          newErrors[errorKey] = err.message;
          validationErrors.push({
            field: err.path[0] as string,
            message: err.message,
            section: sectionKey
          });
        });
      }
      
      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, ...newErrors },
        validationErrors: [...prev.validationErrors, ...validationErrors]
      }));
      
      return false;
    }
  }, [currentPage, formData]);

  // Enhanced navigation with validation feedback
  const handleNext = useCallback(() => {
    if (validateCurrentPage()) {
      setCurrentPage(prev => Math.min(prev + 1, 4));
      clearErrors(); // Clear any residual errors when moving to next page
    } else {
      showNotification('warning', 'Please fix the errors before proceeding to the next page');
    }
  }, [validateCurrentPage, clearErrors, showNotification]);

  const handlePrevious = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
    clearErrors(); // Clear errors when going back
  }, [clearErrors]);

  // Enhanced submit function with comprehensive error handling
  const handleSubmit = useCallback(async () => {
    const { isValid, firstInvalidPage } = validateAllPages();
    if (!isValid) {
      // Set form state to show validation errors
      setFormState(prev => ({
        ...prev,
        showNotification: true,
        notificationType: 'error',
        notificationMessage: 'Please fix all validation errors before submitting.'
      }));
      
      if (firstInvalidPage) {
        setCurrentPage(firstInvalidPage);
      }
      return;
    }
    
    setFormState(prev => ({ ...prev, isSubmitting: true, apiError: null, showNotification: false }));
    
    try {
      await onSubmit(formData);
      
      // Success handling
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        submitSuccess: true,
        errors: {},
        validationErrors: [],
        apiError: null,
        showNotification: true,
        notificationType: 'success',
        notificationMessage: 'ASU data submitted successfully!'
      }));
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setFormState(prev => ({ ...prev, showNotification: false }));
      }, 5000);

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
      
      // Clear saved form data from localStorage after successful submission
      localStorage.removeItem('asuFormData');
      
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      
      // Parse API error
      let apiError: ApiError = {
        message: 'An unexpected error occurred while submitting the form',
        statusCode: 500
      };
      
      if (error && typeof error === 'object' && 'response' in error) {
        const typedError = error as { response: { data: Record<string, unknown>; status: number } };
        // Handle structured API error response
        apiError = {
          message: String(typedError.response.data.error || typedError.response.data.message || apiError.message),
          statusCode: typedError.response.status,
          details: typedError.response.data.details ? String(typedError.response.data.details) : undefined
        };
      } else if (error && typeof error === 'object' && 'message' in error) {
        // Handle basic error with message
        const errorMessage = String(error.message);
        apiError.message = errorMessage;
        
        // Handle specific error types
        if (errorMessage.includes('token') || errorMessage.includes('auth') || errorMessage.includes('401')) {
          apiError.message = 'Authentication failed. Please log in again.';
          apiError.statusCode = 401;
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          apiError.message = 'Network error. Please check your connection and try again.';
        }
      }
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        apiError,
        submitSuccess: false,
        showNotification: true,
        notificationType: 'error',
        notificationMessage: apiError.message
      }));
      
      // Call error callback if provided
      if (onError) {
        onError(apiError);
      }
    }
  }, [validateAllPages, onSubmit, formData, onSuccess, onError, getTodayDate, getWeekStartDate]);

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
          <label htmlFor="karigar-name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Karigar Name
          </label>
          <input
            id="karigar-name"
            type="text"
            value={formData.dailyMachineData.karigarName}
            onChange={(e) => updateFormData('dailyMachineData', 'karigarName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              formState.errors['dailyMachineData.karigarName'] 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
            }`}
            placeholder="Enter karigar name"
            aria-describedby={formState.errors['dailyMachineData.karigarName'] ? 'karigar-name-error' : undefined}
            aria-invalid={formState.errors['dailyMachineData.karigarName'] ? 'true' : 'false'}
            required
          />
          {formState.errors['dailyMachineData.karigarName'] && (
            <p id="karigar-name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {formState.errors['dailyMachineData.karigarName']}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="yarn-type" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Yarn Type
          </label>
          <select
            id="yarn-type"
            value={formData.dailyMachineData.yarn}
            onChange={(e) => updateFormData('dailyMachineData', 'yarn', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              formState.errors['dailyMachineData.yarn'] 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
            }`}
            aria-describedby={formState.errors['dailyMachineData.yarn'] ? 'yarn-type-error' : undefined}
            aria-invalid={formState.errors['dailyMachineData.yarn'] ? 'true' : 'false'}
            required
          >
            <option value="">Select yarn type</option>
            {yarnOptions.map(yarn => (
              <option key={yarn} value={yarn}>{yarn}</option>
            ))}
          </select>
          {formState.errors['dailyMachineData.yarn'] && (
            <p id="yarn-type-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {formState.errors['dailyMachineData.yarn']}
            </p>
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
          {formState.errors['dailyMachineData.machineHoursWorked'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {formState.errors['dailyMachineData.machineHoursWorked']}
            </p>
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
          {formState.errors['dailyMachineData.extraHours'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {formState.errors['dailyMachineData.extraHours']}
            </p>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-gray-50"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-gray-50"
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
      {/* Enhanced Notification System */}
      {formState.showNotification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 mb-4 rounded-lg shadow-lg transition-all duration-300 ${
          formState.notificationType === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/20 dark:border-green-400 dark:text-green-300'
            : formState.notificationType === 'error'
            ? 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/20 dark:border-red-400 dark:text-red-300'
            : 'bg-yellow-100 border border-yellow-400 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-400 dark:text-yellow-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {formState.notificationType === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
              {formState.notificationType === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
              {formState.notificationType === 'warning' && <AlertCircle className="w-5 h-5 mr-2" />}
              <span className="font-medium">{formState.notificationMessage}</span>
            </div>
            <button
              onClick={() => setFormState(prev => ({ ...prev, showNotification: false }))}
              className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* API Error Display */}
      {formState.apiError && (
        <div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Submission Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                {formState.apiError.message}
              </p>
              {formState.apiError.details && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-500">
                  Details: {formState.apiError.details}
                </p>
              )}
            </div>
            <button
              onClick={() => setFormState(prev => ({ ...prev, apiError: null }))}
              className="ml-4 text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success State Display */}
      {formState.submitSuccess && (
        <div className="p-4 mb-6 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <div className="flex items-center">
            <CheckCircle className="flex-shrink-0 w-5 h-5 mr-3 text-green-400" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                Data Submitted Successfully!
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                Your ASU Unit 2 data has been saved to the database.
              </p>
            </div>
          </div>
        </div>
      )}

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
      <div className="min-h-[400px] relative">
        {(formState.isSubmitting || isLoading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 dark:bg-gray-800/80">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {formState.isSubmitting ? 'Submitting data...' : 'Loading...'}
              </p>
            </div>
          </div>
        )}
        
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

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              // Reset form and close the input form (hide component)
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
              localStorage.removeItem('asuFormData');
              // Only close the form (let parent control visibility)
              if (typeof props?.onCancel === 'function') {
                props.onCancel();
              }
            }}
            className="flex items-center px-4 py-2 space-x-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            aria-label="Cancel and close form"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>

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
              disabled={formState.isSubmitting || isLoading}
              className="flex items-center px-6 py-2 space-x-2 text-white transition-colors bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Submit all ASU data"
            >
              <Save className="w-4 h-4" />
              <span>
                {formState.isSubmitting ? 'Submitting...' : 'Submit All Data'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ASUInputForm;
