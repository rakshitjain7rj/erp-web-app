import React, { useEffect, useState } from "react";
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from "../api/inventoryApi";
import { InventoryItem } from "../types/inventory";
import toast from "react-hot-toast";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ITEMS_PER_PAGE = 10;
const LOW_STOCK_THRESHOLD_KG = 20;

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [yarnFilter, setYarnFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Edit/Delete states
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newItem, setNewItem] = useState({
    // Basic Product Information
    productName: "",
    rawMaterial: "",
    category: "",
    
    // Quantity & Production
    initialQuantity: "",
    currentQuantity: "",
    effectiveYarn: "",
    count: "",
    gsm: "",
    
    // Costing
    costPerKg: "",
    totalValue: "",
    
    // Location & Storage
    warehouseLocation: "",
    batchNumber: "",
    supplierName: "",
    
    // Manual Override Flags
    manualQuantity: false,
    manualValue: false,
    manualYarn: false,
    
    // Additional
    remarks: "",
  });

  // Helper function to get clean/empty form state
  const getEmptyFormState = () => ({
    productName: "",
    rawMaterial: "",
    category: "",
    initialQuantity: "",
    currentQuantity: "",
    effectiveYarn: "",
    count: "",
    gsm: "",
    costPerKg: "",
    totalValue: "",
    warehouseLocation: "",
    batchNumber: "",
    supplierName: "",
    manualQuantity: false,
    manualValue: false,
    manualYarn: false,
    remarks: "",
  });

  // Reset form to empty state
  const resetForm = () => {
    console.log('🧹 Resetting form to empty state');
    setNewItem(getEmptyFormState());
    setEditingItem(null);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Reset form when modal is opened for new item (not editing)
  useEffect(() => {
    if (showModal && !editingItem) {
      console.log('🔄 Modal opened for new item - resetting form');
      resetForm();
    }
  }, [showModal, editingItem]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching inventory items...');
      const data = await getInventory();
      console.log('✅ Inventory data received:', data);
      console.log('📊 Number of items:', data.length);
      
      if (data.length > 0) {
        console.log('🔍 First item:', data[0]);
        console.log('🔍 Last item:', data[data.length - 1]);
      }
      
      setItems(data);
      console.log('✅ Items state updated');
    } catch (error: any) {
      console.error('❌ Error fetching inventory:', error);
      
      // Professional error handling with specific messages
      let errorMessage = "❌ Failed to load inventory";
      let errorDetails = "";
      
      if (error.message.includes('Server Error')) {
        errorMessage = "❌ Server Database Error";
        errorDetails = "There's an issue with the database. Please contact support.";
      } else if (error.message.includes('connect')) {
        errorMessage = "❌ Connection Failed";
        errorDetails = "Cannot reach the server. Please check your connection.";
      } else if (error.message.includes('Network')) {
        errorMessage = "❌ Network Error";
        errorDetails = "Please check your internet connection and try again.";
      } else {
        errorDetails = error.message;
      }
      
      toast.error(`${errorMessage}\n${errorDetails}`, {
        duration: 6000,
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px'
        }
      });
      
      // Set empty array to show empty state
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewItem({ ...newItem, [name]: checked });
    } else {
      // Handle character limit for remarks field
      if (name === 'remarks' && value.length > 500) {
        return; // Don't update if exceeds character limit
      }
      setNewItem({ ...newItem, [name]: value });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    console.log('✏️ Editing inventory item:', item.id, item.productName);
    setEditingItem(item);
    setNewItem({
      productName: item.productName || "",
      rawMaterial: item.rawMaterial || "",
      category: item.category || "",
      initialQuantity: item.initialQuantity?.toString() || "",
      currentQuantity: item.currentQuantity?.toString() || "",
      effectiveYarn: item.effectiveYarn?.toString() || "",
      count: item.count?.toString() || "",
      gsm: item.gsm?.toString() || "",
      costPerKg: item.costPerKg?.toString() || "",
      totalValue: item.totalValue?.toString() || "",
      warehouseLocation: item.warehouseLocation || "",
      batchNumber: item.batchNumber || "",
      supplierName: item.supplierName || "",
      manualQuantity: item.manualQuantity || false,
      manualValue: item.manualValue || false,
      manualYarn: item.manualYarn || false,
      remarks: item.remarks || "",
    });
    setShowModal(true);
  };

  const handleDelete = (item: InventoryItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await deleteInventoryItem(itemToDelete.id);
      toast.success("✅ Inventory item deleted successfully");
      setShowDeleteModal(false);
      setItemToDelete(null);
      await fetchItems(); // Refresh the list
    } catch (error: any) {
      console.error("❌ Error deleting inventory item:", error);
      toast.error(`❌ Failed to delete inventory item: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddInventory = async () => {
    const { productName, rawMaterial, initialQuantity, effectiveYarn, count } = newItem;
    
    console.log('🔍 Form values:', {
      productName,
      rawMaterial,
      initialQuantity,
      effectiveYarn,
      count,
      editingItem: editingItem ? `ID: ${editingItem.id}` : 'New item'
    });
    
    if (!productName || !rawMaterial || !initialQuantity || !effectiveYarn || !count) {
      toast.error("Please fill all required fields marked with *");
      return;
    }
    
    const payloadToSend = {
      // Basic fields (required)
      productName,
      rawMaterial,
      effectiveYarn: parseFloat(effectiveYarn) || 0,
      count: parseFloat(count) || 0,
      initialQuantity: parseFloat(initialQuantity) || 0,
      
      // Optional fields
      category: newItem.category || "Unspecified",
      costPerKg: parseFloat(newItem.costPerKg) || 0,
      currentQuantity: parseFloat(newItem.currentQuantity) || parseFloat(initialQuantity) || 0,
      gsm: parseFloat(newItem.gsm) || 0,
      totalValue: parseFloat(newItem.totalValue) || (parseFloat(newItem.costPerKg) * parseFloat(initialQuantity)) || 0,
      
      // Location & Storage
      warehouseLocation: newItem.warehouseLocation || "Main Warehouse",
      batchNumber: newItem.batchNumber || "",
      supplierName: newItem.supplierName || "",
      
      // Manual Override Flags
      manualQuantity: newItem.manualQuantity,
      manualValue: newItem.manualValue,
      manualYarn: newItem.manualYarn,
      
      // Additional
      remarks: newItem.remarks || "",
      
      // Default values for compatibility
      unitsProduced: editingItem?.unitsProduced || 0,
      location: newItem.warehouseLocation || "Main Warehouse",
      status: editingItem?.status || "Available",
    };
    
    console.log('🔍 Payload being sent to API:', JSON.stringify(payloadToSend, null, 2));
    
    setIsCreating(true);
    try {
      let result;
      if (editingItem) {
        console.log(`🔄 Updating inventory item with ID: ${editingItem.id}`);
        result = await updateInventoryItem(editingItem.id, payloadToSend);
        console.log('✅ Update API Success response:', result);
        toast.success("✅ Inventory item updated successfully");
      } else {
        console.log('🚀 Creating new inventory item...');
        result = await createInventoryItem(payloadToSend);
        console.log('✅ Create API Success response:', result);
        toast.success("✅ Inventory item added successfully");
      }
      
      // Close modal first (immediate user feedback)
      setShowModal(false);
      
      // Clear form and editing state
      console.log('🧹 Clearing form after successful operation');
      resetForm();
      
      // IMPORTANT: Refresh the inventory list to show changes
      console.log('🔄 Refreshing inventory list after successful operation...');
      await fetchItems();
      console.log('✅ Inventory list refreshed successfully');
      
      // Reset pagination to first page to see the changes
      setCurrentPage(1);
      
    } catch (error: any) {
      console.error("❌ Error with inventory operation:", error);
      console.error("❌ Error response data:", error.response?.data);
      console.error("❌ Error response status:", error.response?.status);
      
      // Enhanced error handling with specific messages for different scenarios
      let errorMessage = "❌ Operation failed";
      
      if (error.message.includes("not found")) {
        errorMessage = "❌ Item not found - may have been deleted by another user";
      } else if (error.message.includes("Invalid data")) {
        errorMessage = `❌ Invalid data: ${error.message.replace("Invalid data: ", "")}`;
      } else if (error.message.includes("Server Error")) {
        errorMessage = `❌ Server error: ${error.message.replace("Server Error: ", "")}`;
      } else if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        const missingFields = errorData?.missing;
        
        if (missingFields) {
          console.error("❌ Missing fields:", missingFields);
          const missingFieldsList = Object.keys(missingFields).filter(key => missingFields[key]).join(', ');
          errorMessage = `❌ Missing required fields: ${missingFieldsList}`;
        } else {
          const serverMessage = errorData?.message || error.response.statusText;
          errorMessage = `❌ ${editingItem ? 'Update' : 'Create'} failed: ${serverMessage}`;
        }
      } else if (error.request) {
        // Request made but no response received
        errorMessage = "❌ Network error: Unable to connect to server";
      } else {
        // Something else happened
        errorMessage = `❌ ${editingItem ? 'Update' : 'Create'} error: ${error.message}`;
      }
      
      // Show error toast with enhanced styling
      toast.error(errorMessage, {
        duration: 6000,
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px',
          maxWidth: '500px'
        }
      });
      
      // Don't close modal on error - let user try again
    } finally {
      setIsCreating(false);
    }
  };

  const filteredItems = items
    .filter(item =>
      [item.productName, item.rawMaterial, item.status].some(field =>
        field.toLowerCase().includes(search.toLowerCase())
      )
    )
    .filter(item =>
      categoryFilter ? item.category?.toLowerCase() === categoryFilter.toLowerCase() : true
    )
    .filter(item =>
      yarnFilter ? item.rawMaterial?.toLowerCase() === yarnFilter.toLowerCase() : true
    )
    .filter(item =>
      dateFilter ? item.createdAt?.slice(0, 10) === dateFilter : true
    );

  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const getStatusBadge = (status: string) => {
    const base = "px-2 py-1 text-xs rounded-full font-semibold";
    switch (status) {
      case "Available":
        return <span className={`${base} bg-green-100 text-green-700`}>Available</span>;
      case "Reserved":
        return <span className={`${base} bg-yellow-100 text-yellow-700`}>Reserved</span>;
      case "Out of Stock":
        return <span className={`${base} bg-red-100 text-red-700`}>Out of Stock</span>;
      default:
        return <span className={`${base} bg-gray-200 text-gray-700`}>{status}</span>;
    }
  };

  const exportToCSV = () => {
    const csvData = filteredItems.map(item => {
      const consumed = item.unitsProduced * item.effectiveYarn * item.count / 1000;
      const left = item.initialQuantity - consumed;
      const perUnitYarn = item.effectiveYarn * item.count;
      const estimatedCapacity = perUnitYarn > 0 ? (left * 1000) / perUnitYarn : 0;
      const cost = consumed * (item.costPerKg || 0);
      return {
        Product: item.productName,
        Material: item.rawMaterial,
        "Effective Yarn (m)": item.effectiveYarn,
        "Count (g/m)": item.count,
        "Per Unit Yarn (g)": perUnitYarn.toFixed(2),
        "Yarn Consumed (kg)": consumed.toFixed(2),
        "Yarn Left (kg)": left.toFixed(2),
        "Est. Capacity": Math.floor(estimatedCapacity),
        "Cost (₹)": cost.toFixed(2),
        Status: item.status,
      };
    });
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inventory_report.csv";
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableData = filteredItems.map(item => {
      const consumed = item.unitsProduced * item.effectiveYarn * item.count / 1000;
      const left = item.initialQuantity - consumed;
      const perUnitYarn = item.effectiveYarn * item.count;
      const estimatedCapacity = perUnitYarn > 0 ? (left * 1000) / perUnitYarn : 0;
      const cost = consumed * (item.costPerKg || 0);
      return [
        item.productName,
        item.rawMaterial,
        item.effectiveYarn,
        item.count,
        perUnitYarn.toFixed(2),
        consumed.toFixed(2),
        left.toFixed(2),
        Math.floor(estimatedCapacity),
        `₹${cost.toFixed(2)}`,
        item.status,
      ];
    });
    autoTable(doc, {
      head: [["Product", "Material", "Yarn (m)", "Count", "Yarn/Product (g)", "Used (kg)", "Left (kg)", "Est. Capacity", "Cost", "Status"]],
      body: tableData,
      styles: { fontSize: 8 },
      theme: "striped",
    });
    doc.save("inventory_report.pdf");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-4 py-6 text-black dark:text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-3xl font-bold text-blue-700 dark:text-white text-center sm:text-left">Inventory Dashboard</h2>
        <div className="flex gap-2 justify-center sm:justify-end">
          <button 
            onClick={() => {
              console.log('➕ Opening new inventory modal');
              resetForm(); // Ensure clean form
              setShowModal(true);
            }} 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm"
          >
            ➕ Add Inventory
          </button>
          <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm">📥 CSV</button>
          <button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm">🧾 PDF</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <input type="text" placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full border px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full border px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white">
          <option value="">All Categories</option>
          {[...new Set(items.map(i => i.category || ""))].map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={yarnFilter} onChange={e => setYarnFilter(e.target.value)} className="w-full border px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white">
          <option value="">All Yarn Types</option>
          {[...new Set(items.map(i => i.rawMaterial || ""))].map(mat => <option key={mat} value={mat}>{mat}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full border px-4 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
          <div className="text-2xl font-bold text-blue-600">{items.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Available Items</div>
          <div className="text-2xl font-bold text-green-600">
            {items.filter(item => item.status === "Available").length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
          <div className="text-2xl font-bold text-purple-600">
            {new Set(items.map(item => item.category).filter(Boolean)).size}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Low Stock Alert</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredItems.filter(item => {
              const consumed = item.unitsProduced * item.effectiveYarn * item.count / 1000;
              const left = item.initialQuantity - consumed;
              return left < LOW_STOCK_THRESHOLD_KG;
            }).length}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600 dark:text-gray-400">Loading inventory...</div>
          </div>
        </div>
      ) : (
        <>
          {/* Inventory Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Products in Inventory ({filteredItems.length} items)
              </h3>
            </div>
            
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  {items.length === 0 ? "📦" : "🔍📦"}
                </div>
                <div className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {items.length === 0 
                    ? "No inventory data available" 
                    : "No inventory items found"
                  }
                </div>
                <div className="text-gray-500 dark:text-gray-500 mb-4">
                  {items.length === 0 
                    ? "There might be a connection issue or no data in the database" 
                    : "Try adjusting your search filters"
                  }
                </div>
                <div className="flex justify-center gap-3">
                  {items.length === 0 && (
                    <>
                      <button 
                        onClick={fetchItems}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                      >
                        🔄 Retry Connection
                      </button>
                      <button 
                        onClick={() => {
                          console.log('➕ Opening first inventory item modal');
                          resetForm();
                          setShowModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                      >
                        ➕ Add First Item
                      </button>
                    </>
                  )}
                  {items.length > 0 && (
                    <button 
                      onClick={() => {
                        console.log('➕ Opening new inventory item modal');
                        resetForm();
                        setShowModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                    >
                      ➕ Add New Item
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Product Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Specifications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Inventory Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cost & Capacity
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedItems.map((item) => {
                      const consumed = item.unitsProduced * item.effectiveYarn * item.count / 1000;
                      const left = item.initialQuantity - consumed;
                      const perUnitYarn = item.effectiveYarn * item.count;
                      const estimatedCapacity = perUnitYarn > 0 ? (left * 1000) / perUnitYarn : 0;
                      const cost = consumed * (item.costPerKg || 0);
                      const usagePercent = Math.min((consumed / item.initialQuantity) * 100, 100);
                      const isLowStock = left < LOW_STOCK_THRESHOLD_KG;
                      const isExpanded = expandedRows.has(item.id);

                      return (
                        <React.Fragment key={item.id}>
                          <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${isLowStock ? "bg-red-50 dark:bg-red-900/20" : ""}`}>
                            {/* Product Details */}
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-full">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.productName}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Material: {item.rawMaterial}
                                  </div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500">
                                    Category: {item.category}
                                  </div>
                                  {item.remarks && (
                                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border-l-2 border-blue-400">
                                      <div className="flex items-start space-x-2">
                                        <span className="text-blue-500 dark:text-blue-400 text-xs font-medium">💬 REMARKS:</span>
                                        <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                          {item.remarks.length > 50 ? `${item.remarks.substring(0, 50)}...` : item.remarks}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {item.batchNumber && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                        🏷️ Batch: {item.batchNumber}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Specifications */}
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                <div>Yarn: {item.effectiveYarn}m</div>
                                <div>Count: {item.count} g/m</div>
                                <div className="text-xs text-gray-500">
                                  Per unit: {perUnitYarn.toFixed(2)}g
                                </div>
                              </div>
                            </td>

                            {/* Inventory Status */}
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Initial: </span>
                                  <span className="font-medium">{item.initialQuantity} kg</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${usagePercent}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500 flex justify-between">
                                  <span>Used: {consumed.toFixed(1)}kg</span>
                                  <span>Left: {left.toFixed(1)}kg</span>
                                </div>
                              </div>
                            </td>

                            {/* Cost & Capacity */}
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="text-gray-900 dark:text-white">
                                  Cost: ₹{cost.toFixed(2)}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  Rate: ₹{item.costPerKg || 0}/kg
                                </div>
                                <div className="text-xs text-gray-500">
                                  Capacity: {Math.floor(estimatedCapacity)} units
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 text-center">
                              {getStatusBadge(item.status)}
                              {isLowStock && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200">
                                    ⚠️ Low Stock
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => toggleRow(item.id)}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium px-2 py-1 rounded"
                                >
                                  {isExpanded ? "Hide Details" : "View Details"}
                                </button>
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-2 py-1 rounded transition-colors duration-200"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-2 py-1 rounded transition-colors duration-200"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr className="bg-gray-50 dark:bg-gray-800">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Production Info</h4>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                      <div>Units Produced: <span className="font-medium">{item.unitsProduced}</span></div>
                                      <div>Yarn per Unit: <span className="font-medium">{perUnitYarn.toFixed(2)}g</span></div>
                                      <div>Total Yarn Used: <span className="font-medium">{consumed.toFixed(2)}kg</span></div>
                                      {item.gsm && <div>GSM: <span className="font-medium">{item.gsm}</span></div>}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Location & Tracking</h4>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                      <div>Location: <span className="font-medium">{item.warehouseLocation || item.location || "Not specified"}</span></div>
                                      {item.batchNumber && <div>Batch: <span className="font-medium">{item.batchNumber}</span></div>}
                                      {item.supplierName && <div>Supplier: <span className="font-medium">{item.supplierName}</span></div>}
                                      <div>Created: <span className="font-medium">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</span></div>
                                      <div>Updated: <span className="font-medium">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "N/A"}</span></div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Financial Summary</h4>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                      <div>Investment: <span className="font-medium">₹{(item.initialQuantity * (item.costPerKg || 0)).toFixed(2)}</span></div>
                                      <div>Used Value: <span className="font-medium">₹{cost.toFixed(2)}</span></div>
                                      <div>Remaining Value: <span className="font-medium">₹{(left * (item.costPerKg || 0)).toFixed(2)}</span></div>
                                      {item.totalValue && <div>Total Value: <span className="font-medium">₹{item.totalValue}</span></div>}
                                    </div>
                                  </div>
                                </div>
                                {item.remarks && (
                                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                      <span className="text-blue-500 dark:text-blue-400 mr-2">�</span>
                                      Remarks & Notes
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                      <div className="leading-relaxed">
                                        {item.remarks}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {/* Additional Information Cards */}
                                {(item.supplierName || item.batchNumber || item.warehouseLocation) && (
                                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                      <span className="text-indigo-500 dark:text-indigo-400 mr-2">🏷️</span>
                                      Additional Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      {item.supplierName && (
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Supplier</div>
                                          <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">{item.supplierName}</div>
                                        </div>
                                      )}
                                      {item.batchNumber && (
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Batch Number</div>
                                          <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">{item.batchNumber}</div>
                                        </div>
                                      )}
                                      {item.warehouseLocation && (
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Warehouse</div>
                                          <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">{item.warehouseLocation}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingItem ? "✏️ Edit Inventory Item" : "➕ New Inventory Item"}
              </h3>
              {!editingItem && (
                <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Fresh Form</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Product Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2 flex items-center">
                  📦 Product Details
                  {!editingItem && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </h4>
                <input 
                  type="text" 
                  name="productName" 
                  value={newItem.productName} 
                  onChange={handleModalChange} 
                  placeholder="Product Name *" 
                  className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                />
                <input 
                  type="text" 
                  name="rawMaterial" 
                  value={newItem.rawMaterial} 
                  onChange={handleModalChange} 
                  placeholder="Raw Material *" 
                  className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                />
                <select 
                  name="category" 
                  value={newItem.category} 
                  onChange={handleModalChange} 
                  className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Category</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Synthetic">Synthetic</option>
                  <option value="Wool">Wool</option>
                  <option value="Blended">Blended</option>
                </select>
                <input 
                  type="text" 
                  name="gsm" 
                  value={newItem.gsm} 
                  onChange={handleModalChange} 
                  placeholder="GSM (grams per square meter)" 
                  className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                />
              </div>

              {/* Quantity & Production */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2">📊 Production Info</h4>
                <div className="flex items-center space-x-2">
                  <input type="number" name="initialQuantity" value={newItem.initialQuantity} onChange={handleModalChange} placeholder="Initial Quantity (kg) *" className="w-full border px-3 py-2 rounded text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="manualQuantity" checked={newItem.manualQuantity} onChange={handleModalChange} className="mr-1" />
                    Manual
                  </label>
                </div>
                <input type="number" name="currentQuantity" value={newItem.currentQuantity} onChange={handleModalChange} placeholder="Current Quantity (kg)" className="w-full border px-3 py-2 rounded text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
                <div className="flex items-center space-x-2">
                  <input type="number" name="effectiveYarn" value={newItem.effectiveYarn} onChange={handleModalChange} placeholder="Effective Yarn per Unit (m) *" className="w-full border px-3 py-2 rounded text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="manualYarn" checked={newItem.manualYarn} onChange={handleModalChange} className="mr-1" />
                    Manual
                  </label>
                </div>
                <input type="number" name="count" value={newItem.count} onChange={handleModalChange} placeholder="Count (g/m) *" className="w-full border px-3 py-2 rounded text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
              </div>

              {/* Costing Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2">💰 Financial Details</h4>
                <input type="number" name="costPerKg" value={newItem.costPerKg} onChange={handleModalChange} placeholder="Cost per Kg (₹)" className="w-full border px-3 py-2 rounded text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
                <div className="flex items-center space-x-2">
                  <input type="number" name="totalValue" value={newItem.totalValue} onChange={handleModalChange} placeholder="Total Value (₹)" className="w-full border px-3 py-2 rounded text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="manualValue" checked={newItem.manualValue} onChange={handleModalChange} className="mr-1" />
                    Manual
                  </label>
                </div>
              </div>

              {/* Location & Storage */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2">🏭 Storage & Tracking</h4>
                <input type="text" name="warehouseLocation" value={newItem.warehouseLocation} onChange={handleModalChange} placeholder="Warehouse Location" className="w-full border px-3 py-2 rounded text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
                <input type="text" name="batchNumber" value={newItem.batchNumber} onChange={handleModalChange} placeholder="Batch Number" className="w-full border px-3 py-2 rounded text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
                <input type="text" name="supplierName" value={newItem.supplierName} onChange={handleModalChange} placeholder="Supplier Name" className="w-full border px-3 py-2 rounded text-sm bg-white dark:bg-gray-900 text-black dark:text-white" />
              </div>
            </div>

            {/* Full-width Remarks Section */}
            <div className="mt-6 space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2 flex items-center">
                <span className="text-blue-500 dark:text-blue-400 mr-2">💬</span>
                Remarks & Additional Notes
                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                  Optional
                </span>
              </h4>
              <textarea 
                name="remarks" 
                value={newItem.remarks} 
                onChange={handleModalChange} 
                placeholder="Add any special notes, handling instructions, quality details, or important information about this inventory item..." 
                rows={4}
                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-4">
                <span>💡 Tip: Include quality specifications, special handling requirements, or supplier notes</span>
                <span className="text-right ml-auto">{newItem.remarks.length}/500 characters</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              {/* Left side - Clear Form button (only for new items) */}
              <div>
                {!editingItem && (
                  <button 
                    onClick={() => {
                      console.log('🧹 Manual form clear requested');
                      resetForm();
                      toast.success('📝 Form cleared', { duration: 1500 });
                    }}
                    className="px-4 py-2 text-sm rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors duration-200 border border-yellow-300 dark:border-yellow-700"
                    disabled={isCreating}
                  >
                    🧹 Clear Form
                  </button>
                )}
              </div>
              
              {/* Right side - Main action buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    console.log('❌ Modal cancelled - resetting form');
                    setShowModal(false);
                    resetForm();
                  }} 
                  className="px-6 py-2 text-sm rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors duration-200"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddInventory} 
                  className="px-6 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  disabled={isCreating}
                >
                  {isCreating 
                    ? (editingItem ? "🔄 Updating..." : "🔄 Adding...") 
                    : (editingItem ? "💾 Update Inventory Item" : "➕ Add Inventory Item")
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              🗑️ Confirm Deletion
            </h3>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Are you sure you want to delete this inventory item?
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white">
                  {itemToDelete.productName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {itemToDelete.rawMaterial} • {itemToDelete.category}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                  ⚠️ This action cannot be undone
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
