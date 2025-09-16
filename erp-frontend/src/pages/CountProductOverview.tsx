import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ChevronDown, ChevronUp, Package, TrendingUp, Calendar, BarChart3, Plus, Check, X, Loader } from "lucide-react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "sonner";
import { exportDataToCSV } from "../utils/exportUtils";
import FloatingActionDropdown from "../components/FloatingActionDropdown";
import CountProductFollowUpModal from "../components/CountProductFollowUpModal";
import { HorizontalAddOrderForm } from "../components/HorizontalAddOrderForm";
import SimplifiedDyeingOrderForm from "../components/SimplifiedDyeingOrderForm";
import { 
  getAllCountProducts, 
  createCountProduct, 
  updateCountProduct, 
  deleteCountProduct,
  CountProduct 
} from "../api/countProductApi";
import { getAllDyeingFirms, DyeingFirm } from "../api/dyeingFirmApi";
import { deleteDyeingRecord, updateDyeingRecord } from "../api/dyeingApi";
import { dyeingDataStore } from "../stores/dyeingDataStore";
import { DyeingRecord } from "../types/dyeing";

// REMOVED: mockCountProducts hard-coded demo data. We now rely ONLY on real API / synced creations

const CountProductOverview: React.FC = () => {
  // Early role-based page guard (defense in depth)
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (role === 'manager') {
    return <Navigate to="/dashboard" replace />;
  }
  const [products, setProducts] = useState<CountProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [firmFilter, setFirmFilter] = useState<string>("");
  // Removed grade filter per request
  const [partyFilter, setPartyFilter] = useState<string>("");
  const [showHorizontalForm, setShowHorizontalForm] = useState(false); // New state for horizontal form
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CountProduct | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<CountProduct | null>(null);
  
  // Dyeing record edit modal state
  const [isDyeingEditModalOpen, setIsDyeingEditModalOpen] = useState(false);
  const [dyeingRecordToEdit, setDyeingRecordToEdit] = useState<any | null>(null); // Changed to any to accept formatted record
  
  // Centralized dyeing firms state and dyeing records
  const [centralizedDyeingFirms, setCentralizedDyeingFirms] = useState<DyeingFirm[]>([]);
  const [dyeingRecords, setDyeingRecords] = useState<DyeingRecord[]>([]);
  const [isLoadingFirms, setIsLoadingFirms] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Multiple delete functionality
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isMultiDeleteMode, setIsMultiDeleteMode] = useState(false);
  
  const [editValues, setEditValues] = useState<{
    quantity: number;
    receivedQuantity: number;
    dispatchQuantity: number;
    sentQuantity: number;
  }>({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });

  // Parse tracking info from remarks (same logic as DyeingOrders)
  const parseTrackingInfo = (remarks?: string) => {
    console.log('📝 [CountProductOverview] Parsing remarks:', remarks);
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

    // Extract tracking data using same patterns as DyeingOrders
    const received = remarks.match(/Received: ([\d.]+)kg/)?.[1];
    const receivedDate = remarks.match(/Received: [\d.]+kg on ([\d-]+)/)?.[1];
    const dispatched = remarks.match(/Dispatched: ([\d.]+)kg/)?.[1];
    const dispatchDate = remarks.match(/Dispatched: [\d.]+kg on ([\d-]+)/)?.[1];
    const middleman = remarks.match(/Middleman: ([^|]+)/)?.[1]?.trim();
    const originalQty = remarks.match(/OriginalQty: ([\d.]+)kg/)?.[1];
    
    // Handle multiple entries by taking the LAST value
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
    
    console.log('🔍 [CountProductOverview] Parsed tracking info:', trackingInfo);
    return trackingInfo;
  };

  // Map dyeing record to simplified display (same logic as DyeingOrders)
  const mapToSimplifiedDisplay = (record: DyeingRecord) => {
    console.log('� [CountProductOverview] Mapping record to simplified display:', record.id);
    
    const trackingInfo = parseTrackingInfo(record.remarks);
    
    const mappedRecord = {
      id: record.id,
      quantity: trackingInfo.originalQuantity || record.quantity,
      customerName: record.customerName, // FIX: Use actual customer name, not party name!
      sentToDye: record.quantity, // This is what was actually sent
      sentDate: record.sentDate,
      received: trackingInfo.received,
      receivedDate: trackingInfo.receivedDate,
      dispatch: trackingInfo.dispatch,
      dispatchDate: trackingInfo.dispatchDate,
      partyNameMiddleman: trackingInfo.partyNameMiddleman,
      dyeingFirm: record.dyeingFirm,
      remarks: trackingInfo.originalRemarks || record.remarks
    };
    
    console.log('✅ [CountProductOverview] Mapped record:', mappedRecord);
    return mappedRecord;
  };

  const formatQty = (v: number | undefined | null) => 
    (v === null || v === undefined || v === 0) ? '-' : `${v % 1 === 0 ? v : v.toFixed(1)} kg`;

  // Fetch count products from API with AGGRESSIVE localStorage persistence
  const fetchCountProducts = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 [AGGRESSIVE] Fetching count products with priority on localStorage...');
      
      // ALWAYS load localStorage data first and keep it as backup
      const savedProducts = localStorage.getItem('countProducts');
      const savedTimestamp = localStorage.getItem('countProductsTimestamp');
      
      let localData: CountProduct[] = [];
      let hasValidLocalData = false;
      
      if (savedProducts) {
        try {
          localData = JSON.parse(savedProducts);
          hasValidLocalData = Array.isArray(localData) && localData.length > 0;
          console.log(`📋 [AGGRESSIVE] Found ${localData.length} products in localStorage (valid: ${hasValidLocalData})`);
          
          // ALWAYS set localStorage data if we have it - API should not override this
          if (hasValidLocalData) {
            console.log('� [AGGRESSIVE] Setting products from localStorage immediately and treating as source of truth');
            setProducts(localData);
          }
          
          // If localStorage data is very recent (< 1 minute), don't even call API
          if (savedTimestamp) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - parseInt(savedTimestamp);
            const oneMinuteInMs = 1 * 60 * 1000;
            
            if (timeDiff < oneMinuteInMs && hasValidLocalData) {
              console.log(`✅ [AGGRESSIVE] LocalStorage data is very fresh (${Math.round(timeDiff/1000)}s old), skipping API call entirely`);
              return;
            }
          }
        } catch (parseError) {
          console.warn('⚠️ [AGGRESSIVE] Failed to parse localStorage data:', parseError);
        }
      }
      
      // Only call API if localStorage data is older or empty
      try {
        console.log('🌐 [AGGRESSIVE] Calling API for background sync only...');
        const apiData = await getAllCountProducts();
        console.log(`✅ [AGGRESSIVE] API returned ${apiData.length} products`);
        
        // CRITICAL: Only update state if API data is actually better than localStorage
        if (Array.isArray(apiData) && apiData.length > 0) {
          // If we have no localStorage data, use API data
          if (!hasValidLocalData) {
            console.log('📝 [AGGRESSIVE] No localStorage data, using API data');
            setProducts(apiData);
            localStorage.setItem('countProducts', JSON.stringify(apiData));
            localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
          } 
          // If API has more data than localStorage, merge them
          else if (apiData.length > localData.length) {
            console.log('📝 [AGGRESSIVE] API has more data, merging with localStorage priority');
            const mergedData = [...localData]; // Start with localStorage data
            
            // Add any API products that aren't in localStorage
            apiData.forEach(apiProduct => {
              const existsInLocal = localData.some(localProduct => localProduct.id === apiProduct.id);
              if (!existsInLocal) {
                console.log('📝 [AGGRESSIVE] Adding API product not in localStorage:', apiProduct.customerName);
                mergedData.push(apiProduct);
              }
            });
            
            setProducts(mergedData);
            localStorage.setItem('countProducts', JSON.stringify(mergedData));
            localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
          }
          // Otherwise, keep localStorage data as is
          else {
            console.log('� [AGGRESSIVE] LocalStorage data is equal/better, keeping it unchanged');
          }
        } 
        // If API returns empty/invalid data, NEVER override localStorage
        else {
          console.log('🛡️ [AGGRESSIVE] API returned empty/invalid data, protecting localStorage data');
          if (hasValidLocalData) {
            console.log('💪 [AGGRESSIVE] Keeping localStorage data intact, API call was meaningless');
            // Don't call setProducts again, localStorage data is already set
          }
        }
      } catch (apiError) {
        console.warn('⚠️ [AGGRESSIVE] API failed, this is fine - localStorage data is protected:', apiError);
        // If API fails and we have localStorage data, make sure it's displayed
        if (hasValidLocalData) {
          console.log('�️ [AGGRESSIVE] API failed but localStorage data is safe and displayed');
          // Don't override - localStorage data is already set above
        } else {
          console.log('📭 [AGGRESSIVE] API failed and no localStorage data available');
          setProducts([]);
        }
      }
      
    } catch (error) {
      console.error('❌ [AGGRESSIVE] Fatal error in fetchCountProducts:', error);
      
      // ULTIMATE FALLBACK: Always try localStorage one more time
      const emergencyBackup = localStorage.getItem('countProducts');
      if (emergencyBackup) {
        try {
          const emergencyData = JSON.parse(emergencyBackup);
          if (Array.isArray(emergencyData) && emergencyData.length > 0) {
            console.log('� [AGGRESSIVE] Emergency localStorage recovery successful');
            setProducts(emergencyData);
            return;
          }
        } catch (emergencyError) {
          console.error('💥 [AGGRESSIVE] Emergency localStorage recovery failed:', emergencyError);
        }
      }
      
      // Only set empty if absolutely nothing worked
      console.log('💔 [AGGRESSIVE] All recovery attempts failed');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log('🔧 [CountProductOverview] Component mounting, initializing store...');
    
    // IMMEDIATELY load localStorage data before any async operations
    console.log('📋 [CountProductOverview] Loading localStorage data immediately...');
    const savedProducts = localStorage.getItem('countProducts');
    if (savedProducts) {
      try {
        const localData = JSON.parse(savedProducts);
        if (Array.isArray(localData) && localData.length > 0) {
          console.log(`✅ [CountProductOverview] Immediately loaded ${localData.length} products from localStorage`);
          setProducts(localData);
        }
      } catch (parseError) {
        console.warn('⚠️ [CountProductOverview] Failed to parse localStorage on mount:', parseError);
      }
    }
    
    let unmounted = false;
    
    const initializeStoreAndSubscribe = async () => {
      try {
        // Initialize store first
        console.log('🔄 [CountProductOverview] Initializing store...');
        await dyeingDataStore.init();
        
        if (unmounted) return;
        
        console.log('✅ [CountProductOverview] Store initialized, setting up subscriptions...');
        
        // Subscribe to store updates
        const unsubscribeFirms = await dyeingDataStore.subscribeFirms((firms) => {
          if (unmounted) return;
          console.log('📡 [CountProductOverview] Received firm sync update:', {
            count: firms.length,
            firms: firms.map(f => f.name),
            source: 'unified-store'
          });
          setCentralizedDyeingFirms(firms);
        });

        const unsubscribeRecords = await dyeingDataStore.subscribeRecords((records) => {
          if (unmounted) return;
          console.log('📡 [CountProductOverview] Received dyeing records update:', {
            count: records.length,
            source: 'unified-store'
          });
          setDyeingRecords(records);
        });
        
        console.log('✅ [CountProductOverview] Subscriptions established');
        
        // Fetch count products (now this will sync with API and merge with already-loaded localStorage data)
        fetchCountProducts();
        
        // Store cleanup functions
        return () => {
          unsubscribeFirms();
          unsubscribeRecords();
        };
        
      } catch (error) {
        console.error('❌ [CountProductOverview] Store initialization failed:', error);
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

  // Cross-page synchronization - listen for localStorage changes from DyeingOrders
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'countProducts' && e.newValue) {
        try {
          const updatedProducts = JSON.parse(e.newValue);
          console.log('🔄 [CountProductOverview] Detected countProducts change from another page, syncing...', updatedProducts.length);
          setProducts(updatedProducts);
        } catch (error) {
          console.error('❌ [CountProductOverview] Failed to parse countProducts from storage change:', error);
        }
      }
    };

    // Listen for storage changes from other tabs/pages
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-page updates)
    const handleCustomSync = (e: CustomEvent) => {
      if (e.detail && e.detail.countProducts) {
        console.log('🔄 [CountProductOverview] Custom countProducts sync received:', e.detail.countProducts.length);
        setProducts(e.detail.countProducts);
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('countProductsUpdated', handleCustomSync as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('countProductsUpdated', handleCustomSync as EventListener);
    };
  }, []);

  // Auto-refresh functionality - triggers fast refresh on component mount and focus
  useEffect(() => {
    let isRefreshing = false;

    const fastRefresh = async () => {
      if (isRefreshing) return; // Prevent multiple simultaneous refreshes
      
      isRefreshing = true;
      try {
        // Check if data is stale before refreshing
        const lastRefresh = localStorage.getItem('lastCountProductRefresh');
        const now = Date.now();
        const staleThreshold = 500; // 500ms threshold for staleness
        
        if (!lastRefresh || (now - parseInt(lastRefresh)) > staleThreshold) {
          setIsLoading(true);
          
          // Parallel data loading for maximum speed
          const refreshPromises = [
            fetchCountProducts(),
            dyeingDataStore.loadRecords(true),
            dyeingDataStore.loadFirms(true)
          ];
          
          await Promise.all(refreshPromises);
          localStorage.setItem('lastCountProductRefresh', now.toString());
          setRefreshKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('Initial load failed:', error);
      } finally {
        setIsLoading(false);
        isRefreshing = false;
      }
    };

    // Smart one-time initial load - check if we need to load data
    const lastLoadKey = `countProductOverviewLastLoad_${new Date().toDateString()}`;
    const hasLoadedToday = localStorage.getItem(lastLoadKey);
    
    if (!hasLoadedToday) {
      console.log('🚀 First load of the day - performing initial data load...');
      fastRefresh();
      localStorage.setItem(lastLoadKey, Date.now().toString());
    } else {
      console.log('✅ Data already loaded today - using cached data for instant display');
      // Data is already available from the store - no need to force update
    }

    // No continuous refresh listeners - data updates happen through forms and actions
    return () => {
      // no-op
    };
  }, []);

  // Debug effect to track when products state changes
  useEffect(() => {
    console.log('🔄 Products state updated:', {
      count: products.length,
      sampleProducts: products.slice(0, 2).map(p => ({ id: p.id, customerName: p.customerName, quantity: p.quantity }))
    });
    
    // Debug: Check localStorage consistency when products change
    if (products.length > 0) {
      const savedProducts = localStorage.getItem('countProducts');
      const savedTimestamp = localStorage.getItem('countProductsTimestamp');
      if (savedProducts && savedTimestamp) {
        try {
          const localData = JSON.parse(savedProducts);
          console.log('📋 LocalStorage consistency check:', {
            stateCount: products.length,
            localStorageCount: localData.length,
            timestampAge: savedTimestamp ? Math.round((Date.now() - parseInt(savedTimestamp)) / 1000) : 'N/A'
          });
        } catch (e) {
          console.warn('⚠️ Failed to check localStorage consistency:', e);
        }
      } else {
        console.warn('🚨 Products in state but no localStorage backup found!');
      }
    }
  }, [products]);

  // Debug effect to track when firms state changes
  useEffect(() => {
    console.log('🏭 Firms state updated:', {
      count: centralizedDyeingFirms.length,
      activeCount: centralizedDyeingFirms.filter(f => f.isActive).length,
      firms: centralizedDyeingFirms.map(f => ({ name: f.name, isActive: f.isActive })),
      timestamp: new Date().toISOString()
    });
    
    // Debug: Check localStorage for cached firms
    try {
      const cached = localStorage.getItem('custom-dyeing-firms');
      if (cached) {
        console.log('💾 Cached firms in localStorage:', JSON.parse(cached));
      }
    } catch (e) {
      console.warn('⚠️ Failed to read cached firms from localStorage:', e);
    }
    
    // Debug: Check if firms disappear after refresh
    if (centralizedDyeingFirms.length === 0) {
      console.warn('🚨 NO FIRMS LOADED - This might be the refresh issue!');
      console.log('🔄 Attempting manual store refresh...');
      dyeingDataStore.forceRefresh().then(() => {
        console.log('✅ Manual store refresh completed');
      }).catch((err) => {
        console.error('❌ Manual store refresh failed:', err);
      });
    }
  }, [centralizedDyeingFirms]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showHorizontalForm) {
          setShowHorizontalForm(false);
        } else if (isEditModalOpen) {
          handleEditCancel();
        } else if (isDyeingEditModalOpen) {
          setIsDyeingEditModalOpen(false);
          setDyeingRecordToEdit(null);
        }
      }
    };

    if (showHorizontalForm || isEditModalOpen || isDyeingEditModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showHorizontalForm, isEditModalOpen, isDyeingEditModalOpen]);

  // Filter products based on search and filters
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      product.partyName.toLowerCase().includes(query) ||
      product.dyeingFirm.toLowerCase().includes(query) ||
      product.yarnType.toLowerCase().includes(query) ||
      product.shade.toLowerCase().includes(query) ||
      product.count.toLowerCase().includes(query) ||
      product.lotNumber.toLowerCase().includes(query);

    const matchesFirm = firmFilter ? product.dyeingFirm === firmFilter : true;
  const matchesGrade = true;
    const matchesParty = partyFilter ? product.partyName === partyFilter : true;

    return matchesSearch && matchesFirm && matchesGrade && matchesParty;
  });

  // Get unique values for filters
  // Use centralized dyeing firms instead of extracting from products
  // Firms currently visible on this page, derived from filtered products
  const pageFirms = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => p?.dyeingFirm && set.add(p.dyeingFirm));
    // Also include dyeingRecords mapped to simplified display if used in UI lists here
    dyeingRecords.forEach(r => r?.dyeingFirm && set.add(r.dyeingFirm));
    return Array.from(set).sort((a,b) => a.localeCompare(b));
  }, [products, dyeingRecords]);
  // Removed uniqueGrades, no longer used
  const uniqueParties = Array.from(new Set(products.map((p) => p.partyName)));

  // Group products by dyeing firm
  const groupedByFirm = filteredProducts.reduce((acc, product) => {
    if (!acc[product.dyeingFirm]) acc[product.dyeingFirm] = [];
    acc[product.dyeingFirm].push(product);
    return acc;
  }, {} as Record<string, CountProduct[]>);

  // Group dyeing records by firm
  const groupedDyeingRecords = dyeingRecords.reduce((acc, record) => {
    if (!acc[record.dyeingFirm]) acc[record.dyeingFirm] = [];
    acc[record.dyeingFirm].push(record);
    return acc;
  }, {} as Record<string, DyeingRecord[]>);

  // Create complete firm listing using UNION of centralized firms and any firms found in data
  const completeFirmListing = React.useMemo(() => {
    // Build union of firm names from: centralized list + filtered products + dyeing records
    const unionFirmNames = new Set<string>();
    centralizedDyeingFirms.forEach(f => f?.name && unionFirmNames.add(f.name));
    Object.keys(groupedByFirm).forEach(name => name && unionFirmNames.add(name));
    Object.keys(groupedDyeingRecords).forEach(name => name && unionFirmNames.add(name));

    // Create listing entries for all union firms
    const listing = Array.from(unionFirmNames).map((name) => {
      const firmMeta = centralizedDyeingFirms.find(f => f.name === name);
      return {
        name,
        products: groupedByFirm[name] || [],
        dyeingRecords: groupedDyeingRecords[name] || [],
        id: firmMeta?.id
      };
    })
    // Remove empty groups (no products and no dyeing records)
    .filter(firm => firm.products.length > 0 || firm.dyeingRecords.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

    return listing;
  }, [centralizedDyeingFirms, groupedByFirm, groupedDyeingRecords]);

  // Debug logging
  console.log('🔍 [CountProductOverview] Complete firm listing:', completeFirmListing);
  console.log('🔍 [CountProductOverview] Firms with only dyeing records:', 
    completeFirmListing.filter(f => f.products.length === 0 && f.dyeingRecords.length > 0)
  );

  // Quality grade badge component
  const qualityBadge = (grade: string) => {
    const base = "px-3 py-1 text-xs font-semibold rounded-full";
    switch (grade) {
      case "A":
        return <span className={`${base} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`}>Grade A</span>;
      case "B":
        return <span className={`${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300`}>Grade B</span>;
      case "C":
        return <span className={`${base} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300`}>Grade C</span>;
      default:
        return <span className={`${base} bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300`}>{grade}</span>;
    }
  };

  const statusBadge = (status: boolean, label: string) => {
    const base = "px-2 py-1 text-xs font-medium rounded";
    if (status) {
      return <span className={`${base} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`}>✓ {label}</span>;
    } else {
      return <span className={`${base} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300`}>✗ {label}</span>;
    }
  };

  // Professional quantity formatter
  const formatQuantity = (quantity: number | undefined | null): string => {
    if (!quantity || quantity === 0) {
      return "N/A";
    }
    return `${quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1)} kg`;
  };

  // Action handlers
  const handleEdit = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductToEdit(product);
      setIsEditModalOpen(true);
      toast.info("Opening edit form for the selected product.");
    }
  };

  const handleDelete = async (productId: number) => {
    console.log('🗑️ Delete request for product ID:', productId);
    
    // Find the product to show more details in confirmation
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) {
      console.error('❌ Product not found for deletion');
      toast.error('Product not found. Please try again.');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete this count product?\n\nCustomer: ${productToDelete.customerName}\nDyeing Firm: ${productToDelete.dyeingFirm}\nQuantity: ${productToDelete.quantity} kg\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      console.log('❌ Delete cancelled by user');
      return;
    }

    console.log('✅ Delete confirmed by user, proceeding...', {
      productId,
      customerName: productToDelete.customerName,
      dyeingFirm: productToDelete.dyeingFirm
    });

    try {
      console.log('🔄 Calling deleteCountProduct API...');
      console.log('📊 Products before deletion:', products.length);
      
      await deleteCountProduct(productId);
      console.log('✅ API delete successful');
      
      // Remove from local state
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      console.log(`✅ Product removed from local state. Products before: ${products.length}, after: ${updatedProducts.length}`);
      
      // Save updated products to localStorage for persistence
      localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
      localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
      console.log('💾 Delete: Updated products saved to localStorage with timestamp');
      
      // Dispatch custom event for cross-page synchronization
      window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
        detail: { countProducts: updatedProducts } 
      }));
      
      toast.success('Count product deleted successfully!');
    } catch (error) {
      console.error('❌ Failed to delete count product:', error);
      
      // Check for demo mode scenarios (API unavailable)
      if ((error instanceof Error && error.message.includes('ECONNREFUSED')) ||
          (error as any)?.response?.status >= 500 ||
          (error instanceof Error && error.message.includes('Network Error'))) {
        console.log('🔧 API unavailable, using demo mode for delete');
        console.log('📊 Products before demo delete:', products.length);
        
        // Proceed with local deletion in demo mode
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        console.log(`✅ Demo delete: Products before: ${products.length}, after: ${updatedProducts.length}`);
        
        // Save to localStorage in demo mode
        localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
        localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
        
        // Dispatch custom event for cross-page synchronization
        window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
          detail: { countProducts: updatedProducts } 
        }));
        
        toast.success('Count product deleted successfully! (Demo mode - database not connected)');
        console.log('✅ Demo mode delete completed successfully');
      } else {
        toast.error(`Failed to delete count product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
    
    // Add all count products
    products.forEach((product) => {
      allItemIds.add(`count-${product.id}`);
    });
    
    // Add all dyeing records
    dyeingRecords.forEach((record) => {
      allItemIds.add(`dyeing-${record.id}`);
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
        
        if (type === 'count') {
          deletePromises.push(deleteCountProduct(numericId));
        } else if (type === 'dyeing') {
          deletePromises.push(deleteDyeingRecord(numericId));
        }
      });

      // Execute all deletions
      await Promise.all(deletePromises);
      
      toast.success(`Successfully deleted ${selectedItems.size} item(s)`);
      
      // Clear selection and refresh data
      setSelectedItems(new Set());
      setIsMultiDeleteMode(false);
      
      // Refresh data
      await fetchCountProducts();
      await dyeingDataStore.loadRecords(true);
      
    } catch (error: any) {
      console.error("❌ Multiple delete failed:", error);
      
      // Handle demo mode fallback
      if ((error instanceof Error && error.message.includes('ECONNREFUSED')) ||
          (error as any)?.response?.status >= 500 ||
          (error instanceof Error && error.message.includes('Network Error'))) {
        
        // Process local deletions in demo mode
        let updatedProducts = [...products];
        let updatedRecords = [...dyeingRecords];
        
        selectedItems.forEach(itemId => {
          const [type, id] = itemId.split('-');
          const numericId = parseInt(id);
          
          if (type === 'count') {
            updatedProducts = updatedProducts.filter(p => p.id !== numericId);
          } else if (type === 'dyeing') {
            updatedRecords = updatedRecords.filter(r => r.id !== numericId);
          }
        });
        
        setProducts(updatedProducts);
        setDyeingRecords(updatedRecords);
        
        // Save to localStorage
        localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
        localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
        
        // Dispatch events for cross-page sync
        window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
          detail: { countProducts: updatedProducts } 
        }));
        
        setSelectedItems(new Set());
        setIsMultiDeleteMode(false);
        
        toast.success(`Successfully deleted ${selectedItems.size} item(s) (Demo mode)`);
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || "Unknown error occurred";
        toast.error(`Failed to delete items: ${errorMessage}`);
      }
    }
  };

  const handleFollowUp = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsFollowUpModalOpen(true);
      toast.info(`Opening follow-up for ${product.partyName} - ${product.yarnType}`);
    }
  };

  // Handle edit modal
  const handleEditSuccess = (updatedProduct: CountProduct) => {
    // Update the product in the local state
    const updatedProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updatedProducts);
    
    // Save updated products to localStorage for persistence
    localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
    localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
    console.log('💾 Edit modal: Updated products saved to localStorage with timestamp');
    
    // Dispatch custom event for cross-page synchronization
    window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
      detail: { countProducts: updatedProducts } 
    }));
    
    // Close the modal
    setIsEditModalOpen(false);
    setProductToEdit(null);
    
    // Force refresh to update the display
    setRefreshKey(prev => prev + 1);
    
    toast.success("Product updated successfully!");
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setProductToEdit(null);
  };

  // Handle quantity edit mode
  const handleUpdateQuantities = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingProductId(productId);
      setEditValues({
        quantity: product.quantity,
        receivedQuantity: product.receivedQuantity || 0,
        dispatchQuantity: product.dispatchQuantity || 0,
        sentQuantity: product.sentQuantity ?? product.quantity  // Use nullish coalescing for better null handling
      });
      toast.info("Edit mode activated. Update quantities and save changes.");
    }
  };

  const handleSaveQuantities = async (productId: number) => {
    console.log('🔄 handleSaveQuantities called for product ID:', productId);
    console.log('📋 Current editValues:', editValues);
    console.log('⚡ Current isSaving state:', isSaving);
    console.log('🎯 Current editingProductId:', editingProductId);
    
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
      
      // MINIMAL VALIDATION FOR TESTING
      if (editValues.quantity <= 0) {
        console.log('❌ Validation failed: quantity <= 0');
        toast.error("Quantity must be greater than 0.");
        throw new Error("Validation failed: quantity <= 0");
      }

      console.log('✅ Basic validation passed, proceeding with update');

      // Update the product in database
      const updateData = {
        quantity: editValues.quantity,  // Keep main quantity separate
        sentQuantity: editValues.sentQuantity,  // Sent to dye quantity
        sentToDye: editValues.sentQuantity > 0,  // Boolean flag
        receivedQuantity: editValues.receivedQuantity || 0,
        received: (editValues.receivedQuantity || 0) > 0,
        dispatchQuantity: editValues.dispatchQuantity || 0,
        dispatch: (editValues.dispatchQuantity || 0) > 0,
        dispatchDate: (editValues.dispatchQuantity || 0) > 0 ? 
          (products.find(p => p.id === productId)?.dispatchDate || new Date().toISOString().split('T')[0]) : ""
      };

      console.log('🔄 Updating product with data:', {
        ...updateData,
        debug: {
          originalQuantity: editValues.quantity,
          sentToDyeQuantity: editValues.sentQuantity,
          receivedQuantity: editValues.receivedQuantity,
          dispatchQuantity: editValues.dispatchQuantity
        }
      });

      await updateCountProduct(productId, updateData);
      console.log('✅ Product updated successfully via API');

      // Update local state
      const updatedProducts = products.map(product => 
        product.id === productId 
          ? { ...product, ...updateData }
          : product
      );
      setProducts(updatedProducts);
      console.log('✅ Local state updated successfully');

      // Save updated products to localStorage for persistence across refreshes
      localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
      localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
      console.log('💾 Updated products saved to localStorage with timestamp');

      // ENHANCED cross-page synchronization - dispatch multiple events for robust sync
      console.log('📡 Dispatching cross-page sync events...');
      
      // Primary sync event
      window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
        detail: { 
          countProducts: updatedProducts,
          updatedProductId: productId,
          updateData: updateData,
          timestamp: Date.now()
        } 
      }));
      
      // Secondary storage event for additional sync
      window.dispatchEvent(new CustomEvent('storage', {
        detail: {
          key: 'countProducts',
          newValue: JSON.stringify(updatedProducts),
          timestamp: Date.now()
        }
      }));
      
      console.log('📡 Cross-page sync events dispatched successfully');

      // Exit edit mode
      setEditingProductId(null);
      setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
      
      console.log('✅ Edit mode exited, form reset');
      toast.success("Quantities updated successfully and saved to database!");
    } catch (error) {
      console.error('❌ Failed to update count product:', error);
      
      // Recreate updateData for demo mode
      const updateData = {
        quantity: editValues.quantity,  // Keep main quantity separate
        sentQuantity: editValues.sentQuantity,  // Sent to dye quantity  
        sentToDye: editValues.sentQuantity > 0,  // Boolean flag
        receivedQuantity: editValues.receivedQuantity,
        received: editValues.receivedQuantity > 0,
        dispatchQuantity: editValues.dispatchQuantity,
        dispatch: editValues.dispatchQuantity > 0,
        dispatchDate: editValues.dispatchQuantity > 0 ? 
          (products.find(p => p.id === productId)?.dispatchDate || new Date().toISOString().split('T')[0]) : ""
      };
      
      // Check for demo mode scenarios
      if ((error instanceof Error && error.message.includes('ECONNREFUSED')) ||
          (error as any)?.response?.status >= 500) {
        console.log('🔧 API unavailable, using demo mode for quantity update');
        
        // Update local state in demo mode
        const updatedProducts = products.map(product => 
          product.id === productId 
            ? { ...product, ...updateData }
            : product
        );
        setProducts(updatedProducts);
        
        // Save to localStorage in demo mode
        localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
        localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
        console.log('💾 Demo mode: Updated products saved to localStorage with timestamp');

        // ENHANCED cross-page synchronization for demo mode
        console.log('📡 [Demo Mode] Dispatching cross-page sync events...');
        
        // Primary sync event
        window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
          detail: { 
            countProducts: updatedProducts,
            updatedProductId: productId,
            updateData: updateData,
            timestamp: Date.now(),
            demoMode: true
          } 
        }));
        
        // Secondary storage event for additional sync
        window.dispatchEvent(new CustomEvent('storage', {
          detail: {
            key: 'countProducts',
            newValue: JSON.stringify(updatedProducts),
            timestamp: Date.now(),
            demoMode: true
          }
        }));
        
        console.log('📡 [Demo Mode] Cross-page sync events dispatched successfully');

        // Exit edit mode
        setEditingProductId(null);
        setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
        
        toast.success("Quantities updated successfully! (Demo mode - database not connected)");
        console.log('✅ Demo mode update completed successfully');
      } else {
        toast.error(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
    setIsSaving(false); // Reset isSaving state when canceling
    toast.info("Edit cancelled. Changes discarded.");
  };

  const handleEditValueChange = (field: keyof typeof editValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditValues(prev => ({ ...prev, [field]: numValue }));
  };

  // Handle successful horizontal form submission with AGGRESSIVE persistence
  const handleHorizontalFormSuccess = async (created: CountProduct) => {
    console.log('🎯 [AGGRESSIVE] handleHorizontalFormSuccess called with:', created);
    
    // Update local products state and save to localStorage for persistence
    setProducts(prev => {
      const exists = prev.some(p => p.id === created.id);
      let updatedProducts;
      
      if (exists) {
        console.log('🔄 [AGGRESSIVE] Updating existing product');
        updatedProducts = prev.map(p => p.id === created.id ? created : p);
      } else {
        console.log('🆕 [AGGRESSIVE] Adding new product to list');
        updatedProducts = [created, ...prev];
      }
      
      // IMMEDIATE localStorage save with fresh timestamp
      const currentTimestamp = new Date().getTime().toString();
      localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
      localStorage.setItem('countProductsTimestamp', currentTimestamp);
      console.log(`💾 [AGGRESSIVE] IMMEDIATE save to localStorage: ${updatedProducts.length} products with timestamp ${currentTimestamp}`);
      
      // Double-check the save was successful
      const verifyData = localStorage.getItem('countProducts');
      if (verifyData) {
        try {
          const parsed = JSON.parse(verifyData);
          console.log(`✅ [AGGRESSIVE] Verified localStorage save: ${parsed.length} products stored successfully`);
        } catch (e) {
          console.error('❌ [AGGRESSIVE] localStorage save verification failed:', e);
        }
      }
      
      return updatedProducts;
    });

    // Ensure firm exists in the store and sync across pages
    if (created.dyeingFirm) {
      console.log('🏢 [CountProductOverview] Ensuring firm exists in store:', created.dyeingFirm);
      try {
        const ensuredFirm = await dyeingDataStore.ensureFirm(created.dyeingFirm);
        console.log('✅ [CountProductOverview] Firm ensured in store:', ensuredFirm);
        
        // Force refresh of firms to ensure immediate sync across all pages
        await dyeingDataStore.loadFirms(true);
        console.log('🔄 [CountProductOverview] Forced refresh of firms after creation - store subscription will update UI');
      } catch (error) {
        console.warn('⚠️ [CountProductOverview] Failed to ensure firm in store:', error);
      }
    }

    // Dispatch custom event for cross-page synchronization
    setProducts(currentProducts => {
      window.dispatchEvent(new CustomEvent('countProductsUpdated', { 
        detail: { countProducts: currentProducts } 
      }));
      return currentProducts;
    });

    setShowHorizontalForm(false);
    toast.success('Order added and synced to all pages!');
  };

  // Export handlers
  const handleExportCSV = () => {
    exportDataToCSV(filteredProducts, "CountProductOverview");
    toast.success("Data exported to CSV successfully!");
  };

  const handleExportPDF = () => {
    const html2pdf = (window as any).html2pdf;
    const element = document.getElementById("count-product-table");
    if (!element || !html2pdf) {
      toast.error("Export failed: PDF library not loaded.");
      return;
    }

    html2pdf()
      .set({
        margin: 0.5,
        filename: `CountProductOverview_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
      })
      .from(element)
      .save();

    toast.success("PDF exported successfully!");
  };

  // Cross-page handlers for DyeingRecord items (created in DyeingOrders page)
  const handleDyeingRecordEdit = (recordId: number) => {
    console.log('🖊️ [CountProductOverview] handleDyeingRecordEdit called for record:', recordId);
    console.log('🔍 Available dyeingRecords:', dyeingRecords);
    
    const record = dyeingRecords.find(r => r.id === recordId);
    if (record) {
      // Convert DyeingRecord to SimplifiedDyeingOrderData format
      const trackingInfo = parseTrackingInfo(record.remarks || '');
      
      // Format dates properly for HTML date inputs (YYYY-MM-DD format)
      const formatDateForInput = (dateValue: any) => {
        if (!dateValue) return '';
        
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return '';
          
          // Return in YYYY-MM-DD format required by HTML date inputs
          return date.toISOString().split('T')[0];
        } catch (error) {
          console.warn('Date formatting error:', error);
          return '';
        }
      };

      const formattedRecord = {
        id: record.id,
        quantity: trackingInfo.originalQuantity || record.quantity,
        customerName: record.customerName, // FIX: Use actual customer name, not party name!
        sentToDye: record.quantity,
        sentDate: formatDateForInput(record.sentDate),
        received: trackingInfo.received || 0,
        receivedDate: trackingInfo.receivedDate || '',
        dispatch: trackingInfo.dispatch || 0,
        dispatchDate: trackingInfo.dispatchDate || '',
        dyeingFirm: record.dyeingFirm,
        partyName: record.partyName,
        remarks: trackingInfo.originalRemarks || record.remarks || '',
        // Technical fields required by the form
        yarnType: record.yarnType,
        shade: record.shade,
        count: record.count,
        lot: record.lot,
        expectedArrivalDate: formatDateForInput(record.expectedArrivalDate),
      };
      
      console.log('🔄 Converted record for editing:', formattedRecord);
      setDyeingRecordToEdit(formattedRecord);
      setIsDyeingEditModalOpen(true);
      toast.info(`Opening edit form for dyeing record: ${record.partyName} - ${record.dyeingFirm}`);
    } else {
      toast.error('Dyeing record not found for editing');
    }
  };

  const handleDyeingRecordDelete = async (recordId: number) => {
    console.log('🗑️ [CountProductOverview] handleDyeingRecordDelete called for record:', recordId);
    console.log('🔍 Available dyeingRecords:', dyeingRecords);
    alert(`✅ DYEING RECORD DELETE WORKS! Record ID: ${recordId}`);
    
    const recordToDelete = dyeingRecords.find(r => r.id === recordId);
    if (!recordToDelete) {
      console.error('❌ Dyeing record not found for deletion');
      toast.error('Dyeing record not found. Please try again.');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete this dyeing record?\n\nCustomer: ${recordToDelete.partyName}\nDyeing Firm: ${recordToDelete.dyeingFirm}\nQuantity: ${recordToDelete.quantity} kg\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      console.log('❌ Delete cancelled by user');
      return;
    }

    try {
      console.log('✅ Delete confirmed by user, proceeding...', { recordToDelete });
      
      // Use the API to delete the record
      await deleteDyeingRecord(recordId);
      
      // Refresh data from store to update UI
      await dyeingDataStore.loadRecords(true);
      
      // Trigger force refresh of UI
      window.location.reload();
      
      toast.success(`Dyeing record deleted successfully: ${recordToDelete.partyName}`);
      
    } catch (error) {
      console.error('❌ Error deleting dyeing record:', error);
      toast.error('Failed to delete dyeing record. Please try again.');
    }
  };

  const handleDyeingRecordFollowUp = (recordId: number) => {
    console.log('📋 [CountProductOverview] handleDyeingRecordFollowUp called for record:', recordId);
    alert(`✅ DYEING RECORD FOLLOW-UP WORKS! Record ID: ${recordId}`);
    const record = dyeingRecords.find(r => r.id === recordId);
    if (record) {
      toast.info(`Follow Up Dyeing Record: ${record.partyName} - ${record.dyeingFirm} (Feature pending)`);
    }
  };

  const handleDyeingRecordUpdateQuantities = (recordId: number) => {
    console.log('📊 [CountProductOverview] handleDyeingRecordUpdateQuantities called for record:', recordId);
    const record = dyeingRecords.find(r => r.id === recordId);
    if (record) {
      // Parse tracking info to get correct current values
      const trackingInfo = parseTrackingInfo(record.remarks || '');
      
      // Set editing mode for this dyeing record (using negative ID to distinguish from count products)
      setEditingProductId(-recordId); // Use negative ID for dyeing records
      setEditValues({
        quantity: trackingInfo.originalQuantity || record.quantity || 0,
        receivedQuantity: trackingInfo.received || 0,
        dispatchQuantity: trackingInfo.dispatch || 0,
        sentQuantity: record.quantity || 0, // Sent quantity is the main quantity field
      });
      toast.info(`Update Quantities for Dyeing Record: ${record.partyName} - ${record.dyeingFirm}`);
    }
  };

  // Save dyeing record changes
  const handleSaveDyeingRecord = async (recordId: number) => {
    console.log('💾 [CountProductOverview] handleSaveDyeingRecord called for record:', recordId);
    console.log('📋 Current editValues:', editValues);
    
    try {
      setIsSaving(true);
      
      // Validate quantities
      if (editValues.quantity <= 0) {
        toast.error('Quantity must be greater than 0');
        return;
      }
      
      // Find the record to update
      const recordToUpdate = dyeingRecords.find(r => r.id === recordId);
      if (!recordToUpdate) {
        toast.error('Dyeing record not found');
        return;
      }
      
      // Parse existing tracking info to preserve dates and middleman info
      const existingTrackingInfo = parseTrackingInfo(recordToUpdate.remarks || '');
      
      // Build enhanced remarks preserving existing dates and middleman info
      const trackingInfo = [];
      
      // Add original quantity info if it's different from main quantity
      if (editValues.quantity && editValues.quantity !== editValues.sentQuantity) {
        trackingInfo.push(`OriginalQty: ${editValues.quantity}kg`);
      }
      
      // Preserve received info with existing date
      if (editValues.receivedQuantity >= 0) {
        const receivedInfo = `Received: ${editValues.receivedQuantity}kg${existingTrackingInfo.receivedDate ? ` on ${existingTrackingInfo.receivedDate}` : ''}`;
        trackingInfo.push(receivedInfo);
      }
      
      // Preserve dispatch info with existing date
      if (editValues.dispatchQuantity >= 0) {
        const dispatchInfo = `Dispatched: ${editValues.dispatchQuantity}kg${existingTrackingInfo.dispatchDate ? ` on ${existingTrackingInfo.dispatchDate}` : ''}`;
        trackingInfo.push(dispatchInfo);
      }
      
      // Preserve middleman/party information
      if (existingTrackingInfo.partyNameMiddleman && existingTrackingInfo.partyNameMiddleman !== "Direct Supply") {
        trackingInfo.push(`Middleman: ${existingTrackingInfo.partyNameMiddleman}`);
      }
      
      // Combine clean original remarks with preserved tracking info
      const cleanRemarks = existingTrackingInfo.originalRemarks || '';
      const enhancedRemarks = [cleanRemarks, ...trackingInfo].filter(Boolean).join(' | ');
      
      // Prepare updated data for API (using CreateDyeingRecordRequest format)
      const apiUpdateData = {
        yarnType: recordToUpdate.yarnType,
        sentDate: recordToUpdate.sentDate,
        expectedArrivalDate: recordToUpdate.expectedArrivalDate,
        partyName: recordToUpdate.partyName, // Preserve original party name
        dyeingFirm: recordToUpdate.dyeingFirm,
        quantity: editValues.quantity,
        shade: recordToUpdate.shade,
        count: recordToUpdate.count,
        lot: recordToUpdate.lot,
        isReprocessing: recordToUpdate.isReprocessing || false,
        // Use enhanced remarks that preserve all tracking info
        remarks: enhancedRemarks
      };
      
      console.log('📤 Updating dyeing record via API with data:', apiUpdateData);
      console.log('🔍 Original remarks:', recordToUpdate.remarks);
      console.log('🔍 Existing tracking info parsed:', existingTrackingInfo);
      console.log('🔍 Enhanced remarks being saved:', enhancedRemarks);
      console.log('🔍 Preserved receivedDate:', existingTrackingInfo.receivedDate);
      console.log('🔍 Preserved dispatchDate:', existingTrackingInfo.dispatchDate);
      console.log('🔍 Preserved partyNameMiddleman:', existingTrackingInfo.partyNameMiddleman);
      
      // Call API to update the record
      await updateDyeingRecord(recordId, apiUpdateData);
      
      // Refresh data from store to get updated information
      await dyeingDataStore.loadRecords(true);
      
      // Clear editing state
      setEditingProductId(null);
      setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
      
      toast.success(`Dyeing record updated successfully: ${recordToUpdate.partyName} - ${recordToUpdate.dyeingFirm}`);
      
    } catch (error) {
      console.error('❌ Error updating dyeing record:', error);
      toast.error('Failed to update dyeing record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate summary statistics (using real-time data from all products, not filtered)
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
  const totalFirms = centralizedDyeingFirms.filter(firm => firm.isActive).length;
  
  // Debug logging for real-time data
  console.log('📊 Real-time Summary Stats:');
  console.log('  - Total Products:', products.length);
  console.log('  - Total Quantity:', totalQuantity);
  console.log('  - Total Active Firms:', totalFirms);
  console.log('  - Centralized Firms:', centralizedDyeingFirms.length);
  console.log('  - Products data:', products.slice(0, 2)); // Show first 2 products for debugging

  useEffect(() => {
    if (firmFilter && !pageFirms.includes(firmFilter)) {
      setFirmFilter("");
    }
  }, [firmFilter, pageFirms]);

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Package className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading Count Products...</h3>
            <p className="text-gray-600 dark:text-gray-400">Fetching data from database</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <>
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Count Product Overview</h1>
                <p className="text-gray-600 dark:text-gray-400">Track and manage completed count products</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowHorizontalForm(!showHorizontalForm)}
                className={`flex items-center space-x-2 transition-all ${
                  showHorizontalForm 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
            <Plus className="w-4 h-4" />
            <span>{showHorizontalForm ? 'Cancel Add Order' : 'Add Order'}</span>
          </Button>
          <Button 
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
          <Button 
            onClick={handleExportPDF}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Export PDF</span>
          </Button>
          
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

      {/* Filters Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search by party, firm, yarn, shade, count, lot..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select 
          value={firmFilter} 
          onChange={(e) => setFirmFilter(e.target.value)} 
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Dyeing Firms</option>
          {pageFirms.map((firm) => (
            <option key={firm} value={firm}>{firm}</option>
          ))}
        </select>
  {/* Grade filter removed */}
        <select 
          value={partyFilter} 
          onChange={(e) => setPartyFilter(e.target.value)} 
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Parties</option>
          {uniqueParties.map((party) => (
            <option key={party} value={party}>{party}</option>
          ))}
        </select>
      </div>

      {/* Horizontal Add Order Form - Modal Overlay */}
      {showHorizontalForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking the backdrop
            if (e.target === e.currentTarget) {
              setShowHorizontalForm(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Dyeing Order</h2>
              <button
                onClick={() => setShowHorizontalForm(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <HorizontalAddOrderForm
                onSuccess={handleHorizontalFormSuccess}
                onCancel={() => setShowHorizontalForm(false)}
                existingFirms={pageFirms}
              />
            </div>
          </div>
        </div>
      )}

      {/* Grouped Content by Dyeing Firm */}
      <div className="space-y-6" key={refreshKey}>
        {completeFirmListing.map((firmInfo) => (
          <div key={firmInfo.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Firm Header - Collapsible */}
            <div
              onClick={() => setExpandedFirm((f) => (f === firmInfo.name ? null : firmInfo.name))}
              className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300">{firmInfo.name}</h2>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {firmInfo.products.length} products • {firmInfo.products.reduce((sum, p) => sum + p.quantity, 0)} kg total
                    {firmInfo.dyeingRecords.length > 0 && ` • ${firmInfo.dyeingRecords.length} dyeing orders`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {expandedFirm === firmInfo.name ? 'Collapse' : 'Expand'}
                </span>
                {expandedFirm === firmInfo.name ? 
                  <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : 
                  <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                }
              </div>
            </div>

            {/* Combined Products Table - Count Products + Dyeing Records with Color Coding */}
            {expandedFirm === firmInfo.name && (
              <div className="overflow-x-auto" id="count-product-table">
                {(firmInfo.products.length > 0 || firmInfo.dyeingRecords.length > 0) ? (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-3 py-3 text-center font-semibold w-12">
                          {isMultiDeleteMode && (
                            <input
                              type="checkbox"
                              checked={
                                (firmInfo.products.length + firmInfo.dyeingRecords.length) > 0 && 
                                selectedItems.size > 0 &&
                                selectedItems.size === (firmInfo.products.length + firmInfo.dyeingRecords.length)
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Select all items in current firm view
                                  const allItemIds = new Set<string>();
                                  firmInfo.products.forEach((product) => {
                                    allItemIds.add(`count-${product.id}`);
                                  });
                                  firmInfo.dyeingRecords.forEach((record) => {
                                    allItemIds.add(`dyeing-${record.id}`);
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
                        <th className="px-3 py-3 text-left font-semibold">Count</th>
                        <th className="px-3 py-3 text-left font-semibold">Sent to Dye</th>
                        <th className="px-3 py-3 text-left font-semibold">Sent Date</th>
                        <th className="px-3 py-3 text-left font-semibold">Received</th>
                        <th className="px-3 py-3 text-left font-semibold">Received Date</th>
                        <th className="px-3 py-3 text-left font-semibold">Dispatch</th>
                        <th className="px-3 py-3 text-left font-semibold">Dispatch Date</th>
                        <th className="px-3 py-3 text-left font-semibold">Party/Middleman</th>
                        <th className="px-3 py-3 text-left font-semibold w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                      {/* Count Products - Green Background/Text */}
                      {firmInfo.products.map((product) => {
                        const isCountProduct = true;
                        const itemId = `count-${product.id}`;
                        return (
                          <tr key={`count-${product.id}`} 
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isCountProduct ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
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
                              {editingProductId === product.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editValues.quantity}
                                    onChange={(e) => handleEditValueChange('quantity', e.target.value)}
                                    className="w-20 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    autoFocus
                                  />
                                  <span className="text-sm text-gray-500">kg</span>
                                </div>
                              ) : (
                                <>
                                  {formatQuantity(product.quantity)}
                                  {isCountProduct && <span className="ml-1 text-xs">(CP)</span>}
                                </>
                              )}
                            </td>
                            <td className="px-3 py-3 font-medium">{product.customerName}</td>
                            <td className="px-3 py-3 text-sm font-medium">{product.count || '-'}</td>
                            <td className="px-3 py-3">
                              {editingProductId === product.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editValues.sentQuantity}
                                    onChange={(e) => handleEditValueChange('sentQuantity', e.target.value)}
                                    className="w-20 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  />
                                  <span className="text-sm text-gray-500">kg</span>
                                </div>
                              ) : (
                                formatQuantity(product.sentQuantity ?? product.quantity)
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              {product.sentDate ? new Date(product.sentDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-3 py-3">
                              {editingProductId === product.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editValues.receivedQuantity}
                                    onChange={(e) => handleEditValueChange('receivedQuantity', e.target.value)}
                                    className="w-20 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  />
                                  <span className="text-sm text-gray-500">kg</span>
                                </div>
                              ) : (
                                formatQuantity(product.receivedQuantity)
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              {product.receivedDate ? new Date(product.receivedDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-3 py-3">
                              {editingProductId === product.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editValues.dispatchQuantity}
                                    onChange={(e) => handleEditValueChange('dispatchQuantity', e.target.value)}
                                    className="w-20 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  />
                                  <span className="text-sm text-gray-500">kg</span>
                                </div>
                              ) : (
                                formatQuantity(product.dispatchQuantity)
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              {product.dispatchDate ? new Date(product.dispatchDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-3 py-3">
                              <div className="space-y-1">
                                <div className="font-medium">{product.partyName}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">{product.middleman}</div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {editingProductId === product.id ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('🖱️ Save button clicked!', { 
                                        productId: product.id, 
                                        isSaving,
                                        editingProductId,
                                        editValues,
                                        disabled: isSaving
                                      });
                                      handleSaveQuantities(product.id);
                                    }}
                                    disabled={isSaving}
                                    className={`p-1.5 ${
                                      isSaving 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                                    } rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500`}
                                    title={isSaving ? "Saving..." : "Save Changes"}
                                    type="button"
                                  >
                                    {isSaving ? (
                                      <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                    title="Cancel Changes"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <FloatingActionDropdown
                                  onEdit={() => {
                                    console.log('🖊️ [CountProductOverview] Edit CountProduct clicked for product:', product.id);
                                    setProductToEdit(product);
                                    setIsEditModalOpen(true);
                                    toast.info("Opening edit form for the selected product.");
                                  }}
                                  onDelete={() => {
                                    console.log('🗑️ [CountProductOverview] Delete CountProduct clicked for product:', product.id);
                                    handleDelete(product.id);
                                  }}
                                  onFollowUp={() => {
                                    console.log('📋 [CountProductOverview] Follow-up CountProduct clicked for product:', product.id);
                                    setSelectedProduct(product);
                                    setIsFollowUpModalOpen(true);
                                  }}
                                  onUpdateQuantities={() => {
                                    console.log('📊 [CountProductOverview] Update Quantities CountProduct clicked for product:', product.id);
                                    handleUpdateQuantities(product.id);
                                  }}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Dyeing Records - Blue Text (no background) */}
                      {firmInfo.dyeingRecords.map(record => {
                        const simplifiedRecord = mapToSimplifiedDisplay(record);
                        const isCountProduct = false;
                        const isEditing = editingProductId === -record.id; // Negative ID for dyeing records
                        const itemId = `dyeing-${record.id}`;
                        
                        return (
                          <tr key={`dyeing-${record.id}`} 
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isCountProduct ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
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
                            <td className={`px-4 py-3 font-medium ${isCountProduct ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.quantity}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                  className="w-20 px-2 py-1 border rounded text-center"
                                  min="0"
                                  step="0.01"
                                />
                              ) : (
                                formatQty(simplifiedRecord.quantity)
                              )}
                            </td>
                            <td className="px-3 py-3 font-medium">
                              {simplifiedRecord.customerName || '-'}
                            </td>
                            <td className="px-3 py-3 text-sm font-medium">{record.count || '-'}</td>
                            <td className="px-3 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.sentQuantity}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, sentQuantity: parseFloat(e.target.value) || 0 }))}
                                  className="w-20 px-2 py-1 border rounded text-center"
                                  min="0"
                                  step="0.01"
                                />
                              ) : (
                                formatQty(simplifiedRecord.sentToDye)
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              {simplifiedRecord.sentDate ? new Date(simplifiedRecord.sentDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-3 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.receivedQuantity}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, receivedQuantity: parseFloat(e.target.value) || 0 }))}
                                  className="w-20 px-2 py-1 border rounded text-center"
                                  min="0"
                                  step="0.01"
                                />
                              ) : (
                                formatQty(simplifiedRecord.received)
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              {simplifiedRecord.receivedDate ? new Date(simplifiedRecord.receivedDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-3 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.dispatchQuantity}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, dispatchQuantity: parseFloat(e.target.value) || 0 }))}
                                  className="w-20 px-2 py-1 border rounded text-center"
                                  min="0"
                                  step="0.01"
                                />
                              ) : (
                                formatQty(simplifiedRecord.dispatch)
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              {simplifiedRecord.dispatchDate ? new Date(simplifiedRecord.dispatchDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-3 py-3">
                              <div className="space-y-1">
                                <div className="font-medium">{simplifiedRecord.partyNameMiddleman || '-'}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {simplifiedRecord.dyeingFirm}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isEditing ? (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleSaveDyeingRecord(record.id)}
                                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                    title="Save changes"
                                  >
                                    <FaCheck className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingProductId(null);
                                      setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
                                    }}
                                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                    title="Cancel editing"
                                  >
                                    <FaTimes className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <FloatingActionDropdown
                                onEdit={() => {
                                  console.log('🖊️ [DYEING RECORD ACTION] Edit clicked!');
                                  console.log('🔍 Record object:', record);
                                  console.log('🔍 Record ID:', record.id);
                                  handleDyeingRecordEdit(record.id);
                                }}
                                onDelete={() => {
                                  console.log('� [DYEING RECORD ACTION] Delete clicked!');
                                  console.log('🔍 Record object:', record);
                                  console.log('🔍 Record ID:', record.id);
                                  alert(`Delete DyeingRecord ID: ${record.id}`);
                                  handleDyeingRecordDelete(record.id);
                                }}
                                onFollowUp={() => {
                                  console.log('� [DYEING RECORD ACTION] Follow-up clicked!');
                                  console.log('🔍 Record object:', record);
                                  console.log('🔍 Record ID:', record.id);
                                  alert(`Follow-up DyeingRecord ID: ${record.id}`);
                                  handleDyeingRecordFollowUp(record.id);
                                }}
                                onUpdateQuantities={() => {
                                  console.log('📊 [DYEING RECORD ACTION] Update quantities clicked!');
                                  console.log('🔍 Record object:', record);
                                  console.log('🔍 Record ID:', record.id);
                                  handleDyeingRecordUpdateQuantities(record.id);
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
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No products or dyeing orders for this firm yet.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {completeFirmListing.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
          <p className="text-gray-600 dark:text-gray-400">Create your first count product or dyeing order to get started.</p>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && productToEdit && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleEditCancel();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Edit Product: {productToEdit.customerName}
              </h2>
              <button
                onClick={handleEditCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <HorizontalAddOrderForm
                editMode={true}
                productToEdit={productToEdit}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
                existingFirms={pageFirms}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dyeing Record Edit Modal */}
      {isDyeingEditModalOpen && dyeingRecordToEdit && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDyeingEditModalOpen(false);
              setDyeingRecordToEdit(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Edit Dyeing Record: {dyeingRecordToEdit.partyName}
              </h2>
              <button
                onClick={() => {
                  setIsDyeingEditModalOpen(false);
                  setDyeingRecordToEdit(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <SimplifiedDyeingOrderForm
                onCancel={() => {
                  setIsDyeingEditModalOpen(false);
                  setDyeingRecordToEdit(null);
                }}
                onSuccess={async () => {
                  // Refresh dyeing records
                  console.log('🔄 Dyeing record updated, refreshing data...');
                  await dyeingDataStore.loadRecords(true);
                  setIsDyeingEditModalOpen(false);
                  setDyeingRecordToEdit(null);
                  toast.success('Dyeing record updated successfully!');
                }}
                orderToEdit={dyeingRecordToEdit}
                existingFirms={pageFirms}
              />
            </div>
          </div>
        </div>
      )}

      {/* Count Product Follow-Up Modal */}
      <CountProductFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setSelectedProduct(null);
        }}
        countProduct={selectedProduct as any}
        onFollowUpAdded={() => {
          // Refresh any data if needed in the future
          // For now, the modal handles updating its own state
          toast.success("Follow-up added successfully! Note: If backend is not connected, this is a demo mode.");
        }}
      />
        </>
      )}
    </div>
  );
};

export default CountProductOverview;
