import React, { useEffect, useState, useRef } from "react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { createDyeingRecord, updateDyeingRecord, getAllDyeingRecords } from "../api/dyeingApi";
import { getAllDyeingFirms, findOrCreateDyeingFirm, DyeingFirm } from "../api/dyeingFirmApi";
import { CreateDyeingRecordRequest, DyeingRecord } from "../types/dyeing";
import { Button } from "./ui/Button";
import { X, ChevronDown, Check } from "lucide-react";
import { syncDyeingFirms } from '../utils/dyeingFirmsSync';

interface CreateDyeingOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: DyeingRecord) => void;
  recordToEdit?: DyeingRecord | null;
}

const CreateDyeingOrderForm: React.FC<CreateDyeingOrderFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  recordToEdit,
}) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultExpectedDate = format(addDays(new Date(), 7), "yyyy-MM-dd");  const initialState: CreateDyeingRecordRequest = {
    yarnType: "",
    sentDate: today,
    expectedArrivalDate: defaultExpectedDate,
    remarks: "",
    partyName: "",
    quantity: 0,
    shade: "",
    count: "",
    lot: "",
    dyeingFirm: "",
  };

  const [formData, setFormData] = useState<CreateDyeingRecordRequest>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateDyeingRecordRequest>>({});
  
  // Dyeing Firm Combobox States
  const [showDyeingFirmDropdown, setShowDyeingFirmDropdown] = useState(false);
  const [dyeingFirmFilter, setDyeingFirmFilter] = useState("");
  const [selectedDyeingFirmIndex, setSelectedDyeingFirmIndex] = useState(-1);
  const [existingDyeingFirms, setExistingDyeingFirms] = useState<DyeingFirm[]>([]);
  const [isLoadingFirms, setIsLoadingFirms] = useState(false);
  
  // Ref for dropdown container to handle clicks
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch existing dyeing firms from centralized API
  const fetchExistingDyeingFirms = async () => {
    try {
      setIsLoadingFirms(true);
      console.log('🔄 Fetching dyeing firms from centralized API...');
      // Use centralized DyeingFirm API instead of extracting from records
      const dyeingFirms = await getAllDyeingFirms();
      console.log(`✅ Fetched ${dyeingFirms.length} dyeing firms:`, dyeingFirms.map(f => f.name));
      setExistingDyeingFirms(dyeingFirms);
    } catch (error) {
      console.error("❌ Failed to fetch dyeing firms from API:", error);
      console.log("🔄 Falling back to extracting from dyeing records...");
      
      try {
        // Fallback: Extract from existing dyeing records
        const allRecords = await getAllDyeingRecords();
        const uniqueFirmNames = Array.from(
          new Set(
            allRecords
              .map(record => record.dyeingFirm)
              .filter(firm => firm && firm.trim() !== "")
              .map(firm => firm.trim())
          )
        ).sort();
        
        console.log(`📋 Fallback: Found ${uniqueFirmNames.length} unique firms from records:`, uniqueFirmNames);
        
        // Convert to DyeingFirm format for consistency
        const fallbackFirms: DyeingFirm[] = uniqueFirmNames.map((name, index) => ({
          id: -(index + 1), // Negative IDs for fallback data
          name,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        setExistingDyeingFirms(fallbackFirms);
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
        setExistingDyeingFirms([]);
      }
    } finally {
      setIsLoadingFirms(false);
    }
  };  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        yarnType: recordToEdit.yarnType || "",
        sentDate: format(new Date(recordToEdit.sentDate), "yyyy-MM-dd"),
        expectedArrivalDate: format(new Date(recordToEdit.expectedArrivalDate), "yyyy-MM-dd"),
        remarks: recordToEdit.remarks || "",
        partyName: recordToEdit.partyName || "",
        quantity: recordToEdit.quantity || 0,
        shade: recordToEdit.shade || "",
        count: recordToEdit.count || "",
        lot: recordToEdit.lot || "",
        dyeingFirm: recordToEdit.dyeingFirm || "",
      });
      setDyeingFirmFilter(recordToEdit.dyeingFirm || "");
    } else {
      setFormData({
        yarnType: "",
        sentDate: today,
        expectedArrivalDate: defaultExpectedDate,
        remarks: "",
        partyName: "",
        quantity: 0,
        shade: "",
        count: "",
        lot: "",
        dyeingFirm: "",
      });
      setDyeingFirmFilter("");
    }
    setShowDyeingFirmDropdown(false);
    setSelectedDyeingFirmIndex(-1);
    
    // Fetch existing dyeing firms when form opens
    if (isOpen) {
      console.log('📖 Form opened, fetching dyeing firms...');
      fetchExistingDyeingFirms();
    } else {
      console.log('📝 Form closed');
    }
  }, [recordToEdit, isOpen, today, defaultExpectedDate]);  const validateForm = (): boolean => {
    const newErrors: Partial<CreateDyeingRecordRequest> = {};
    const sentDate = new Date(formData.sentDate);
    const expectedDate = new Date(formData.expectedArrivalDate);

    if (!formData.yarnType.trim()) newErrors.yarnType = "Yarn type is required";
    if (!formData.partyName.trim()) newErrors.partyName = "Party name is required";
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0" as any;
    if (!formData.shade.trim()) newErrors.shade = "Shade is required";
    if (!formData.count.trim()) newErrors.count = "Count is required";
    if (!formData.lot.trim()) newErrors.lot = "Lot is required";
    if (!formData.dyeingFirm.trim()) newErrors.dyeingFirm = "Dyeing firm is required";
    if (!formData.sentDate) newErrors.sentDate = "Sent date is required";
    else if (sentDate > new Date()) newErrors.sentDate = "Sent date cannot be in the future";
    if (!formData.expectedArrivalDate) newErrors.expectedArrivalDate = "Expected arrival date is required";
    else if (expectedDate <= sentDate) newErrors.expectedArrivalDate = "Must be after sent date";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return toast.error("Please fix the errors");

    setIsSubmitting(true);
    try {
      // First, ensure the dyeing firm is saved to the centralized system
      if (formData.dyeingFirm && formData.dyeingFirm.trim()) {
        try {
          console.log(`🏭 Creating/finding dyeing firm: "${formData.dyeingFirm.trim()}"`);
          const firmResult = await findOrCreateDyeingFirm({ 
            name: formData.dyeingFirm.trim() 
          });
          
          if (firmResult.created) {
            console.log(`✨ New dyeing firm created: "${firmResult.data.name}"`);
            toast.success(`Dyeing firm "${firmResult.data.name}" created and saved!`);
            
            // Notify other pages about the new firm
            console.log('📡 Notifying other pages about new firm:', firmResult.data);
            syncDyeingFirms.notifyFirmAdded(firmResult.data, 'dyeing-orders');
            
            // Refresh the firms list to include the new firm
            console.log('🔄 Refreshing dyeing firms list after creation...');
            await fetchExistingDyeingFirms();
          } else {
            console.log(`📋 Existing dyeing firm found: "${firmResult.data.name}"`);
          }
        } catch (firmError) {
          console.warn("⚠️ Failed to save dyeing firm to centralized system:", firmError);
          // Continue with dyeing record creation even if firm save fails
        }
      }

      // Create or update the dyeing record
      let result: DyeingRecord;
      if (recordToEdit?.id) {
        result = await updateDyeingRecord(recordToEdit.id, formData);
        toast.success("Dyeing order updated!");
      } else {
        result = await createDyeingRecord(formData);
        toast.success("Dyeing order created!");
      }
      
      onSuccess(result);
      handleClose();
    } catch (error: unknown) {
      console.error("Save failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Operation failed";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };  const handleClose = () => {
    setFormData({
      yarnType: "",
      sentDate: today,
      expectedArrivalDate: defaultExpectedDate,
      remarks: "",
      partyName: "",
      quantity: 0,
      shade: "",
      count: "",
      lot: "",
      dyeingFirm: "",
    });
    setErrors({});
    setDyeingFirmFilter("");
    setShowDyeingFirmDropdown(false);
    setSelectedDyeingFirmIndex(-1);
    onClose();
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle quantity as number
    if (name === "quantity") {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof CreateDyeingRecordRequest]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (name === "sentDate" && value && !recordToEdit) {
      const sentDate = new Date(value);
      const suggested = format(addDays(sentDate, 7), "yyyy-MM-dd");
      setFormData(prev => ({
        ...prev,
        sentDate: value,
        expectedArrivalDate: suggested,
      }));
    }
  };

  // Dyeing Firm Combobox Handlers
  const filteredDyeingFirms = existingDyeingFirms.filter(firm =>
    firm.name.toLowerCase().includes(dyeingFirmFilter.toLowerCase())
  );

  const handleDyeingFirmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDyeingFirmFilter(value);
    setFormData(prev => ({ ...prev, dyeingFirm: value }));
    setShowDyeingFirmDropdown(true);
    setSelectedDyeingFirmIndex(-1);

    if (errors.dyeingFirm) {
      setErrors(prev => ({ ...prev, dyeingFirm: undefined }));
    }
  };

  const handleDyeingFirmSelect = (firm: DyeingFirm) => {
    console.log('🎯 Selecting firm:', firm.name); // Debug log
    setDyeingFirmFilter(firm.name);
    setFormData(prev => ({ ...prev, dyeingFirm: firm.name }));
    setShowDyeingFirmDropdown(false);
    setSelectedDyeingFirmIndex(-1);
    
    if (errors.dyeingFirm) {
      setErrors(prev => ({ ...prev, dyeingFirm: undefined }));
    }
  };

  const handleDyeingFirmKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDyeingFirmDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedDyeingFirmIndex(prev => 
          prev < filteredDyeingFirms.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedDyeingFirmIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedDyeingFirmIndex >= 0) {
          handleDyeingFirmSelect(filteredDyeingFirms[selectedDyeingFirmIndex]);
        }
        break;
      case 'Escape':
        setShowDyeingFirmDropdown(false);
        setSelectedDyeingFirmIndex(-1);
        break;
    }
  };

  const handleDyeingFirmBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if the click is inside the dropdown
    if (dropdownRef.current && dropdownRef.current.contains(e.relatedTarget as Node)) {
      return; // Don't close if clicking inside dropdown
    }
    
    // Delay closing to allow for option click
    setTimeout(() => {
      setShowDyeingFirmDropdown(false);
      setSelectedDyeingFirmIndex(-1);
    }, 200);
  };

  if (!isOpen) return null;

  return (    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {recordToEdit ? "Edit Dyeing Order" : "Create New Dyeing Order"}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="partyName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Party Name <span className="text-red-500">*</span>
              </label>
              <input
                id="partyName"
                name="partyName"
                type="text"
                value={formData.partyName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.partyName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., ABC Textiles"
              />
              {errors.partyName && <p className="text-red-600 text-sm">{errors.partyName}</p>}
            </div>

            <div>
              <label htmlFor="yarnType" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Yarn Type <span className="text-red-500">*</span>
              </label>
              <input
                id="yarnType"
                name="yarnType"
                type="text"
                value={formData.yarnType}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.yarnType ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Cotton Yarn"
              />
              {errors.yarnType && <p className="text-red-600 text-sm">{errors.yarnType}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="quantity" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.quantity ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 100.5"
              />
              {errors.quantity && <p className="text-red-600 text-sm">{errors.quantity}</p>}
            </div>

            <div>
              <label htmlFor="shade" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Shade <span className="text-red-500">*</span>
              </label>
              <input
                id="shade"
                name="shade"
                type="text"
                value={formData.shade}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.shade ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Navy Blue"
              />
              {errors.shade && <p className="text-red-600 text-sm">{errors.shade}</p>}
            </div>

            <div>
              <label htmlFor="count" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Count <span className="text-red-500">*</span>
              </label>
              <input
                id="count"
                name="count"
                type="text"
                value={formData.count}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.count ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 30s"
              />
              {errors.count && <p className="text-red-600 text-sm">{errors.count}</p>}
            </div>
          </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lot" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Lot <span className="text-red-500">*</span>
              </label>
              <input
                id="lot"
                name="lot"
                type="text"
                value={formData.lot}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                  errors.lot ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., LOT001"
              />
              {errors.lot && <p className="text-red-600 text-sm">{errors.lot}</p>}
            </div>

            <div>
              <label htmlFor="dyeingFirm" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Dyeing Firm <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="dyeingFirm"
                  name="dyeingFirm"
                  type="text"
                  value={dyeingFirmFilter}
                  onChange={handleDyeingFirmInputChange}
                  onKeyDown={handleDyeingFirmKeyDown}
                  onBlur={handleDyeingFirmBlur}
                  onFocus={() => setShowDyeingFirmDropdown(true)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white ${
                    errors.dyeingFirm ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder={isLoadingFirms ? "Loading existing firms..." : "Type firm name or select from existing"}
                  autoComplete="off"
                  disabled={isLoadingFirms}
                />
                <button
                  type="button"
                  onClick={() => !isLoadingFirms && setShowDyeingFirmDropdown(!showDyeingFirmDropdown)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-auto"
                  disabled={isLoadingFirms}
                >
                  {isLoadingFirms ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  ) : (
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        showDyeingFirmDropdown ? 'rotate-180' : ''
                      }`} 
                    />
                  )}
                </button>
                
                {/* Dropdown */}
                {showDyeingFirmDropdown && !isLoadingFirms && (
                  <div 
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    {filteredDyeingFirms.length > 0 ? (
                      <>
                        {filteredDyeingFirms.map((firm, index) => (
                          <div
                            key={firm.id || firm.name}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent blur from firing
                              console.log('🖱️ Mouse down on:', firm.name); // Debug log
                              handleDyeingFirmSelect(firm);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              console.log('🔗 Click on:', firm.name); // Debug log
                              handleDyeingFirmSelect(firm);
                            }}
                            className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                              index === selectedDyeingFirmIndex 
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500' 
                                : ''
                            } ${
                              formData.dyeingFirm === firm.name 
                                ? 'text-blue-600 dark:text-blue-400 font-medium' 
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            <span>{firm.name}</span>
                            {formData.dyeingFirm === firm.name && (
                              <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                        ))}
                        {dyeingFirmFilter && !existingDyeingFirms.some(firm => 
                          firm.name.toLowerCase() === dyeingFirmFilter.toLowerCase()
                        ) && (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                            <div className="flex items-center space-x-2">
                              <span>✨</span>
                              <span>Press Enter to add "{dyeingFirmFilter}" as new firm</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : existingDyeingFirms.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                        <div className="flex flex-col items-center space-y-1">
                          <span>🏭</span>
                          <span>No existing dyeing firms found</span>
                          <span className="text-xs">You can type to add a new firm</span>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                        <div className="flex flex-col items-center space-y-1">
                          <span>🔍</span>
                          <span>No matching firms found</span>
                          <span className="text-xs">Type to add "{dyeingFirmFilter}" as new firm</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.dyeingFirm && <p className="text-red-600 text-sm mt-1">{errors.dyeingFirm}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sentDate" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Sent Date <span className="text-red-500">*</span>
              </label>
              <input
                id="sentDate"
                name="sentDate"
                type="date"
                value={formData.sentDate}
                max={today}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-white ${
                  errors.sentDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.sentDate && <p className="text-red-600 text-sm">{errors.sentDate}</p>}
            </div>

            <div>
              <label htmlFor="expectedArrivalDate" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Expected Arrival Date <span className="text-red-500">*</span>
              </label>
              <input
                id="expectedArrivalDate"
                name="expectedArrivalDate"
                type="date"
                value={formData.expectedArrivalDate}
                min={formData.sentDate ? format(addDays(new Date(formData.sentDate), 1), "yyyy-MM-dd") : today}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-white ${
                  errors.expectedArrivalDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.expectedArrivalDate && <p className="text-red-600 text-sm">{errors.expectedArrivalDate}</p>}
            </div>
          </div>

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
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
              placeholder="Optional notes..."
            />
          </div>          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? recordToEdit
                  ? "Updating..."
                  : "Creating..."
                : recordToEdit
                ? "Update Order"
                : "Create Order"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDyeingOrderForm;
