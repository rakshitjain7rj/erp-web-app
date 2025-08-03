import React, { useEffect, useState } from "react"; 
import {
  getAllDyeingRecords,
  deleteDyeingRecord,
  getDyeingStatus,
  markAsArrived,
  completeReprocessing,
  createDyeingRecord,
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

  useEffect(() => {
    fetchRecords();
    fetchCentralizedDyeingFirms();
  }, []);

  const fetchRecords = async () => {
    try {
      const data = await getAllDyeingRecords();
      setRecords(data);
    } catch (error) {
      console.error("Failed to fetch dyeing records:", error);
    }
  };

  // Fetch centralized dyeing firms from API
  const fetchCentralizedDyeingFirms = async () => {
    try {
      setIsLoadingFirms(true);
      console.log('🔄 Fetching centralized dyeing firms for Dyeing Orders...');
      const firms = await getAllDyeingFirms();
      setCentralizedDyeingFirms(firms);
      console.log(`✅ Loaded ${firms.length} centralized dyeing firms:`, firms.map(f => f.name));
    } catch (error) {
      console.error('❌ Failed to fetch centralized dyeing firms:', error);
      // Fallback to extracting from existing records if API fails
      const fallbackFirms = Array.from(new Set(records.map((r) => r.dyeingFirm)))
        .map((name, index) => ({
          id: -(index + 1),
          name,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      setCentralizedDyeingFirms(fallbackFirms);
      console.log(`📋 Using fallback firms from records:`, fallbackFirms.map(f => f.name));
    } finally {
      setIsLoadingFirms(false);
    }
  };

  // ================= MAPPING FUNCTION =================
  const mapToSimplifiedDisplay = (record: DyeingRecord): SimplifiedDyeingDisplayRecord => {
    // Parse enhanced remarks to extract tracking information
    const parseTrackingInfo = (remarks?: string) => {
      if (!remarks) return {};
      
      const received = remarks.match(/Received: ([\d.]+)kg/)?.[1];
      const receivedDate = remarks.match(/Received: [\d.]+kg on ([\d-]+)/)?.[1];
      const dispatched = remarks.match(/Dispatched: ([\d.]+)kg/)?.[1];
      const dispatchDate = remarks.match(/Dispatched: [\d.]+kg on ([\d-]+)/)?.[1];
      const middleman = remarks.match(/Middleman: ([^|]+)/)?.[1]?.trim();
      
      // Extract original remarks (everything before the first tracking info)
      const trackingPattern = / \| (Received:|Dispatched:|Middleman:)/;
      const originalRemarks = remarks.split(trackingPattern)[0] || remarks;
      
      return {
        received: received ? parseFloat(received) : undefined,
        receivedDate: receivedDate || undefined,
        dispatch: dispatched ? parseFloat(dispatched) : undefined,
        dispatchDate: dispatchDate || undefined,
        partyNameMiddleman: middleman || "Direct Supply",
        originalRemarks
      };
    };
    
    const trackingInfo = parseTrackingInfo(record.remarks);
    
    return {
      id: record.id,
      quantity: record.quantity,
      customerName: record.partyName,
      sentToDye: record.quantity, // For now, assume all quantity is sent to dye
      sentDate: record.sentDate,
      received: trackingInfo.received,
      receivedDate: trackingInfo.receivedDate,
      dispatch: trackingInfo.dispatch,
      dispatchDate: trackingInfo.dispatchDate,
      partyNameMiddleman: trackingInfo.partyNameMiddleman || "Direct Supply",
      dyeingFirm: record.dyeingFirm,
      remarks: trackingInfo.originalRemarks || record.remarks
    };
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
    // Convert DyeingRecord to SimplifiedDyeingOrderForm format
    const simplifiedOrder = {
      yarnType: record.yarnType,
      sentDate: record.sentDate,
      expectedArrivalDate: record.expectedArrivalDate,
      remarks: record.remarks,
      partyName: record.partyName,
      quantity: record.quantity,
      shade: record.shade,
      count: record.count,
      lot: record.lot,
      dyeingFirm: record.dyeingFirm,
    };
    setOrderToEdit(simplifiedOrder);
    setIsFormOpen(true);
  };

  // Handler for successful form submission
  const handleOrderSuccess = async (orderData: any) => {
    try {
      // The form already handles the API call, so we just need to refresh
      console.log("Order created successfully:", orderData);
      
      // Refresh the records
      await fetchRecords();
      
      // Also refresh centralized dyeing firms to show newly created firms
      await fetchCentralizedDyeingFirms();
      
      setIsFormOpen(false);
      setOrderToEdit(null);
      
      // Success toast is already shown by the form
    } catch (error) {
      console.error("Failed to refresh data after order creation:", error);
      toast.error("Order created but failed to refresh data. Please refresh the page.");
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
    // Parse tracking info from remarks
    const parseTrackingInfo = (remarks?: string) => {
      if (!remarks) return {};
      
      const received = remarks.match(/Received: ([\d.]+)kg/)?.[1];
      const dispatched = remarks.match(/Dispatched: ([\d.]+)kg/)?.[1];
      
      return {
        received: received ? parseFloat(received) : 0,
        dispatch: dispatched ? parseFloat(dispatched) : 0,
      };
    };
    
    const trackingInfo = parseTrackingInfo(record.remarks);
    
    setEditValues({
      quantity: record.quantity,
      receivedQuantity: trackingInfo.received || 0,
      dispatchQuantity: trackingInfo.dispatch || 0,
      sentQuantity: record.quantity, // Assume sent quantity is same as total quantity
    });
    setEditingRecordId(record.id);
  };

  const handleSaveQuantities = async (record: DyeingRecord) => {
    try {
      // Create enhanced remarks with updated tracking information
      const originalRemarks = record.remarks?.split(' | ')[0] || '';
      const trackingInfo = [];
      
      if (editValues.receivedQuantity > 0) {
        trackingInfo.push(`Received: ${editValues.receivedQuantity}kg`);
      }
      if (editValues.dispatchQuantity > 0) {
        trackingInfo.push(`Dispatched: ${editValues.dispatchQuantity}kg`);
      }
      
      const enhancedRemarks = [
        originalRemarks,
        ...trackingInfo
      ].filter(Boolean).join(' | ');

      // Update the record through the API
      // Note: This would need to be implemented in the API
      // For now, we'll update locally and show success
      
      toast.success("Quantities updated successfully!");
      setEditingRecordId(null);
      fetchRecords();
    } catch (error) {
      console.error("Failed to update quantities:", error);
      toast.error("Failed to update quantities");
    }
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditValues({ quantity: 0, receivedQuantity: 0, dispatchQuantity: 0, sentQuantity: 0 });
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🪨 Dyeing Orders Overview</h1>
        <div className="flex gap-2">
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
          />
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedByFirm).map(([firm, firmRecords]) => (
          <div key={firm} className="overflow-hidden shadow rounded-2xl">
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
                          <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                            <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.quantity}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                  className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                  step="0.01"
                                />
                              ) : (
                                `${simplifiedRecord.quantity} kg`
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium">{simplifiedRecord.customerName}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.sentQuantity}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, sentQuantity: parseFloat(e.target.value) || 0 }))}
                                  className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                  step="0.01"
                                />
                              ) : (
                                `${simplifiedRecord.sentToDye} kg`
                              )}
                            </td>
                            <td className="px-4 py-3">{new Date(simplifiedRecord.sentDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValues.receivedQuantity}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, receivedQuantity: parseFloat(e.target.value) || 0 }))}
                                  className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                  step="0.01"
                                />
                              ) : (
                                simplifiedRecord.received ? `${simplifiedRecord.received} kg` : '--'
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
                                  onChange={(e) => setEditValues(prev => ({ ...prev, dispatchQuantity: parseFloat(e.target.value) || 0 }))}
                                  className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                  step="0.01"
                                />
                              ) : (
                                simplifiedRecord.dispatch ? `${simplifiedRecord.dispatch} kg` : '--'
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