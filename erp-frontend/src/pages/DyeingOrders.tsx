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
import { AddDyeingOrderModal } from "../components/AddDyeingOrderModal";
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

// Helper to safely extract string from potential objects
const getSafeString = (val: any): string => {
  if (!val) return "";
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.partyName || val.name || val.customerName || JSON.stringify(val);
  }
  return String(val);
};

const formatQuantity = (val: number | undefined | null): string => {
  if (val === undefined || val === null) return "0.00";
  return Number(val).toFixed(2);
};

const DyeingOrderRow = React.memo(({
  displayRecord,
  isEditing,
  editValues,
  isSaving,
  isMultiDeleteMode,
  isSelected,
  onToggleSelection,
  onEditValueChange,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onFollowUp,
  onUpdateQuantities,
  onCountProductEdit,
  onCountProductDelete,
  onCountProductFollowUp,
  onCountProductUpdateQuantities,
  onSaveCountProductQuantities
}: any) => {
  const isCountProduct = displayRecord.type === 'countProduct';
  const itemId = `${displayRecord.type}-${displayRecord.id}`;

  return (
    <tr className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isCountProduct ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
      <td className="px-4 py-3 text-center">
        {isMultiDeleteMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(itemId)}
            className="w-4 h-4 rounded border-gray-300"
          />
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {displayRecord.customerName || '[No Customer]'}
            </span>
            {displayRecord.isReprocessing && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white bg-red-500 rounded-full">
                Reprocessing
              </span>
            )}
          </div>
          {isCountProduct && <span className="text-xs text-blue-600 dark:text-blue-400">Count Product</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {displayRecord.dyeingFirm || "--"}
      </td>
      <td className="px-4 py-3 text-right">
        {isEditing ? (
          <input
            type="number"
            value={editValues.quantity}
            onChange={(e) => onEditValueChange('quantity', e.target.value)}
            className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700 dark:border-gray-600"
            step="0.01"
            min="0"
          />
        ) : (
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatQuantity(displayRecord.quantity)}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {isEditing ? (
          <input
            type="number"
            value={editValues.sentQuantity}
            onChange={(e) => onEditValueChange('sentQuantity', e.target.value)}
            className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700 dark:border-gray-600"
            step="0.01"
            min="0"
          />
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-gray-700 dark:text-gray-300">{formatQuantity(displayRecord.sentToDye)}</span>
            {displayRecord.sentDate && <span className="text-xs text-gray-500">{new Date(displayRecord.sentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {isEditing ? (
          <input
            type="number"
            value={editValues.receivedQuantity}
            onChange={(e) => onEditValueChange('receivedQuantity', e.target.value)}
            className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700 dark:border-gray-600"
            step="0.01"
            min="0"
          />
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-gray-700 dark:text-gray-300">{formatQuantity(displayRecord.received)}</span>
            {displayRecord.receivedDate && <span className="text-xs text-gray-500">{new Date(displayRecord.receivedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {isEditing ? (
          <input
            type="number"
            value={editValues.dispatchQuantity}
            onChange={(e) => onEditValueChange('dispatchQuantity', e.target.value)}
            className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700 dark:border-gray-600"
            step="0.01"
            min="0"
          />
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-gray-700 dark:text-gray-300">{formatQuantity(displayRecord.dispatch)}</span>
            {displayRecord.dispatchDate && <span className="text-xs text-gray-500">{new Date(displayRecord.dispatchDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
          {displayRecord.partyNameMiddleman}
        </span>
      </td>
      <td className="px-4 py-3 text-center" style={{ position: 'relative', zIndex: 1 }}>
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                if (isCountProduct) {
                  onSaveCountProductQuantities(displayRecord.originalRecord.id);
                } else {
                  onSave(displayRecord.originalRecord);
                }
              }}
              disabled={isSaving}
              className={`p-1.5 rounded transition-colors ${isSaving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-100 hover:bg-green-200 text-green-700'
                }`}
              title={isSaving ? "Saving..." : "Save"}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className={`p-1.5 rounded transition-colors ${isSaving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : isCountProduct ? (
          <FloatingActionDropdown
            onEdit={() => onCountProductEdit(displayRecord.originalRecord.id)}
            onDelete={() => onCountProductDelete(displayRecord.originalRecord.id)}
            onFollowUp={() => onCountProductFollowUp(displayRecord.originalRecord.id)}
            onUpdateQuantities={() => onCountProductUpdateQuantities(displayRecord.originalRecord.id)}
          />
        ) : (
          <FloatingActionDropdown
            onEdit={() => onEdit(displayRecord.originalRecord)}
            onDelete={() => onDelete(displayRecord.originalRecord)}
            onFollowUp={() => onFollowUp(displayRecord.originalRecord)}
            onUpdateQuantities={() => onUpdateQuantities(displayRecord.originalRecord)}
          />
        )}
      </td>
    </tr>
  );
});

const DyeingOrders: React.FC = () => {
  const [records, setRecords] = useState<DyeingRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    }

    if (allDispatchedMatches && allDispatchedMatches.length > 1) {
      const lastDispatchedMatch = allDispatchedMatches[allDispatchedMatches.length - 1];
      finalDispatched = lastDispatchedMatch.match(/Dispatched: ([\d.]+)kg/)?.[1];
    }

    if (allOriginalQtyMatches && allOriginalQtyMatches.length > 1) {
      const lastOriginalQtyMatch = allOriginalQtyMatches[allOriginalQtyMatches.length - 1];
      finalOriginalQty = lastOriginalQtyMatch.match(/OriginalQty: ([\d.]+)kg/)?.[1];
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

    return trackingInfo;
  };

  // ================= MAPPING FUNCTION =================
  const mapToSimplifiedDisplay = (record: DyeingRecord): SimplifiedDyeingDisplayRecord => {
    const trackingInfo = parseTrackingInfo(record.remarks);

    // PRESERVE USER INPUT: Show customer name exactly as user entered it
    let customerName = getSafeString(record.customerName) || "Unknown Customer";

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
      remarks: trackingInfo.originalRemarks || record.remarks,
      isReprocessing: record.isReprocessing
    };

    return mappedRecord;
  };

  // ================= COUNT PRODUCT MAPPING FUNCTION =================
  const mapCountProductToSimplifiedDisplay = (countProduct: CountProduct): SimplifiedDyeingDisplayRecord => {
    // PRESERVE USER INPUT: Show customer name exactly as user entered it
    let customerName = getSafeString(countProduct.customerName);

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
      partyNameMiddleman: countProduct.middleman || getSafeString(countProduct.partyName), // Use middleman if available, otherwise fall back to partyName
      dyeingFirm: countProduct.dyeingFirm,
      remarks: countProduct.remarks || '',
      isReprocessing: countProduct.isReprocessing
    };

    console.log('✅ [CountProduct] Mapped with preserved customer name:', countProduct.customerName);
    return mappedRecord;
  };
  // ================= FETCH COUNT PRODUCTS =================
  const fetchCountProducts = async () => {
    try {
      // Use the authenticated API client instead of plain fetch
      const products = await getAllCountProducts();

      if (products && Array.isArray(products)) {
        // Set the products directly
        setCountProducts(products);
        localStorage.setItem('countProducts', JSON.stringify(products));
        localStorage.setItem('countProductsTimestamp', Date.now().toString());

        return; // Success - exit early
      }

      // If API returned invalid data, try cached data as fallback
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
    const groupedCountProductsByCount = filteredCountProducts.reduce((acc, product) => {
      const key = normalizeCount(product.count || 'Standard');
      if (!acc[key]) acc[key] = [];
      acc[key].push(product);
      return acc;
    }, {} as Record<string, CountProduct[]>);

    const countDisplayNameFromProducts: Record<string, string> = {};
    filteredCountProducts.forEach((p) => {
      const key = normalizeCount(p.count || 'Standard');
      if (!countDisplayNameFromProducts[key]) {
        countDisplayNameFromProducts[key] = getDisplayCount(p.count);
      }
    });

    const allCountValues = new Set([
      ...Object.keys(groupedByCount),
      ...Object.keys(groupedCountProductsByCount)
    ]);

    return Array.from(allCountValues)
      .map(key => {
        const dyeingRecords = groupedByCount[key] || [];
        const countProductsForCount = groupedCountProductsByCount[key] || [];
        const displayName = countDisplayNameFromRecords[key] || countDisplayNameFromProducts[key] || 'Standard';

        // Map records HERE for performance
        const mappedDyeingRecords = dyeingRecords.map(record => ({ ...mapToSimplifiedDisplay(record), type: 'dyeing', originalRecord: record }));
        const mappedCountProducts = countProductsForCount.map(product => ({ ...mapCountProductToSimplifiedDisplay(product), type: 'countProduct', originalRecord: product }));

        const allRecordsForDisplay = [...mappedDyeingRecords, ...mappedCountProducts];
        const hasData = allRecordsForDisplay.length > 0;

        return {
          name: displayName,
          allRecordsForDisplay,
          hasData,
          id: key
        };
      })
      .filter(countGroup => countGroup.hasData)
      .sort((a, b) => {
        const stdKey = normalizeCount('Standard');
        const aIsStd = a.id === stdKey;
        const bIsStd = b.id === stdKey;
        if (aIsStd && !bIsStd) return 1;
        if (bIsStd && !aIsStd) return -1;
        return a.name.localeCompare(b.name);
      });
  }, [filteredCountProducts, groupedByCount, refreshKey]);

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



  const handleExportCSV = () => {
    // Gather all currently filtered/displayed records from completeCountListing
    const flatList: any[] = [];
    completeCountListing.forEach(group => {
      flatList.push(...group.allRecordsForDisplay);
    });

    if (flatList.length === 0) {
      toast.error("No records to export");
      return;
    }

    const csvData = flatList.map(rec => ({
      "Type": rec.type === 'countProduct' ? 'Count Product' : 'Dyeing Record',
      "ID": rec.id,
      "Customer": rec.customerName,
      "Party/Middleman": rec.partyNameMiddleman,
      "Dyeing Firm": rec.dyeingFirm,
      "Count": rec.count,
      "Quantity (kg)": rec.quantity,
      "Sent to Dye": rec.sentToDye,
      "Sent Date": rec.sentDate ? new Date(rec.sentDate).toLocaleDateString() : '',
      "Received": rec.received,
      "Received Date": rec.receivedDate ? new Date(rec.receivedDate).toLocaleDateString() : '',
      "Dispatch": rec.dispatch,
      "Dispatch Date": rec.dispatchDate ? new Date(rec.dispatchDate).toLocaleDateString() : '',
      "Status": rec.type === 'countProduct' ? 'Completed' : (rec.isReprocessing ? 'Reprocessing' : 'Standard'),
      "Remarks": rec.remarks
    }));

    exportDataToCSV(csvData, `Dyeing_Orders_Export_${new Date().toISOString().split('T')[0]}`);
    toast.success("Export started");
  };

  const handleEdit = useCallback((record: DyeingRecord) => {
    const trackingInfo = parseTrackingInfo(record.remarks);

    // Determine the correct quantity values for form fields
    const originalQuantity = trackingInfo.originalQuantity !== undefined ? trackingInfo.originalQuantity : record.quantity;
    const sentToDye = record.quantity; // What was actually sent (stored as main quantity in DB)

    // Convert DyeingRecord to DyeingOrderQuickForm format with all fields properly mapped
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

    setOrderToEdit(simplifiedOrder);
    setIsFormOpen(true);
  }, []);

  // Handler for successful form submission
  const handleOrderSuccess = async (orderData: any) => {
    try {
      // Ensure firm exists in store before processing
      const dyeingFirmName = orderData?.dyeingFirm || orderData?.updatedFields?.dyeingFirm;
      if (dyeingFirmName) {
        try {
          await dyeingDataStore.ensureFirm(dyeingFirmName);
        } catch (error) {
          console.warn('⚠️ Failed to ensure firm in store:', error);
        }
      }

      // Force reload from API with cache bypass
      await dyeingDataStore.loadRecords(true);
      await dyeingDataStore.loadFirms(true);

      // CRITICAL: Also refresh count products so count-based grouping reflects edits
      try {
        await fetchCountProducts();
      } catch (cpErr) {
        console.warn('⚠️ Failed to refresh count products after order update:', cpErr);
      }

      // Close the form and clear edit state
      setIsFormOpen(false);
      setOrderToEdit(null);

      // Force UI refresh with timestamp to ensure re-render
      const newRefreshKey = Date.now();
      setRefreshKey(newRefreshKey);

      // Show success message with edit-specific information
      const actionType = orderData?.action || (orderToEdit ? 'updated' : 'created');
      const message = orderToEdit
        ? `Order #${orderToEdit.id} updated successfully! Party/middleman changes are now visible.`
        : `Order ${actionType} successfully! Data synchronized across all pages.`;

      toast.success(message, {
        duration: 3000,
      });

    } catch (error) {
      console.error("Failed to refresh data after order operation:", error);
      toast.error("Order operation completed but failed to refresh data. Please try again.");
    }
  };

  const handleDelete = useCallback(async (record: DyeingRecord) => {
    const confirmed = window.confirm(`Are you sure you want to delete order for ${record.partyName}?`);

    if (!confirmed) return;

    try {
      await deleteDyeingRecord(record.id);
      toast.success("Record deleted successfully!");

      // Refresh the records list using store
      await dyeingDataStore.loadRecords(true);

    } catch (error: any) {
      console.error("❌ Delete failed:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Unknown error occurred";
      toast.error(`Failed to delete record: ${errorMessage}`);
    }
  }, []);

  // Multiple delete functions
  const toggleItemSelection = useCallback((itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  }, [selectedItems]);

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

  const handleFollowUp = useCallback((record: DyeingRecord) => {
    setSelectedRecord(record);
    setIsFollowUpModalOpen(true);
  }, []);

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
  const handleCountProductUpdateQuantities = useCallback(async (id: number) => {
    const recordToUpdate = countProducts.find(cp => cp.id === id);

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
  }, [countProducts]);

  // Update Quantities functionality - copied exactly from CountProductOverview
  const handleUpdateQuantities = useCallback((record: DyeingRecord) => {
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
  }, []);

  const handleSaveQuantities = useCallback(async (record: DyeingRecord) => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      // MINIMAL VALIDATION FOR TESTING - same as CountProductOverview
      if (editValues.quantity <= 0) {
        toast.error("Quantity must be greater than 0.");
        throw new Error("Validation failed: quantity <= 0");
      }

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

      await updateDyeingRecord(record.id, updateData);

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

      // Save to localStorage for persistence - same as CountProductOverview
      localStorage.setItem('dyeingRecords', JSON.stringify(updatedRecords));
      localStorage.setItem('dyeingRecordsTimestamp', new Date().getTime().toString());

      // Cross-page synchronization - same events as CountProductOverview
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

      // Exit edit mode
      setEditingRecordId(null);
      setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });

      toast.success("Quantities updated successfully!");

    } catch (error) {
      console.error('❌ [Dyeing] Error saving quantities:', error);
      toast.error("Failed to update quantities");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, editValues, dyeingRecords]);

  const handleCancelEdit = useCallback(() => {
    setEditingRecordId(null);
    setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
    toast.info("Edit cancelled. Changes discarded.");
  }, []);

  const handleEditValueChange = useCallback((field: keyof typeof editValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditValues(prev => ({ ...prev, [field]: numValue }));
  }, []);

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
      console.error('❌ [DyeingOrders] Count product not found for deletion');
      toast.error('Count product not found. Please try again.');
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
  const handleSaveCountProductQuantities = useCallback(async (productId: number) => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      // MINIMAL VALIDATION FOR TESTING (same as CountProductOverview)
      if (editValues.quantity <= 0) {
        toast.error("Quantity must be greater than 0.");
        throw new Error("Validation failed: quantity <= 0");
      }

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

      // Use the SAME API function as CountProductOverview
      await updateCountProduct(productId, updateData);

      // Update local state EXACTLY like CountProductOverview
      const updatedCountProducts = countProducts.map(product =>
        product.id === productId
          ? { ...product, ...updateData }
          : product
      );
      setCountProducts(updatedCountProducts);

      // Save to localStorage for cross-page persistence (SAME as CountProductOverview)
      localStorage.setItem('countProducts', JSON.stringify(updatedCountProducts));
      localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());

      // ENHANCED cross-page synchronization - EXACT copy from CountProductOverview
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

    } catch (error) {
      console.error('❌ Error saving count product quantities:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, editValues, countProducts]);

  // ================= RENDER COUNT GROUPS LIST (MODIFIED FOR COUNT GROUPING) =================
  // Extract large inline JSX map into a memoized variable to avoid parser ambiguities
  const renderedCountGroups = React.useMemo(() => {
    return completeCountListing.map(({ name: countValue, allRecordsForDisplay }) => {
      return (
        <div key={`${countValue}-${refreshKey}`} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden">
          <div
            onClick={() => setExpandedFirm((f) => (f === countValue ? null : countValue))}
            className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {expandedFirm === countValue ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronUp className="w-5 h-5 text-gray-500" />}
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Count: {countValue}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({allRecordsForDisplay.length} {allRecordsForDisplay.length === 1 ? 'order' : 'orders'})
              </span>
            </div>
          </div>

          {expandedFirm === countValue && (
            <div className="overflow-x-auto" id="dyeing-orders-table">
              {allRecordsForDisplay.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-center w-10">
                        {isMultiDeleteMode && (
                          <input
                            type="checkbox"
                            checked={allRecordsForDisplay.length > 0 && selectedItems.size > 0 && selectedItems.size === allRecordsForDisplay.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allItemIds = new Set<string>();
                                allRecordsForDisplay.forEach((record: any) => {
                                  allItemIds.add(`${record.type}-${record.id}`);
                                });
                                setSelectedItems(allItemIds);
                              } else {
                                clearSelection();
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        )}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Firm</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sent</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Received</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Dispatch</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Party</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-900 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                    {allRecordsForDisplay.map((displayRecord: any, index: number) => {
                      const isEditing = editingRecordId === displayRecord.id;
                      const itemId = `${displayRecord.type}-${displayRecord.id}`;
                      const isSelected = selectedItems.has(itemId);

                      return (
                        <DyeingOrderRow
                          key={`${displayRecord.type}-${displayRecord.id}-${refreshKey}-${index}`}
                          displayRecord={displayRecord}
                          isEditing={isEditing}
                          editValues={isEditing ? editValues : undefined}
                          isSaving={isSaving}
                          isMultiDeleteMode={isMultiDeleteMode}
                          isSelected={isSelected}
                          onToggleSelection={toggleItemSelection}
                          onEditValueChange={handleEditValueChange}
                          onSave={handleSaveQuantities}
                          onCancel={handleCancelEdit}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onFollowUp={handleFollowUp}
                          onUpdateQuantities={handleUpdateQuantities}
                          onCountProductEdit={handleCountProductEdit}
                          onCountProductDelete={handleCountProductDelete}
                          onCountProductFollowUp={handleCountProductFollowUp}
                          onCountProductUpdateQuantities={handleCountProductUpdateQuantities}
                          onSaveCountProductQuantities={handleSaveCountProductQuantities}
                        />
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No dyeing orders yet for this count.</div>
              )}
            </div>
          )}
        </div>
      );
    });
  }, [completeCountListing, expandedFirm, editingRecordId, editValues, isSaving, isMultiDeleteMode, selectedItems, refreshKey]);

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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dyeing Orders</h1>
        <div className="flex items-center gap-2">
          {isRefreshing && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400 text-sm">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Refreshing...</span>
            </div>
          )}
          <Button onClick={handleExportCSV} variant="outline" className="text-sm">Export CSV</Button>
          <Button onClick={() => { setOrderToEdit(null); setIsAddModalOpen(true); }} className="text-sm">+ Add Order</Button>

          {!isMultiDeleteMode ? (
            <Button
              onClick={() => {
                setSelectedItems(new Set());
                setIsMultiDeleteMode(true);
              }}
              variant="outline"
              className="text-sm text-red-600 border-red-300 hover:bg-red-50"
            >
              Delete Multiple
            </Button>
          ) : (
            <>
              <Button
                onClick={handleMultipleDelete}
                disabled={selectedItems.size === 0}
                className="text-sm bg-red-600 hover:bg-red-700 text-white"
              >
                Delete ({selectedItems.size})
              </Button>
              <Button
                onClick={() => {
                  setIsMultiDeleteMode(false);
                  setSelectedItems(new Set());
                }}
                variant="outline"
                className="text-sm"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer, firm, yarn, lot, shade, count..."
          className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={firmFilter}
          onChange={(e) => setFirmFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">All Firms</option>
          {pageFirms.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          value={partyFilter}
          onChange={(e) => setPartyFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">All Parties</option>
          {pageParties.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

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

      {/* Add Dyeing Order Modal */}
      <AddDyeingOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async (newProduct) => {
          console.log("🎯 New dyeing order added:", newProduct);
          // Refresh data
          await fetchCountProducts();
          await dyeingDataStore.loadRecords(true);
          setRefreshKey(prev => prev + 1);
          setIsAddModalOpen(false);
        }}
        currentFirm={expandedFirm || ""}
      />
    </div>
  );
};

export default DyeingOrders;





