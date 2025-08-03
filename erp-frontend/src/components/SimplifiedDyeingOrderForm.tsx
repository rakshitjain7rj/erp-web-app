import React, { useState, useRef, useEffect } from "react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { createDyeingRecord } from "../api/dyeingApi";
import { CreateDyeingRecordRequest } from "../types/dyeing";
import { Button } from "./ui/Button";
import { X, ChevronDown, Check, Package, Calendar, Plus } from "lucide-react";

// Simplified data structure for business-friendly form (matches CountProduct structure)
interface SimplifiedDyeingOrderData {
  quantity: number;              // Total quantity ordered
  customerName: string;          // Customer/client name
  sentToDye: number;            // Quantity sent to dyeing (matches count product pattern)
  sentDate: string;             // Date when sent to dyeing
  received: number;             // Quantity received back
  receivedDate?: string;        // Date when received back
  dispatch: number;             // Quantity dispatched
  dispatchDate?: string;        // Date when dispatched
  dyeingFirm: string;           // Dyeing firm name
  partyName?: string;           // Party name (optional)
  remarks?: string;             // Additional notes
  // Keep technical fields for API compatibility
  yarnType: string;             // Type of yarn (required by API)
  shade: string;                // Color/shade (required by API)
  count: string;                // Yarn count (required by API)
  lot: string;                  // Lot number (required by API)
  expectedArrivalDate: string;  // Expected return date
}

interface SimplifiedDyeingOrderFormProps {
  onSuccess: (orderData: SimplifiedDyeingOrderData) => void;
  orderToEdit?: SimplifiedDyeingOrderData | null;
  onCancel?: () => void;
}

const SimplifiedDyeingOrderForm: React.FC<SimplifiedDyeingOrderFormProps> = ({
  onSuccess,
  orderToEdit,
  onCancel,
}) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultExpectedDate = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const initialState: SimplifiedDyeingOrderData = {
    quantity: 0,
    customerName: "",
    sentToDye: 0,
    sentDate: today,
    received: 0,
    receivedDate: "",
    dispatch: 0,
    dispatchDate: "",
    dyeingFirm: "",
    partyName: "",
    remarks: "",
    // Technical fields for API
    yarnType: "",
    shade: "",
    count: "",
    lot: "",
    expectedArrivalDate: defaultExpectedDate,
  };

  const [formData, setFormData] = useState<SimplifiedDyeingOrderData>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dyeing Firm dropdown states
  const [showFirmDropdown, setShowFirmDropdown] = useState(false);
  const [firmFilter, setFirmFilter] = useState("");
  const [selectedFirmIndex, setSelectedFirmIndex] = useState(-1);
  const firmDropdownRef = useRef<HTMLDivElement>(null);

  // Common dyeing firms
  const commonDyeingFirms = [
    "Premium Dye Works",
    "Color Masters Ltd",
    "Rainbow Dyeing Co",
    "Professional Dyers",
    "Elite Color Solutions",
    "Modern Dyeing Mills",
    "Quality Dye House",
    "Artistic Colors Inc",
    "Spectrum Dyeing",
    "Advanced Color Tech"
  ];

  // Filter firms based on input
  const filteredFirms = commonDyeingFirms.filter(firm =>
    firm.toLowerCase().includes(firmFilter.toLowerCase())
  );

  useEffect(() => {
    if (orderToEdit) {
      setFormData(orderToEdit);
      setFirmFilter(orderToEdit.dyeingFirm);
    } else {
      setFormData(initialState);
      setFirmFilter("");
    }
    setErrors({});
  }, [orderToEdit]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (firmDropdownRef.current && !firmDropdownRef.current.contains(event.target as Node)) {
        setShowFirmDropdown(false);
        setSelectedFirmIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number fields
    if (name === "quantity" || name === "sentToDye" || name === "received" || name === "dispatch") {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } 
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleFirmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFirmFilter(value);
    setFormData(prev => ({ ...prev, dyeingFirm: value }));
    setShowFirmDropdown(true);
    setSelectedFirmIndex(-1);

    // Clear error when user starts typing
    if (errors.dyeingFirm) {
      const newErrors = { ...errors };
      delete newErrors.dyeingFirm;
      setErrors(newErrors);
    }
  };

  const handleFirmKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showFirmDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedFirmIndex(prev => 
          prev < filteredFirms.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedFirmIndex(prev => 
          prev > 0 ? prev - 1 : filteredFirms.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedFirmIndex >= 0 && filteredFirms[selectedFirmIndex]) {
          selectFirm(filteredFirms[selectedFirmIndex]);
        }
        break;
      case "Escape":
        setShowFirmDropdown(false);
        setSelectedFirmIndex(-1);
        break;
    }
  };

  const selectFirm = (firm: string) => {
    setFormData(prev => ({ ...prev, dyeingFirm: firm }));
    setFirmFilter(firm);
    setShowFirmDropdown(false);
    setSelectedFirmIndex(-1);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Primary business fields validation
    if (!formData.customerName?.trim()) {
      newErrors.customerName = "Customer name is required";
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Quantity is required and must be greater than 0";
    }

    if (!formData.sentToDye || formData.sentToDye <= 0) {
      newErrors.sentToDye = "Sent to dye quantity is required and must be greater than 0";
    }

    if (!formData.dyeingFirm?.trim()) {
      newErrors.dyeingFirm = "Dyeing firm is required";
    }

    if (!formData.sentDate) {
      newErrors.sentDate = "Sent date is required";
    }

    // Technical fields validation - only validate if any are filled (not all required if user doesn't expand section)
    const technicalFieldsFilled = formData.yarnType || formData.shade || formData.count || formData.lot;
    
    if (technicalFieldsFilled) {
      // If user started filling technical fields, then all are required
      if (!formData.yarnType?.trim()) {
        newErrors.yarnType = "Yarn type is required when technical details are provided";
      }

      if (!formData.shade?.trim()) {
        newErrors.shade = "Shade is required when technical details are provided";
      }

      if (!formData.count?.trim()) {
        newErrors.count = "Count is required when technical details are provided";
      }

      if (!formData.lot?.trim()) {
        newErrors.lot = "Lot number is required when technical details are provided";
      }

      if (!formData.expectedArrivalDate) {
        newErrors.expectedArrivalDate = "Expected arrival date is required when technical details are provided";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create enhanced remarks that include tracking information
      const trackingInfo = [];
      if (formData.received > 0) {
        trackingInfo.push(`Received: ${formData.received}kg${formData.receivedDate ? ` on ${formData.receivedDate}` : ''}`);
      }
      if (formData.dispatch > 0) {
        trackingInfo.push(`Dispatched: ${formData.dispatch}kg${formData.dispatchDate ? ` on ${formData.dispatchDate}` : ''}`);
      }
      if (formData.partyName) {
        trackingInfo.push(`Middleman: ${formData.partyName}`);
      }
      
      const enhancedRemarks = [
        formData.remarks,
        ...trackingInfo
      ].filter(Boolean).join(' | ');

      // Create the dyeing record using the API (with only supported fields)
      const dyeingRecordData: CreateDyeingRecordRequest = {
        yarnType: formData.yarnType || "Standard", // Provide default if empty
        sentDate: formData.sentDate,
        expectedArrivalDate: formData.expectedArrivalDate || formData.sentDate, // Use sent date as fallback
        remarks: enhancedRemarks,
        partyName: formData.customerName, // Map customerName to partyName for API
        quantity: formData.quantity,
        shade: formData.shade || "Natural", // Provide default if empty
        count: formData.count || "Standard", // Provide default if empty
        lot: formData.lot || `LOT-${Date.now()}`, // Generate lot number if empty
        dyeingFirm: formData.dyeingFirm,
      };

      const result = await createDyeingRecord(dyeingRecordData);
      
      // Create the complete order data for the success callback
      const completeOrderData = {
        ...formData,
        // Include API response data
        id: result?.id || Date.now(),
        // Map form fields to expected display names
        partyName: formData.customerName,
        // Store tracking fields for display
        receivedQuantity: formData.received,
        dispatchQuantity: formData.dispatch,
        middleman: formData.partyName || "Direct",
        // Technical fields with defaults
        yarnType: formData.yarnType || "Standard",
        shade: formData.shade || "Natural",
        count: formData.count || "Standard",
        lot: formData.lot || `LOT-${Date.now()}`,
        // Enhanced remarks with tracking info
        remarks: enhancedRemarks,
        // Add metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      onSuccess(completeOrderData);
      toast.success(orderToEdit ? "Order updated successfully!" : "Order created successfully!");
      handleReset();
    } catch (error) {
      console.error("Failed to submit order:", error);
      toast.error("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialState);
    setFirmFilter("");
    setErrors({});
    setShowFirmDropdown(false);
    setSelectedFirmIndex(-1);
  };

  const handleCancel = () => {
    handleReset();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-center mb-4">
        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
          {orderToEdit ? 'Edit Dyeing Order' : 'Add New Dyeing Order'}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Row - Required Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Quantity (kg) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="quantity"
              value={formData.quantity || ""}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                errors.quantity 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="0.00"
            />
            {errors.quantity && (
              <p className="text-xs text-red-500">{errors.quantity}</p>
            )}
          </div>

          {/* Customer Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Customer Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                errors.customerName 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter customer name"
            />
            {errors.customerName && (
              <p className="text-xs text-red-500">{errors.customerName}</p>
            )}
          </div>

          {/* Sent to Dye */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Sent to Dye (kg) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="sentToDye"
              value={formData.sentToDye || ""}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                errors.sentToDye 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="0.00"
            />
            {errors.sentToDye && (
              <p className="text-xs text-red-500">{errors.sentToDye}</p>
            )}
          </div>

          {/* Sent Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Sent Date *
            </label>
            <div className="relative">
              <input
                type="date"
                name="sentDate"
                value={formData.sentDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.sentDate 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.sentDate && (
              <p className="text-xs text-red-500">{errors.sentDate}</p>
            )}
          </div>
        </div>

        {/* Second Row - Process Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Received */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Received (kg)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="received"
              value={formData.received || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="0.00"
            />
          </div>

          {/* Received Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Received Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="receivedDate"
                value={formData.receivedDate || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Dispatch */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Dispatch (kg)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="dispatch"
              value={formData.dispatch || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="0.00"
            />
          </div>

          {/* Dispatch Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Dispatch Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="dispatchDate"
                value={formData.dispatchDate || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Third Row - Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dyeing Firm */}
          <div className="space-y-1 relative">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Dyeing Firm *
            </label>
            <div className="relative" ref={firmDropdownRef}>
              <input
                type="text"
                value={firmFilter}
                onChange={handleFirmInputChange}
                onKeyDown={handleFirmKeyDown}
                onFocus={() => setShowFirmDropdown(true)}
                onBlur={() => setTimeout(() => setShowFirmDropdown(false), 200)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors pr-8 ${
                  errors.dyeingFirm 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter or select dyeing firm"
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              
              {showFirmDropdown && filteredFirms.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredFirms.map((firm, index) => (
                    <div
                      key={index}
                      className={`px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white ${
                        index === selectedFirmIndex ? 'bg-blue-100 dark:bg-blue-900' : ''
                      }`}
                      onMouseDown={() => selectFirm(firm)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{firm}</span>
                        {index === selectedFirmIndex && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                  {firmFilter.trim() && 
                   !filteredFirms.some(firm => firm.toLowerCase() === firmFilter.toLowerCase()) && (
                    <div
                      className="px-3 py-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 border-t border-gray-200 dark:border-gray-600 flex items-center font-medium"
                      onMouseDown={() => selectFirm(firmFilter)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create "{firmFilter}"
                    </div>
                  )}
                  {/* Always show manual add option */}
                  <div
                    className="px-3 py-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 border-t border-gray-200 dark:border-gray-600 flex items-center font-medium"
                    onMouseDown={() => {
                      const firmName = prompt("Enter new dyeing firm name:");
                      if (firmName && firmName.trim()) {
                        selectFirm(firmName.trim());
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Firm
                  </div>
                </div>
              )}
            </div>
            {errors.dyeingFirm && (
              <p className="text-xs text-red-500">{errors.dyeingFirm}</p>
            )}
          </div>

          {/* Party Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Party Name
            </label>
            <input
              type="text"
              name="partyName"
              value={formData.partyName || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="Enter party name (optional)"
            />
          </div>
        </div>

        {/* Fourth Row - Technical Details (Collapsed Section) */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Technical Details (Required for API)</span>
              <ChevronDown className="w-4 h-4 transform group-open:rotate-180 transition-transform" />
            </summary>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Yarn Type */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Yarn Type *
                </label>
                <input
                  type="text"
                  name="yarnType"
                  value={formData.yarnType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.yarnType 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter yarn type"
                />
                {errors.yarnType && (
                  <p className="text-xs text-red-500">{errors.yarnType}</p>
                )}
              </div>

              {/* Shade */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Shade *
                </label>
                <input
                  type="text"
                  name="shade"
                  value={formData.shade}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.shade 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter shade/color"
                />
                {errors.shade && (
                  <p className="text-xs text-red-500">{errors.shade}</p>
                )}
              </div>

              {/* Count */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Count *
                </label>
                <input
                  type="text"
                  name="count"
                  value={formData.count}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.count 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter count"
                />
                {errors.count && (
                  <p className="text-xs text-red-500">{errors.count}</p>
                )}
              </div>

              {/* Lot */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Lot Number *
                </label>
                <input
                  type="text"
                  name="lot"
                  value={formData.lot}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.lot 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter lot number"
                />
                {errors.lot && (
                  <p className="text-xs text-red-500">{errors.lot}</p>
                )}
              </div>
            </div>

            {/* Expected Arrival Date */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Expected Arrival *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="expectedArrivalDate"
                    value={formData.expectedArrivalDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                      errors.expectedArrivalDate 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.expectedArrivalDate && (
                  <p className="text-xs text-red-500">{errors.expectedArrivalDate}</p>
                )}
              </div>
            </div>
          </details>
        </div>

        {/* Remarks */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
            Remarks
          </label>
          <textarea
            name="remarks"
            value={formData.remarks || ""}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
            placeholder="Additional notes (optional)"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting}
            className="px-6"
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {orderToEdit ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {orderToEdit ? 'Update Order' : 'Submit Order'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SimplifiedDyeingOrderForm;
