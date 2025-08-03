import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { ChevronDown, ChevronUp, Package, TrendingUp, Calendar, BarChart3, Plus, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { exportDataToCSV } from "../utils/exportUtils";
import FloatingActionDropdown from "../components/FloatingActionDropdown";
import CountProductFollowUpModal from "../components/CountProductFollowUpModal";
import { HorizontalAddOrderForm } from "../components/HorizontalAddOrderForm";
import { 
  getAllCountProducts, 
  createCountProduct, 
  updateCountProduct, 
  deleteCountProduct,
  CountProduct 
} from "../api/countProductApi";
import { getAllDyeingFirms, DyeingFirm } from "../api/dyeingFirmApi";

// Mock data for demonstration (fallback if API fails)
const mockCountProducts: CountProduct[] = [
  {
    id: 1,
    partyName: "ABC Textiles Ltd",
    dyeingFirm: "Rainbow Dyers",
    yarnType: "Cotton Combed",
    count: "30s",
    shade: "Navy Blue",
    quantity: 150,
    completedDate: "2025-01-15",
    qualityGrade: "A",
    remarks: "Excellent color fastness",
    lotNumber: "RD-2025-001",
    processedBy: "Team A",
    customerName: "Fashion Forward Ltd",
    sentToDye: true,
    sentDate: "2025-01-10",
    received: true,
    receivedDate: "2025-01-14",
    receivedQuantity: 148,
    dispatch: true,
    dispatchDate: "2025-01-16",
    dispatchQuantity: 145,
    middleman: "Global Yarn Traders"
  },
  {
    id: 2,
    partyName: "XYZ Fashion House",
    dyeingFirm: "Rainbow Dyers", 
    yarnType: "Cotton Carded",
    count: "20s",
    shade: "Crimson Red",
    quantity: 200,
    completedDate: "2025-01-14",
    qualityGrade: "A",
    remarks: "Perfect shade matching",
    lotNumber: "RD-2025-002",
    processedBy: "Team B",
    customerName: "Metro Garments",
    sentToDye: true,
    sentDate: "2025-01-08",
    received: true,
    receivedDate: "2025-01-13",
    receivedQuantity: 195,
    dispatch: false,
    dispatchDate: "",
    dispatchQuantity: 0,
    middleman: "Textile Hub Co"
  },
  {
    id: 3,
    partyName: "DEF Garments",
    dyeingFirm: "ColorTech Solutions",
    yarnType: "Polyester Blend",
    count: "40s",
    shade: "Forest Green",
    quantity: 120,
    completedDate: "2025-01-13",
    qualityGrade: "B",
    remarks: "Minor shade variation",
    lotNumber: "CT-2025-001",
    processedBy: "Team C",
    customerName: "Premium Fabrics Inc",
    sentToDye: true,
    sentDate: "2025-01-05",
    received: true,
    receivedDate: "2025-01-12",
    receivedQuantity: 118,
    dispatch: true,
    dispatchDate: "2025-01-15",
    dispatchQuantity: 115,
    middleman: "Quality Yarn Solutions"
  },
  {
    id: 4,
    partyName: "GHI Exports",
    dyeingFirm: "ColorTech Solutions",
    yarnType: "Cotton Combed",
    count: "32s",
    shade: "Sky Blue",
    quantity: 180,
    completedDate: "2025-01-12",
    qualityGrade: "A",
    remarks: "Outstanding quality",
    lotNumber: "CT-2025-002",
    processedBy: "Team A",
    customerName: "Artisan Crafts",
    sentToDye: true,
    sentDate: "2025-01-06",
    received: true,
    receivedDate: "2025-01-11",
    receivedQuantity: 175,
    dispatch: false,
    dispatchDate: "",
    dispatchQuantity: 0,
    middleman: "Direct Supply"
  },
  {
    id: 5,
    partyName: "JKL Industries",
    dyeingFirm: "Premium Dye Works",
    yarnType: "Viscose",
    count: "24s",
    shade: "Golden Yellow",
    quantity: 160,
    completedDate: "2025-01-11",
    qualityGrade: "A",
    remarks: "Vibrant color achieved",
    lotNumber: "PDW-2025-001",
    processedBy: "Team D",
    customerName: "Luxury Textiles",
    sentToDye: true,
    sentDate: "2025-01-03",
    received: true,
    receivedDate: "2025-01-10",
    receivedQuantity: 158,
    dispatch: true,
    dispatchDate: "2025-01-13",
    dispatchQuantity: 155,
    middleman: "Elite Brokers"
  },
  {
    id: 6,
    partyName: "MNO Fabrics",
    dyeingFirm: "Premium Dye Works",
    yarnType: "Cotton Combed",
    count: "28s",
    shade: "Deep Purple",
    quantity: 140,
    completedDate: "2025-01-10",
    qualityGrade: "B",
    remarks: "Good overall quality",
    lotNumber: "PDW-2025-002",
    processedBy: "Team B",
    customerName: "Designer Collections",
    sentToDye: true,
    sentDate: "2025-01-04",
    received: true,
    receivedDate: "2025-01-09",
    receivedQuantity: 138,
    dispatch: true,
    dispatchDate: "2025-01-12",
    dispatchQuantity: 135,
    middleman: "Fashion Bridge Ltd"
  }
];

const CountProductOverview: React.FC = () => {
  const [products, setProducts] = useState<CountProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [firmFilter, setFirmFilter] = useState<string>("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [partyFilter, setPartyFilter] = useState<string>("");
  const [showHorizontalForm, setShowHorizontalForm] = useState(false); // New state for horizontal form
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CountProduct | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<CountProduct | null>(null);
  
  // Centralized dyeing firms state
  const [centralizedDyeingFirms, setCentralizedDyeingFirms] = useState<DyeingFirm[]>([]);
  const [isLoadingFirms, setIsLoadingFirms] = useState(true);
  
  const [editValues, setEditValues] = useState<{
    quantity: number;
    receivedQuantity: number;
    dispatchQuantity: number;
    sentQuantity: number;
  }>({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });

  // Fetch count products from API
  const fetchCountProducts = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching count products from API...');
      
      // First, check localStorage for recent changes
      const savedProducts = localStorage.getItem('countProducts');
      const savedTimestamp = localStorage.getItem('countProductsTimestamp');
      const currentTime = new Date().getTime();
      
      // If we have local data that's less than 5 minutes old, prefer it
      if (savedProducts && savedTimestamp) {
        const timeDiff = currentTime - parseInt(savedTimestamp);
        const fiveMinutesInMs = 5 * 60 * 1000;
        
        if (timeDiff < fiveMinutesInMs) {
          try {
            const localData = JSON.parse(savedProducts);
            console.log(`📋 Using recent localStorage data (${Math.round(timeDiff/1000)}s old) with ${localData.length} products`);
            setProducts(localData);
            toast.success(`Loaded ${localData.length} count products from local cache`);
            return;
          } catch (parseError) {
            console.warn('Failed to parse saved products, will fetch from API:', parseError);
          }
        }
      }
      
      let data: CountProduct[] = [];
      try {
        data = await getAllCountProducts();
        console.log(`✅ Successfully fetched ${data.length} products from API`);
        
        // Save to localStorage as backup with timestamp
        localStorage.setItem('countProducts', JSON.stringify(data));
        localStorage.setItem('countProductsTimestamp', currentTime.toString());
        console.log('💾 Saved products to localStorage backup with timestamp');
      } catch (apiError) {
        console.warn('⚠️ API failed, trying localStorage backup:', apiError);
        
        // Try to get from localStorage backup (even if old)
        if (savedProducts) {
          try {
            data = JSON.parse(savedProducts);
            console.log(`📋 Loaded ${data.length} products from localStorage backup (API failed)`);
          } catch (parseError) {
            console.error('Failed to parse saved products:', parseError);
            data = [];
          }
        }
      }
      
      if (data.length > 0) {
        setProducts(data);
        toast.success(`Loaded ${data.length} count products`);
      } else {
        // Final fallback to demo data
        console.log('🔄 No products available, falling back to mock data');
        setProducts(mockCountProducts);
        localStorage.setItem('countProducts', JSON.stringify(mockCountProducts));
        localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
        toast.warning('Using demo data - no products found');
      }
    } catch (error) {
      console.error('❌ Critical error in fetchCountProducts:', error);
      // Last resort fallback
      setProducts(mockCountProducts);
      localStorage.setItem('countProducts', JSON.stringify(mockCountProducts));
      localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
      toast.error('Failed to load products - using demo data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch centralized dyeing firms from API
  const fetchCentralizedDyeingFirms = async () => {
    try {
      setIsLoadingFirms(true);
      console.log('🔄 Fetching centralized dyeing firms for Count Product Overview...');
      
      // Try to get from API first
      let firms: DyeingFirm[] = [];
      try {
        firms = await getAllDyeingFirms();
        console.log(`✅ Loaded ${firms.length} centralized dyeing firms from API:`, firms.map(f => f.name));
        
        // Save to localStorage as backup
        localStorage.setItem('dyeingFirms', JSON.stringify(firms));
      } catch (apiError) {
        console.warn('⚠️ API failed, trying localStorage backup:', apiError);
        
        // Try to get from localStorage backup
        const savedFirms = localStorage.getItem('dyeingFirms');
        if (savedFirms) {
          try {
            firms = JSON.parse(savedFirms);
            console.log(`📋 Loaded ${firms.length} firms from localStorage backup`);
          } catch (parseError) {
            console.error('Failed to parse saved firms:', parseError);
            firms = [];
          }
        }
        
        // If no saved firms, extract from products as last resort
        if (firms.length === 0) {
          firms = Array.from(new Set(products.map((p) => p.dyeingFirm)))
            .map((name, index) => ({
              id: -(index + 1),
              name,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
          console.log(`🔧 Created ${firms.length} fallback firms from products`);
        }
      }
      
      // Sort firms alphabetically for consistent display
      const sortedFirms = firms.sort((a, b) => a.name.localeCompare(b.name));
      
      setCentralizedDyeingFirms(sortedFirms);
      console.log('📋 Final firms list:', sortedFirms.map(f => f.name));
      
    } catch (error) {
      console.error('❌ Critical error in fetchCentralizedDyeingFirms:', error);
      // Last resort fallback
      setCentralizedDyeingFirms([
        { id: 1, name: "Rainbow Dyers", isActive: true, createdAt: "", updatedAt: "" },
        { id: 2, name: "ColorTech Solutions", isActive: true, createdAt: "", updatedAt: "" },
        { id: 3, name: "Premium Dye Works", isActive: true, createdAt: "", updatedAt: "" }
      ]);
    } finally {
      setIsLoadingFirms(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCountProducts();
    fetchCentralizedDyeingFirms();
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showHorizontalForm) {
          setShowHorizontalForm(false);
        } else if (isEditModalOpen) {
          handleEditCancel();
        }
      }
    };

    if (showHorizontalForm || isEditModalOpen) {
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
  }, [showHorizontalForm, isEditModalOpen]);

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
    const matchesGrade = gradeFilter ? product.qualityGrade === gradeFilter : true;
    const matchesParty = partyFilter ? product.partyName === partyFilter : true;

    return matchesSearch && matchesFirm && matchesGrade && matchesParty;
  });

  // Get unique values for filters
  // Use centralized dyeing firms instead of extracting from products
  const uniqueFirms = centralizedDyeingFirms.map(firm => firm.name);
  const uniqueGrades = Array.from(new Set(products.map((p) => p.qualityGrade)));
  const uniqueParties = Array.from(new Set(products.map((p) => p.partyName)));

  // Group products by dyeing firm
  const groupedByFirm = filteredProducts.reduce((acc, product) => {
    if (!acc[product.dyeingFirm]) acc[product.dyeingFirm] = [];
    acc[product.dyeingFirm].push(product);
    return acc;
  }, {} as Record<string, CountProduct[]>);

  // Create complete firm listing excluding firms with no products
  const completeFirmListing = centralizedDyeingFirms
    .map(firm => ({
      name: firm.name,
      products: groupedByFirm[firm.name] || [], // Empty array if no products
      id: firm.id
    }))
    .filter(firm => firm.products.length > 0) // Only include firms with products
    .sort((a, b) => a.name.localeCompare(b.name));

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
        
        toast.success('Count product deleted successfully! (Demo mode - database not connected)');
        console.log('✅ Demo mode delete completed successfully');
      } else {
        toast.error(`Failed to delete count product: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    // Close the modal
    setIsEditModalOpen(false);
    setProductToEdit(null);
    
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
        sentQuantity: product.quantity
      });
      toast.info("Edit mode activated. Update quantities and save changes.");
    }
  };

  const handleSaveQuantities = async (productId: number) => {
    console.log('🔄 handleSaveQuantities called for product ID:', productId);
    console.log('📋 Current editValues:', editValues);
    
    try {
      // Validate inputs - allow zero values for received/dispatch quantities
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

      if (editValues.receivedQuantity > editValues.sentQuantity) {
        console.log('❌ Validation failed: received > sent');
        toast.error("Received quantity cannot exceed sent quantity.");
        return;
      }

      if (editValues.dispatchQuantity > editValues.receivedQuantity) {
        console.log('❌ Validation failed: dispatch > received');
        toast.error("Dispatch quantity cannot exceed received quantity.");
        return;
      }

      console.log('✅ All validations passed, proceeding with update');

      // Update the product in database
      const updateData = {
        quantity: editValues.sentQuantity,  // The sent quantity becomes the main quantity
        receivedQuantity: editValues.receivedQuantity,
        received: editValues.receivedQuantity > 0,
        dispatchQuantity: editValues.dispatchQuantity,
        dispatch: editValues.dispatchQuantity > 0,
        dispatchDate: editValues.dispatchQuantity > 0 ? 
          (products.find(p => p.id === productId)?.dispatchDate || new Date().toISOString().split('T')[0]) : ""
      };

      console.log('🔄 Updating product with data:', updateData);
      console.log('📋 Current editValues:', editValues);

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

      // Exit edit mode
      setEditingProductId(null);
      setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
      
      console.log('✅ Edit mode exited, form reset');
      toast.success("Quantities updated successfully and saved to database!");
    } catch (error) {
      console.error('❌ Failed to update count product:', error);
      
      // Recreate updateData for demo mode
      const updateData = {
        quantity: editValues.sentQuantity,  // The sent quantity becomes the main quantity
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

        // Exit edit mode
        setEditingProductId(null);
        setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
        
        toast.success("Quantities updated successfully! (Demo mode - database not connected)");
        console.log('✅ Demo mode update completed successfully');
      } else {
        toast.error(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
    toast.info("Edit cancelled. Changes discarded.");
  };

  const handleEditValueChange = (field: keyof typeof editValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditValues(prev => ({ ...prev, [field]: numValue }));
  };

  // Handle successful horizontal form submission
  const handleHorizontalFormSuccess = async (newCountProduct: CountProduct) => {
    console.log('🎯 Handling horizontal form success:', newCountProduct);
    try {
      // First, add to local state immediately for instant UI feedback
      console.log('📝 Adding product to local state immediately');
      setProducts(prevProducts => {
        const updatedProducts = [...prevProducts, newCountProduct];
        console.log(`✅ Local state updated, now has ${updatedProducts.length} products`);
        
        // Save to localStorage immediately for persistence across refreshes
        localStorage.setItem('countProducts', JSON.stringify(updatedProducts));
        localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
        console.log('💾 Saved updated products to localStorage for persistence with timestamp');
        
        return updatedProducts;
      });
      
      // Show success message immediately
      toast.success("Dyeing order added successfully!");
      
      // Close horizontal form
      setShowHorizontalForm(false);
      
      // Expand the firm section to show the new order
      setExpandedFirm(newCountProduct.dyeingFirm);
      
      // Ensure the new firm is added to centralized state immediately
      setCentralizedDyeingFirms(prevFirms => {
        const firmExists = prevFirms.some(f => f.name.toLowerCase() === newCountProduct.dyeingFirm.toLowerCase());
        if (!firmExists) {
          const newFirm: DyeingFirm = {
            id: Date.now(),
            name: newCountProduct.dyeingFirm,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          console.log('📋 Adding new firm to centralized state:', newFirm);
          const updatedFirms = [...prevFirms, newFirm].sort((a, b) => a.name.localeCompare(b.name));
          
          // Save to localStorage immediately for persistence across refreshes
          localStorage.setItem('dyeingFirms', JSON.stringify(updatedFirms));
          console.log('💾 Saved updated firms to localStorage for persistence');
          
          return updatedFirms;
        } else {
          // Even if firm exists, update localStorage to ensure persistence
          const sortedFirms = [...prevFirms].sort((a, b) => a.name.localeCompare(b.name));
          localStorage.setItem('dyeingFirms', JSON.stringify(sortedFirms));
        }
        return prevFirms;
      });
      
      // Force refresh centralized dyeing firms from API to sync with backend
      console.log('🔄 Attempting to sync with backend...');
      try {
        await fetchCentralizedDyeingFirms();
        console.log('✅ Backend firms sync completed successfully');
      } catch (syncError) {
        console.warn('⚠️ Backend firms sync failed, but localStorage persistence is active:', syncError);
      }
      
      // Try to refresh products from server (but don't overwrite if it fails)
      console.log('🔄 Attempting to refresh products from server...');
      try {
        await fetchCountProducts();
        console.log('✅ Server products refreshed successfully');
      } catch (refreshError) {
        console.warn('⚠️ Server products refresh failed, keeping local data:', refreshError);
      }
      
    } catch (error) {
      console.error('❌ Error in success handler:', error);
      toast.error('There was an issue processing the success. Please refresh the page.');
    }
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

  // Force refresh from server
  const handleForceRefresh = async () => {
    console.log('🔄 Force refresh requested - clearing localStorage and fetching from API');
    
    // Clear localStorage to force API fetch
    localStorage.removeItem('countProducts');
    localStorage.removeItem('countProductsTimestamp');
    
    // Force fetch from API
    setIsLoading(true);
    try {
      const data = await getAllCountProducts();
      console.log(`✅ Force refresh: Successfully fetched ${data.length} products from API`);
      
      setProducts(data);
      
      // Save fresh API data to localStorage
      localStorage.setItem('countProducts', JSON.stringify(data));
      localStorage.setItem('countProductsTimestamp', new Date().getTime().toString());
      
      toast.success(`Refreshed from server: ${data.length} products loaded`);
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      toast.error('Failed to refresh from server. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary statistics
  const totalQuantity = filteredProducts.reduce((sum, product) => sum + product.quantity, 0);
  const gradeACounts = filteredProducts.filter(p => p.qualityGrade === 'A').length;
  const totalFirms = uniqueFirms.length;

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
          {/* Debug Info Panel (temporary for debugging) */}
          {import.meta.env.DEV && (
            <div className="mb-4 p-4 bg-gray-100 rounded-lg border">
              <h3 className="text-sm font-bold mb-2">🔧 Debug Info:</h3>
              <div className="text-xs space-y-1">
                <div>📋 Centralized Firms ({centralizedDyeingFirms.length}): {centralizedDyeingFirms.map(f => f.name).join(', ')}</div>
                <div>💾 LocalStorage Firms: {(() => {
                  try {
                    const saved = localStorage.getItem('dyeingFirms');
                    if (saved) {
                      const firms = JSON.parse(saved);
                      return `(${firms.length}) ${firms.map((f: any) => f.name).join(', ')}`;
                    }
                    return 'None';
                  } catch {
                    return 'Error parsing';
                  }
                })()}</div>
                <div>� Current Products ({products.length}): {products.slice(0, 3).map(p => `${p.customerName}-${p.dyeingFirm}`).join(', ')}{products.length > 3 ? '...' : ''}</div>
                <div>💾 LocalStorage Products: {(() => {
                  try {
                    const saved = localStorage.getItem('countProducts');
                    if (saved) {
                      const prods = JSON.parse(saved);
                      return `(${prods.length}) items saved`;
                    }
                    return 'None';
                  } catch {
                    return 'Error parsing';
                  }
                })()}</div>
                <div>�🔄 Loading Firms: {isLoadingFirms ? 'Yes' : 'No'}</div>
                <div>� Loading Products: {isLoading ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}
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
          <Button 
            onClick={handleForceRefresh}
            variant="outline"
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredProducts.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white truncate" title={`${totalQuantity} kg`}>{totalQuantity} kg</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500 flex-shrink-0" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Grade A Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{gradeACounts}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Firms</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalFirms}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
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
          {uniqueFirms.map((firm) => (
            <option key={firm} value={firm}>{firm}</option>
          ))}
        </select>
        <select 
          value={gradeFilter} 
          onChange={(e) => setGradeFilter(e.target.value)} 
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Quality Grades</option>
          {uniqueGrades.map((grade) => (
            <option key={grade} value={grade}>Grade {grade}</option>
          ))}
        </select>
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
              />
            </div>
          </div>
        </div>
      )}

      {/* Grouped Content by Dyeing Firm */}
      <div className="space-y-6">
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

            {/* Products Table - Expandable */}
            {expandedFirm === firmInfo.name && (
              <div className="overflow-x-auto" id="count-product-table">
                {firmInfo.products.length > 0 ? (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Quantity</th>
                        <th className="px-4 py-3 text-left font-semibold">Customer Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Sent to Dye</th>
                        <th className="px-4 py-3 text-left font-semibold">Sent Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Received</th>
                        <th className="px-4 py-3 text-left font-semibold">Received Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Dispatch</th>
                        <th className="px-4 py-3 text-left font-semibold">Dispatch Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Party Name / Middleman</th>
                        <th className="px-4 py-3 text-left font-semibold w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                      {firmInfo.products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
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
                            formatQuantity(product.quantity)
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{product.customerName}</td>
                        <td className="px-4 py-3">
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
                            formatQuantity(product.quantity)
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {product.sentDate ? new Date(product.sentDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3 text-sm">
                          {product.receivedDate ? new Date(product.receivedDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3 text-sm">
                          {product.dispatchDate ? new Date(product.dispatchDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 dark:text-white">{product.partyName}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{product.middleman}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingProductId === product.id ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleSaveQuantities(product.id)}
                                className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                                title="Save Changes"
                              >
                                <Check className="w-4 h-4" />
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
                              onEdit={() => handleEdit(product.id)}
                              onDelete={() => handleDelete(product.id)}
                              onFollowUp={() => handleFollowUp(product.id)}
                              onUpdateQuantities={() => handleUpdateQuantities(product.id)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                ) : (
                  <div className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No products yet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      This dyeing firm exists but has no products assigned yet.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                      Use the horizontal form above to add products to this firm.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search criteria or filters.</p>
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
