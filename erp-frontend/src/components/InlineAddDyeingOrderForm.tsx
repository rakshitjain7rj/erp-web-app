import React, { useState, useEffect } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { 
  createCountProduct, 
  CreateCountProductRequest 
} from "../api/countProductApi";
import { getAllDyeingFirms, DyeingFirm } from "../api/dyeingFirmApi";

interface InlineAddDyeingOrderFormProps {
  onSuccess: (newProduct: any) => void;
  onCancel: () => void;
  currentFirm: string;
}

interface FormData {
  quantity: number;
  customerName: string;
  sentToDye: number;
  sentDate: string;
  received: number;
  receivedDate: string;
  dispatch: number;
  dispatchDate: string;
  partyName: string;
}

interface FormErrors {
  [key: string]: string;
}

export const InlineAddDyeingOrderForm: React.FC<InlineAddDyeingOrderFormProps> = ({
  onSuccess,
  onCancel,
  currentFirm
}) => {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    quantity: 0,
    customerName: "",
    sentToDye: 0,
    sentDate: new Date().toISOString().split('T')[0],
    received: 0,
    receivedDate: "",
    dispatch: 0,
    dispatchDate: "",
    partyName: ""
  });

  // Party dropdown state
  const [partyOptions, setPartyOptions] = useState<string[]>([]);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch party options from existing products or API
  useEffect(() => {
    const fetchPartyOptions = async () => {
      try {
        // You can replace this with actual party API if available
        const sampleParties = [
          "Global Yarn Traders",
          "Textile Hub Co",
          "Quality Yarn Solutions",
          "Metro Distribution",
          "Premier Textiles"
        ];
        setPartyOptions(sampleParties);
      } catch (error) {
        console.error("Failed to fetch party options:", error);
      }
    };
    fetchPartyOptions();
  }, []);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Quantity is required and must be greater than 0";
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }
    if (!formData.sentToDye || formData.sentToDye <= 0) {
      newErrors.sentToDye = "Sent to dye quantity is required and must be greater than 0";
    }
    if (!formData.sentDate) {
      newErrors.sentDate = "Sent date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // Handle party selection
  const handlePartySelect = (party: string) => {
    setFormData(prev => ({ ...prev, partyName: party }));
    setShowPartyDropdown(false);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    setIsSubmitting(true);
    try {
      const newCountProductData: CreateCountProductRequest = {
        partyName: formData.partyName || "Direct",
        dyeingFirm: currentFirm,
        yarnType: "Mixed", // Default value
        count: "Standard", // Default value
        shade: "As Required", // Default value
        quantity: formData.quantity,
        completedDate: new Date().toISOString().split('T')[0],
        qualityGrade: "A", // Default grade
        remarks: `Added via inline form - Customer: ${formData.customerName}`,
        lotNumber: `INL-${Date.now()}`, // Generate lot number
        processedBy: "System",
        customerName: formData.customerName,
        sentToDye: true,
        sentDate: formData.sentDate,
        received: formData.received > 0,
  receivedDate: formData.receivedDate || undefined,
        receivedQuantity: formData.received,
        dispatch: formData.dispatch > 0,
  dispatchDate: formData.dispatchDate || undefined,
        dispatchQuantity: formData.dispatch,
        middleman: formData.partyName || "Direct"
      };

      const createdProduct = await createCountProduct(newCountProductData);
      onSuccess(createdProduct);
      toast.success("Dyeing order added successfully!");
    } catch (error) {
      console.error("Failed to create dyeing order:", error);
      toast.error("Failed to add dyeing order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredParties = partyOptions.filter(party =>
    party.toLowerCase().includes(formData.partyName.toLowerCase())
  );

  return (
    <tr className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700">
      <td colSpan={10} className="px-4 py-3">
        <div className="grid grid-cols-10 gap-2 items-end">
          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Quantity *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="kg"
            />
            {errors.quantity && (
              <p className="text-xs text-red-500">{errors.quantity}</p>
            )}
          </div>

          {/* Customer Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Customer *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.customerName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Customer name"
            />
            {errors.customerName && (
              <p className="text-xs text-red-500">{errors.customerName}</p>
            )}
          </div>

          {/* Sent to Dye */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Sent to Dye *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.sentToDye}
              onChange={(e) => handleInputChange('sentToDye', parseFloat(e.target.value) || 0)}
              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.sentToDye ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="kg"
            />
            {errors.sentToDye && (
              <p className="text-xs text-red-500">{errors.sentToDye}</p>
            )}
          </div>

          {/* Sent Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Sent Date *
            </label>
            <input
              type="date"
              value={formData.sentDate}
              onChange={(e) => handleInputChange('sentDate', e.target.value)}
              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.sentDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.sentDate && (
              <p className="text-xs text-red-500">{errors.sentDate}</p>
            )}
          </div>

          {/* Received */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Received
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.received}
              onChange={(e) => handleInputChange('received', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="kg"
            />
          </div>

          {/* Received Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Received Date
            </label>
            <input
              type="date"
              value={formData.receivedDate}
              onChange={(e) => handleInputChange('receivedDate', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Dispatch */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Dispatch
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.dispatch}
              onChange={(e) => handleInputChange('dispatch', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="kg"
            />
          </div>

          {/* Dispatch Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Dispatch Date
            </label>
            <input
              type="date"
              value={formData.dispatchDate}
              onChange={(e) => handleInputChange('dispatchDate', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Party Name / Middleman */}
          <div className="space-y-1 relative">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Party / Middleman
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.partyName}
                onChange={(e) => {
                  handleInputChange('partyName', e.target.value);
                  setShowPartyDropdown(true);
                }}
                onFocus={() => setShowPartyDropdown(true)}
                onBlur={() => setTimeout(() => setShowPartyDropdown(false), 200)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-6"
                placeholder="Party name"
              />
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              
              {/* Dropdown */}
              {showPartyDropdown && (
                <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-b shadow-lg max-h-32 overflow-y-auto">
                  {filteredParties.length > 0 ? (
                    filteredParties.map((party, index) => (
                      <div
                        key={index}
                        className="px-2 py-1 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white"
                        onMouseDown={() => handlePartySelect(party)}
                      >
                        {party}
                      </div>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-sm text-gray-500">No matches found</div>
                  )}
                  {formData.partyName && !partyOptions.includes(formData.partyName) && (
                    <div
                      className="px-2 py-1 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-t border-gray-200 dark:border-gray-600"
                      onMouseDown={() => handlePartySelect(formData.partyName)}
                    >
                      + Add "{formData.partyName}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Actions
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" />
                {isSubmitting ? "..." : "Save"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-2 py-1 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};
