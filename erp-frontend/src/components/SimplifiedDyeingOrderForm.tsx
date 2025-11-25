import React, { useState, useRef, useEffect } from "react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { createCountProduct, updateCountProduct } from "../api/countProductApi";
import { updateDyeingRecord } from "../api/dyeingApi";
import { findOrCreateDyeingFirm } from "../api/dyeingFirmApi";
import { getAllPartyNames } from "../api/partyApi";
import { Button } from "./ui/Button";
import { X, ChevronDown, Check, Package, Calendar, Plus } from "lucide-react";
import { dyeingDataStore } from '../stores/dyeingDataStore';

// Simplified data structure for business-friendly form (matches CountProduct structure)
interface SimplifiedDyeingOrderData {
  id?: number;                  // Record ID for editing
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
  onSuccess: (orderData: any) => void; // Changed to any to allow success signals
  orderToEdit?: SimplifiedDyeingOrderData | null;
  onCancel?: () => void;
  existingFirms?: string[]; // Add prop for existing dyeing firms from database
}

const SimplifiedDyeingOrderForm: React.FC<SimplifiedDyeingOrderFormProps> = ({
  onSuccess,
  orderToEdit,
  onCancel,
  existingFirms = [],
}) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultExpectedDate = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const getInitialState = (): SimplifiedDyeingOrderData => ({
    id: undefined,
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
    count: "", // Empty by default so users can type directly
    lot: "",
    expectedArrivalDate: defaultExpectedDate,
  });

  const [formData, setFormData] = useState<SimplifiedDyeingOrderData>(getInitialState());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dyeing Firm dropdown states
  const [showFirmDropdown, setShowFirmDropdown] = useState(false);
  const [firmFilter, setFirmFilter] = useState("");
  const [selectedFirmIndex, setSelectedFirmIndex] = useState(-1);
  const firmDropdownRef = useRef<HTMLDivElement>(null);

  // Party dropdown states
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [partyFilter, setPartyFilter] = useState("");
  const [selectedPartyIndex, setSelectedPartyIndex] = useState(-1);
  const partyDropdownRef = useRef<HTMLDivElement>(null);

  // Count suggestions dropdown states
  const [showCountDropdown, setShowCountDropdown] = useState(false);
  const countDropdownRef = useRef<HTMLDivElement>(null);
  const [liveCounts, setLiveCounts] = useState<string[]>([]);

  // Keep a local reactive copy of firms so we can update; prefer page-provided list if present
  const preferPropFirms = (existingFirms && existingFirms.length > 0);
  const [liveFirms, setLiveFirms] = useState<string[]>(existingFirms);

  // Party names state for dropdown
  const [partyNames, setPartyNames] = useState<string[]>([]);

  // Subscribe to firm updates from sync manager ONLY if no page-provided list is given
  useEffect(() => {
    if (preferPropFirms) return; // use page list exclusively
    let unsubscribe: (() => void) | null = null;
    (async () => {
      try {
        unsubscribe = await dyeingDataStore.subscribeFirms((firms) => {
          const firmNames = firms.map(f => f.name);
          setLiveFirms(firmNames);
          console.log('📡 SimplifiedDyeingOrderForm received firm sync update:', firmNames);
        });
      } catch (error) {
        console.error('❌ Error setting up firm subscription:', error);
      }
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [preferPropFirms]);

  // Update liveFirms when existingFirms prop changes
  useEffect(() => {
    if (preferPropFirms) {
      setLiveFirms(existingFirms);
    }
  }, [existingFirms, preferPropFirms]);

  // Filter existing firms based on input (use dynamic firms from database)
  const filteredFirms = liveFirms.filter(firm =>
    firm.toLowerCase().includes(firmFilter.toLowerCase())
  );

  // Filter party names based on input
  const filteredParties = partyNames.filter(party =>
    party.toLowerCase().includes(partyFilter.toLowerCase())
  );

  // Build unique counts from dyeing records (store) and count products (localStorage)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const collectCounts = (records: any[]) => {
      const recCounts = Array.from(new Set((records || [])
        .map(r => (r?.count || '').toString().trim())
        .filter(Boolean)));
      let cpCounts: string[] = [];
      try {
        const raw = localStorage.getItem('countProducts');
        if (raw) {
          const cps = JSON.parse(raw);
          cpCounts = Array.from(new Set((cps || [])
            .map((p: any) => (p?.count || '').toString().trim())
            .filter(Boolean)));
        }
      } catch { }
      const merged = Array.from(new Set([...recCounts, ...cpCounts])).sort();
      setLiveCounts(merged);
    };

    const setup = async () => {
      try {
        unsubscribe = await dyeingDataStore.subscribeRecords((records) => {
          collectCounts(records as any[]);
        });
      } catch (e) {
        // fallback: try from localStorage only
        collectCounts([]);
      }
    };
    setup();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // Fetch party names from Party Master
  useEffect(() => {
    const fetchPartyNames = async () => {
      try {
        const names = await getAllPartyNames();
        console.log('🎉 Raw party names from API:', names);

        if (Array.isArray(names)) {
          const normalizedNames = names
            .map((entry: any) => {
              // Handle direct strings
              if (typeof entry === 'string') {
                return entry.trim();
              }
              // Handle objects with name or partyName property
              if (entry && typeof entry === 'object') {
                if (typeof entry.name === 'string') return entry.name.trim();
                if (typeof entry.partyName === 'string') return entry.partyName.trim();

                // CRITICAL FIX: If the object itself is being passed but has no known string property,
                // do NOT return the object. Return null to filter it out.
                console.warn('⚠️ Invalid party object found:', entry);
                return null;
              }
              return null;
            })
            .filter((name): name is string => {
              const isValid = typeof name === 'string' && name.length > 0;
              if (!isValid && name !== null) console.warn('⚠️ Filtered out invalid party name:', name);
              return isValid;
            });

          console.log('✅ Normalized party names:', normalizedNames);
          setPartyNames(Array.from(new Set(normalizedNames)).sort((a, b) => a.localeCompare(b)));
        } else {
          console.warn('⚠️ getAllPartyNames did not return an array:', names);
        }
      } catch (error) {
        console.error('Failed to fetch party names:', error);
        // Silently fail - user can still type manually
      }
    };
    fetchPartyNames();
  }, []);

  const filteredCounts = React.useMemo(() => {
    const q = (formData.count || '').toLowerCase();
    return liveCounts.filter(c => c.toLowerCase().includes(q));
  }, [liveCounts, formData.count]);

  useEffect(() => {
    console.log('🔄 useEffect triggered');
    console.log('📥 orderToEdit prop:', orderToEdit);
    console.log('📋 Previous formData.id:', formData.id);

    if (orderToEdit) {
      console.log('✅ Setting form data to orderToEdit');
      console.log('🆔 OrderToEdit ID:', orderToEdit.id);
      console.log('🔍 OrderToEdit full object:', JSON.stringify(orderToEdit, null, 2));

      // CRITICAL DEBUG: Log the specific fields we're interested in
      console.log('🎯 FORM POPULATION DEBUG:');
      console.log('  - orderToEdit.quantity (original):', orderToEdit.quantity);
      console.log('  - orderToEdit.sentToDye (sent):', orderToEdit.sentToDye);
      console.log('  - Are they different?', orderToEdit.quantity !== orderToEdit.sentToDye);

      // Ensure the ID is preserved when setting form data
      const dataToSet = { ...orderToEdit };
      console.log('📋 Data to set:', dataToSet);
      console.log('🆔 Data to set ID:', dataToSet.id);
      console.log('📋 Data to set quantity:', dataToSet.quantity);
      console.log('📋 Data to set sentToDye:', dataToSet.sentToDye);

      setFormData(dataToSet);
      setFirmFilter(orderToEdit.dyeingFirm);
      setPartyFilter(orderToEdit.partyName || "");

      // Verify the state was set correctly
      setTimeout(() => {
        console.log('⏰ Checking formData after setState:', formData);
        console.log('⏰ FormData quantity after setState:', formData.quantity);
        console.log('⏰ FormData sentToDye after setState:', formData.sentToDye);
      }, 100);

    } else {
      console.log('🆕 Setting form data to initial state');
      setFormData(getInitialState());
      setFirmFilter("");
      setPartyFilter("");
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
      if (countDropdownRef.current && !countDropdownRef.current.contains(event.target as Node)) {
        setShowCountDropdown(false);
      }
      if (countDropdownRef.current && !countDropdownRef.current.contains(event.target as Node)) {
        setShowCountDropdown(false);
      }
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target as Node)) {
        setShowPartyDropdown(false);
        setSelectedPartyIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    console.log('📝 Input change:', name, '=', value);
    console.log('📋 Current formData ID before change:', formData.id);

    // Handle number fields with proper precision
    if (name === "quantity" || name === "sentToDye" || name === "received" || name === "dispatch") {
      let numValue = 0;

      if (value === '' || value === null || value === undefined) {
        numValue = 0;
      } else {
        // Parse the number and round to 2 decimal places to avoid floating point issues
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          // Round to 2 decimal places and ensure it's a clean number
          numValue = Math.round(parsed * 100) / 100;
        }
      }

      console.log(`🔢 Updating ${name} from ${formData[name as keyof typeof formData]} to ${numValue}`);

      setFormData(prev => {
        const newData = { ...prev, [name]: numValue };
        console.log(`🔢 Updated formData with ${name}:`, newData[name as keyof typeof newData]);
        console.log('🆔 FormData ID after number update:', newData.id);
        return newData;
      });
    }
    else {
      console.log(`📝 Updating text field ${name} to:`, value);
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        console.log('📝 Updated formData with text:', newData.id);
        return newData;
      });
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

  const selectFirm = async (firm: string) => {
    setFormData(prev => ({ ...prev, dyeingFirm: firm }));
    setFirmFilter(firm);
    setShowFirmDropdown(false);
    setSelectedFirmIndex(-1);

    // Check if this is a new firm that needs to be created
    const isNewFirm = !liveFirms.some(existing =>
      existing.toLowerCase() === firm.toLowerCase()
    );

    if (isNewFirm && firm.trim()) {
      try {
        console.log(`🏭 Creating new dyeing firm: ${firm}`);
        const firmResult = await dyeingDataStore.ensureFirm(firm.trim());

        // Add to local state immediately
        setLiveFirms(prev => [...prev, firmResult.name].sort());

        toast.success(`Firm "${firm}" created and synced to all pages!`);
      } catch (error) {
        console.warn("⚠️ Failed to create dyeing firm, but continuing with form:", error);
        toast.warning(`Failed to save firm "${firm}" to database, but you can continue with the form`);
      }
    }
  };

  const handlePartyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPartyFilter(value);
    setFormData(prev => ({ ...prev, partyName: value }));
    setShowPartyDropdown(true);
    setSelectedPartyIndex(-1);

    if (errors.partyName) {
      const newErrors = { ...errors };
      delete newErrors.partyName;
      setErrors(newErrors);
    }
  };

  const handlePartyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPartyDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedPartyIndex(prev =>
          prev < filteredParties.length ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedPartyIndex(prev =>
          prev > 0 ? prev - 1 : filteredParties.length
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedPartyIndex === 0) {
          selectParty("Direct Supply");
        } else if (selectedPartyIndex > 0 && filteredParties[selectedPartyIndex - 1]) {
          selectParty(filteredParties[selectedPartyIndex - 1]);
        }
        break;
      case "Escape":
        setShowPartyDropdown(false);
        setSelectedPartyIndex(-1);
        break;
    }
  };

  const selectParty = (party: string) => {
    setFormData(prev => ({ ...prev, partyName: party }));
    setPartyFilter(party);
    setShowPartyDropdown(false);
    setSelectedPartyIndex(-1);
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

    if (!formData.count?.trim()) {
      newErrors.count = "Count is required";
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

    if (!formData.partyName?.trim()) {
      newErrors.partyName = "Please select a party from the list";
    }

    // Technical fields validation - only validate if any are filled (not all required if user doesn't expand section)
    const technicalFieldsFilled = formData.yarnType || formData.shade || formData.lot;

    if (technicalFieldsFilled) {
      // If user started filling technical fields, then all are required
      if (!formData.yarnType?.trim()) {
        newErrors.yarnType = "Yarn type is required when technical details are provided";
      }

      if (!formData.shade?.trim()) {
        newErrors.shade = "Shade is required when technical details are provided";
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

    // CRITICAL DEBUG: Let's check EVERYTHING about the edit mode detection
    console.log('🔍 CRITICAL DEBUG - Form submission analysis:');
    console.log('  - orderToEdit prop:', orderToEdit);
    console.log('  - orderToEdit?.id:', orderToEdit?.id);
    console.log('  - formData:', formData);
    console.log('  - formData.id:', formData.id);
    console.log('  - typeof formData.id:', typeof formData.id);
    console.log('  - Boolean(orderToEdit):', Boolean(orderToEdit));
    console.log('  - Boolean(formData.id):', Boolean(formData.id));
    console.log('  - orderToEdit && formData.id:', !!(orderToEdit && formData.id));
    console.log('  - formData.id > 0:', formData.id ? formData.id > 0 : false);
    console.log('  - orderToEdit !== null:', orderToEdit !== null);
    console.log('  - orderToEdit !== undefined:', orderToEdit !== undefined);
    console.log('  - formData.id !== null:', formData.id !== null);
    console.log('  - formData.id !== undefined:', formData.id !== undefined);

    // Use the most explicit check possible
    const hasValidId = formData.id !== null &&
      formData.id !== undefined &&
      typeof formData.id === 'number' &&
      !isNaN(formData.id) &&
      formData.id > 0;

    const shouldUpdate = orderToEdit !== null &&
      orderToEdit !== undefined &&
      hasValidId;

    console.log('🎯 Has valid ID?', hasValidId);
    console.log('🎯 FINAL DECISION - Should update?', shouldUpdate);
    console.log('🎯 Will call API:', shouldUpdate ? 'updateDyeingRecord' : 'createDyeingRecord');

    try {
      console.log('🚀 Form submit started');
      console.log('📝 Form data at submission:', JSON.stringify(formData, null, 2));
      console.log('🔍 Order to edit prop:', orderToEdit);
      console.log('🆔 Form data ID:', formData.id);
      console.log('🔎 OrderToEdit exists:', !!orderToEdit);
      console.log('🔎 FormData ID exists:', !!formData.id);
      console.log('🔎 Should update:', !!(orderToEdit && formData.id));

      // CRITICAL: Log the exact values being processed
      console.log('🎯 CRITICAL VALUES CHECK:');
      console.log('  - formData.received:', formData.received, typeof formData.received);
      console.log('  - formData.dispatch:', formData.dispatch, typeof formData.dispatch);
      console.log('  - formData.sentToDye:', formData.sentToDye, typeof formData.sentToDye);
      console.log('  - formData.receivedDate:', formData.receivedDate);
      console.log('  - formData.dispatchDate:', formData.dispatchDate);

      // Create enhanced remarks that include tracking information with updated values
      const trackingInfo = [];

      // Add original quantity info if it's different from sentToDye
      if (formData.quantity && formData.quantity !== formData.sentToDye) {
        trackingInfo.push(`OriginalQty: ${formData.quantity}kg`);
        console.log('📦 Adding original quantity to remarks:', formData.quantity);
      }

      // Always add received information when updating an existing record
      // This ensures we can clear/update previous values
      if (shouldUpdate || formData.received >= 0) {
        const receivedInfo = `Received: ${formData.received || 0}kg${formData.receivedDate ? ` on ${formData.receivedDate}` : ''}`;
        trackingInfo.push(receivedInfo);
        console.log('📥 Adding received info to remarks:', receivedInfo);
        console.log('📥 Received value being saved:', formData.received);
        console.log('📅 Received date being saved:', formData.receivedDate);
      }

      // Always add dispatch information when updating an existing record  
      if (shouldUpdate || formData.dispatch >= 0) {
        const dispatchInfo = `Dispatched: ${formData.dispatch || 0}kg${formData.dispatchDate ? ` on ${formData.dispatchDate}` : ''}`;
        trackingInfo.push(dispatchInfo);
        console.log('📤 Adding dispatch info to remarks:', dispatchInfo);
        console.log('📤 Dispatch value being saved:', formData.dispatch);
        console.log('📅 Dispatch date being saved:', formData.dispatchDate);
      }

      // Add middleman/party information if provided
      if (formData.partyName) {
        trackingInfo.push(`Middleman: ${formData.partyName}`);
        console.log('👥 Adding middleman info to remarks:', formData.partyName);
      }

      // CRITICAL FIX: Use ONLY the original remarks (without existing tracking info) 
      // to prevent duplicate tracking entries
      const cleanRemarks = formData.remarks || ''; // This should already be cleaned by handleEdit

      // Combine CLEAN original remarks with NEW tracking info
      const enhancedRemarks = [
        cleanRemarks,
        ...trackingInfo
      ].filter(Boolean).join(' | ');

      console.log('📝 Clean original remarks:', cleanRemarks);
      console.log('📝 New tracking info:', trackingInfo);
      console.log('📝 Final enhanced remarks:', enhancedRemarks);
      console.log('🔍 Should update?', shouldUpdate);
      console.log('🔍 FormData received:', formData.received);
      console.log('🔍 FormData dispatch:', formData.dispatch);

      // Create the count product data for API (this will save customer name properly)
      const countProductData = {
        partyName: (formData.partyName?.trim() || "Unknown Party"), // Use actual party name from form
        dyeingFirm: formData.dyeingFirm,
        yarnType: (formData.yarnType?.trim() || "Standard"),
        count: (formData.count?.trim() || "Standard"),
        shade: (formData.shade?.trim() || "Natural"),
        quantity: formData.sentToDye || formData.quantity,
        completedDate: formData.sentDate, // Use sent date as completed date
        qualityGrade: 'A' as const,
        remarks: enhancedRemarks,
        lotNumber: (formData.lot?.trim() || `LOT-${Date.now()}`),
        customerName: (formData.customerName?.trim() || "Unknown Customer"), // 🎯 SEPARATE field for customer!
        sentToDye: true,
        sentDate: formData.sentDate,
        received: !!formData.received,
        receivedDate: formData.receivedDate || undefined,
        receivedQuantity: formData.received || undefined,
        dispatch: !!formData.dispatch,
        dispatchDate: formData.dispatchDate || undefined,
        dispatchQuantity: formData.dispatch || undefined,
        middleman: (formData.partyName?.trim() || "") // 🔥 CRITICAL: Save party name as middleman field
      };

      console.log(' Count Product API Request Data:', countProductData);
      console.log(' Customer Name in request:', countProductData.customerName);
      console.log(' Party Name in request:', countProductData.partyName);
      console.log('🏭 Dyeing Firm in request:', countProductData.dyeingFirm);
      console.log('� Lot Number in request:', countProductData.lotNumber);

      let result;

      if (shouldUpdate) {
        const idToUse = formData.id || orderToEdit?.id;
        console.log('🔄 UPDATE PATH: Updating existing dyeing record with ID:', idToUse);
        console.log('🔄 ID source:', formData.id ? 'formData' : 'orderToEdit prop');

        if (!idToUse || idToUse <= 0) {
          throw new Error(`Invalid ID for update: ${idToUse}`);
        }

        // Build full payload expected by updateDyeingRecord (PUT)
        const dyeingUpdateData = {
          yarnType: formData.yarnType || "Mixed",
          sentDate: formData.sentDate,
          expectedArrivalDate: formData.expectedArrivalDate,
          remarks: enhancedRemarks,
          partyName: formData.partyName || "Direct",
          customerName: formData.customerName || undefined,
          quantity: formData.sentToDye || formData.quantity,
          shade: formData.shade || "Natural",
          count: formData.count || "Standard",
          lot: formData.lot || `LOT-${Date.now()}`,
          dyeingFirm: formData.dyeingFirm
        };

        console.log('📦 PUT /dyeing with payload:', dyeingUpdateData);
        result = await updateDyeingRecord(idToUse, dyeingUpdateData as any);
        console.log('✅ Dyeing record updated successfully:', result);

        // Note: We no longer attempt to update a CountProduct here because IDs are not guaranteed to match.
      } else {
        console.log('🔄 CREATE PATH: Creating new count product');
        console.log('🔄 Create data:', countProductData);
        result = await createCountProduct(countProductData);
        console.log('✅ Count product created successfully:', result);
        console.log('✅ Created customer name:', result?.customerName);
        console.log('🎯 Created partyName field:', result?.partyName);
        console.log('🎯 Created middleman field:', result?.middleman);
      }

      // Create a simple success signal for the parent component
      const successData = {
        action: shouldUpdate ? 'updated' : 'created',
        recordId: result?.id || formData.id,
        dyeingFirm: countProductData.dyeingFirm,
        customerName: countProductData.customerName, // Include customer name in success data
        timestamp: new Date().toISOString(),
        updatedFields: {
          quantity: countProductData.quantity,
          customerName: countProductData.customerName,
          dyeingFirm: countProductData.dyeingFirm,
          yarnType: countProductData.yarnType,
          shade: countProductData.shade,
          count: countProductData.count,
          lotNumber: countProductData.lotNumber,
          sentToDye: formData.sentToDye,
          received: formData.received,
          dispatch: formData.dispatch,
          remarks: countProductData.remarks
        }
      };

      console.log('📤 Sending success signal to parent:', successData);
      onSuccess(successData);

      const actionType = shouldUpdate ? 'updated' : 'created';
      toast.success(`Order ${actionType} successfully! Customer: ${countProductData.customerName}`, {
        duration: 4000,
        description: shouldUpdate ? 'The listing will refresh to show updated customer name and values.' : 'Customer name will now be saved and displayed properly.'
      });

      // Only reset form if not editing, let parent component handle form closure for edits
      if (!orderToEdit) {
        handleReset();
      }
    } catch (error) {
      console.error("Failed to submit order:", error);
      const actionType = (orderToEdit && formData.id) ? 'update' : 'create';
      toast.error(`Failed to ${actionType} order with customer name. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    console.log('🔄 handleReset called');
    setFormData(getInitialState());
    setFirmFilter("");
    setPartyFilter("");
    setErrors({});
    setShowFirmDropdown(false);
    setSelectedFirmIndex(-1);
  };

  const handleCancel = () => {
    console.log('❌ handleCancel called');
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Quantity (kg) * {/* DEBUG: Show current value */}
              <span className="text-xs text-blue-500 ml-2">
                [Current: {formData.quantity}]
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="quantity"
              value={formData.quantity === 0 ? "" : formData.quantity}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${errors.quantity
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="0"
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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${errors.customerName
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Enter customer name"
            />
            {errors.customerName && (
              <p className="text-xs text-red-500">{errors.customerName}</p>
            )}
          </div>

          {/* Count with suggestions */}
          <div className="space-y-1 relative" ref={countDropdownRef}>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Count *
            </label>
            <input
              type="text"
              name="count"
              value={formData.count}
              onChange={(e) => { handleInputChange(e); setShowCountDropdown(true); }}
              onFocus={() => setShowCountDropdown(true)}
              onBlur={() => setTimeout(() => setShowCountDropdown(false), 180)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${errors.count
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="e.g. 20s, 30s, Standard"
            />
            {showCountDropdown && (
              <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                {filteredCounts.length > 0 ? (
                  filteredCounts.map((c, idx) => (
                    <div
                      key={`${c}-${idx}`}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white"
                      onMouseDown={() => {
                        setFormData(prev => ({ ...prev, count: c }));
                        setShowCountDropdown(false);
                      }}
                    >
                      {c}
                    </div>
                  ))
                ) : (
                  (formData.count || '').trim() && (
                    <div
                      className="px-3 py-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center font-medium"
                      onMouseDown={() => {
                        setShowCountDropdown(false);
                      }}
                    >
                      Use "{formData.count.trim()}"
                    </div>
                  )
                )}
              </div>
            )}
            {errors.count && (
              <p className="text-xs text-red-500">{errors.count}</p>
            )}
          </div>

          {/* Sent to Dye */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Sent to Dye (kg) * {/* DEBUG: Show current value */}
              <span className="text-xs text-green-500 ml-2">
                [Current: {formData.sentToDye}]
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="sentToDye"
              value={formData.sentToDye === 0 ? "" : formData.sentToDye}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${errors.sentToDye
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="0"
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${errors.sentDate
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
              value={formData.received === 0 ? "" : formData.received}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="0"
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
              value={formData.dispatch === 0 ? "" : formData.dispatch}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="0"
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors pr-8 ${errors.dyeingFirm
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
                      className={`px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white ${index === selectedFirmIndex ? 'bg-blue-100 dark:bg-blue-900' : ''
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

          {/* Party/Middleman */}
          <div className="space-y-1 relative" ref={partyDropdownRef}>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Party/Middleman *
            </label>
            <div className="relative">
              <input
                type="text"
                name="partyName"
                value={partyFilter}
                onChange={handlePartyInputChange}
                onKeyDown={handlePartyKeyDown}
                onFocus={() => setShowPartyDropdown(true)}
                onBlur={() => setTimeout(() => setShowPartyDropdown(false), 200)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors pr-8 ${errors.partyName
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600'
                  }`}
                placeholder="Search or enter party name"
                autoComplete="off"
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

              {showPartyDropdown && (
                <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {/* Direct Supply Option */}
                  <div
                    className={`px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 ${selectedPartyIndex === 0 ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    onMouseDown={() => selectParty("Direct Supply")}
                  >
                    <span className="font-medium text-blue-600 dark:text-blue-400">Direct Supply</span>
                  </div>

                  {filteredParties.length > 0 ? (
                    filteredParties.map((party, index) => (
                      <div
                        key={party}
                        className={`px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white ${index + 1 === selectedPartyIndex ? 'bg-blue-100 dark:bg-blue-900' : ''
                          }`}
                        onMouseDown={() => selectParty(party)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{party}</span>
                          {party === formData.partyName && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    partyFilter.trim() && (
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center font-medium"
                        onMouseDown={() => selectParty(partyFilter)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Use "{partyFilter}"
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            {errors.partyName && (
              <p className="text-xs text-red-500">{errors.partyName}</p>
            )}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${errors.yarnType
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${errors.shade
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="Enter shade/color"
                />
                {errors.shade && (
                  <p className="text-xs text-red-500">{errors.shade}</p>
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${errors.lot
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${errors.expectedArrivalDate
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
