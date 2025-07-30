import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { ChevronDown, ChevronUp, Package, TrendingUp, Calendar, BarChart3, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { exportDataToCSV } from "../utils/exportUtils";
import FloatingActionDropdown from "../components/FloatingActionDropdown";
import CreateDyeingOrderForm from "../components/CreateDyeingOrderForm";
import CountProductFollowUpModal from "../components/CountProductFollowUpModal";
import { DyeingRecord } from "../types/dyeing";

// Mock data structure for count products
interface CountProduct {
  id: number;
  partyName: string;
  dyeingFirm: string;
  yarnType: string;
  count: string;
  shade: string;
  quantity: number;
  completedDate: string;
  qualityGrade: 'A' | 'B' | 'C';
  remarks?: string;
  lotNumber: string;
  processedBy: string;
  customerName: string;
  sentToDye: boolean;
  sentDate: string;
  received: boolean;
  receivedDate: string;
  receivedQuantity: number;
  dispatch: boolean;
  dispatchDate: string;
  dispatchQuantity: number;
  middleman: string;
}

// Mock data for demonstration
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
  const [products, setProducts] = useState<CountProduct[]>(mockCountProducts);
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [firmFilter, setFirmFilter] = useState<string>("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [partyFilter, setPartyFilter] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<DyeingRecord | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CountProduct | null>(null);
  const [editValues, setEditValues] = useState<{
    quantity: number;
    receivedQuantity: number;
    dispatchQuantity: number;
    sentQuantity: number;
  }>({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });

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
  const uniqueFirms = Array.from(new Set(products.map((p) => p.dyeingFirm)));
  const uniqueGrades = Array.from(new Set(products.map((p) => p.qualityGrade)));
  const uniqueParties = Array.from(new Set(products.map((p) => p.partyName)));

  // Group products by dyeing firm
  const groupedByFirm = filteredProducts.reduce((acc, product) => {
    if (!acc[product.dyeingFirm]) acc[product.dyeingFirm] = [];
    acc[product.dyeingFirm].push(product);
    return acc;
  }, {} as Record<string, CountProduct[]>);

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
    toast.info(`Edit action for product ID: ${productId}`);
    // TODO: Implement edit functionality
  };

  const handleDelete = (productId: number) => {
    toast.info(`Delete action for product ID: ${productId}`);
    // TODO: Implement delete functionality
  };

  const handleFollowUp = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsFollowUpModalOpen(true);
      toast.info(`Opening follow-up for ${product.partyName} - ${product.yarnType}`);
    }
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
    try {
      // Validate inputs
      if (editValues.quantity <= 0 || editValues.receivedQuantity <= 0 || editValues.dispatchQuantity < 0 || editValues.sentQuantity <= 0) {
        toast.error("Please enter valid positive numbers for quantities.");
        return;
      }

      if (editValues.receivedQuantity > editValues.sentQuantity) {
        toast.error("Received quantity cannot exceed sent quantity.");
        return;
      }

      if (editValues.dispatchQuantity > editValues.receivedQuantity) {
        toast.error("Dispatch quantity cannot exceed received quantity.");
        return;
      }

      // Update the product in state
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? {
                ...product,
                quantity: editValues.sentQuantity,
                receivedQuantity: editValues.receivedQuantity,
                received: editValues.receivedQuantity > 0,
                dispatchQuantity: editValues.dispatchQuantity,
                dispatch: editValues.dispatchQuantity > 0,
                dispatchDate: editValues.dispatchQuantity > 0 ? 
                  (product.dispatchDate || new Date().toISOString().split('T')[0]) : ""
              }
            : product
        )
      );

      // Exit edit mode
      setEditingProductId(null);
      setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
      
      toast.success("Quantities updated successfully!");
      
      // TODO: Call update API here
      // await updateProductQuantities(productId, editValues);
      
    } catch (error) {
      console.error("Failed to update quantities:", error);
      toast.error("Failed to update quantities. Please try again.");
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

  // Handle successful dyeing order creation
  const handleDyeingOrderSuccess = (dyeingRecord: DyeingRecord) => {
    // Convert DyeingRecord to CountProduct format
    const newCountProduct: CountProduct = {
      id: Date.now(), // Temporary ID until we implement proper backend integration
      partyName: dyeingRecord.partyName,
      dyeingFirm: dyeingRecord.dyeingFirm,
      yarnType: dyeingRecord.yarnType,
      count: dyeingRecord.count,
      shade: dyeingRecord.shade,
      quantity: dyeingRecord.quantity,
      completedDate: new Date().toISOString().split('T')[0], // Today's date as completed
      qualityGrade: "A", // Default grade, can be updated later
      remarks: dyeingRecord.remarks || "",
      lotNumber: dyeingRecord.lot,
      processedBy: "System", // Default value
      customerName: dyeingRecord.partyName, // Use party name as customer name
      sentToDye: true,
      sentDate: dyeingRecord.sentDate,
      received: true,
      receivedDate: dyeingRecord.expectedArrivalDate,
      receivedQuantity: dyeingRecord.quantity, // Default to full quantity received
      dispatch: false,
      dispatchDate: "",
      dispatchQuantity: 0, // No dispatch initially
      middleman: "Direct Supply" // Default value
    };

    // Add to products list
    setProducts(prevProducts => [...prevProducts, newCountProduct]);
    
    // Close form
    setIsFormOpen(false);
    setRecordToEdit(null);
    
    // Show success message
    toast.success("Dyeing order added successfully to Count Product Overview!");
    
    // Expand the firm section if it's not already expanded
    setExpandedFirm(dyeingRecord.dyeingFirm);
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

  // Calculate summary statistics
  const totalQuantity = filteredProducts.reduce((sum, product) => sum + product.quantity, 0);
  const gradeACounts = filteredProducts.filter(p => p.qualityGrade === 'A').length;
  const totalFirms = uniqueFirms.length;

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
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
            onClick={() => { setRecordToEdit(null); setIsFormOpen(true); }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dyeing Order</span>
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
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalQuantity} kg</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
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

      {/* Grouped Content by Dyeing Firm */}
      <div className="space-y-6">
        {Object.entries(groupedByFirm).map(([firm, firmProducts]) => (
          <div key={firm} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Firm Header - Collapsible */}
            <div
              onClick={() => setExpandedFirm((f) => (f === firm ? null : firm))}
              className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300">{firm}</h2>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {firmProducts.length} products • {firmProducts.reduce((sum, p) => sum + p.quantity, 0)} kg total
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {expandedFirm === firm ? 'Collapse' : 'Expand'}
                </span>
                {expandedFirm === firm ? 
                  <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : 
                  <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                }
              </div>
            </div>

            {/* Products Table - Expandable */}
            {expandedFirm === firm && (
              <div className="overflow-x-auto" id="count-product-table">
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
                    {firmProducts.map((product) => (
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

      {/* Create Dyeing Order Form Modal */}
      <CreateDyeingOrderForm
        isOpen={isFormOpen}
        recordToEdit={recordToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setRecordToEdit(null);
        }}
        onSuccess={handleDyeingOrderSuccess}
      />

      {/* Count Product Follow-Up Modal */}
      <CountProductFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setSelectedProduct(null);
        }}
        countProduct={selectedProduct}
        onFollowUpAdded={() => {
          // Refresh any data if needed in the future
          // For now, the modal handles updating its own state
          toast.success("Follow-up added successfully! Note: If backend is not connected, this is a demo mode.");
        }}
      />
    </div>
  );
};

export default CountProductOverview;
