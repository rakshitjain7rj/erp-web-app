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
import { CountProduct, getAllCountProducts, deleteCountProduct } from "../api/countProductApi";
import { DyeingRecord, SimplifiedDyeingDisplayRecord } from "../types/dyeing";
import SimplifiedDyeingOrderForm from "../components/SimplifiedDyeingOrderForm";
import { Button } from "../components/ui/Button";
import { ChevronDown, ChevronUp, MoreVertical, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import FollowUpModal from "../components/FollowUpModal";
import { exportDataToCSV } from "../utils/exportUtils";
import FloatingActionDropdown from "../components/FloatingActionDropdown";
import { DyeingFirm } from "../api/dyeingFirmApi";
import { dyeingDataStore } from "../stores/dyeingDataStore";

const DyeingOrders: React.FC = () => {
  const [records, setRecords] = useState<DyeingRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<any | null>(null);
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DyeingRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [firmFilter, setFirmFilter] = useState<string>("");
  const [partyFilter, setPartyFilter] = useState<string>("");

  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    quantity: number;
    receivedQuantity: number;
    dispatchQuantity: number;
    sentQuantity: number;
  }>({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });

  const [centralizedDyeingFirms, setCentralizedDyeingFirms] = useState<DyeingFirm[]>([]);
  const [dyeingRecords, setDyeingRecords] = useState<DyeingRecord[]>([]);
  const [countProducts, setCountProducts] = useState<CountProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log('🔧 [DyeingOrders] Component mounting, initializing store...');
    
    let unmounted = false;
    
    const initializeStoreAndSubscribe = async () => {
      try {
        // Initialize store first
        console.log('🔄 [DyeingOrders] Initializing store...');
        await dyeingDataStore.init();
        
        if (unmounted) return;
        
        console.log('✅ [DyeingOrders] Store initialized, setting up subscriptions...');
        
        // Subscribe to store updates
        const unsubscribeFirms = await dyeingDataStore.subscribeFirms((firms) => {
          if (unmounted) return;
          console.log('📡 [DyeingOrders] Received firm sync update:', {
            count: firms.length,
            firms: firms.map(f => f.name),
            source: 'unified-store'
          });
          setCentralizedDyeingFirms(firms);
          
          // Debug: Log firm update details
          console.log('🔍 [DyeingOrders] Centralized firms updated:', {
            totalFirms: firms.length,
            firmNames: firms.map(f => ({ name: f.name, isActive: f.isActive })),
            timestamp: new Date().toISOString()
          });
        });
        
        const unsubscribeRecords = await dyeingDataStore.subscribeRecords((records) => {
          if (unmounted) return;
          console.log('📡 [DyeingOrders] Received records sync update:', {
            count: records.length,
            source: 'unified-store'
          });
          setRecords(records);
          setDyeingRecords(records);
        });
        
        console.log('✅ [DyeingOrders] Subscriptions established');
        
        // Fetch count products to show cross-page data
        fetchCountProducts();
        
        // Store cleanup functions
        return () => {
          unsubscribeFirms();
          unsubscribeRecords();
        };
        
      } catch (error) {
        console.error('❌ [DyeingOrders] Store initialization failed:', error);
      }
    };
    
    let cleanupPromise = initializeStoreAndSubscribe();
    
    return () => {
      unmounted = true;
      cleanupPromise.then(cleanup => {
        if (cleanup) cleanup();
      }).catch(console.error);
    };
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
        originalQuantity: undefined,
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

  // ================= MAPPING FUNCTION =================
  const mapToSimplifiedDisplay = (record: DyeingRecord): SimplifiedDyeingDisplayRecord => {
    console.log('🔄 Mapping record to simplified display:', record.id);
    console.log('📋 Raw record data:', record);
    
    const trackingInfo = parseTrackingInfo(record.remarks);
    
    const mappedRecord = {
      id: record.id,
      quantity: trackingInfo.originalQuantity || record.quantity, // Use original quantity if available, otherwise use record quantity
      customerName: record.partyName,
      count: record.count || "Standard", // Add count field from dyeing record
      sentToDye: record.quantity || 0, // This is what was actually sent (stored as main quantity in DB)
      sentDate: record.sentDate,
      received: trackingInfo.received || 0,
      receivedDate: trackingInfo.receivedDate,
      dispatch: trackingInfo.dispatch || 0,
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

  // ================= COUNT PRODUCT MAPPING FUNCTION =================
  const mapCountProductToSimplifiedDisplay = (countProduct: CountProduct): SimplifiedDyeingDisplayRecord => {
    console.log('🔄 [DyeingOrders] Mapping count product to simplified display:', {
      id: countProduct.id,
      quantity: countProduct.quantity,
      sentQuantity: countProduct.sentQuantity,
      receivedQuantity: countProduct.receivedQuantity,
      dispatchQuantity: countProduct.dispatchQuantity,
      received: countProduct.received,
      dispatch: countProduct.dispatch
    });
    
    const mappedRecord = {
      id: countProduct.id,
      quantity: countProduct.quantity,
      customerName: countProduct.customerName,
      count: countProduct.count || "Standard", // Add count field from count product
      sentToDye: countProduct.sentToDye ? (countProduct.sentQuantity ?? countProduct.quantity) : 0,
      sentDate: countProduct.sentDate,
      received: countProduct.received ? countProduct.receivedQuantity : undefined,
      receivedDate: countProduct.receivedDate || undefined,
      dispatch: countProduct.dispatch ? countProduct.dispatchQuantity : undefined,
      dispatchDate: countProduct.dispatchDate || undefined,
      partyNameMiddleman: countProduct.middleman || countProduct.partyName,
      dyeingFirm: countProduct.dyeingFirm,
      remarks: countProduct.remarks || ''
    };
    
    console.log('✅ [DyeingOrders] Mapped count product result:', {
      sentToDye: mappedRecord.sentToDye,
      received: mappedRecord.received,
      dispatch: mappedRecord.dispatch,
      originalQuantity: countProduct.quantity,
      originalSentQuantity: countProduct.sentQuantity,
      originalReceived: countProduct.receivedQuantity,
      originalDispatch: countProduct.dispatchQuantity
    });
    return mappedRecord;
  };

  // ================= FETCH COUNT PRODUCTS =================
  const fetchCountProducts = async () => {
    try {
      console.log('🔄 [DyeingOrders] Fetching count products...');

      // Try cached data first for instant display
      const cached = localStorage.getItem('countProducts');
      const ts = localStorage.getItem('countProductsTimestamp');
      const now = Date.now();
      if (cached && ts && now - parseInt(ts) < 5 * 60 * 1000) { // 5 min freshness
        try {
          const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              console.log('⚡ [DyeingOrders] Using cached count products:', parsed.length);
              setCountProducts(parsed);
            }
        } catch (e) {
          console.warn('⚠️ [DyeingOrders] Failed to parse cached count products');
        }
      }

      // Always attempt fresh fetch
      const products = await getAllCountProducts();
      console.log('✅ [DyeingOrders] Count products fetched (fresh):', products.length);
      setCountProducts(products);
      localStorage.setItem('countProducts', JSON.stringify(products));
      localStorage.setItem('countProductsTimestamp', now.toString());
    } catch (error) {
      console.error('❌ [DyeingOrders] Failed to fetch count products (will fallback to cache if present):', error);
      const cached = localStorage.getItem('countProducts');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            console.log('🛟 [DyeingOrders] Using fallback cached count products:', parsed.length);
            setCountProducts(parsed);
            return;
          }
        } catch {}
      }
      setCountProducts([]);
    }
  };

  // Refetch count products when centralized firm list grows (new firm added elsewhere)
  useEffect(() => {
    fetchCountProducts();
  }, [centralizedDyeingFirms.length]);

  // Cross-page synchronization - listen for localStorage changes from CountProductOverview
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'countProducts' && e.newValue) {
        try {
          const updatedProducts = JSON.parse(e.newValue);
          console.log('🔄 [DyeingOrders] Detected countProducts change from storage event, syncing...', {
            count: updatedProducts.length,
            source: 'storage-event'
          });
          
          setCountProducts(updatedProducts);
          setRefreshKey(prev => prev + 1);
          
          console.log('✅ [DyeingOrders] Storage sync completed');
          
        } catch (error) {
          console.error('❌ [DyeingOrders] Failed to parse countProducts from storage change:', error);
        }
      }
    };

    // Listen for storage changes from other tabs/pages
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-page updates)
    const handleCustomSync = (e: CustomEvent) => {
      if (e.detail && e.detail.countProducts) {
        console.log('🔄 [DyeingOrders] Custom countProducts sync received:', {
          count: e.detail.countProducts.length,
          updatedProductId: e.detail.updatedProductId,
          updateData: e.detail.updateData,
          timestamp: e.detail.timestamp,
          demoMode: e.detail.demoMode
        });
        
        setCountProducts(e.detail.countProducts);
        setRefreshKey(prev => prev + 1);
        
        console.log('✅ [DyeingOrders] Custom sync completed');
      }
    };

    window.addEventListener('countProductsUpdated', handleCustomSync as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('countProductsUpdated', handleCustomSync as EventListener);
    };
  }, []);

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

  // Group count products by firm for cross-page display
  const groupedCountProductsByFirm = countProducts.reduce((acc, product) => {
    if (!acc[product.dyeingFirm]) acc[product.dyeingFirm] = [];
    acc[product.dyeingFirm].push(product);
    return acc;
  }, {} as Record<string, CountProduct[]>);

  // Automatically remove firms with 0 products to match CountProductOverview behavior
  const completeFirmListing = centralizedDyeingFirms
    .map(firm => {
      const dyeingRecords = groupedByFirm[firm.name] || [];
      const countProductsForFirm = groupedCountProductsByFirm[firm.name] || [];
      
      // Combine both dyeing records and count products for display
      const hasData = dyeingRecords.length > 0 || countProductsForFirm.length > 0;
      
      return {
        name: firm.name,
        records: dyeingRecords,
        countProducts: countProductsForFirm,
        hasData,
        id: firm.id
      };
    })
    // AUTOMATICALLY remove firms with 0 products (same as CountProductOverview)
    .filter(firm => firm.countProducts.length > 0 || firm.records.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Debug: Log firm listing construction
  console.log('🔍 [DyeingOrders] completeFirmListing constructed:', {
    centralizedFirmsCount: centralizedDyeingFirms.length,
    centralizedFirmNames: centralizedDyeingFirms.map(f => f.name),
    groupedByFirmKeys: Object.keys(groupedByFirm),
    groupedCountProductsKeys: Object.keys(groupedCountProductsByFirm),
    completeFirmListingCount: completeFirmListing.length,
    completeFirmListingNames: completeFirmListing.map(f => ({ 
      name: f.name, 
      dyeingRecords: f.records.length, 
      countProducts: f.countProducts.length,
      hasData: f.hasData 
    })),
    timestamp: new Date().toISOString()
  });

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
      // Ensure firm exists in store before processing
      const dyeingFirmName = orderData?.dyeingFirm || orderData?.updatedFields?.dyeingFirm;
      if (dyeingFirmName) {
        console.log('🏢 Ensuring firm exists in store:', dyeingFirmName);
        try {
          await dyeingDataStore.ensureFirm(dyeingFirmName);
          console.log('✅ Firm ensured in store:', dyeingFirmName);
        } catch (error) {
          console.warn('⚠️ Failed to ensure firm in store:', error);
        }
      }
      
      console.log("🎯 Order operation completed successfully:", orderData);
      console.log("🎯 Is editing mode:", !!orderToEdit);
      
      // Reload data from store
      console.log('� Reloading data from store...');
      await dyeingDataStore.loadRecords(true);
      await dyeingDataStore.loadFirms(true);
      
      console.log('✅ Store data refreshed');
      
      // Close the form and clear edit state
      setIsFormOpen(false);
      setOrderToEdit(null);
      
      // Force UI refresh
      setRefreshKey(prev => prev + 1);
      
      console.log('🎯 Form closed and edit state cleared');
      
      // Show success message
      const actionType = orderData?.action || 'processed';
      toast.success(`Order ${actionType} successfully! Data synchronized across all pages.`, {
        duration: 3000,
      });
      
    } catch (error) {
      console.error("Failed to refresh data after order operation:", error);
      toast.error("Order operation completed but failed to refresh data. Please try again.");
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
      
      // Refresh the records list using store
      console.log('🔄 Refreshing records list...');
      await dyeingDataStore.loadRecords(true);
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
      await dyeingDataStore.loadRecords(true);
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
      await dyeingDataStore.loadRecords(true);
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
      await dyeingDataStore.loadRecords(true);
      
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

  // CountProduct action handlers - synchronized with CountProductOverview
  const handleCountProductEdit = (productId: number) => {
    console.log('🖊️ [DyeingOrders] handleCountProductEdit called for product:', productId);
    alert(`✅ COUNT PRODUCT EDIT WORKS! Product ID: ${productId}`);
    const product = countProducts.find(p => p.id === productId);
    if (product) {
      // Set up the same edit state as CountProductOverview
      setSelectedRecord(null); // Clear any dyeing record selection
      // Note: We would need to implement the same edit modal here or create a shared component
      toast.info(`Edit Count Product: ${product.partyName} - ${product.dyeingFirm} (Feature needs shared edit modal)`);
    }
  };

  const handleCountProductDelete = async (productId: number) => {
    console.log('🗑️ [DyeingOrders] handleCountProductDelete called for product:', productId);
    alert(`✅ COUNT PRODUCT DELETE WORKS! Product ID: ${productId}`);
    
    const productToDelete = countProducts.find(p => p.id === productId);
    if (!productToDelete) {
      console.error('❌ Product not found for deletion');
      toast.error('Product not found. Please try again.');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete this count product?\n\nCustomer: ${productToDelete.partyName}\nDyeing Firm: ${productToDelete.dyeingFirm}\nQuantity: ${productToDelete.quantity} kg\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      console.log('❌ Delete cancelled by user');
      return;
    }

    try {
      console.log('✅ Delete confirmed by user, proceeding...', { productToDelete });
      
      // Use the API to delete the product properly
      await deleteCountProduct(productId);
      
      // Update local state
      const updatedCountProducts = countProducts.filter(p => p.id !== productId);
      setCountProducts(updatedCountProducts);
      
      // Update localStorage for persistence across pages
      localStorage.setItem('countProducts', JSON.stringify(updatedCountProducts));
      localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
      console.log('💾 [DyeingOrders] Updated countProducts saved to localStorage');
      
      // Dispatch custom event for cross-page synchronization
      window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
        detail: { countProducts: updatedCountProducts } 
      }));
      
      // Force refresh to update UI
      setRefreshKey(prev => prev + 1);
      
      toast.success(`Count Product deleted successfully: ${productToDelete.partyName}`);
      
    } catch (error) {
      console.error('❌ Error deleting count product:', error);
      toast.error('Failed to delete count product. Please try again.');
    }
  };

  const handleCountProductFollowUp = (productId: number) => {
    console.log('📋 [DyeingOrders] handleCountProductFollowUp called for product:', productId);
    alert(`✅ COUNT PRODUCT FOLLOW-UP WORKS! Product ID: ${productId}`);
    const product = countProducts.find(p => p.id === productId);
    if (product) {
      // Set up follow-up modal (would need shared follow-up component)
      toast.info(`Follow Up Count Product: ${product.partyName} - ${product.dyeingFirm} (Feature needs shared follow-up modal)`);
    }
  };

  const handleCountProductUpdateQuantities = (productId: number) => {
    console.log('📊 [DyeingOrders] handleCountProductUpdateQuantities called for product:', productId);
    alert(`✅ COUNT PRODUCT UPDATE QUANTITIES WORKS! Product ID: ${productId}`);
    const product = countProducts.find(p => p.id === productId);
    if (product) {
      // Set editing mode for this product
      setEditingRecordId(productId);
      setEditValues({
        quantity: product.quantity,
        receivedQuantity: product.receivedQuantity || 0,
        dispatchQuantity: product.dispatchQuantity || 0,
        sentQuantity: product.quantity
      });
      toast.info("Edit mode activated. Update quantities and save changes.");
    }
  };

  // Save quantities for CountProduct items
  const handleSaveCountProductQuantities = async (productId: number) => {
    console.log('🔄 [DyeingOrders] handleSaveCountProductQuantities called for product ID:', productId);
    console.log('📋 Current editValues:', editValues);
    
    if (isSaving) {
      console.log('⏳ Save already in progress, ignoring duplicate call');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Validate inputs
      if (editValues.quantity <= 0 || editValues.sentQuantity <= 0) {
        console.log('❌ Validation failed: quantity or sentQuantity <= 0');
        toast.error("Quantity and sent quantity must be greater than 0.");
        return;
      }

      if (editValues.dispatchQuantity < 0 || editValues.receivedQuantity < 0) {
        console.log('❌ Validation failed: negative quantities');
        toast.error("Received and dispatch quantities cannot be negative.");
        return;
      }

      // Find and update the product
      const productIndex = countProducts.findIndex(p => p.id === productId);
      if (productIndex === -1) {
        toast.error('Product not found. Please refresh and try again.');
        return;
      }

      const updatedProduct = {
        ...countProducts[productIndex],
        quantity: editValues.quantity,
        receivedQuantity: editValues.receivedQuantity,
        dispatchQuantity: editValues.dispatchQuantity
      };

      // Update local state
      const updatedCountProducts = [...countProducts];
      updatedCountProducts[productIndex] = updatedProduct;
      setCountProducts(updatedCountProducts);
      
      // Save to localStorage for cross-page persistence
      localStorage.setItem('countProducts', JSON.stringify(updatedCountProducts));
      localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
      console.log('💾 [DyeingOrders] Count product quantities updated and saved to localStorage');
      
      // Dispatch custom event for cross-page synchronization
      window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
        detail: { countProducts: updatedCountProducts } 
      }));
      
      // Exit edit mode
      setEditingRecordId(null);
      setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
      
      toast.success("Count product quantities updated successfully!");
      
    } catch (error) {
      console.error('❌ Error saving count product quantities:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
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

  // ================= RENDER FIRMS LIST (EXTRACTED) =================
  // Extract large inline JSX map into a memoized variable to avoid parser ambiguities
  const renderedFirms = React.useMemo(() => {
    return completeFirmListing.map(({ name: firm, records: firmRecords, countProducts: firmCountProducts }) => {
      const allRecordsForDisplay = [
        ...firmRecords.map(record => ({ ...mapToSimplifiedDisplay(record), type: 'dyeing', originalRecord: record })),
        ...firmCountProducts.map(product => ({ ...mapCountProductToSimplifiedDisplay(product), type: 'countProduct', originalRecord: product }))
      ];

      return (
        <div key={`${firm}-${refreshKey}`} className="overflow-hidden shadow rounded-2xl">
          <div
            onClick={() => setExpandedFirm((f) => (f === firm ? null : firm))}
            className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 cursor-pointer hover:bg-purple-50"
          >
            <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
              {firm} ({allRecordsForDisplay.length})
              {firmCountProducts.length > 0 && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {firmCountProducts.length} from Count Products
                </span>
              )}
            </h2>
            {expandedFirm === firm ? <ChevronUp /> : <ChevronDown />}
          </div>

          {expandedFirm === firm && (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 border-t dark:border-gray-700" id="dyeing-orders-table">
              <div className="min-w-[1000px]">
                {allRecordsForDisplay.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="text-gray-600 dark:text-gray-300 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-3 py-3 text-left font-semibold">Quantity</th>
                        <th className="px-3 py-3 text-left font-semibold">Customer Name</th>
                        <th className="px-3 py-3 text-left font-semibold">Count</th>
                        <th className="px-3 py-3 text-left font-semibold">Sent to Dye</th>
                        <th className="px-3 py-3 text-left font-semibold">Sent Date</th>
                        <th className="px-3 py-3 text-left font-semibold">Received</th>
                        <th className="px-3 py-3 text-left font-semibold">Received Date</th>
                        <th className="px-3 py-3 text-left font-semibold">Dispatch</th>
                        <th className="px-3 py-3 text-left font-semibold">Dispatch Date</th>
                        <th className="px-3 py-3 text-left font-semibold">Party/Middleman</th>
                        <th className="px-3 py-3 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                      {allRecordsForDisplay.map((displayRecord: any, index: number) => {
                        const isEditing = displayRecord.type === 'dyeing' && editingRecordId === displayRecord.id;
                        const isCountProduct = displayRecord.type === 'countProduct';
                        return (
                          <tr key={`${displayRecord.type}-${displayRecord.id}-${refreshKey}-${index}`}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${isCountProduct ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                            <td className={`px-3 py-3 font-medium ${isCountProduct ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
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
                                <>
                                  {formatQuantity(displayRecord.quantity)}
                                  {isCountProduct && <span className="ml-1 text-xs">(CP)</span>}
                                </>
                              )}
                            </td>
                            <td className="px-3 py-3 font-medium">{displayRecord.customerName}</td>
                            <td className="px-3 py-3 text-sm font-medium">{displayRecord.count || "Standard"}</td>
                            <td className="px-3 py-3">
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
                                formatQuantity(displayRecord.sentToDye)
                              )}
                            </td>
                            <td className="px-3 py-3">{displayRecord.sentDate ? new Date(displayRecord.sentDate).toLocaleDateString() : '--'}</td>
                            <td className="px-3 py-3 text-gray-500 dark:text-gray-400">
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
                                formatQuantity(displayRecord.received)
                              )}
                            </td>
                            <td className="px-3 py-3 text-gray-500 dark:text-gray-400">
                              {displayRecord.receivedDate ? new Date(displayRecord.receivedDate).toLocaleDateString() : '--'}
                            </td>
                            <td className="px-3 py-3 text-gray-500 dark:text-gray-400">
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
                                formatQuantity(displayRecord.dispatch)
                              )}
                            </td>
                            <td className="px-3 py-3 text-gray-500 dark:text-gray-400">
                              {displayRecord.dispatchDate ? new Date(displayRecord.dispatchDate).toLocaleDateString() : '--'}
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                                {displayRecord.partyNameMiddleman}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {isCountProduct ? (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  Count Product
                                </span>
                              ) : isEditing ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => {
                                      if (!isCountProduct && 'expectedArrivalDate' in displayRecord.originalRecord) {
                                        handleSaveQuantities(displayRecord.originalRecord as DyeingRecord);
                                      }
                                    }}
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
                                    if (!isCountProduct && 'expectedArrivalDate' in displayRecord.originalRecord) {
                                      handleEdit(displayRecord.originalRecord as DyeingRecord);
                                    }
                                  }}
                                  onDelete={() => {
                                    if (!isCountProduct && 'expectedArrivalDate' in displayRecord.originalRecord) {
                                      handleDelete(displayRecord.originalRecord as DyeingRecord);
                                    }
                                  }}
                                  onFollowUp={() => {
                                    if (!isCountProduct && 'expectedArrivalDate' in displayRecord.originalRecord) {
                                      handleFollowUp(displayRecord.originalRecord as DyeingRecord);
                                    }
                                  }}
                                  onUpdateQuantities={() => {
                                    if (!isCountProduct && 'expectedArrivalDate' in displayRecord.originalRecord) {
                                      handleUpdateQuantities(displayRecord.originalRecord as DyeingRecord);
                                    }
                                  }}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No dyeing orders yet for this firm. (Synced firm)</div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    });
  }, [completeFirmListing, expandedFirm, editingRecordId, editValues, isSaving, refreshKey]);

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
              await dyeingDataStore.loadRecords(true);
              await dyeingDataStore.loadFirms(true);
              setRefreshKey(prev => prev + 1);
              toast.success('Data refreshed successfully!');
            }}
            disabled={dyeingDataStore.isLoadingFirms() || dyeingDataStore.isLoadingRecords()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${dyeingDataStore.isLoadingFirms() || dyeingDataStore.isLoadingRecords() ? 'animate-spin' : ''}`} />
            Force Refresh
          </Button>
          <Button onClick={handleExportCSV}>Export CSV</Button>
          <Button onClick={handleExportPDF}>Export PDF</Button>
          <Button onClick={() => { setOrderToEdit(null); setIsFormOpen(true); }}>+ Add Dyeing Order</Button>
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

      {isFormOpen && (
        <div className="animate-fadeIn">
          <SimplifiedDyeingOrderForm
            orderToEdit={orderToEdit}
            onCancel={() => { setIsFormOpen(false); setOrderToEdit(null); }}
            onSuccess={handleOrderSuccess}
            existingFirms={centralizedDyeingFirms.map(firm => firm.name)}
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
        {completeFirmListing.map(({ name: firm, records: firmRecords, countProducts: firmCountProducts }) => {
          const allRecordsForDisplay = [
            ...firmRecords.map(record => ({ ...mapToSimplifiedDisplay(record), type: 'dyeing', originalRecord: record })),
            ...firmCountProducts.map(product => ({ ...mapCountProductToSimplifiedDisplay(product), type: 'countProduct', originalRecord: product }))
          ];
          return (
            <div key={`${firm}-${refreshKey}`} className="overflow-hidden shadow rounded-2xl">
              <div
                onClick={() => setExpandedFirm((f) => (f === firm ? null : firm))}
                className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 cursor-pointer hover:bg-purple-50"
              >
                <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
                  {firm} ({allRecordsForDisplay.length})
                  {firmCountProducts.length > 0 && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {firmCountProducts.length} from Count Products
                    </span>
                  )}
                </h2>
                {expandedFirm === firm ? <ChevronUp /> : <ChevronDown />}
              </div>
              {expandedFirm === firm && (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 border-t dark:border-gray-700" id="dyeing-orders-table">
                  <div className="min-w-[1000px]">
                    <table className="w-full text-sm">
                      <thead className="text-gray-600 dark:text-gray-300 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-3 py-3 text-left font-semibold">Quantity</th>
                          <th className="px-3 py-3 text-left font-semibold">Customer Name</th>
                          <th className="px-3 py-3 text-left font-semibold">Count</th>
                          <th className="px-3 py-3 text-left font-semibold">Sent to Dye</th>
                          <th className="px-3 py-3 text-left font-semibold">Sent Date</th>
                          <th className="px-3 py-3 text-left font-semibold">Received</th>
                          <th className="px-3 py-3 text-left font-semibold">Received Date</th>
                          <th className="px-3 py-3 text-left font-semibold">Dispatch</th>
                          <th className="px-3 py-3 text-left font-semibold">Dispatch Date</th>
                          <th className="px-3 py-3 text-left font-semibold">Party/Middleman</th>
                          <th className="px-3 py-3 text-center font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-900 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                        {allRecordsForDisplay.length === 0 && (
                          <tr>
                            <td colSpan={11} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                              No dyeing or count product entries yet for this synced firm.
                            </td>
                          </tr>
                        )}
                        {allRecordsForDisplay.map((displayRecord, index) => {
                          const isEditing = (displayRecord.type === 'dyeing' && editingRecordId === displayRecord.id) || 
                                          (displayRecord.type === 'countProduct' && editingRecordId === (displayRecord.originalRecord as CountProduct).id);
                          const isCountProduct = displayRecord.type === 'countProduct';
                          return (
                            <tr key={`${displayRecord.type}-${displayRecord.id}-${refreshKey}-${index}`} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${isCountProduct ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                              <td className={`px-4 py-3 font-medium ${isCountProduct ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
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
                                  <>
                                    {formatQuantity(displayRecord.quantity)}
                                    {isCountProduct && <span className="ml-1 text-xs">(CP)</span>}
                                  </>
                                )}
                              </td>
                              <td className="px-4 py-3 font-medium">{displayRecord.customerName}</td>
                              <td className="px-3 py-3 text-sm font-medium">{displayRecord.count || "Standard"}</td>
                              <td className="px-3 py-3">
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
                                  formatQuantity(displayRecord.sentToDye)
                                )}
                              </td>
                              <td className="px-4 py-3">{displayRecord.sentDate ? new Date(displayRecord.sentDate).toLocaleDateString() : '--'}</td>
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
                                  formatQuantity(displayRecord.received)
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{displayRecord.receivedDate ? new Date(displayRecord.receivedDate).toLocaleDateString() : '--'}</td>
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
                                  formatQuantity(displayRecord.dispatch)
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{displayRecord.dispatchDate ? new Date(displayRecord.dispatchDate).toLocaleDateString() : '--'}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                                  {displayRecord.partyNameMiddleman}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isCountProduct ? (
                                  <FloatingActionDropdown
                                    onEdit={() => handleCountProductEdit((displayRecord.originalRecord as CountProduct).id)}
                                    onDelete={() => handleCountProductDelete((displayRecord.originalRecord as CountProduct).id)}
                                    onFollowUp={() => handleCountProductFollowUp((displayRecord.originalRecord as CountProduct).id)}
                                    onUpdateQuantities={() => handleCountProductUpdateQuantities((displayRecord.originalRecord as CountProduct).id)}
                                  />
                                ) : isEditing ? (
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => {
                                        if (isCountProduct) {
                                          handleSaveCountProductQuantities((displayRecord.originalRecord as CountProduct).id);
                                        } else if ('expectedArrivalDate' in displayRecord.originalRecord) {
                                          handleSaveQuantities(displayRecord.originalRecord as DyeingRecord);
                                        }
                                      }}
                                      disabled={isSaving}
                                      className={`p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                                      title={isSaving ? 'Saving...' : 'Save Changes'}
                                    >
                                      {isSaving ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      disabled={isSaving}
                                      className={`p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                                      title="Cancel Changes"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <FloatingActionDropdown
                                    onEdit={() => handleEdit(displayRecord.originalRecord as DyeingRecord)}
                                    onDelete={() => handleDelete(displayRecord.originalRecord as DyeingRecord)}
                                    onFollowUp={() => handleFollowUp(displayRecord.originalRecord as DyeingRecord)}
                                    onUpdateQuantities={() => handleUpdateQuantities(displayRecord.originalRecord as DyeingRecord)}
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
          );
        })}
      </div>

      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => { setIsFollowUpModalOpen(false); setSelectedRecord(null); }}
        dyeingRecord={selectedRecord}
        onFollowUpAdded={async () => await dyeingDataStore.loadRecords(true)}
      />
    </div>
  );
};

export default DyeingOrders;