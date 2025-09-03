import React, { useEffect, useState, useCallback } from "react"; 
import {
  getAllDyeingRecords,
  deleteDyeingRecord,
  getDyeingStatus,
  markAsArrived,
  completeReprocessing,
  createDyeingRecord,
  updateDyeingRecord,
} from "../api/dyeingApi";
import { CountProduct, getAllCountProducts, deleteCountProduct, updateCountProduct } from "../api/countProductApi";
import { DyeingRecord, SimplifiedDyeingDisplayRecord, CreateDyeingRecordRequest } from "../types/dyeing";
import SimplifiedDyeingOrderForm from "../components/SimplifiedDyeingOrderForm";
import { HorizontalAddOrderForm } from "../components/HorizontalAddOrderForm";
import { Button } from "../components/ui/Button";
import { ChevronDown, ChevronUp, MoreVertical, Check, X } from "lucide-react";
import { toast } from "sonner";
import FollowUpModal from "../components/FollowUpModal";
import { exportDataToCSV } from "../utils/exportUtils";
import FloatingActionDropdown from "../components/FloatingActionDropdown";
import SimpleActionDropdown from "../components/SimpleActionDropdown";
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

  // Multiple delete functionality
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isMultiDeleteMode, setIsMultiDeleteMode] = useState(false);

  // Count Product Edit Modal state
  const [isCountProductEditModalOpen, setIsCountProductEditModalOpen] = useState(false);
  const [countProductToEdit, setCountProductToEdit] = useState<CountProduct | null>(null);

  useEffect(() => {
    let unmounted = false;
    
    const initializeStoreAndSubscribe = async () => {
      try {
        // Initialize store first
        await dyeingDataStore.init();
        
        if (unmounted) return;
        
        // Subscribe to store updates
        const unsubscribeFirms = await dyeingDataStore.subscribeFirms((firms) => {
          if (unmounted) return;
          setCentralizedDyeingFirms(firms);
        });
        
        const unsubscribeRecords = await dyeingDataStore.subscribeRecords((records) => {
          if (unmounted) return;
          setRecords(records);
          setDyeingRecords(records);
        });
        
        // Fetch count products to show cross-page data
        fetchCountProducts();
        
        // Store cleanup functions
        return () => {
          unsubscribeFirms();
          unsubscribeRecords();
        };
        
      } catch (error) {
        console.error('Store initialization failed:', error);
        
        // FALLBACK: Even if store fails, try to fetch count products
        try {
          await fetchCountProducts();
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
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

  // Auto-refresh functionality - triggers fast refresh on component mount and focus
  useEffect(() => {
    let refreshTimeout: number | undefined;
    let isRefreshing = false;

    const fastRefresh = async () => {
      if (isRefreshing) return; // Prevent multiple simultaneous refreshes
      
      isRefreshing = true;
      try {
        // Parallel data loading for maximum speed - only refresh if needed
        const refreshPromises: Promise<any>[] = [];
        
        // Check if data is stale before refreshing
        const lastRefresh = localStorage.getItem('lastDyeingRefresh');
        const now = Date.now();
        const staleThreshold = 500; // 500ms threshold for staleness
        
        if (!lastRefresh || (now - parseInt(lastRefresh)) > staleThreshold) {
          refreshPromises.push(
            dyeingDataStore.loadRecords(true),
            dyeingDataStore.loadFirms(true),
            fetchCountProducts()
          );
          
          await Promise.all(refreshPromises);
          localStorage.setItem('lastDyeingRefresh', now.toString());
          setRefreshKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('Initial load failed:', error);
      } finally {
        isRefreshing = false;
      }
    };

    // Smart one-time initial load - check if we need to load data
    const lastLoadKey = `dyeingOrdersLastLoad_${new Date().toDateString()}`;
    const hasLoadedToday = localStorage.getItem(lastLoadKey);
    
    if (!hasLoadedToday) {
      console.log('🚀 First load of the day - performing initial data load...');
      fastRefresh();
      localStorage.setItem(lastLoadKey, Date.now().toString());
    } else {
      console.log('✅ Data already loaded today - using cached data for instant display');
      // Just trigger UI refresh with existing data
      setRefreshKey(prev => prev + 1);
    }

    // No continuous refresh listeners - data updates happen through forms and actions
    return () => {
      if (refreshTimeout !== undefined) {
        clearTimeout(refreshTimeout);
      }
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
    
    // PRESERVE USER INPUT: Show customer name exactly as user entered it
    let customerName = record.customerName || "Unknown Customer";
    
    const mappedRecord = {
      id: record.id,
      quantity: trackingInfo.originalQuantity || record.quantity, // Use original quantity if available, otherwise use record quantity
      customerName: customerName, // Use the customer name with fallback
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
    console.log('✅ Customer name preserved as:', record.customerName);
    console.log('✅ Mapped quantity (original):', mappedRecord.quantity);
    console.log('✅ Mapped sentToDye (actual sent):', mappedRecord.sentToDye);
    console.log('✅ Mapped received value:', mappedRecord.received);
    console.log('✅ Mapped dispatch value:', mappedRecord.dispatch);
    console.log('✅ Original record remarks:', record.remarks);
    return mappedRecord;
  };

  // ================= COUNT PRODUCT MAPPING FUNCTION =================
  const mapCountProductToSimplifiedDisplay = (countProduct: CountProduct): SimplifiedDyeingDisplayRecord => {
    // PRESERVE USER INPUT: Show customer name exactly as user entered it
    let customerName = countProduct.customerName;
    
    // DEBUG: Log customer name details
    console.log(`🔍 Mapping CountProduct ID ${countProduct.id}: customerName="${customerName}"`);
    
    const mappedRecord = {
      id: countProduct.id,
      quantity: countProduct.quantity,
      customerName: customerName, // Use the exact customer name from user input
      count: countProduct.count || "Standard", 
      sentToDye: countProduct.sentToDye ? (countProduct.sentQuantity ?? countProduct.quantity) : 0,
      sentDate: countProduct.sentDate,
      received: countProduct.received ? countProduct.receivedQuantity : undefined,
      receivedDate: countProduct.receivedDate || undefined,
      dispatch: countProduct.dispatch ? countProduct.dispatchQuantity : undefined,
      dispatchDate: countProduct.dispatchDate || undefined,
      partyNameMiddleman: countProduct.middleman || countProduct.partyName, // Use middleman if available, otherwise fall back to partyName
      dyeingFirm: countProduct.dyeingFirm,
      remarks: countProduct.remarks || ''
    };
    
    console.log('✅ [CountProduct] Mapped with preserved customer name:', countProduct.customerName);
    return mappedRecord;
  };
// ================= FETCH COUNT PRODUCTS =================
  const fetchCountProducts = async () => {
    try {
  const directResponse = await fetch(`${import.meta.env.VITE_API_URL}/count-products`);
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        
        if (directData.success && directData.data && Array.isArray(directData.data)) {
          const products = directData.data;
          
          // Set the products directly
          setCountProducts(products);
          localStorage.setItem('countProducts', JSON.stringify(products));
          localStorage.setItem('countProductsTimestamp', Date.now().toString());
          
          return; // Success - exit early
        }
      }
      
      // If direct API failed, try cached data as fallback
      const cached = localStorage.getItem('countProducts');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCountProducts(parsed);
            return;
          }
        } catch (e) {
          console.warn('Failed to parse cached data');
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch count products:', error);
      // Try cached data as last resort
      const cached = localStorage.getItem('countProducts');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            console.log('⚡ [EMERGENCY] Using cached data after error');
            setCountProducts(parsed);
          }
        } catch (e) {
          console.warn('⚠️ [EMERGENCY] Failed to parse cached data');
        }
      }
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

    // Listen for dyeing records updates (for our own update quantities functionality)
    const handleDyeingRecordsSync = (e: CustomEvent) => {
      if (e.detail && e.detail.dyeingRecords) {
        console.log('🔄 [DyeingOrders] Custom dyeingRecords sync received:', {
          count: e.detail.dyeingRecords.length,
          updatedRecordId: e.detail.updatedRecordId,
          updateData: e.detail.updateData,
          timestamp: e.detail.timestamp
        });
        
        setDyeingRecords(e.detail.dyeingRecords);
        setRefreshKey(prev => prev + 1);
        
        console.log('✅ [DyeingOrders] Dyeing records sync completed');
      }
    };

    window.addEventListener('countProductsUpdated', handleCustomSync as EventListener);
    window.addEventListener('dyeingRecordsUpdated', handleDyeingRecordsSync as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('countProductsUpdated', handleCustomSync as EventListener);
      window.removeEventListener('dyeingRecordsUpdated', handleDyeingRecordsSync as EventListener);
    };
  }, []);

  // Define handleCountProductEditCancel before it's used in useEffect
  const handleCountProductEditCancel = useCallback(() => {
    console.log('🚫 [DyeingOrders] Count product edit cancelled');
    setIsCountProductEditModalOpen(false);
    setCountProductToEdit(null);
  }, []);

  // Handle escape key to close modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCountProductEditModalOpen) {
          handleCountProductEditCancel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCountProductEditModalOpen, handleCountProductEditCancel]);

  // Cleanup effect to prevent DOM errors
  useEffect(() => {
    return () => {
      // Clean up any pending operations when component unmounts
      if (isCountProductEditModalOpen) {
        setIsCountProductEditModalOpen(false);
        setCountProductToEdit(null);
      }
    };
  }, []);

  // Normalize comparison: trim + case-insensitive
  const nk = (s: string) => (s || '').toString().trim().toUpperCase();

  const filteredRecords = records.filter((r) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      r.partyName.toLowerCase().includes(query) ||
      r.dyeingFirm.toLowerCase().includes(query) ||
      r.yarnType.toLowerCase().includes(query) ||
      r.shade.toLowerCase().includes(query) ||
      r.lot.toLowerCase().includes(query) ||
      r.count.toLowerCase().includes(query);

  const matchesStatus = true;
    const matchesFirm = firmFilter ? nk(r.dyeingFirm) === nk(firmFilter) : true;
    const matchesParty = partyFilter ? nk(r.partyName) === nk(partyFilter) : true;

    return matchesSearch && matchesStatus && matchesFirm && matchesParty;
  });

  // Apply the SAME filters to Count Products so UI behaves consistently
  const filteredCountProducts = countProducts.filter((p) => {
    const query = searchQuery.toLowerCase();
    const haystack = [
      p.partyName,
      p.middleman,
      p.customerName,
      p.dyeingFirm,
      p.yarnType,
      p.shade,
      (p as any).count,
      (p as any).lotNumber,
    ].map((v) => (v || '').toString().toLowerCase());

    const matchesSearch = query ? haystack.some((h) => h.includes(query)) : true;
    const matchesFirm = firmFilter ? nk(p.dyeingFirm as any) === nk(firmFilter) : true;
    // Party filter matches either partyName or middleman for CountProducts
    const matchesParty = partyFilter
      ? nk(p.partyName as any) === nk(partyFilter) || nk(p.middleman as any) === nk(partyFilter)
      : true;

    return matchesSearch && matchesFirm && matchesParty;
  });

  // Status filter removed
  // Firms currently listed on page (from visible records and count products)
  const pageFirms = React.useMemo(() => {
    const firmSet = new Set<string>();
    records.forEach(r => r?.dyeingFirm && firmSet.add(r.dyeingFirm));
    countProducts.forEach(p => p?.dyeingFirm && firmSet.add(p.dyeingFirm));
    return Array.from(firmSet).sort((a, b) => a.localeCompare(b));
  }, [records, countProducts]);
  // Parties currently listed on page (include both dyeing records and count products)
  const pageParties = React.useMemo(() => {
    const partySet = new Set<string>();
    records.forEach(r => r?.partyName && partySet.add(r.partyName));
    countProducts.forEach(p => p?.partyName && partySet.add(p.partyName as any));
    const arr = Array.from(partySet).sort((a, b) => a.localeCompare(b));
    // Ensure current selected party stays in options even if not present in records (e.g., archived/no current orders)
    if (partyFilter && !arr.some(n => nk(n) === nk(partyFilter))) arr.unshift(partyFilter);
    return arr;
  }, [records, countProducts, partyFilter]);

  // Helpers: normalize and display count values consistently
  const normalizeCount = (value?: string) => {
    const v = (value ?? 'Standard').toString();
    return v.trim().replace(/\s+/g, '').toLowerCase();
  };
  const getDisplayCount = (value?: string) => {
    const v = (value ?? 'Standard').toString();
    return v.trim() || 'Standard';
  };

  // DYEING ORDERS PAGE: Group by COUNT instead of firm name
  const groupedByCount = filteredRecords.reduce((acc, record) => {
    const key = normalizeCount(record.count || 'Standard');
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<string, DyeingRecord[]>);
  // Keep a friendly display name for each normalized key (prefer first seen from dyeing records)
  const countDisplayNameFromRecords: Record<string, string> = {};
  filteredRecords.forEach((rec) => {
    const key = normalizeCount(rec.count || 'Standard');
    if (!countDisplayNameFromRecords[key]) {
      countDisplayNameFromRecords[key] = getDisplayCount(rec.count);
    }
  });

  // Group count products by count for cross-page display - make reactive with useMemo
  const completeCountListing = React.useMemo(() => {
    console.log('🔄 [DyeingOrders] Recalculating completeCountListing with countProducts:', countProducts.length);
    
    const groupedCountProductsByCount = filteredCountProducts.reduce((acc, product) => {
      const key = normalizeCount(product.count || 'Standard');
      if (!acc[key]) acc[key] = [];
      acc[key].push(product);
      return acc;
    }, {} as Record<string, CountProduct[]>);
    // Display names from count products (fallbacks if none from records)
    const countDisplayNameFromProducts: Record<string, string> = {};
  filteredCountProducts.forEach((p) => {
      const key = normalizeCount(p.count || 'Standard');
      if (!countDisplayNameFromProducts[key]) {
        countDisplayNameFromProducts[key] = getDisplayCount(p.count);
      }
    });

    // Get all unique count values from both dyeing records and count products
    const allCountValues = new Set([
      ...Object.keys(groupedByCount),
      ...Object.keys(groupedCountProductsByCount)
    ]);

    // DYEING ORDERS PAGE: Group by COUNT instead of firm - create count-based listing
    return Array.from(allCountValues)
      .map(key => {
        const dyeingRecords = groupedByCount[key] || [];
        const countProductsForCount = groupedCountProductsByCount[key] || [];
        const displayName = countDisplayNameFromRecords[key] || countDisplayNameFromProducts[key] || 'Standard';
        
        // Combine both dyeing records and count products for display
        const hasData = dyeingRecords.length > 0 || countProductsForCount.length > 0;
        
        return {
          name: displayName, // Friendly display name
          records: dyeingRecords,
          countProducts: countProductsForCount,
          hasData,
          id: key // Use normalized key as ID
        };
      })
      // Remove count groups with 0 products
      .filter(countGroup => countGroup.countProducts.length > 0 || countGroup.records.length > 0)
      .sort((a, b) => {
        // Sort "Standard" last using normalized comparison, others alphabetically by display name
        const stdKey = normalizeCount('Standard');
        const aIsStd = a.id === stdKey;
        const bIsStd = b.id === stdKey;
        if (aIsStd && !bIsStd) return 1;
        if (bIsStd && !aIsStd) return -1;
        return a.name.localeCompare(b.name);
      });
  }, [filteredCountProducts, groupedByCount, refreshKey]);

  // Debug: Log count group listing construction
  console.log('🔍 [DyeingOrders] completeCountListing constructed:', {
    completeCountListingCount: completeCountListing.length,
    completeCountListingNames: completeCountListing.map(c => ({ 
      countValue: c.name, 
      dyeingRecords: c.records.length, 
      countProducts: c.countProducts.length,
      hasData: c.hasData 
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
      customerName: record.customerName,
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
      console.log("🎯 Order ID (if editing):", orderToEdit?.id);
      
      // AGGRESSIVE: Clear all cached data and force complete reload
      console.log('🔥 AGGRESSIVE REFRESH - Clearing all caches...');
      localStorage.removeItem('dyeingData');
      localStorage.removeItem('dyeingFirms');
      localStorage.removeItem('lastDyeingDataTimestamp');
      localStorage.removeItem('lastDyeingFirmsTimestamp');
      
      // Force reload from API with cache bypass
      console.log('🔄 Force reloading data from store with cache bypass...');
      await dyeingDataStore.loadRecords(true);
      await dyeingDataStore.loadFirms(true);
      
      // CRITICAL: Also refresh count products so count-based grouping reflects edits
      try {
        console.log('🔄 Also fetching latest count products for regrouping...');
        await fetchCountProducts();
      } catch (cpErr) {
        console.warn('⚠️ Failed to refresh count products after order update:', cpErr);
      }
      
      console.log('✅ Store data refreshed aggressively');
      
      // Close the form and clear edit state
      setIsFormOpen(false);
      setOrderToEdit(null);
      
      // Force UI refresh with timestamp to ensure re-render
      const newRefreshKey = Date.now();
      setRefreshKey(newRefreshKey);
      
      console.log('🎯 Form closed and edit state cleared, refresh key:', newRefreshKey);
      
      // Show success message with edit-specific information
      const actionType = orderData?.action || (orderToEdit ? 'updated' : 'created');
      const message = orderToEdit 
        ? `Order #${orderToEdit.id} updated successfully! Party/middleman changes are now visible.` 
        : `Order ${actionType} successfully! Data synchronized across all pages.`;
        
      toast.success(message, {
        duration: 3000,
      });
      
      // Additional debug: Log current data state after refresh
      setTimeout(() => {
        console.log('🔍 Post-refresh data check:');
        console.log('📊 Current records count:', records.length);
        if (orderToEdit?.id) {
          const updatedRecord = records.find(r => r.id === orderToEdit.id);
          console.log('📝 Updated record after refresh:', updatedRecord);
          console.log('👥 Updated partyNameMiddleman:', (updatedRecord as any)?.partyNameMiddleman);
        }
      }, 1000);
      
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

  // Multiple delete functions
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAllItems = () => {
    const allItemIds = new Set<string>();
    
    // Add all dyeing records
    dyeingRecords.forEach((record) => {
      allItemIds.add(`dyeing-${record.id}`);
    });
    
    // Add all count products
    countProducts.forEach((product) => {
      allItemIds.add(`countProduct-${product.id}`);
    });
    
    setSelectedItems(allItemIds);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleMultipleDelete = async () => {
    if (selectedItems.size === 0) {
      toast.error("No items selected for deletion");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} selected item(s)? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const deletePromises: Promise<void>[] = [];
      
      // Process selected items
      selectedItems.forEach(itemId => {
        const [type, id] = itemId.split('-');
        const numericId = parseInt(id);
        
        if (type === 'dyeing') {
          deletePromises.push(deleteDyeingRecord(numericId));
        } else if (type === 'countProduct') {
          deletePromises.push(deleteCountProduct(numericId));
        }
      });

      // Execute all deletions
      await Promise.all(deletePromises);
      
      toast.success(`Successfully deleted ${selectedItems.size} item(s)`);
      
      // Clear selection and refresh data
      setSelectedItems(new Set());
      setIsMultiDeleteMode(false);
      
      // Refresh the records list using store
      await dyeingDataStore.loadRecords(true);
      fetchCountProducts();
      
    } catch (error: any) {
      console.error("❌ Multiple delete failed:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Unknown error occurred";
      toast.error(`Failed to delete items: ${errorMessage}`);
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

  // Count Product Update Quantities functionality - matches CountProductOverview behavior
  const handleCountProductUpdateQuantities = async (id: number) => {
    console.log('Count Product Update Quantities called for ID:', id);
    
    const recordToUpdate = countProducts.find(cp => cp.id === id);
    console.log('Found Count Product Record:', recordToUpdate);
    
    if (!recordToUpdate) {
      toast.error('Count Product record not found!');
      return;
    }

    // Set inline editing mode like CountProductOverview
    setEditingRecordId(id);
    setEditValues({
      quantity: recordToUpdate.quantity,
      receivedQuantity: recordToUpdate.receivedQuantity || 0,
      dispatchQuantity: recordToUpdate.dispatchQuantity || 0,
      sentQuantity: recordToUpdate.sentQuantity ?? recordToUpdate.quantity
    });
    toast.info("Edit mode activated. Update quantities and save changes.");
  };

  // Update Quantities functionality - copied exactly from CountProductOverview
  const handleUpdateQuantities = (record: DyeingRecord) => {
    console.log('🎯 [DYEING] handleUpdateQuantities called for record:', record.id);
    console.log('🎯 [DYEING] Raw record data:', record);
    
    try {
      // Set edit values directly from record, same pattern as CountProductOverview
      setEditingRecordId(record.id);
      
      const newEditValues = {
        quantity: record.quantity || 0,
        receivedQuantity: 0,  // Default to 0 since DyeingRecord doesn't have this field
        dispatchQuantity: 0,  // Default to 0 since DyeingRecord doesn't have this field
        sentQuantity: record.quantity || 0  // Use record.quantity as sent quantity
      };
      
      setEditValues(newEditValues);
      toast.info("Edit mode activated. Update quantities and save changes.");
      
    } catch (error) {
      console.error('❌ [DYEING] Error in handleUpdateQuantities:', error);
      toast.error("Failed to activate edit mode");
    }
  };

  const handleSaveQuantities = async (record: DyeingRecord) => {
    console.log('🔄 [DYEING] handleSaveQuantities called for record ID:', record.id);
    console.log('📋 [DYEING] Current editValues:', editValues);
    console.log('⚡ [DYEING] Current isSaving state:', isSaving);
    
    if (isSaving) {
      console.log('⏳ [DYEING] Save already in progress, ignoring duplicate call');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // MINIMAL VALIDATION FOR TESTING - same as CountProductOverview
      if (editValues.quantity <= 0) {
        console.log('❌ [DYEING] Validation failed: quantity <= 0');
        toast.error("Quantity must be greater than 0.");
        throw new Error("Validation failed: quantity <= 0");
      }

      console.log('✅ [DYEING] Basic validation passed, proceeding with update');

      // Build complete CreateDyeingRecordRequest object with existing fields preserved
      const updateData: CreateDyeingRecordRequest = {
        yarnType: record.yarnType,
        sentDate: record.sentDate,
        expectedArrivalDate: record.expectedArrivalDate,
        partyName: record.partyName,
        shade: record.shade,
        count: record.count,
        lot: record.lot,
        dyeingFirm: record.dyeingFirm,
        customerName: record.customerName,
        quantity: editValues.quantity,  // Update with new quantity
        remarks: record.remarks || ''   // Preserve existing remarks
      };

      console.log('🔄 [DYEING] Updating record with complete data:', updateData);

      await updateDyeingRecord(record.id, updateData);
      console.log('✅ [DYEING] Record updated successfully via API');

      // Update local state - merge the edit values with the updated record
      const updatedRecords = dyeingRecords.map(r => 
        r.id === record.id 
          ? { 
              ...r, 
              quantity: editValues.quantity,
              receivedQuantity: editValues.receivedQuantity || 0,
              received: (editValues.receivedQuantity || 0) > 0,
              dispatchQuantity: editValues.dispatchQuantity || 0,
              dispatch: (editValues.dispatchQuantity || 0) > 0
            }
          : r
      );
      setDyeingRecords(updatedRecords);
      console.log('✅ [DYEING] Local state updated successfully');

      // Save to localStorage for persistence - same as CountProductOverview
      localStorage.setItem('dyeingRecords', JSON.stringify(updatedRecords));
      localStorage.setItem('dyeingRecordsTimestamp', new Date().getTime().toString());
      console.log('💾 [DYEING] Updated records saved to localStorage');

      // Cross-page synchronization - same events as CountProductOverview
      console.log('📡 [DYEING] Dispatching cross-page sync events...');
      
      window.dispatchEvent(new CustomEvent('dyeingRecordsUpdated', { 
        detail: { 
          dyeingRecords: updatedRecords,
          updatedRecordId: record.id,
          updateData: {
            quantity: editValues.quantity,
            receivedQuantity: editValues.receivedQuantity || 0,
            dispatchQuantity: editValues.dispatchQuantity || 0
          },
          timestamp: Date.now()
        } 
      }));
      
      window.dispatchEvent(new CustomEvent('storage', {
        detail: {
          key: 'dyeingRecords',
          newValue: JSON.stringify(updatedRecords),
          timestamp: Date.now()
        }
      }));
      
      console.log('📡 [DYEING] Cross-page sync events dispatched successfully');

      // Exit edit mode
      setEditingRecordId(null);
      setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
      
      toast.success("Quantities updated successfully!");
      console.log('🎉 [DYEING] Save completed successfully');
      
    } catch (error) {
      console.error('❌ [DYEING] Error saving quantities:', error);
      toast.error("Failed to update quantities");
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
  
  // Debug function to inspect the current state of count products
  const inspectCountProductsState = () => {
    console.log('🔍 [DyeingOrders] INSPECTING CURRENT COUNT PRODUCTS STATE');
    console.log('Total count products:', countProducts.length);
    
    countProducts.forEach((product, index) => {
      console.log(`Product ${index + 1} (ID: ${product.id}):`, {
        customerName: product.customerName,
        partyName: product.partyName,
        middleman: product.middleman
      });
    });

    // Inspect how they would be displayed
    const displayRecords = countProducts.map(mapCountProductToSimplifiedDisplay);
    console.log('🔍 How these would appear in the display:');
    displayRecords.forEach((record, index) => {
      console.log(`Display Record ${index + 1}:`, {
        customerName: record.customerName,
        partyNameMiddleman: record.partyNameMiddleman
      });
    });

    toast.success(`Inspected ${countProducts.length} count products. Check console for details.`);
  };

  // Clear local storage cache function - for debugging
  const clearLocalStorageCache = () => {
    console.log('🧹 [DyeingOrders] Clearing localStorage cache for count products');
    localStorage.removeItem('countProducts');
    localStorage.removeItem('countProductsTimestamp');
    localStorage.removeItem('dyeingOrders');
    localStorage.removeItem('dyeingOrdersTimestamp');
    setRefreshKey(prev => prev + 1);
    toast.success("Cache cleared successfully! Refreshing data...");
    fetchCountProducts(); // Refresh data
  };

  // TEMPORARY DEBUG FUNCTION - Remove after testing
  const createTestCountProduct = () => {
    const testProduct: CountProduct = {
      id: Date.now(),
      partyName: "TEST PARTY NAME",
      dyeingFirm: "Test Dyeing",
      yarnType: "Cotton",
      count: "30s",
      shade: "White",
      quantity: 100,
      completedDate: new Date().toISOString().split('T')[0],
      qualityGrade: "A" as const,
      remarks: "Test product",
      lotNumber: `TEST-${Date.now()}`,
      processedBy: "System",
      customerName: "TEST CUSTOMER NAME", // Different from partyName
      sentToDye: true,
      sentDate: new Date().toISOString().split('T')[0],
      received: false,
      receivedDate: "",
      receivedQuantity: 0,
      dispatch: false,
      dispatchDate: "",
      dispatchQuantity: 0,
      middleman: "TEST MIDDLEMAN VALUE", // Use a distinct value different from partyName
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('🧪 [DyeingOrders] Creating test product with distinct values:', {
      customerName: testProduct.customerName,
      partyName: testProduct.partyName,
      middleman: testProduct.middleman
    });
    
    const updatedProducts = [...countProducts, testProduct];
    setCountProducts(updatedProducts);
    localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
    setRefreshKey(prev => prev + 1);
  };

  const handleCountProductEdit = useCallback((productId: number) => {
    console.log('🖊️ [DyeingOrders] handleCountProductEdit called for product:', productId);
    const product = countProducts.find(p => p.id === productId);
    if (product) {
      console.log('\n🔥 ULTRA-AGGRESSIVE EDIT DEBUG:');
      console.log('Product being passed to edit form:', {
        id: product.id,
        customerName: product.customerName,
        partyName: product.partyName,
        middleman: product.middleman,
        quantity: product.quantity
      });
      
      // ULTRA-AGGRESSIVE FIX: Force customer name distinction before passing to edit form
      const fixedProduct = {
        ...product,
        customerName: product.customerName === product.partyName ? 
          `Customer: ${product.customerName}` : 
          product.customerName
      };
      
      if (fixedProduct.customerName !== product.customerName) {
        console.log('🔧 FORCED CUSTOMER NAME FOR EDIT FORM:', product.customerName, '→', fixedProduct.customerName);
      }
      
      setCountProductToEdit(fixedProduct);
      setIsCountProductEditModalOpen(true);
      setSelectedRecord(null); // Clear any dyeing record selection
      console.log('✅ [DyeingOrders] Opening count product edit modal for:', fixedProduct.customerName);
      console.log('🔥 EDIT DEBUG COMPLETE\n');
    } else {
      console.error('❌ [DyeingOrders] Count product not found for ID:', productId);
      toast.error('Count product not found. Please refresh and try again.');
    }
  }, [countProducts]);

  // Count Product Edit Modal handlers
  const handleCountProductEditSuccess = (updatedProduct: CountProduct) => {
    console.log('✅ [DyeingOrders] Count product edit success:', updatedProduct);
    console.log('🔍 [DyeingOrders] Updated product details:', {
      id: updatedProduct.id,
      customerName: updatedProduct.customerName,
      partyName: updatedProduct.partyName,
      middleman: updatedProduct.middleman,
      quantity: updatedProduct.quantity,
      count: (updatedProduct as any).count
    });
    
    // Ensure data integrity - keep fields separate
    const cleanedProduct = {
      ...updatedProduct,
      customerName: updatedProduct.customerName,
      partyName: updatedProduct.partyName || "Direct",
      middleman: updatedProduct.middleman || "Direct" // Don't mix with partyName
    };
    
    console.log('🔧 [DyeingOrders] Cleaned product data:', {
      originalCustomerName: updatedProduct.customerName,
      originalPartyName: updatedProduct.partyName,
      cleanedCustomerName: cleanedProduct.customerName,
      cleanedPartyName: cleanedProduct.partyName
    });
    
    // Update the product in the local state
    const updatedProducts = countProducts.map(p => p.id === updatedProduct.id ? cleanedProduct : p);
    
    // Use functional state update to ensure fresh state
    setCountProducts(() => {
      console.log('🔄 [DyeingOrders] Setting updated count products, count:', updatedProducts.length);
      return updatedProducts;
    });
    
    // Save updated products to localStorage for persistence
    localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
    localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
    console.log('💾 [DyeingOrders] Updated products saved to localStorage with timestamp');
    
    // Dispatch custom event for cross-page synchronization
    window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
      detail: { countProducts: updatedProducts } 
    }));
    
    // Close the modal
    setIsCountProductEditModalOpen(false);
    setCountProductToEdit(null);
    
    // Force refresh to update the display
    setRefreshKey(prev => {
      const newKey = prev + 1;
      console.log('🔑 [DyeingOrders] Updated refreshKey from', prev, 'to', newKey);
      return newKey;
    });
    
    toast.success("Count product updated successfully!");
  };

  const handleCountProductDelete = useCallback(async (productId: number) => {
    console.log('🗑️ [DyeingOrders] handleCountProductDelete called for product:', productId);
    
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
  }, [countProducts]);

  const handleCountProductFollowUp = useCallback((productId: number) => {
    console.log('📋 [DyeingOrders] handleCountProductFollowUp called for product:', productId);
    const product = countProducts.find(p => p.id === productId);
    if (product) {
      // Set up follow-up modal (would need shared follow-up component)
      toast.info(`Follow Up Count Product: ${product.partyName} - ${product.dyeingFirm} (Feature needs shared follow-up modal)`);
    }
  }, [countProducts]);

  // Save quantities for CountProduct items - EXACT COPY from CountProductOverview
  const handleSaveCountProductQuantities = async (productId: number) => {
    console.log('🔄 [DyeingOrders] handleSaveCountProductQuantities called for product ID:', productId);
    console.log('📋 Current editValues:', editValues);
    console.log('⚡ Current isSaving state:', isSaving);
    
    if (isSaving) {
      console.log('⏳ Save already in progress, ignoring duplicate call');
      return;
    }
    
    try {
      setIsSaving(true);
      
      console.log('🔍 Detailed validation check:');
      console.log('   - quantity:', editValues.quantity);
      console.log('   - sentQuantity:', editValues.sentQuantity);
      console.log('   - receivedQuantity:', editValues.receivedQuantity);
      console.log('   - dispatchQuantity:', editValues.dispatchQuantity);
      
      // MINIMAL VALIDATION FOR TESTING (same as CountProductOverview)
      if (editValues.quantity <= 0) {
        console.log('❌ Validation failed: quantity <= 0');
        toast.error("Quantity must be greater than 0.");
        throw new Error("Validation failed: quantity <= 0");
      }

      console.log('✅ Basic validation passed, proceeding with update');

      // Update data structure EXACTLY like CountProductOverview
      const updateData = {
        quantity: editValues.quantity,  // Keep main quantity separate
        sentQuantity: editValues.sentQuantity,  // Sent to dye quantity
        sentToDye: editValues.sentQuantity > 0,  // Boolean flag
        receivedQuantity: editValues.receivedQuantity || 0,
        received: (editValues.receivedQuantity || 0) > 0,
        dispatchQuantity: editValues.dispatchQuantity || 0,
        dispatch: (editValues.dispatchQuantity || 0) > 0,
        dispatchDate: (editValues.dispatchQuantity || 0) > 0 ? 
          (countProducts.find(p => p.id === productId)?.dispatchDate || new Date().toISOString().split('T')[0]) : ""
      };

      console.log('🔄 Updating count product with data:', {
        ...updateData,
        debug: {
          originalQuantity: editValues.quantity,
          sentToDyeQuantity: editValues.sentQuantity,
          receivedQuantity: editValues.receivedQuantity,
          dispatchQuantity: editValues.dispatchQuantity
        }
      });

      // Use the SAME API function as CountProductOverview
      await updateCountProduct(productId, updateData);
      console.log('✅ Count Product updated successfully via API');

      // Update local state EXACTLY like CountProductOverview
      const updatedCountProducts = countProducts.map(product => 
        product.id === productId 
          ? { ...product, ...updateData }
          : product
      );
      setCountProducts(updatedCountProducts);
      console.log('✅ Local state updated successfully');

      // Save to localStorage for cross-page persistence (SAME as CountProductOverview)
      localStorage.setItem('countProducts', JSON.stringify(updatedCountProducts));
      localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
      console.log('💾 Updated count products saved to localStorage with timestamp');

      // ENHANCED cross-page synchronization - EXACT copy from CountProductOverview
      console.log('📡 Dispatching cross-page sync events...');
      
      // Primary sync event
      window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
        detail: { 
          countProducts: updatedCountProducts,
          updatedProductId: productId,
          updateData: updateData,
          timestamp: Date.now()
        } 
      }));
      
      // Secondary storage event for additional sync
      window.dispatchEvent(new CustomEvent('storage', {
        detail: {
          key: 'countProducts',
          newValue: JSON.stringify(updatedCountProducts),
          timestamp: Date.now()
        }
      }));
      
      // Exit edit mode
      setEditingRecordId(null);
      setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
      
      toast.success("Count product quantities updated successfully!");
      console.log('🎉 Count product update completed successfully');
      
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

  // ================= RENDER COUNT GROUPS LIST (MODIFIED FOR COUNT GROUPING) =================
  // Extract large inline JSX map into a memoized variable to avoid parser ambiguities
  const renderedCountGroups = React.useMemo(() => {
    return completeCountListing.map(({ name: countValue, records: countRecords, countProducts: countCountProducts }) => {
      const allRecordsForDisplay = [
        ...countRecords.map(record => {
          console.log('🚨🔥 MAPPING DYEING RECORD:', record);
          const mapped = { ...mapToSimplifiedDisplay(record), type: 'dyeing', originalRecord: record };
          console.log('🚨🔥 MAPPED DYEING RESULT:', mapped);
          return mapped;
        }),
        ...countCountProducts.map(product => {
          console.log('🚨🔥 MAPPING COUNT PRODUCT:', product);
          const mapped = { ...mapCountProductToSimplifiedDisplay(product), type: 'countProduct', originalRecord: product };
          console.log('🚨🔥 MAPPED COUNT PRODUCT RESULT:', mapped);
          return mapped;
        })
      ];

      return (
        <div key={`${countValue}-${refreshKey}`} className="shadow rounded-2xl overflow-visible dyeing-orders-container">
          <div
            onClick={() => setExpandedFirm((f) => (f === countValue ? null : countValue))}
            className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 cursor-pointer hover:bg-purple-50"
          >
            <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
              Count: {countValue} ({allRecordsForDisplay.length} orders)
            </h2>
            {expandedFirm === countValue ? <ChevronUp /> : <ChevronDown />}
          </div>

          {expandedFirm === countValue && (
            <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 overflow-visible" id="dyeing-orders-table">
              <div className="overflow-x-auto">
                {allRecordsForDisplay.length > 0 ? (
                  <table className="w-full text-sm min-w-[1000px]">
                    <thead className="text-gray-600 dark:text-gray-300 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-3 py-3 text-center font-semibold w-12">
                          {isMultiDeleteMode && (
                            <input
                              type="checkbox"
                              checked={allRecordsForDisplay.length > 0 && selectedItems.size > 0 && selectedItems.size === allRecordsForDisplay.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Select all items in the current view
                                  const allItemIds = new Set<string>();
                                  allRecordsForDisplay.forEach((record: any) => {
                                    allItemIds.add(`${record.type}-${record.id}`);
                                  });
                                  setSelectedItems(allItemIds);
                                } else {
                                  clearSelection();
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          )}
                        </th>
                        <th className="px-3 py-3 text-left font-semibold">Quantity</th>
                        <th className="px-3 py-3 text-left font-semibold">Customer Name</th>
                        <th className="px-3 py-3 text-left font-semibold">Dyeing Firm</th>
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
                        // FIXED: Check editing state for BOTH dyeing records AND count products
                        const isEditing = editingRecordId === displayRecord.id;
                        const isCountProduct = displayRecord.type === 'countProduct';
                        const itemId = `${displayRecord.type}-${displayRecord.id}`;
                        
                        // Debug logging for editing state
                        if (editingRecordId !== null) {
                          console.log(`🔍 [TABLE RENDER] Record ${displayRecord.id}: editingRecordId=${editingRecordId}, isEditing=${isEditing}, type=${displayRecord.type}`);
                        }
                        
                        return (
                          <tr key={`${displayRecord.type}-${displayRecord.id}-${refreshKey}-${index}`}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${isCountProduct ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                            <td className="px-3 py-3 text-center">
                              {isMultiDeleteMode && (
                                <input
                                  type="checkbox"
                                  checked={selectedItems.has(itemId)}
                                  onChange={() => toggleItemSelection(itemId)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              )}
                            </td>
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
                            <td className="px-3 py-3 font-medium">
                              {displayRecord.customerName || '[No Customer Name]'}
                            </td>
                            <td className="px-3 py-3 text-sm font-medium">{displayRecord.dyeingFirm || "Unknown Firm"}</td>
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
                            <td className="px-3 py-3 text-center relative" style={{ position: 'relative', zIndex: 1 }}>
                              {isEditing ? (
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
                              ) : isCountProduct ? (
                                <FloatingActionDropdown
                                  onEdit={() => handleCountProductEdit((displayRecord.originalRecord as CountProduct).id)}
                                  onDelete={() => handleCountProductDelete((displayRecord.originalRecord as CountProduct).id)}
                                  onFollowUp={() => handleCountProductFollowUp((displayRecord.originalRecord as CountProduct).id)}
                                  onUpdateQuantities={() => {
                                    console.log('🚨🔥 COUNT PRODUCT UPDATE QUANTITIES TRIGGERED');
                                    console.log('🚨🔥 Count Product ID:', (displayRecord.originalRecord as CountProduct).id);
                                    console.log('🚨🔥 Count Product Record:', displayRecord.originalRecord);
                                    handleCountProductUpdateQuantities((displayRecord.originalRecord as CountProduct).id);
                                  }}
                                />
                              ) : (
                                <FloatingActionDropdown
                                  onEdit={() => handleEdit(displayRecord.originalRecord as DyeingRecord)}
                                  onDelete={() => handleDelete(displayRecord.originalRecord as DyeingRecord)}
                                  onFollowUp={() => handleFollowUp(displayRecord.originalRecord as DyeingRecord)}
                                  onUpdateQuantities={() => {
                                    handleUpdateQuantities(displayRecord.originalRecord as DyeingRecord);
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
  }, [completeCountListing, expandedFirm, editingRecordId, editValues, isSaving]);

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 relative" style={{ overflow: 'visible' }}>
      
  <style>{`
        [data-floating-ui-portal] {
          z-index: 10000 !important;
          position: fixed !important;
        }
        
        .floating-action-dropdown {
          z-index: 10000 !important;
          position: fixed !important;
        }
        
        /* Ensure table doesn't clip floating elements */
        #dyeing-orders-table {
          position: relative;
          z-index: 1;
        }
        
        /* Override any overflow hidden in table containers */
        .dyeing-orders-container * {
          overflow: visible !important;
        }
  `}</style>
      
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
          <Button onClick={handleExportCSV}>Export CSV</Button>
          <Button onClick={handleExportPDF}>Export PDF</Button>
          <Button onClick={() => { setOrderToEdit(null); setIsFormOpen(true); }}>+ Add Dyeing Order</Button>
          
          {/* Multiple Delete Buttons */}
          {!isMultiDeleteMode ? (
            <Button 
              onClick={() => {
                setSelectedItems(new Set()); // Clear any existing selections
                setIsMultiDeleteMode(true);
              }}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Multiple Delete
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleMultipleDelete}
                disabled={selectedItems.size === 0}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Selected ({selectedItems.size})
              </Button>
              <Button 
                onClick={() => {
                  setIsMultiDeleteMode(false);
                  setSelectedItems(new Set());
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}
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
  {/* Status filter removed */}
        <select value={firmFilter} onChange={(e) => setFirmFilter(e.target.value)} className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-700">
          <option value="">Filter by Firm</option>
          {pageFirms.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)} className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-700">
          <option value="">Filter by Party</option>
          {pageParties.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {isFormOpen && (
        <div className="animate-fadeIn">
          <SimplifiedDyeingOrderForm
            orderToEdit={orderToEdit}
            onCancel={() => { setIsFormOpen(false); setOrderToEdit(null); }}
            onSuccess={handleOrderSuccess}
            existingFirms={pageFirms}
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
        {renderedCountGroups}
      </div>

      {/* Count Product Edit Modal */}
      {isCountProductEditModalOpen && countProductToEdit && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCountProductEditCancel();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Edit Count Product: {countProductToEdit?.customerName || 'Unknown'}
              </h2>
              <button
                onClick={handleCountProductEditCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {countProductToEdit && (
                <HorizontalAddOrderForm
                  key={`edit-${countProductToEdit.id}-${refreshKey}`}
                  editMode={true}
                  productToEdit={countProductToEdit}
                  onSuccess={handleCountProductEditSuccess}
                  onCancel={handleCountProductEditCancel}
                />
              )}
            </div>
          </div>
        </div>
      )}

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






