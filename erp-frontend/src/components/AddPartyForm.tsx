import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Save, User, Building, MapPin, Phone, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { createParty } from '../api/partyApi';
import ConfirmationDialog from './ConfirmationDialog';

type Props = {
  onSuccess: (partyName?: string) => void;
  onClose: () => void;
  existingParties?: string[]; // List of existing party names for validation
};

interface FormData {
  name: string;
  dyeingFirm: string;
  address: string;
  contact: string;
}

interface FormErrors {
  name?: string;
  dyeingFirm?: string;
  address?: string;
  contact?: string;
}

const AddPartyForm: React.FC<Props> = ({ onSuccess, onClose, existingParties = [] }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    dyeingFirm: '',
    address: '',
    contact: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdPartyName, setCreatedPartyName] = useState('');
  
  // Focus management
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-focus first input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced keyboard shortcuts with better UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && !loading) {
        e.preventDefault();
        onClose();
      } 
      // Ctrl/Cmd + Enter to submit
      else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !loading) {
        e.preventDefault();
        if (formData.name.trim()) {
          formRef.current?.requestSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, formData.name, loading]);

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    
    // Show success toast with professional styling
    toast.success('🎉 Party Added Successfully!', {
      description: `${createdPartyName} has been added to the system and is now available in the party list.`,
      duration: 4000,
      action: {
        label: 'View List',
        onClick: () => {
          onSuccess(createdPartyName);
          onClose();
        },
      },
    });
    
    onSuccess(createdPartyName);
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validation with professional messaging
    if (!formData.name.trim()) {
      newErrors.name = 'Party name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Party name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Party name must be less than 100 characters';
    } else if (!/^[a-zA-Z0-9\s&.-]+$/.test(formData.name.trim())) {
      newErrors.name = 'Party name contains invalid characters';
    } else if (existingParties.some(party => 
      party.toLowerCase().trim() === formData.name.toLowerCase().trim()
    )) {
      newErrors.name = 'A party with this name already exists';
    }

    // Optional field validation with professional constraints
    if (formData.dyeingFirm && formData.dyeingFirm.length > 100) {
      newErrors.dyeingFirm = 'Dyeing firm name must be less than 100 characters';
    }

    if (formData.address && formData.address.length > 255) {
      newErrors.address = 'Address must be less than 255 characters';
    }

    if (formData.contact) {
      if (formData.contact.length > 50) {
        newErrors.contact = 'Contact must be less than 50 characters';
      } else if (!/^[\d+\-()\s]+$/.test(formData.contact)) {
        newErrors.contact = 'Contact must contain only numbers, spaces, and +()-';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Real-time validation on blur for better UX
    if (field === 'name' && formData.name.trim()) {
      validateForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Professional form submission initiated');
    console.log('📝 Form data:', formData);
    
    // Mark all fields as touched for comprehensive validation display
    const allTouched = {
      name: true,
      dyeingFirm: true,
      address: true,
      contact: true,
    };
    setTouched(allTouched);

    // Comprehensive validation
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      toast.error('Validation Error', {
        description: 'Please correct the highlighted fields and try again.',
        duration: 4000,
      });
      
      // Focus on first error field for better UX
      const firstErrorField = Object.keys(errors)[0] as keyof FormData;
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement;
        element?.focus();
      }
      return;
    }

    // Prevent double submission
    if (loading) {
      console.log('⚠️ Form already submitting, ignoring duplicate request');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📡 Sending professional API request...');
      
      const partyData = {
        name: formData.name.trim(),
        dyeingFirm: formData.dyeingFirm.trim() || undefined,
        address: formData.address.trim() || undefined,
        contact: formData.contact.trim() || undefined,
      };
      
      console.log('📦 Sanitized payload:', partyData);
      console.log('🌐 Target API:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/parties`);
      
      const response = await createParty(partyData);
      
      console.log('✅ Professional API response received:', response);
      
      const addedPartyName = partyData.name;
      setCreatedPartyName(addedPartyName);
      
      // Immediate professional feedback
      toast.success('🎉 Party Created!', {
        description: `${addedPartyName} has been successfully added to the system.`,
        duration: 2000,
      });
      
      // Show professional success confirmation dialog
      setShowSuccessDialog(true);
      
      // Professional form reset
      setFormData({
        name: '',
        dyeingFirm: '',
        address: '',
        contact: '',
      });
      setTouched({});
      setErrors({});
      
      console.log('✅ Form professionally reset and ready for next entry');
    } catch (err: any) {
      console.error('❌ Professional error handling:', err);
      console.error('❌ Response details:', err.response?.data);
      console.error('❌ Status code:', err.response?.status);
      console.error('❌ Request config:', err.config);
      
      let errorTitle = 'Failed to Create Party';
      let errorMessage = 'An unexpected error occurred while creating the party.';
      
      if (err.response?.status === 400) {
        errorTitle = 'Validation Error';
        errorMessage = err.response?.data?.message || 'Invalid party data provided.';
      } else if (err.response?.status === 409) {
        errorTitle = 'Duplicate Party';
        errorMessage = 'A party with this name already exists.';
      } else if (err.response?.status === 500) {
        errorTitle = 'Server Error';
        errorMessage = 'The server encountered an error. Please try again later.';
      } else if (err.code === 'ECONNREFUSED') {
        errorTitle = 'Connection Failed';
        errorMessage = 'Unable to connect to server. Please check if the server is running.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorTitle = 'Network Error';
        errorMessage = 'Please check your internet connection and try again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorTitle, {
        description: errorMessage,
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => {
            console.log('🔄 User initiated retry');
            // Focus back to name field for retry
            firstInputRef.current?.focus();
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add New Party</h2>
                <p className="text-white/80 text-sm">Create a new party profile</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Professional Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Party Name Field - Required */}
          <div className="space-y-2">
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4 text-purple-500" />
              Party Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={firstInputRef}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 
                  transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.name && touched.name 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/10' 
                    : 'border-gray-300 hover:border-gray-400'
                  }`}
                placeholder="Enter party name (e.g., ABC Textiles Ltd.)"
                autoComplete="organization"
                aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
                aria-invalid={errors.name && touched.name ? 'true' : 'false'}
              />
              {errors.name && touched.name && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.name && touched.name && (
              <p id="name-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Unique identifier for the party (2-100 characters)
            </p>
          </div>

          {/* Dyeing Firm Field - Optional */}
          <div className="space-y-2">
            <label htmlFor="dyeingFirm" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Building className="w-4 h-4 text-blue-500" />
              Dyeing Firm <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="dyeingFirm"
                name="dyeingFirm"
                value={formData.dyeingFirm}
                onChange={(e) => handleInputChange('dyeingFirm', e.target.value)}
                onBlur={() => handleBlur('dyeingFirm')}
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 
                  transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.dyeingFirm && touched.dyeingFirm 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/10' 
                    : 'border-gray-300 hover:border-gray-400'
                  }`}
                placeholder="Enter dyeing firm name (e.g., XYZ Dyeing Works)"
                autoComplete="organization"
                aria-describedby={errors.dyeingFirm && touched.dyeingFirm ? 'dyeingFirm-error' : undefined}
                aria-invalid={errors.dyeingFirm && touched.dyeingFirm ? 'true' : 'false'}
              />
              {errors.dyeingFirm && touched.dyeingFirm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.dyeingFirm && touched.dyeingFirm && (
              <p id="dyeingFirm-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.dyeingFirm}
              </p>
            )}
          </div>

          {/* Address Field - Optional */}
          <div className="space-y-2">
            <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4 text-green-500" />
              Address <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                disabled={loading}
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 
                  transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed resize-none
                  ${errors.address && touched.address 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/10' 
                    : 'border-gray-300 hover:border-gray-400'
                  }`}
                placeholder="Enter complete address..."
                autoComplete="street-address"
                aria-describedby={errors.address && touched.address ? 'address-error' : undefined}
                aria-invalid={errors.address && touched.address ? 'true' : 'false'}
              />
              {errors.address && touched.address && (
                <div className="absolute right-3 top-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.address && touched.address && (
              <p id="address-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.address}
              </p>
            )}
          </div>

          {/* Contact Field - Optional */}
          <div className="space-y-2">
            <label htmlFor="contact" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Phone className="w-4 h-4 text-orange-500" />
              Contact <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={(e) => handleInputChange('contact', e.target.value)}
                onBlur={() => handleBlur('contact')}
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 
                  transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.contact && touched.contact 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/10' 
                    : 'border-gray-300 hover:border-gray-400'
                  }`}
                placeholder="Enter contact number (e.g., +91 98765 43210)"
                autoComplete="tel"
                aria-describedby={errors.contact && touched.contact ? 'contact-error' : undefined}
                aria-invalid={errors.contact && touched.contact ? 'true' : 'false'}
              />
              {errors.contact && touched.contact && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.contact && touched.contact && (
              <p id="contact-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.contact}
              </p>
            )}
          </div>

          {/* Professional Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Party...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Party
                </>
              )}
            </button>
          </div>

          {/* Professional Keyboard Shortcuts Help */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700 pt-3">
            <p>💡 Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd> to close • <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd> to save</p>
          </div>
        </form>
      </div>

      {/* Professional Success Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        onConfirm={handleSuccessConfirm}
        title="Party Created Successfully!"
        message={`${createdPartyName} has been successfully added to the system. The party list will be updated automatically.`}
        confirmText="Continue"
        variant="success"
        icon={<CheckCircle className="w-6 h-6" />}
      />
    </>
  );
};

// Professional Default Export
export default AddPartyForm;
