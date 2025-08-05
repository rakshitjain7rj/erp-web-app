import React, { useEffect, useState } from "react"; 
import {
  getAllDyeingRecords,
  deleteDyeingRecord,
  getDyeingStatus,
  markAsArrived,
  completeReprocessing,
  createDyeingRecord,
  updateDyeingRecord,
} from "../api/dyeingApi";
import { DyeingRecord, SimplifiedDyeingDisplayRecord } from "../types/dyeing";
import SimplifiedDyeingOrderForm from "../components/SimplifiedDyeingOrderForm";
import { Button } from "../components/ui/Button";
import { ChevronDown, ChevronUp, MoreVertical, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import FollowUpModal from "../components/FollowUpModal";
import { exportDataToCSV } from "../utils/exportUtils";
import FloatingActionDropdown from "../components/FloatingActionDropdown";
import { getAllDyeingFirms, DyeingFirm } from "../api/dyeingFirmApi";

const DyeingOrders: React.FC = () => {
  const [records, setRecords] = useState<DyeingRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<any | null>(null); // Updated to handle simplified data
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DyeingRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [firmFilter, setFirmFilter] = useState<string>("");
  const [partyFilter, setPartyFilter] = useState<string>("");

  // Update quantities functionality
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    quantity: number;
    receivedQuantity: number;
    dispatchQuantity: number;
    sentQuantity: number;
  }>({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });

  // Centralized dyeing firms state
  const [centralizedDyeingFirms, setCentralizedDyeingFirms] = useState<DyeingFirm[]>([]);
  const [isLoadingFirms, setIsLoadingFirms] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Add saving state

  useEffect(() => {
    fetchRecords();
    fetchCentralizedDyeingFirms();
  }, []);

  // ================= TRACKING INFO PARSER (SHARED) =================
  const parseTrackingInfo = (remarks?: string) => {
    console.log('📝 Parsing remarks:', remarks);
    if (!remarks) {
      return {
        received: undefined,
        receivedDate: undefined,
        dispatch: undefined,
        dispatchDate: undefined,
        partyNameMiddleman: "Direct Supply",
        originalRemarks: ""
      };
    }
    
    const received = remarks.match(/Received: ([\d.]+)kg/)?.[1];
    const receivedDate = remarks.match(/Received: [\d.]+kg on ([\d-]+)/)?.[1];
    const dispatched = remarks.match(/Dispatched: ([\d.]+)kg/)?.[1];
    const dispatchDate = remarks.match(/Dispatched: [\d.]+kg on ([\d-]+)/)?.[1];
    const middleman = remarks.match(/Middleman: ([^|]+)/)?.[1]?.trim();
    const originalQty = remarks.match(/OriginalQty: ([\d.]+)kg/)?.[1];
    
    // ENHANCED: Handle multiple entries by taking the LAST value
    const allReceivedMatches = remarks.match(/Received: ([\d.]+)kg/g);
    const allDispatchedMatches = remarks.match(/Dispatched: ([\d.]+)kg/g);
    const allOriginalQtyMatches = remarks.match(/OriginalQty: ([\d.]+)kg/g);
    
    let finalReceived = received;
    let finalDispatched = dispatched;
    let finalOriginalQty = originalQty;
    
    // If there are multiple entries, take the last one
    if (allReceivedMatches && allReceivedMatches.length > 1) {
      const lastReceivedMatch = allReceivedMatches[allReceivedMatches.length - 1];
      finalReceived = lastReceivedMatch.match(/Received: ([\d.]+)kg/)?.[1];
      console.log('🔍 Multiple received entries found, using last:', finalReceived);
    }
    
    if (allDispatchedMatches && allDispatchedMatches.length > 1) {
      const lastDispatchedMatch = allDispatchedMatches[allDispatchedMatches.length - 1];
      finalDispatched = lastDispatchedMatch.match(/Dispatched: ([\d.]+)kg/)?.[1];
      console.log('🔍 Multiple dispatched entries found, using last:', finalDispatched);
    }
    
    if (allOriginalQtyMatches && allOriginalQtyMatches.length > 1) {
      const lastOriginalQtyMatch = allOriginalQtyMatches[allOriginalQtyMatches.length - 1];
      finalOriginalQty = lastOriginalQtyMatch.match(/OriginalQty: ([\d.]+)kg/)?.[1];
      console.log('🔍 Multiple original quantity entries found, using last:', finalOriginalQty);
    }
    
    // Extract original remarks (everything before ANY tracking info)
    const trackingPattern = / \| (Received:|Dispatched:|Middleman:|OriginalQty:)/;
    const originalRemarks = remarks.split(trackingPattern)[0] || remarks;
    
    const trackingInfo = {
      received: finalReceived !== undefined ? parseFloat(finalReceived) : undefined,
      receivedDate: receivedDate || undefined,
      dispatch: finalDispatched !== undefined ? parseFloat(finalDispatched) : undefined,
      dispatchDate: dispatchDate || undefined,
      partyNameMiddleman: middleman || "Direct Supply",
      originalQuantity: finalOriginalQty !== undefined ? parseFloat(finalOriginalQty) : undefined,
      originalRemarks
    };
    
    console.log('🔍 Parsed tracking info:', trackingInfo);
    return trackingInfo;
  };

  const fetchRecords = async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 Fetching dyeing records...');
      
      const currentTime = new Date().getTime();
      
      // First, check localStorage for recent changes (DISABLED FOR TESTING)
      // const savedRecords = localStorage.getItem('dyeingRecords');
      // const savedTimestamp = localStorage.getItem('dyeingRecordsTimestamp');
      
      // if (savedRecords && savedTimestamp) {
      //   const timeDiff = currentTime - parseInt(savedTimestamp);
      //   // Use cached data if it's less than 10 seconds old
      //   if (timeDiff < 10000) {
      //     const localData = JSON.parse(savedRecords);
      //     if (Array.isArray(localData) && localData.length > 0) {
      //       console.log(`📋 Using recent localStorage data (${Math.round(timeDiff/1000)}s old) with ${localData.length} records`);
      //       setRecords(localData);
      //       setRefreshKey(currentTime % 1000);
      //       setIsRefreshing(false);
      //       return;
      //     }
      //   }
      // }
      
      console.log('🚫 BYPASSING CACHE - Always fetching fresh data for testing');
      
      // Add multiple cache-busting parameters to ensure fresh data
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      console.log('⏰ Cache bust timestamp:', timestamp, 'Random ID:', randomId);
      
      // Clear any local state before fetching
      setRecords([]);
      
      try {
        // Fetch fresh data from server
        const data = await getAllDyeingRecords();
        console.log('📊 Fetched records count:', data.length);
        console.log('📋 First record sample for verification:', data[0]);
        console.log('🔍 All record IDs:', data.map(r => r.id));
        console.log('🏭 All dyeing firms in fetched data:', [...new Set(data.map(r => r.dyeingFirm))]);
        console.log('👥 All party names in fetched data:', [...new Set(data.map(r => r.partyName))]);
        
        // CRITICAL DEBUG: Check the remarks of all records to see if updates are being saved
        console.log('🔍 CRITICAL: Checking all record remarks for tracking info...');
        data.forEach((record, index) => {
          if (record.remarks && (record.remarks.includes('Received:') || record.remarks.includes('Dispatched:'))) {
            console.log(`  Record ${index + 1} (ID: ${record.id}):`, record.remarks);
          }
        });
        
        // Validate data integrity
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from server');
        }
        
        // Save to localStorage as backup with timestamp
        localStorage.setItem('dyeingRecords', JSON.stringify(data));
        localStorage.setItem('dyeingRecordsTimestamp', currentTime.toString());
        console.log('💾 Saved records to localStorage backup with timestamp');
        
        // Set the records with a small delay to ensure proper state update
        await new Promise(resolve => setTimeout(resolve, 50));
        setRecords(data);
        
        // Force refresh key update
        const newRefreshKey = timestamp % 1000;
        setRefreshKey(newRefreshKey);
        console.log('✅ Records state updated with refresh key:', newRefreshKey);
        
        // Log final state for verification
        setTimeout(() => {
          console.log('🔍 Final verification - Records in state:', data.length);
        }, 100);
        
      } catch (apiError) {
        console.warn('⚠️ API failed, trying localStorage backup:', apiError);
        
        // Try to get from localStorage backup (even if old)
        const savedRecords = localStorage.getItem('dyeingRecords');
        if (savedRecords) {
          const data = JSON.parse(savedRecords);
          if (Array.isArray(data) && data.length > 0) {
            console.log(`📋 Loaded ${data.length} records from localStorage backup (API failed)`);
            setRecords(data);
            setRefreshKey(currentTime % 1000);
          } else {
            throw apiError; // Re-throw if localStorage is also invalid
          }
        } else {
          throw apiError; // Re-throw if no localStorage backup
        }
      }
      
    } catch (error) {
      console.error("❌ Failed to fetch dyeing records:", error);
      toast.error("Failed to load dyeing records. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch centralized dyeing firms from API
  const fetchCentralizedDyeingFirms = async () => {
    try {
      setIsLoadingFirms(true);
      console.log('🔄 Fetching centralized dyeing firms for Dyeing Orders...');
      
      // Try to fetch from API, but don't let it fail the whole process
      try {
        const firms = await getAllDyeingFirms();
        setCentralizedDyeingFirms(firms);
        console.log(`✅ Loaded ${firms.length} centralized dyeing firms:`, firms.map(f => f.name));
      } catch (apiError) {
        console.warn('⚠️ API failed to fetch centralized dyeing firms, using fallback:', apiError);
        throw apiError; // Re-throw to trigger fallback
      }
    } catch (error) {
      console.error('❌ Failed to fetch centralized dyeing firms:', error);
      // Fallback to extracting from existing records if API fails
      const fallbackFirms = Array.from(new Set(records.map((r) => r.dyeingFirm)))
        .filter(Boolean) // Remove empty/null values
        .map((name, index) => ({
          id: -(index + 1),
          name,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      setCentralizedDyeingFirms(fallbackFirms);
      console.log(`📋 Using fallback firms from records:`, fallbackFirms.map(f => f.name));
      // Don't throw error, just continue with fallback
    } finally {
      setIsLoadingFirms(false);
    }
  };

  // ================= MAPPING FUNCTION =================
  const mapToSimplifiedDisplay = (record: DyeingRecord): SimplifiedDyeingDisplayRecord => {
    console.log('🔄 Mapping record to simplified display:', record.id);
    console.log('📋 Raw record data:', record);
    
    const trackingInfo = parseTrackingInfo(record.remarks);
    
    const mappedRecord = {
      id: record.id,
      quantity: trackingInfo.originalQuantity || record.quantity, // Use original quantity if available, otherwise use record quantity
      customerName: record.partyName,
      sentToDye: record.quantity, // This is what was actually sent (stored as main quantity in DB)
      sentDate: record.sentDate,
      received: trackingInfo.received,
      receivedDate: trackingInfo.receivedDate,
      dispatch: trackingInfo.dispatch,
      dispatchDate: trackingInfo.dispatchDate,
      partyNameMiddleman: trackingInfo.partyNameMiddleman,
      dyeingFirm: record.dyeingFirm,
      remarks: trackingInfo.originalRemarks || record.remarks
    };
    
    console.log('✅ Mapped simplified record:', mappedRecord);
    console.log('✅ Mapped quantity (original):', mappedRecord.quantity);
    console.log('✅ Mapped sentToDye (actual sent):', mappedRecord.sentToDye);
    console.log('✅ Mapped received value:', mappedRecord.received);
    console.log('✅ Mapped dispatch value:', mappedRecord.dispatch);
    console.log('✅ Original record remarks:', record.remarks);
    return mappedRecord;
  };

  const filteredRecords = records.filter((r) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      r.partyName.toLowerCase().includes(query) ||
      r.dyeingFirm.toLowerCase().includes(query) ||
      r.yarnType.toLowerCase().includes(query) ||
      r.shade.toLowerCase().includes(query) ||
      r.lot.toLowerCase().includes(query) ||
      r.count.toLowerCase().includes(query);

    const matchesStatus = statusFilter ? getDyeingStatus(r) === statusFilter : true;
    const matchesFirm = firmFilter ? r.dyeingFirm === firmFilter : true;
    const matchesParty = partyFilter ? r.partyName === partyFilter : true;

    return matchesSearch && matchesStatus && matchesFirm && matchesParty;
  });

  const uniqueStatuses = Array.from(new Set(records.map((r) => getDyeingStatus(r))));
  // Use centralized dyeing firms instead of extracting from records
  const uniqueFirms = centralizedDyeingFirms.map(firm => firm.name);
  const uniqueParties = Array.from(new Set(records.map((r) => r.partyName)));

  const groupedByFirm = filteredRecords.reduce((acc, record) => {
    if (!acc[record.dyeingFirm]) acc[record.dyeingFirm] = [];
    acc[record.dyeingFirm].push(record);
    return acc;
  }, {} as Record<string, DyeingRecord[]>);

  const statusBadge = (status: string) => {
    const base = "px-3 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case "Arrived":
        return <span className={`${base} bg-green-100 text-green-700`}>Arrived</span>;
      case "Pending":
        return <span className={`${base} bg-yellow-100 text-yellow-700`}>Pending</span>;
      case "Overdue":
        return <span className={`${base} bg-red-100 text-red-700`}>Overdue</span>;
      case "Reprocessing":
        return <span className={`${base} bg-blue-100 text-blue-700`}>Reprocessing</span>;
      default:
        return <span className={`${base} bg-gray-200 text-gray-700`}>{status}</span>;
    }
  };

  const handleEdit = (record: DyeingRecord) => {
    console.log('🖊️ handleEdit called with record:', record);
    console.log('🆔 Record ID:', record.id);
    console.log('🔍 Record type:', typeof record.id);
    
    const trackingInfo = parseTrackingInfo(record.remarks);
    
    console.log('📝 [EDIT] Parsing remarks for edit form:', record.remarks);
    console.log('📝 [EDIT] Extracted tracking info:', trackingInfo);
    console.log('📝 [EDIT] Received value for form:', trackingInfo.received);
    console.log('📝 [EDIT] Dispatch value for form:', trackingInfo.dispatch);
    console.log('📝 [EDIT] Original quantity from tracking:', trackingInfo.originalQuantity);
    
    // Determine the correct quantity values for form fields
    // If no original quantity is stored in remarks, both fields will initially show the same value
    // but the user can edit them separately in the form
    const originalQuantity = trackingInfo.originalQuantity !== undefined ? trackingInfo.originalQuantity : record.quantity;
    const sentToDye = record.quantity; // What was actually sent (stored as main quantity in DB)
    
    console.log('📝 [EDIT] Setting quantity field to (original):', originalQuantity);
    console.log('📝 [EDIT] Setting sentToDye field to (actual sent):', sentToDye);
    console.log('📝 [EDIT] Are they the same?', originalQuantity === sentToDye);
    console.log('📝 [EDIT] Has originalQuantity in remarks?', trackingInfo.originalQuantity !== undefined);
    
    // Convert DyeingRecord to SimplifiedDyeingOrderForm format with all fields properly mapped
    const simplifiedOrder = {
      // Include the record ID for editing
      id: record.id,
      
      // Basic fields from API - CORRECTED FIELD MAPPINGS
      quantity: originalQuantity, // Use original quantity for the quantity field
      customerName: record.partyName, // API stores customer name as partyName
      sentToDye: sentToDye, // Use actual sent quantity (what's stored in record.quantity)
      sentDate: record.sentDate,
      dyeingFirm: record.dyeingFirm,
      
      // Tracking info parsed from remarks
      received: trackingInfo.received || 0,
      receivedDate: trackingInfo.receivedDate || '',
      dispatch: trackingInfo.dispatch || 0,
      dispatchDate: trackingInfo.dispatchDate || '',
      partyName: trackingInfo.partyNameMiddleman || 'Direct Supply', // This is the middleman/party
      
      // Technical fields for API
      yarnType: record.yarnType,
      shade: record.shade,
      count: record.count,
      lot: record.lot,
      expectedArrivalDate: record.expectedArrivalDate,
      
      // Clean remarks without tracking info
      remarks: trackingInfo.originalRemarks,
    };
    
    console.log('📝 Edit record - Original:', record);
    console.log('📝 Edit record - Parsed tracking info:', trackingInfo);
    console.log('📝 Edit record - Simplified order for form:', simplifiedOrder);
    console.log('🆔 Final simplified order ID:', simplifiedOrder.id);
    console.log('📝 Final form quantity (original):', simplifiedOrder.quantity);
    console.log('📝 Final form sentToDye (actual sent):', simplifiedOrder.sentToDye);
    console.log('📝 Form will show same values?', simplifiedOrder.quantity === simplifiedOrder.sentToDye);
    console.log('🔍 Final simplified order ID type:', typeof simplifiedOrder.id);
    
    setOrderToEdit(simplifiedOrder);
    setIsFormOpen(true);
  };

  // Handler for successful form submission
  const handleOrderSuccess = async (orderData: any) => {
    try {
      // The form already handles the API call, so we just need to refresh
      console.log("🎯 Order operation completed successfully:", orderData);
      console.log("🎯 Is editing mode:", !!orderToEdit);
      console.log("🎯 OrderToEdit details:", orderToEdit);
      
      console.log('🔄 Starting comprehensive data refresh after order operation...');
      
      // Clear any existing state to force complete refresh
      setRecords([]);
      setCentralizedDyeingFirms([]);
      
      // CRITICAL: Clear localStorage to force fresh API call
      localStorage.removeItem('dyeingRecords');
      localStorage.removeItem('dyeingRecordsTimestamp');
      console.log('🗑️ Cleared localStorage cache to force fresh fetch');
      
      // Add a longer delay to ensure database transaction is fully committed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear browser cache if available
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('🗑️ Browser cache cleared');
        } catch (error) {
          console.log('⚠️ Cache clearing failed:', error);
        }
      }
      
      // Force multiple refreshes to ensure data consistency
      console.log('🔄 Fetching records - First attempt');
      await fetchRecords();
      
      // Second fetch with a small delay to ensure consistency
      setTimeout(async () => {
        console.log('🔄 Fetching records - Second attempt for consistency');
        await fetchRecords();
      }, 200);
      
      // Also refresh centralized dyeing firms to show newly created firms
      console.log('🔄 Fetching dyeing firms');
      await fetchCentralizedDyeingFirms();
      
      console.log('✅ Comprehensive data refresh completed');
      
      // Close the form and clear edit state
      setIsFormOpen(false);
      setOrderToEdit(null);
      
      // Force multiple re-renders to ensure UI updates
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setRefreshKey(prev => prev + 1), 100);
      setTimeout(() => setRefreshKey(prev => prev + 1), 300);
      
      console.log('🎯 Form closed and edit state cleared');
      
      // Show success message with more details
      const actionType = orderData?.action || 'processed';
      toast.success(`Order ${actionType} successfully! The listing has been refreshed.`, {
        duration: 3000,
      });
      
    } catch (error) {
      console.error("Failed to refresh data after order operation:", error);
      toast.error("Order operation completed but failed to refresh data. Please manually refresh the page.");
      
      // Fallback: force page reload if refresh fails
      setTimeout(() => {
        if (window.confirm("Would you like to reload the page to see the updated data?")) {
          window.location.reload();
        }
      }, 2000);
    }
  };

  const handleDelete = async (record: DyeingRecord) => {
    console.log('🗑️ Delete button clicked for record:', record.id, record.partyName);
    
    const confirmed = window.confirm(`Are you sure you want to delete order for ${record.partyName}?`);
    console.log('💭 Confirmation result:', confirmed);
    
    if (!confirmed) {
      console.log('❌ Delete cancelled by user');
      return;
    }
    
    try {
      console.log('🔄 Attempting to delete record with ID:', record.id);
      
      await deleteDyeingRecord(record.id);
      console.log('✅ Record deleted successfully from API');
      
      toast.success("Record deleted successfully!");
      
      // Refresh the records list
      console.log('🔄 Refreshing records list...');
      await fetchRecords();
      console.log('✅ Records list refreshed');
      
    } catch (error: any) {
      console.error("❌ Delete failed:", error);
      
      // Show more detailed error message
      const errorMessage = error?.response?.data?.message || error?.message || "Unknown error occurred";
      toast.error(`Failed to delete record: ${errorMessage}`);
    }
  };

  const handleFollowUp = (record: DyeingRecord) => {
    setSelectedRecord(record);
    setIsFollowUpModalOpen(true);
  };

  const handleMarkArrived = async (record: DyeingRecord) => {
    try {
      await markAsArrived(record.id);
      toast.success("Marked as Arrived");
      fetchRecords();
    } catch (error) {
      console.error("Mark Arrived error:", error);
      toast.error("Failed to mark as arrived");
    }
  };

  const handleReprocessing = async (record: DyeingRecord) => {
    const reason = prompt("Enter reason for reprocessing:");
    if (!reason) return;
    try {
      await completeReprocessing(record.id, { reprocessingReason: reason });
      toast.success("Marked as Reprocessing");
      fetchRecords();
    } catch (error) {
      console.error("Reprocessing error:", error);
      toast.error("Failed to complete reprocessing");
    }
  };

  const handleUpdateQuantities = (record: DyeingRecord) => {
    console.log('🎯 handleUpdateQuantities called for record:', record.id);
    console.log('🎯 Raw record data:', record);
    
    // Use the same mapping logic as the display to ensure consistency
    const simplifiedRecord = mapToSimplifiedDisplay(record);
    
    console.log('🎯 Simplified record for editing:', simplifiedRecord);
    console.log('🎯 Simplified quantity (original):', simplifiedRecord.quantity);
    console.log('🎯 Simplified sentToDye (actual sent):', simplifiedRecord.sentToDye);
    console.log('🎯 Simplified received:', simplifiedRecord.received);
    console.log('🎯 Simplified dispatch:', simplifiedRecord.dispatch);
    
    // Set edit values using the mapped simplified record - EXACTLY like count product
    setEditValues({
      quantity: simplifiedRecord.quantity,           // Original quantity from mapping
      receivedQuantity: simplifiedRecord.received || 0,
      dispatchQuantity: simplifiedRecord.dispatch || 0,
      sentQuantity: simplifiedRecord.sentToDye,      // Sent to dye quantity from mapping
    });
    
    console.log('🎯 Edit values set to:', {
      quantity: simplifiedRecord.quantity,
      receivedQuantity: simplifiedRecord.received || 0,
      dispatchQuantity: simplifiedRecord.dispatch || 0,
      sentQuantity: simplifiedRecord.sentToDye,
    });
    
    setEditingRecordId(record.id);
    toast.info("Edit mode activated. Update quantities and save changes.");
  };

  const handleSaveQuantities = async (record: DyeingRecord) => {
    console.log('🔄 handleSaveQuantities called for record ID:', record.id);
    console.log('📋 Current editValues:', editValues);
    
    // Prevent multiple simultaneous saves
    if (isSaving) {
      console.log('⚠️ Already saving, ignoring click');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // ENHANCED VALIDATION: Allow zero values and provide better error messages
      if (editValues.sentQuantity <= 0) {
        console.log('❌ Validation failed: sentQuantity <= 0, value:', editValues.sentQuantity);
        toast.error("Sent to dye quantity must be greater than 0.");
        return;
      }

      // Allow quantity to be 0 if it's the same as sentQuantity (no original quantity difference)
      if (editValues.quantity < 0) {
        console.log('❌ Validation failed: quantity < 0, value:', editValues.quantity);
        toast.error("Quantity cannot be negative.");
        return;
      }

      if (editValues.dispatchQuantity < 0 || editValues.receivedQuantity < 0) {
        console.log('❌ Validation failed: negative quantities');
        console.log('  - receivedQuantity:', editValues.receivedQuantity);
        console.log('  - dispatchQuantity:', editValues.dispatchQuantity);
        toast.error("Received and dispatch quantities cannot be negative.");
        return;
      }

      if (editValues.receivedQuantity > editValues.sentQuantity) {
        console.log('❌ Validation failed: received > sent');
        console.log('  - receivedQuantity:', editValues.receivedQuantity);
        console.log('  - sentQuantity:', editValues.sentQuantity);
        toast.error("Received quantity cannot exceed sent quantity.");
        return;
      }

      if (editValues.dispatchQuantity > editValues.receivedQuantity) {
        console.log('❌ Validation failed: dispatch > received');
        console.log('  - dispatchQuantity:', editValues.dispatchQuantity);
        console.log('  - receivedQuantity:', editValues.receivedQuantity);
        toast.error("Dispatch quantity cannot exceed received quantity.");
        return;
      }

      console.log('✅ All validations passed, proceeding with update');
      console.log('📋 Final editValues to be saved:', editValues);

      // Parse existing tracking info to preserve dates and other details
      const existingTrackingInfo = parseTrackingInfo(record.remarks);
      console.log('🔍 Existing tracking info:', existingTrackingInfo);

      // Create enhanced remarks with updated tracking information
      const originalRemarks = record.remarks?.split(' | ')[0] || '';
      const trackingInfo = [];
      
      // Add original quantity info if it's different from sentToDye (like SimplifiedDyeingOrderForm)
      if (editValues.quantity && editValues.quantity !== editValues.sentQuantity) {
        trackingInfo.push(`OriginalQty: ${editValues.quantity}kg`);
        console.log('📦 Adding original quantity to remarks:', editValues.quantity);
      }
      
      // PRESERVE received date when updating received quantity
      if (editValues.receivedQuantity > 0) {
        const receivedDate = existingTrackingInfo.receivedDate;
        const receivedInfo = receivedDate 
          ? `Received: ${editValues.receivedQuantity}kg on ${receivedDate}`
          : `Received: ${editValues.receivedQuantity}kg`;
        trackingInfo.push(receivedInfo);
        console.log('📥 Adding received info with preserved date:', receivedInfo);
      }
      
      // PRESERVE dispatch date when updating dispatch quantity
      if (editValues.dispatchQuantity > 0) {
        const dispatchDate = existingTrackingInfo.dispatchDate;
        const dispatchInfo = dispatchDate 
          ? `Dispatched: ${editValues.dispatchQuantity}kg on ${dispatchDate}`
          : `Dispatched: ${editValues.dispatchQuantity}kg`;
        trackingInfo.push(dispatchInfo);
        console.log('📤 Adding dispatch info with preserved date:', dispatchInfo);
      }
      
      // PRESERVE middleman/party information
      if (existingTrackingInfo.partyNameMiddleman && existingTrackingInfo.partyNameMiddleman !== "Direct Supply") {
        trackingInfo.push(`Middleman: ${existingTrackingInfo.partyNameMiddleman}`);
        console.log('👥 Preserving middleman info:', existingTrackingInfo.partyNameMiddleman);
      }
      
      const enhancedRemarks = [
        originalRemarks,
        ...trackingInfo
      ].filter(Boolean).join(' | ');

      console.log('📝 Enhanced remarks with preserved data:', enhancedRemarks);

      // Prepare update data - PRESERVE ALL existing fields and only update specific ones
      const updateData = {
        ...record, // Preserve ALL existing fields from the original record
        quantity: editValues.sentQuantity,  // Update: The sent quantity becomes the main quantity
        remarks: enhancedRemarks,           // Update: Enhanced remarks with tracking info
        // Preserve all other fields exactly as they were:
        // yarnType, sentDate, expectedArrivalDate, partyName, shade, count, lot, dyeingFirm, etc.
      };

      console.log('🔄 Updating dyeing record with data (preserving all fields):', updateData);
      console.log('📋 Current editValues:', editValues);
      console.log('🔒 Original record fields preserved:', Object.keys(record));
      console.log('🔄 Fields being updated: quantity, remarks');
      console.log('🆔 Record ID being updated:', record.id);
      console.log('🌐 Calling updateDyeingRecord API...');

      const updateResult = await updateDyeingRecord(record.id, updateData);
      console.log('✅ Dyeing record updated successfully via API');
      console.log('✅ API response:', updateResult);

      // Update local state and refresh
      console.log('🔄 Starting refresh process...');
      
      // Exit edit mode FIRST
      console.log('🔄 Exiting edit mode...');
      setEditingRecordId(null);
      setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
      
      // Refresh data to show updated values
      console.log('🔄 Fetching updated records...');
      await fetchRecords();
      
      console.log('✅ Edit mode exited, form reset, data refreshed');
      toast.success("Quantities updated successfully and saved to database!");
    } catch (error) {
      console.error('❌ Failed to update dyeing record:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        recordId: record.id,
        editValues: editValues
      });
      toast.error(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
    toast.info("Edit cancelled. Changes discarded.");
  };

  const handleEditValueChange = (field: keyof typeof editValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditValues(prev => ({ ...prev, [field]: numValue }));
  };

  // Format quantity display similar to count product
  const formatQuantity = (quantity?: number): string => {
    // Only show "--" for undefined/null values, show "0 kg" for actual 0 values
    if (quantity === undefined || quantity === null) {
      return "--";
    }
    return `${quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1)} kg`;
  };

  const handleExportCSV = () => {
    exportDataToCSV(filteredRecords, "DyeingOrders");
  };

  const handleExportPDF = () => {
    const html2pdf = (window as any).html2pdf;
    const element = document.getElementById("dyeing-orders-table");
    if (!element || !html2pdf) {
      toast.error("Export failed: PDF library not loaded.");
      return;
    }

    html2pdf()
      .set({
        margin: 0.5,
        filename: `DyeingOrders_${new Date().toISOString()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
      })
      .from(element)
      .save();
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🪨 Dyeing Orders Overview</h1>
          {isRefreshing && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Refreshing...</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              console.log('🔄 Manual refresh button clicked');
              setRecords([]);
              await fetchRecords();
              await fetchCentralizedDyeingFirms();
              setRefreshKey(prev => prev + 1);
              toast.success('Data refreshed successfully!');
            }} 
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Force Refresh
          </Button>
          <Button onClick={handleExportCSV}>Export CSV</Button>
          <Button onClick={handleExportPDF}>Export PDF</Button>
          <Button onClick={() => { 
            console.log('Add Dyeing Order button clicked - Current isFormOpen:', isFormOpen); 
            setOrderToEdit(null); 
            setIsFormOpen(true); 
            console.log('isFormOpen set to true - New state should be:', true);
          }}>+ Add Dyeing Order</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search by party, firm, yarn, lot, shade, count"
          className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-700"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-700">
          <option value="">Filter by Status</option>
          {uniqueStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={firmFilter} onChange={(e) => setFirmFilter(e.target.value)} className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-700">
          <option value="">Filter by Firm</option>
          {uniqueFirms.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)} className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-700">
          <option value="">Filter by Party</option>
          {uniqueParties.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Add Dyeing Order Form - Shows when button is clicked */}
      {isFormOpen && (
        <div className="animate-fadeIn">
          <SimplifiedDyeingOrderForm
            orderToEdit={orderToEdit}
            onCancel={() => {
              setIsFormOpen(false);
              setOrderToEdit(null);
            }}
            onSuccess={handleOrderSuccess}
            existingFirms={Array.from(new Set(records.map(record => record.dyeingFirm).filter(Boolean)))}
          />
        </div>
      )}

      <div className="space-y-6" key={refreshKey}>
        {isRefreshing && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Refreshing data to show latest changes...</span>
            </div>
          </div>
        )}
        {Object.entries(groupedByFirm).map(([firm, firmRecords]) => (
          <div key={`${firm}-${refreshKey}`} className="overflow-hidden shadow rounded-2xl">
            <div
              onClick={() => setExpandedFirm((f) => (f === firm ? null : firm))}
              className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 cursor-pointer hover:bg-purple-50"
            >
              <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-400">{firm} ({firmRecords.length})</h2>
              {expandedFirm === firm ? <ChevronUp /> : <ChevronDown />}
            </div>

            {expandedFirm === firm && (
              <div className="overflow-x-auto bg-white dark:bg-gray-800 border-t dark:border-gray-700" id="dyeing-orders-table">
                <div className="min-w-[1000px]"> {/* Ensure minimum width for horizontal scroll */}
                  <table className="w-full text-sm">
                    <thead className="text-gray-600 dark:text-gray-300 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Quantity</th>
                        <th className="px-4 py-3 text-left font-semibold">Customer Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Sent to Dye</th>
                        <th className="px-4 py-3 text-left font-semibold">Sent Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Received</th>
                        <th className="px-4 py-3 text-left font-semibold">Received Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Dispatch</th>
                        <th className="px-4 py-3 text-left font-semibold">Dispatch Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Party/Middleman</th>
                        <th className="px-4 py-3 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                      {firmRecords.map((record) => {
                        const simplifiedRecord = mapToSimplifiedDisplay(record);
                        const isEditing = editingRecordId === record.id;
                        
                        return (
                          <tr key={`${record.id}-${refreshKey}-${record.updatedAt || ''}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                            <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.quantity}
                                  onChange={(e) => handleEditValueChange('quantity', e.target.value)}
                                  className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                formatQuantity(simplifiedRecord.quantity)
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium">{simplifiedRecord.customerName}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.sentQuantity}
                                  onChange={(e) => handleEditValueChange('sentQuantity', e.target.value)}
                                  className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                formatQuantity(simplifiedRecord.sentToDye)
                              )}
                            </td>
                            <td className="px-4 py-3">{new Date(simplifiedRecord.sentDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.receivedQuantity}
                                  onChange={(e) => handleEditValueChange('receivedQuantity', e.target.value)}
                                  className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                formatQuantity(simplifiedRecord.received)
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                              {simplifiedRecord.receivedDate ? new Date(simplifiedRecord.receivedDate).toLocaleDateString() : '--'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.dispatchQuantity}
                                  onChange={(e) => handleEditValueChange('dispatchQuantity', e.target.value)}
                                  className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                formatQuantity(simplifiedRecord.dispatch)
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                              {simplifiedRecord.dispatchDate ? new Date(simplifiedRecord.dispatchDate).toLocaleDateString() : '--'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                                {simplifiedRecord.partyNameMiddleman}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isEditing ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => handleSaveQuantities(record)}
                                    disabled={isSaving}
                                    className={`p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                      isSaving 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                                    }`}
                                    title={isSaving ? "Saving..." : "Save Changes"}
                                  >
                                    {isSaving ? (
                                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                    className={`p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                      isSaving 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                                    }`}
                                    title="Cancel Changes"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <FloatingActionDropdown
                                  onEdit={() => {
                                    console.log('📝 Edit clicked for record:', record.id);
                                    handleEdit(record);
                                  }}
                                  onDelete={() => {
                                    console.log('🗑️ Delete clicked for record:', record.id, 'Party:', record.partyName);
                                    console.log('🔍 Full record object:', record);
                                    handleDelete(record);
                                  }}
                                  onFollowUp={() => handleFollowUp(record)}
                                  onUpdateQuantities={() => handleUpdateQuantities(record)}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setSelectedRecord(null);
        }}
        dyeingRecord={selectedRecord}
        onFollowUpAdded={fetchRecords}
      />
    </div>
  );
};

export default DyeingOrders;