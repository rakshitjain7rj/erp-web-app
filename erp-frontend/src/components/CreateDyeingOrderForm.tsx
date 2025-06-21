// components/CreateDyeingOrderForm.tsx
import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import { createDyeingRecord } from '../api/dyeingApi';
import { CreateDyeingRecordRequest, DyeingRecord } from '../types/dyeing';
import { Button } from './ui/Button';
import { X } from 'lucide-react';

interface CreateDyeingOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRecord: DyeingRecord) => void;
}

const CreateDyeingOrderForm: React.FC<CreateDyeingOrderFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const defaultExpectedDate = format(addDays(new Date(), 7), 'yyyy-MM-dd'); // Default to 7 days from today

  const [formData, setFormData] = useState<CreateDyeingRecordRequest>({
    yarnType: '',
    sentDate: today,
    expectedArrivalDate: defaultExpectedDate,
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateDyeingRecordRequest>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateDyeingRecordRequest> = {};

    if (!formData.yarnType.trim()) {
      newErrors.yarnType = 'Yarn type is required';
    }

    if (!formData.sentDate) {
      newErrors.sentDate = 'Sent date is required';
    } else {
      const sentDate = new Date(formData.sentDate);
      const today = new Date();
      if (sentDate > today) {
        newErrors.sentDate = 'Sent date cannot be in the future';
      }
    }

    if (!formData.expectedArrivalDate) {
      newErrors.expectedArrivalDate = 'Expected arrival date is required';
    } else {
      const sentDate = new Date(formData.sentDate);
      const expectedDate = new Date(formData.expectedArrivalDate);
      
      if (expectedDate <= sentDate) {
        newErrors.expectedArrivalDate = 'Expected arrival date must be after sent date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newRecord = await createDyeingRecord(formData);
      toast.success('Dyeing order created successfully!');
      onSuccess(newRecord);
      handleClose();
    } catch (error: any) {
      console.error('Failed to create dyeing order:', error);
      toast.error(error.response?.data?.message || 'Failed to create dyeing order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      yarnType: '',
      sentDate: today,
      expectedArrivalDate: defaultExpectedDate,
      remarks: ''
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof CreateDyeingRecordRequest]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Auto-update expected arrival date when sent date changes
    if (name === 'sentDate' && value) {
      const sentDate = new Date(value);
      const suggestedExpectedDate = format(addDays(sentDate, 7), 'yyyy-MM-dd');
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        expectedArrivalDate: suggestedExpectedDate
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Dyeing Order
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Yarn Type */}
          <div>
            <label htmlFor="yarnType" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Yarn Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="yarnType"
              name="yarnType"
              value={formData.yarnType}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                errors.yarnType ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Cotton Yarn, Wool Yarn, Silk Yarn"
            />
            {errors.yarnType && (
              <p className="mt-1 text-sm text-red-600">{errors.yarnType}</p>
            )}
          </div>

          {/* Sent Date */}
          <div>
            <label htmlFor="sentDate" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Sent Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="sentDate"
              name="sentDate"
              value={formData.sentDate}
              onChange={handleInputChange}
              max={today}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                errors.sentDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.sentDate && (
              <p className="mt-1 text-sm text-red-600">{errors.sentDate}</p>
            )}
          </div>

          {/* Expected Arrival Date */}
          <div>
            <label htmlFor="expectedArrivalDate" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Expected Arrival Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="expectedArrivalDate"
              name="expectedArrivalDate"
              value={formData.expectedArrivalDate}
              onChange={handleInputChange}
              min={formData.sentDate ? format(addDays(new Date(formData.sentDate), 1), 'yyyy-MM-dd') : today}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                errors.expectedArrivalDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.expectedArrivalDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedArrivalDate}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              When do you expect the dyed yarn to be ready?
            </p>
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="remarks" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              placeholder="Optional notes about the dyeing order..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-4 space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDyeingOrderForm;