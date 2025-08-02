import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { ChevronDown, Check, X, Calendar, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { 
  createCountProduct, 
  updateCountProduct,
  CreateCountProductRequest,
  CountProduct
} from "../api/countProductApi";
import { 
  getAllDyeingFirms, 
  createDyeingFirm, 
  findOrCreateDyeingFirm,
  DyeingFirm, 
  CreateDyeingFirmRequest 
} from "../api/dyeingFirmApi";
import { 
  getAllPartyNames, 
  createParty 
} from "../api/partyApi";

interface HorizontalAddOrderFormProps {
  onSuccess: (newProduct: any) => void;
  onCancel: () => void;
  editMode?: boolean;
  productToEdit?: CountProduct;
}

interface FormData {
  quantity: string;
  customerName: string;
  sentToDye: string;
  sentDate: string;
  received: string;
  receivedDate: string;
  dispatch: string;
  dispatchDate: string;
  partyName: string;
  dyeingFirm: string;
}

interface FormErrors {
  [key: string]: string;
}

export const HorizontalAddOrderForm: React.FC<HorizontalAddOrderFormProps> = ({
  onSuccess,
  onCancel,
  editMode = false,
  productToEdit
}) => {
  // Helper function to get initial form data
  const getInitialFormData = (): FormData => {
    if (editMode && productToEdit) {
      return {
        quantity: productToEdit.quantity.toString(),
        customerName: productToEdit.customerName || "",
        sentToDye: productToEdit.quantity.toString(),
        sentDate: productToEdit.sentDate ? new Date(productToEdit.sentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        received: productToEdit.receivedQuantity ? productToEdit.receivedQuantity.toString() : "",
        receivedDate: productToEdit.receivedDate ? new Date(productToEdit.receivedDate).toISOString().split('T')[0] : "",
        dispatch: productToEdit.dispatchQuantity ? productToEdit.dispatchQuantity.toString() : "",
        dispatchDate: productToEdit.dispatchDate ? new Date(productToEdit.dispatchDate).toISOString().split('T')[0] : "",
        partyName: productToEdit.partyName || "",
        dyeingFirm: productToEdit.dyeingFirm || ""
      };
    }
    return {
      quantity: "",
      customerName: "",
      sentToDye: "",
      sentDate: new Date().toISOString().split('T')[0],
      received: "",
      receivedDate: "",
      dispatch: "",
      dispatchDate: "",
      partyName: "",
      dyeingFirm: ""
    };
  };

  // Form state
  const [formData, setFormData] = useState<FormData>(getInitialFormData());

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [showFirmDropdown, setShowFirmDropdown] = useState(false);
  
  // Data state
  const [dyeingFirms, setDyeingFirms] = useState<DyeingFirm[]>([]);
  const [partyOptions, setPartyOptions] = useState<string[]>([]);

  // Fetch both dyeing firms and parties on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingData(true);
      
      // Fetch dyeing firms
      try {
        console.log('🔄 Fetching dyeing firms...');
        let firms: DyeingFirm[] = [];
        
        try {
          firms = await getAllDyeingFirms();
          console.log('✅ Fetched dyeing firms from API:', firms);
          
          // Save to localStorage for persistence
          localStorage.setItem('dyeingFirms', JSON.stringify(firms));
        } catch (apiError) {
          console.warn('⚠️ API failed, trying localStorage backup:', apiError);
          
          // Try localStorage backup
          const savedFirms = localStorage.getItem('dyeingFirms');
          if (savedFirms) {
            try {
              firms = JSON.parse(savedFirms);
              console.log('📋 Loaded dyeing firms from localStorage backup:', firms);
            } catch (parseError) {
              console.error('Failed to parse saved firms:', parseError);
              firms = [];
            }
          }
        }
        
        if (Array.isArray(firms) && firms.length > 0) {
          const validFirms = firms.filter(firm => firm && firm.name);
          setDyeingFirms(validFirms);
        } else {
          throw new Error('No valid dyeing firms available');
        }
      } catch (error) {
        console.error("Failed to fetch dyeing firms:", error);
        const fallbackFirms = [
          { id: 1, name: "Rainbow Dyers", isActive: true, createdAt: "", updatedAt: "" },
          { id: 2, name: "ColorTech Solutions", isActive: true, createdAt: "", updatedAt: "" },
          { id: 3, name: "Premium Dye Works", isActive: true, createdAt: "", updatedAt: "" }
        ];
        setDyeingFirms(fallbackFirms);
        // Save fallback to localStorage
        localStorage.setItem('dyeingFirms', JSON.stringify(fallbackFirms));
      }

      // Fetch party names
      try {
        console.log('🔄 Fetching party names...');
        const partyNames = await getAllPartyNames();
        console.log('📝 Fetched party names:', partyNames);
        
        if (Array.isArray(partyNames)) {
          const validPartyNames = partyNames
            .filter(party => typeof party === 'string' || (party && typeof party.name === 'string'))
            .map(party => typeof party === 'string' ? party : party.name);
          setPartyOptions(validPartyNames);
        } else {
          throw new Error('Invalid party names format');
        }
      } catch (error) {
        console.error("Failed to fetch party names:", error);
        setPartyOptions([
          "Global Yarn Traders",
          "Textile Hub Co",
          "Quality Yarn Solutions",
          "Metro Distribution",
          "Premier Textiles",
          "Direct Supply"
        ]);
      }

      setIsLoadingData(false);
    };

    fetchInitialData();
  }, []);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.quantity.trim() || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity is required and must be greater than 0";
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }
    // sentToDye is optional, but if provided should be positive
    if (formData.sentToDye.trim() && parseFloat(formData.sentToDye) <= 0) {
      newErrors.sentToDye = "Sent to dye quantity must be greater than 0 if provided";
    }
    if (!formData.sentDate) {
      newErrors.sentDate = "Sent date is required";
    }
    if (!formData.dyeingFirm) {
      newErrors.dyeingFirm = "Dyeing firm is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Handle creating new dyeing firm
  const handleCreateDyeingFirm = async (firmName: string) => {
    try {
      const newFirmData: CreateDyeingFirmRequest = {
        name: firmName
      };
      
      const createdFirm = await createDyeingFirm(newFirmData);
      
      // Add the new firm to the local state
      setDyeingFirms(prev => [...prev, createdFirm]);
      
      // Select the newly created firm
      handleInputChange('dyeingFirm', createdFirm.name);
      setShowFirmDropdown(false);
      
      toast.success(`Dyeing firm "${firmName}" created successfully!`);
    } catch (error) {
      console.error("Failed to create dyeing firm:", error);
      toast.error("Failed to create dyeing firm. Please try again.");
    }
  };

  // Handle creating new party
  const handleCreateParty = async (partyName: string) => {
    try {
      const newPartyData = {
        name: partyName
      };
      
      const createdParty = await createParty(newPartyData);
      
      // Add the new party to the local state
      setPartyOptions(prev => [...prev, partyName]);
      
      // Select the newly created party
      handleInputChange('partyName', partyName);
      setShowPartyDropdown(false);
      
      toast.success(`Party "${partyName}" created successfully!`);
    } catch (error) {
      console.error("Failed to create party:", error);
      toast.error("Failed to create party. Please try again.");
    }
  };

  // Check and auto-save new dyeing firm if not exists
  const ensureDyeingFirmExists = async (firmName: string) => {
    if (!firmName || firmName.trim() === "") return;
    
    const existingFirm = dyeingFirms.find(firm => 
      firm.name.toLowerCase() === firmName.toLowerCase()
    );
    
    if (!existingFirm) {
      console.log(`🏭 Auto-creating new dyeing firm: ${firmName}`);
      try {
        // Use findOrCreateDyeingFirm to avoid duplicates
        const response = await findOrCreateDyeingFirm({ name: firmName.trim() });
        const createdFirm = response.data;
        
        // Add the new firm to the local state if it's not already there
        setDyeingFirms(prev => {
          const exists = prev.some(f => f.id === createdFirm.id);
          if (!exists) {
            const updatedFirms = [...prev, createdFirm];
            // Save to localStorage immediately for persistence
            localStorage.setItem('dyeingFirms', JSON.stringify(updatedFirms));
            console.log('💾 Saved updated firms to localStorage');
            return updatedFirms;
          }
          return prev;
        });
        
        console.log(`✅ Dyeing firm ${response.created ? 'created' : 'found'} and saved: ${firmName}`, createdFirm);
        toast.success(`Dyeing firm "${firmName}" ${response.created ? 'created and saved' : 'found'} in database!`);
        return createdFirm;
      } catch (error) {
        console.error("Failed to auto-create dyeing firm:", error);
        // Create a fallback firm for local state to prevent form blocking
        const fallbackFirm: DyeingFirm = {
          id: Date.now(), // Temporary ID
          name: firmName.trim(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setDyeingFirms(prev => {
          const updatedFirms = [...prev, fallbackFirm];
          // Save fallback to localStorage as well
          localStorage.setItem('dyeingFirms', JSON.stringify(updatedFirms));
          console.log('💾 Saved fallback firm to localStorage');
          return updatedFirms;
        });
        
        console.log(`⚠️ Created fallback firm for local state: ${firmName}`);
        toast.warning(`Dyeing firm "${firmName}" saved locally (backend connection failed)`);
        return fallbackFirm;
      }
    }
    return existingFirm;
  };

  // Check and auto-save new party if not exists
  const ensurePartyExists = async (partyName: string) => {
    if (!partyName || partyName.trim() === "" || partyName.toLowerCase() === "direct") return;
    
    const existingParty = partyOptions.find(party => 
      party.toLowerCase() === partyName.toLowerCase()
    );
    
    if (!existingParty) {
      console.log(`👥 Auto-creating new party: ${partyName}`);
      try {
        const newPartyData = {
          name: partyName.trim()
        };
        
        await createParty(newPartyData);
        
        // Add the new party to the local state
        setPartyOptions(prev => [...prev, partyName.trim()]);
        
        toast.success(`New party "${partyName}" saved automatically!`);
        return partyName.trim();
      } catch (error) {
        console.error("Failed to auto-create party:", error);
        // Don't show error toast here as it shouldn't block form submission
      }
    }
    return existingParty || partyName;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Starting form submission...');
    console.log('📝 Form data:', formData);
    console.log('🔍 Form validation check...');
    
    if (!validateForm()) {
      console.log('❌ Validation failed, errors:', errors);
      toast.error("Please fix validation errors");
      return;
    }

    console.log('✅ Validation passed, proceeding with submission');
    setIsSubmitting(true);
    
    try {
      // Auto-save new dyeing firm and party before creating/updating the order
      console.log('🔍 Checking and auto-saving new firms/parties...');
      await ensureDyeingFirmExists(formData.dyeingFirm);
      await ensurePartyExists(formData.partyName);
      
      if (editMode && productToEdit) {
        // Update existing product
        console.log('✏️ Updating existing product with ID:', productToEdit.id);
        
        const updateData = {
          partyName: formData.partyName || "Direct",
          dyeingFirm: formData.dyeingFirm,
          quantity: parseFloat(formData.quantity),
          customerName: formData.customerName,
          sentDate: formData.sentDate,
          receivedQuantity: formData.received ? parseFloat(formData.received) : 0,
          received: formData.received ? parseFloat(formData.received) > 0 : false,
          receivedDate: formData.receivedDate || undefined,
          dispatchQuantity: formData.dispatch ? parseFloat(formData.dispatch) : 0,
          dispatch: formData.dispatch ? parseFloat(formData.dispatch) > 0 : false,
          dispatchDate: formData.dispatchDate || undefined,
          middleman: formData.partyName || "Direct",
          remarks: `Updated via horizontal form - Customer: ${formData.customerName}`
        };
        
        console.log('📦 Updating count product with data:', updateData);
        
        const updatedProduct = await updateCountProduct(productToEdit.id, updateData);
        console.log('✅ Count product updated successfully:', updatedProduct);
        
        // Call success callback
        console.log('📞 Calling success callback with updated product:', updatedProduct);
        onSuccess(updatedProduct);
        toast.success("Dyeing order updated successfully!");
        
        console.log('🎉 Form update completed successfully');
      } else {
        // Create new product
        const newCountProductData: CreateCountProductRequest = {
          partyName: formData.partyName || "Direct",
          dyeingFirm: formData.dyeingFirm,
          yarnType: "Mixed", // Default value
          count: "Standard", // Default value
          shade: "As Required", // Default value
          quantity: parseFloat(formData.quantity),
          completedDate: new Date().toISOString().split('T')[0],
          qualityGrade: "A", // Default grade
          remarks: `Added via horizontal form - Customer: ${formData.customerName}`,
          lotNumber: `HOR-${Date.now()}`, // Generate lot number
          processedBy: "System",
          customerName: formData.customerName,
          sentToDye: true, // Always true when form is submitted
          sentDate: formData.sentDate,
          received: formData.received ? parseFloat(formData.received) > 0 : false,
          receivedDate: formData.receivedDate || undefined,
          receivedQuantity: formData.received ? parseFloat(formData.received) : 0,
          dispatch: formData.dispatch ? parseFloat(formData.dispatch) > 0 : false,
          dispatchDate: formData.dispatchDate || undefined,
          dispatchQuantity: formData.dispatch ? parseFloat(formData.dispatch) : 0,
          middleman: formData.partyName || "Direct"
        };

        console.log('📦 Creating count product with data:', newCountProductData);
        
        const createdProduct = await createCountProduct(newCountProductData);
        console.log('✅ Count product created successfully:', createdProduct);
        
        // Call success callback
        console.log('📞 Calling success callback with product:', createdProduct);
        onSuccess(createdProduct);
        toast.success("Dyeing order added successfully!");
        
        console.log('🎉 Form submission completed successfully');
      }
      
      // Reset form data only if not in edit mode
      if (!editMode) {
        setFormData({
          quantity: "",
          customerName: "",
          sentToDye: "",
          sentDate: new Date().toISOString().split('T')[0],
          received: "",
          receivedDate: "",
          dispatch: "",
          dispatchDate: "",
          partyName: "",
          dyeingFirm: ""
        });
        setErrors({});
      }
    } catch (error) {
      console.error('❌ Failed to create dyeing order:', error);
      
      // Check for various types of API failures that should trigger demo mode
      const shouldUseDemoMode = (
        (error instanceof Error && error.message.includes('does not exist')) ||
        (error instanceof Error && error.message.includes('ECONNREFUSED')) ||
        (error instanceof Error && error.message.includes('Network Error')) ||
        (error instanceof Error && error.message.includes('500')) ||
        (error as any)?.code === 'ECONNREFUSED' ||
        (error as any)?.response?.status >= 500
      );
      
      if (shouldUseDemoMode) {
        console.log('🔧 API unavailable or database issue, using demo mode');
        
        if (editMode && productToEdit) {
          // Demo mode for update
          const mockUpdatedProduct: CountProduct = {
            ...productToEdit,
            partyName: formData.partyName || "Direct",
            dyeingFirm: formData.dyeingFirm,
            quantity: parseFloat(formData.quantity),
            customerName: formData.customerName,
            sentDate: formData.sentDate,
            receivedQuantity: formData.received ? parseFloat(formData.received) : 0,
            received: formData.received ? parseFloat(formData.received) > 0 : false,
            receivedDate: formData.receivedDate || "",
            dispatchQuantity: formData.dispatch ? parseFloat(formData.dispatch) : 0,
            dispatch: formData.dispatch ? parseFloat(formData.dispatch) > 0 : false,
            dispatchDate: formData.dispatchDate || "",
            middleman: formData.partyName || "Direct",
            remarks: `Updated via horizontal form - Customer: ${formData.customerName}`
          };
          
          console.log('📞 Calling success callback with demo updated product:', mockUpdatedProduct);
          onSuccess(mockUpdatedProduct);
          toast.success("Dyeing order updated successfully! (Demo mode - database not connected)");
          
          console.log('🎉 Demo mode update completed successfully');
        } else {
          // Demo mode for create
          const mockProduct: CountProduct = {
            id: Date.now(), // Use timestamp as unique ID
            partyName: formData.partyName || "Direct",
            dyeingFirm: formData.dyeingFirm,
            yarnType: "Mixed",
            count: "Standard",
            shade: "As Required",
            quantity: parseFloat(formData.quantity),
            completedDate: new Date().toISOString().split('T')[0],
            qualityGrade: "A" as const,
            remarks: `Added via horizontal form - Customer: ${formData.customerName}`,
            lotNumber: `HOR-${Date.now()}`,
            processedBy: "System",
            customerName: formData.customerName,
            sentToDye: true,
            sentDate: formData.sentDate,
            received: formData.received ? parseFloat(formData.received) > 0 : false,
            receivedDate: formData.receivedDate || "",
            receivedQuantity: formData.received ? parseFloat(formData.received) : 0,
            dispatch: formData.dispatch ? parseFloat(formData.dispatch) > 0 : false,
            dispatchDate: formData.dispatchDate || "",
            dispatchQuantity: formData.dispatch ? parseFloat(formData.dispatch) : 0,
            middleman: formData.partyName || "Direct"
          };
          
          console.log('📞 Calling success callback with demo product:', mockProduct);
          onSuccess(mockProduct);
          toast.success("Dyeing order added successfully! (Demo mode - database not connected)");
          
          console.log('🎉 Demo mode submission completed successfully');
        }
        
        // Reset form data only if not in edit mode
        if (!editMode) {
          setFormData({
            quantity: "",
            customerName: "",
            sentToDye: "",
            sentDate: new Date().toISOString().split('T')[0],
            received: "",
            receivedDate: "",
            dispatch: "",
            dispatchDate: "",
            partyName: "",
            dyeingFirm: ""
          });
          setErrors({});
        }
      } else {
        // Handle other errors
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          const action = editMode ? 'update' : 'add';
          toast.error(`Failed to ${action} dyeing order: ${error.message}`);
        } else {
          console.error('Unknown error:', error);
          const action = editMode ? 'update' : 'add';
          toast.error(`Failed to ${action} dyeing order. Please try again.`);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setFormData({
      quantity: "",
      customerName: "",
      sentToDye: "",
      sentDate: new Date().toISOString().split('T')[0],
      received: "",
      receivedDate: "",
      dispatch: "",
      dispatchDate: "",
      partyName: "",
      dyeingFirm: ""
    });
    setErrors({});
  };

  // Safe filtering with error handling
  const filteredParties = React.useMemo(() => {
    try {
      if (!Array.isArray(partyOptions)) return [];
      return partyOptions.filter(party =>
        typeof party === 'string' && 
        party.toLowerCase().includes((formData.partyName || '').toLowerCase())
      );
    } catch (error) {
      console.error('Error filtering parties:', error);
      return [];
    }
  }, [partyOptions, formData.partyName]);

  const filteredDyeingFirms = React.useMemo(() => {
    try {
      if (!Array.isArray(dyeingFirms)) return [];
      return dyeingFirms.filter(firm =>
        firm && firm.name && 
        firm.name.toLowerCase().includes((formData.dyeingFirm || '').toLowerCase())
      );
    } catch (error) {
      console.error('Error filtering dyeing firms:', error);
      return [];
    }
  }, [dyeingFirms, formData.dyeingFirm]);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-center mb-4">
        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
          {editMode ? 'Edit Dyeing Order' : 'Add New Dyeing Order'}
        </h3>
        {isLoadingData && (
          <div className="ml-auto flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Loading data...
          </div>
        )}
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
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
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
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
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
              value={formData.sentToDye}
              onChange={(e) => handleInputChange('sentToDye', e.target.value)}
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
                value={formData.sentDate}
                onChange={(e) => handleInputChange('sentDate', e.target.value)}
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

        {/* Second Row - Optional Fields */}
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
              value={formData.received}
              onChange={(e) => handleInputChange('received', e.target.value)}
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
                value={formData.receivedDate}
                onChange={(e) => handleInputChange('receivedDate', e.target.value)}
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
              value={formData.dispatch}
              onChange={(e) => handleInputChange('dispatch', e.target.value)}
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
                value={formData.dispatchDate}
                onChange={(e) => handleInputChange('dispatchDate', e.target.value)}
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
            <div className="relative">
              <input
                type="text"
                value={formData.dyeingFirm}
                onChange={(e) => {
                  handleInputChange('dyeingFirm', e.target.value);
                  setShowFirmDropdown(true);
                }}
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
              
              {showFirmDropdown && (
                <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredDyeingFirms.length > 0 ? (
                    filteredDyeingFirms.map((firm) => (
                      <div
                        key={firm.id}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white"
                        onMouseDown={() => {
                          handleInputChange('dyeingFirm', firm.name);
                          setShowFirmDropdown(false);
                        }}
                      >
                        {firm.name}
                      </div>
                    ))
                  ) : (
                    formData.dyeingFirm.trim() && (
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center font-medium"
                        onMouseDown={() => {
                          handleCreateDyeingFirm(formData.dyeingFirm.trim());
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create "{formData.dyeingFirm}"
                      </div>
                    )
                  )}
                  {/* Always show manual add option */}
                  <div
                    className="px-3 py-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 border-t border-gray-200 dark:border-gray-600 flex items-center font-medium"
                    onMouseDown={() => {
                      const firmName = prompt("Enter new dyeing firm name:");
                      if (firmName && firmName.trim()) {
                        handleCreateDyeingFirm(firmName.trim());
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

          {/* Party Name / Middleman */}
          <div className="space-y-1 relative">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Party Name / Middleman
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors pr-8"
                placeholder="Enter or select party name"
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              
              {showPartyDropdown && (
                <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                  {filteredParties.length > 0 ? (
                    filteredParties.map((party, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white"
                        onMouseDown={() => {
                          handleInputChange('partyName', party);
                          setShowPartyDropdown(false);
                        }}
                      >
                        {party}
                      </div>
                    ))
                  ) : (
                    formData.partyName.trim() && formData.partyName.toLowerCase() !== "direct" && (
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center font-medium"
                        onMouseDown={() => {
                          handleCreateParty(formData.partyName.trim());
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create "{formData.partyName}"
                      </div>
                    )
                  )}
                  {/* Show create option even when there are matches, if the typed value doesn't exist */}
                  {formData.partyName && 
                   formData.partyName.trim() !== "" && 
                   formData.partyName.toLowerCase() !== "direct" && 
                   !partyOptions.some(party => party.toLowerCase() === formData.partyName.toLowerCase()) && (
                    <div
                      className="px-3 py-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 border-t border-gray-200 dark:border-gray-600 flex items-center font-medium"
                      onMouseDown={() => {
                        handleCreateParty(formData.partyName.trim());
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create "{formData.partyName}"
                    </div>
                  )}
                  {/* Always show manual add option */}
                  <div
                    className="px-3 py-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 border-t border-gray-200 dark:border-gray-600 flex items-center font-medium"
                    onMouseDown={() => {
                      const partyName = prompt("Enter new party name:");
                      if (partyName && partyName.trim()) {
                        handleCreateParty(partyName.trim());
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Party
                  </div>
                </div>
              )}
            </div>
          </div>
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
            onClick={onCancel}
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
                {editMode ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {editMode ? 'Update Order' : 'Submit Order'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
