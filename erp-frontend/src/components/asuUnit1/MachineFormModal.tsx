import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, X } from 'lucide-react';

// Define types for form data
interface MachineFormData {
  machineNo: number | null;
  machineName: string;
  count: number;
  countDisplay: string;
  spindles: number | null;
  speed: number | null;
  yarnType: string;
  isActive: boolean;
  productionAt100: number | null;
}

interface MachineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: MachineFormData) => Promise<void>;
  loading: boolean;
  title?: string;
}

const yarnTypes = ['Cotton', 'PC', 'CVC', 'Tencel'];

const MachineFormModal: React.FC<MachineFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  title = "Add New Machine"
}) => {
  const [formData, setFormData] = useState<MachineFormData>({
    machineNo: null,
    machineName: '',
    count: 30,
    countDisplay: '30',
    spindles: null,
    speed: null,
    yarnType: 'Cotton',
    isActive: true,
    productionAt100: null // User must enter this value manually
  });
  
  // No need for yarn type focus state as buttons are always visible

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Initialize with default values when opening
      setFormData({
        machineNo: null,
        machineName: '',
        count: 30,
        countDisplay: '30',
        spindles: null,
        speed: null,
        yarnType: 'Cotton',
        isActive: true,
        productionAt100: null // User must enter this value manually
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if machine number is entered
    if (formData.machineNo === null) {
      alert('Please enter a machine number');
      return;
    }
    
    // Check if spindles and speed are entered
    if (formData.spindles === null) {
      alert('Please enter the number of spindles');
      return;
    }
    
    if (formData.speed === null) {
      alert('Please enter the speed (RPM)');
      return;
    }
    
    // Check if productionAt100 is entered
    if (formData.productionAt100 === null) {
      alert('Please enter the production at 100% efficiency value');
      return;
    }
    
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="px-4 py-3 border-b border-gray-200 bg-blue-50 dark:bg-blue-900/20 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-base font-medium text-blue-800 dark:text-blue-200">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              <div>
                <Label htmlFor="machineNo" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Machine Number</Label>
                <Input
                  id="machineNo"
                  type="number"
                  value={formData.machineNo || ''}
                  placeholder="Enter machine number"
                  onChange={(e) => {
                    const rawValue = e.target.value.trim();
                    
                    if (rawValue) {
                      const num = parseInt(rawValue, 10);
                      
                      setFormData({ 
                        ...formData, 
                        machineNo: num,
                        // Only update machine name if it's empty or matches the previous pattern
                        machineName: !formData.machineName || formData.machineName === `Machine ${formData.machineNo}` 
                          ? `Machine ${num}` 
                          : formData.machineName
                      });
                    } else {
                      // If input is empty, set machineNo to null
                      setFormData({
                        ...formData,
                        machineNo: null
                      });
                    }
                  }}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="machineName" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Machine Name</Label>
                <Input
                  id="machineName"
                  type="text"
                  value={formData.machineName}
                  placeholder="Enter machine name"
                  onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  required
                />
              </div>

              <div>
                <Label htmlFor="count" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Count</Label>
                <Input
                  id="count"
                  type="text"
                  value={formData.countDisplay || ''}
                  onChange={(e) => {
                    const displayValue = e.target.value;
                    // Extract numeric part for the actual count (supports decimals)
                    const numericMatch = displayValue.match(/^\d*\.?\d+/);
                    const numericValue = numericMatch ? parseFloat(numericMatch[0]) : 30;
                    
                    setFormData({ 
                      ...formData, 
                      count: numericValue, // Store the numeric (can be decimal)
                      countDisplay: displayValue // Store the full string for display
                    });
                  }}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter count (e.g. 30s or 0.65)"
                  required
                />
              </div>

              <div>
                <Label htmlFor="yarnType" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Yarn Type</Label>
                <div className="relative">
                  <Input
                    id="yarnType"
                    type="text"
                    value={formData.yarnType}
                    onChange={(e) => setFormData({ ...formData, yarnType: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    placeholder="Enter yarn type or select below"
                  />
                  {/* Quick select buttons - always visible below the input */}
                  <div className="w-full mt-1 border border-gray-200 dark:border-gray-700 rounded p-2 bg-gray-50 dark:bg-gray-800">
                    <div className="flex flex-wrap gap-1">
                      {yarnTypes.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, yarnType: type });
                          }}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="spindles" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Spindles</Label>
                <Input
                  id="spindles"
                  type="number"
                  value={formData.spindles || ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setFormData({ 
                      ...formData, 
                      spindles: val ? parseInt(val) : null 
                    });
                  }}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter spindles count"
                  required
                />
              </div>

              <div>
                <Label htmlFor="speed" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Speed (RPM)</Label>
                <Input
                  id="speed"
                  type="number"
                  step="0.01"
                  value={formData.speed || ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setFormData({ 
                      ...formData, 
                      speed: val ? parseFloat(val) : null 
                    });
                  }}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter speed in RPM"
                  required
                />
              </div>

              <div>
                <Label htmlFor="productionAt100" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Production at 100% Efficiency</Label>
                <Input
                  id="productionAt100"
                  type="number"
                  step="0.00001"
                  value={formData.productionAt100 !== null ? formData.productionAt100 : ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setFormData({ 
                      ...formData, 
                      productionAt100: val ? parseFloat(val) : null
                    });
                  }}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter production at 100%"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-400"
                  />
                  <Label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="px-3 py-2 text-sm font-medium"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white transition-all duration-200 rounded-md bg-blue-600 hover:bg-blue-700" 
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                {loading ? 'Adding...' : 'Add Machine'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MachineFormModal;
