import React, { useState, useEffect } from 'react';
import { X, Users, Save, Loader2 } from 'lucide-react';
import { updateParty, getPartyDetails } from '../api/partyApi';
import { toast } from 'sonner';

interface EditPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyName: string;
  onSuccess: () => void;
  dyeingFirms?: string[]; // Optional: firms from listing to display if API lacks it
}

interface PartyFormData {
  name: string;
  dyeingFirm: string;
  address: string;
  contact: string;
  totalOrders?: number;
  totalYarn?: number;
  pendingYarn?: number;
  reprocessingYarn?: number;
  arrivedYarn?: number;
}

const EditPartyModal: React.FC<EditPartyModalProps> = ({
  isOpen,
  onClose,
  partyName,
  onSuccess,
  dyeingFirms
}) => {
  const [formData, setFormData] = useState<PartyFormData>({
    name: '',
    dyeingFirm: '',
    address: '',
  contact: '',
  totalOrders: undefined,
  totalYarn: undefined,
  pendingYarn: undefined,
  reprocessingYarn: undefined,
  arrivedYarn: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<PartyFormData>>({});

  useEffect(() => {
    if (isOpen && partyName) {
      fetchPartyDetails();
    }
  }, [isOpen, partyName]);

  const fetchPartyDetails = async () => {
    setLoading(true);
    try {
      const details = await getPartyDetails(partyName);
  const profile = (details && (details.party || {})) as { address?: string; contact?: string; dyeingFirm?: string; name?: string };
      setFormData({
    name: (details.partyName || profile.name || partyName),
    dyeingFirm: (profile.dyeingFirm || details.dyeingFirm || (Array.isArray(dyeingFirms) && dyeingFirms.length ? dyeingFirms.join(', ') : '')),
    address: (profile.address || details.address || ''),
  contact: (profile.contact || details.phone || ''),
  totalOrders: details.summary?.totalOrders ?? details.totalOrders,
  totalYarn: details.summary?.totalYarn ?? details.totalYarn,
  pendingYarn: details.summary?.pendingYarn ?? details.pendingYarn,
  reprocessingYarn: details.summary?.reprocessingYarn ?? details.reprocessingYarn,
  arrivedYarn: details.summary?.arrivedYarn ?? details.arrivedYarn,
      });
    } catch (err) {
      console.error('Error fetching party details:', err);
      // Set default values with current party name
      setFormData({
        name: partyName,
  dyeingFirm: (Array.isArray(dyeingFirms) && dyeingFirms.length ? dyeingFirms.join(', ') : ''),
        address: '',
  contact: '',
  totalOrders: undefined,
  totalYarn: undefined,
  pendingYarn: undefined,
  reprocessingYarn: undefined,
  arrivedYarn: undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PartyFormData> = {};
    const numericFields: (keyof PartyFormData)[] = ['totalOrders','totalYarn','pendingYarn','reprocessingYarn','arrivedYarn'];
    for (const f of numericFields) {
      const v = formData[f] as number | undefined;
      if (v !== undefined && v !== null && isNaN(Number(v))) {
        newErrors[f] = 'Must be a number' as any;
      }
    }

    if (formData.contact && !/^\d{10}$/.test(formData.contact.replace(/\D/g, ''))) {
      newErrors.contact = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await updateParty(partyName, {
        address: formData.address.trim() || undefined,
  contact: formData.contact.trim() || undefined,
  totalOrders: formData.totalOrders,
  totalYarn: formData.totalYarn,
  pendingYarn: formData.pendingYarn,
  reprocessingYarn: formData.reprocessingYarn,
  arrivedYarn: formData.arrivedYarn,
      });

      toast.success('Party updated successfully!', {
        description: `${formData.name} has been updated.`
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating party:', error);
      toast.error('Failed to update party', {
        description: error.response?.data?.message || 'Please try again later.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PartyFormData, value: string) => {
  // Cast numeric fields
  const numericFields: (keyof PartyFormData)[] = ['totalOrders','totalYarn','pendingYarn','reprocessingYarn','arrivedYarn'];
  const castValue = numericFields.includes(field) ? (value === '' ? undefined : Number(value)) : value;
  setFormData(prev => ({ ...prev, [field]: castValue as any }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e as any);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all duration-300 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Edit Party</h2>
                <p className="text-purple-100">{partyName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

  {/* Content */}
  <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading party details...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
              {/* Party Name (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Party Name
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  {formData.name || partyName}
                </div>
              </div>

              {/* Dyeing Firm (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dyeing Firm
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  {formData.dyeingFirm || '-'}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Enter complete address"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors dark:bg-gray-700 dark:text-white ${
                    errors.contact
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600'
                  }`}
                  placeholder="Enter 10-digit contact number"
                />
                {errors.contact && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contact}</p>
                )}
              </div>

              {/* Editable Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Orders</label>
                  <input type="number" value={formData.totalOrders ?? ''} onChange={(e)=>handleInputChange('totalOrders', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Yarn</label>
                  <input type="number" step="0.01" value={formData.totalYarn ?? ''} onChange={(e)=>handleInputChange('totalYarn', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pending</label>
                  <input type="number" step="0.01" value={formData.pendingYarn ?? ''} onChange={(e)=>handleInputChange('pendingYarn', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reprocessing</label>
                  <input type="number" step="0.01" value={formData.reprocessingYarn ?? ''} onChange={(e)=>handleInputChange('reprocessingYarn', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Completed</label>
                  <input type="number" step="0.01" value={formData.arrivedYarn ?? ''} onChange={(e)=>handleInputChange('arrivedYarn', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="0.00" />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Party
                    </>
                  )}
                </button>
              </div>

              {/* Keyboard Shortcut Hint */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> to cancel, 
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs ml-1">Ctrl+Enter</kbd> to save
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditPartyModal;
