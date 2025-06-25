import React, { useEffect, useState } from "react";
import { format, isBefore, addDays } from "date-fns";
import { toast } from "sonner";
import { Plus, RefreshCw, Eye, Trash2, FileDown, Package, Pencil } from "lucide-react";
import { Button } from "../components/ui/Button";
import CreateDyeingOrderForm from "../components/CreateDyeingOrderForm";
import FollowUpModal from "../components/FollowUpModal";
import { useAuth } from "../context/AuthContext";
import {
  getAllDyeingRecords,
  markAsArrived,
  deleteDyeingRecord,
  getDyeingStatus,
  isRecordOverdue,
  markAsReprocessing,
  markReprocessingComplete,
} from "../api/dyeingApi";
import { DyeingRecord } from "../types/dyeing";
import {
  exportTableToExcel,
  exportTableToPDF,
  exportTableToPNG,
} from "../utils/exportUtils";

const notifySummaryToRefresh = () => {
  window.dispatchEvent(new Event("refresh-dyeing-summary"));
};

const formatSafeDate = (dateString: string | null | undefined, fallback: string = "Invalid date"): string => {
  if (!dateString) return fallback;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;
    return format(date, "MMM dd, yyyy");
  } catch {
    return fallback;
  }
};

const DyeingOrders = () => {
  const [orders, setOrders] = useState<DyeingRecord[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<DyeingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DyeingRecord | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<DyeingRecord | null>(null);  const [filter, setFilter] = useState<"all" | "pending" | "arrived" | "overdue" | "dueSoon" | "reprocessing">("all");
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [reprocessingReason, setReprocessingReason] = useState("");
  const [showReprocessingModal, setShowReprocessingModal] = useState(false);
  const [recordToReprocess, setRecordToReprocess] = useState<DyeingRecord | null>(null);

  const { user } = useAuth();
  const role = user?.role || "storekeeper";
  const canCreateOrders = role === "admin" || role === "manager";
  const canUpdateStatus = role === "admin" || role === "manager";
  const canDeleteOrders = role === "admin";
  const canManageFollowUps = role === "admin" || role === "manager";

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDyeingRecords();
      setOrders(data);
      toast.success("Dyeing orders loaded successfully");    } catch (error: unknown) {
      console.error("Failed to fetch dyeing orders:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load dyeing orders";
      toast.error(errorMessage);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;    switch (filter) {
      case "pending":
        filtered = orders.filter(o => !o.arrivalDate && !o.isReprocessing && !isRecordOverdue(o));
        break;
      case "arrived":
        filtered = orders.filter(o => o.arrivalDate);
        break;
      case "overdue":
        filtered = orders.filter(o => !o.arrivalDate && !o.isReprocessing && isRecordOverdue(o));
        break;
      case "reprocessing":
        filtered = orders.filter(o => o.isReprocessing);
        break;
      case "dueSoon":
        filtered = orders.filter(o => {
          if (o.arrivalDate || o.isReprocessing || !o.expectedArrivalDate) return false;
          const today = new Date();
          const dueDate = new Date(o.expectedArrivalDate);
          return isBefore(dueDate, addDays(today, 4));
        });
        break;
    }
    setFilteredOrders(filtered);
  }, [orders, filter]);  const getStatusColor = (record: DyeingRecord): string => {
    const status = getDyeingStatus(record);
    if (status === "Arrived") return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    if (status === "Overdue") return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    if (status === "Reprocessing") return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
    return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
  };
  
  const getRowBackground = (record: DyeingRecord): string => {
    const status = getDyeingStatus(record);
    if (status === "Overdue") return "bg-red-50/50 dark:bg-red-900/10 border-l-4 border-red-500";
    if (status === "Reprocessing") return "bg-orange-50/50 dark:bg-orange-900/10 border-l-4 border-orange-500";
    return "";
  };

  const handleMarkAsArrived = async (id: number) => {
    try {
      const updated = await markAsArrived(id);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
      toast.success("Order marked as arrived");
      notifySummaryToRefresh();    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update status";
      toast.error(errorMessage);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this dyeing order?")) return;
    setIsDeletingId(id);
    try {
      await deleteDyeingRecord(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      toast.success("Order deleted");
      notifySummaryToRefresh();    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete order";
      toast.error(errorMessage);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleMarkAsReprocessing = async (record: DyeingRecord) => {
    setRecordToReprocess(record);
    setShowReprocessingModal(true);
  };

  const confirmReprocessing = async () => {
    if (!recordToReprocess) return;
    try {
      const updated = await markAsReprocessing(recordToReprocess.id, reprocessingReason);
      setOrders(prev => prev.map(o => o.id === recordToReprocess.id ? updated : o));
      toast.success("Order marked for reprocessing");
      setShowReprocessingModal(false);
      setReprocessingReason("");
      setRecordToReprocess(null);
      notifySummaryToRefresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to mark for reprocessing";
      toast.error(errorMessage);
    }
  };
  const handleReprocessingComplete = async (id: number) => {
    if (!window.confirm("Mark reprocessing as complete? This will set the arrival date to today.")) return;
    
    try {
      // First complete the reprocessing
      await markReprocessingComplete(id);
      // Then mark as arrived
      const updated = await markAsArrived(id);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
      toast.success("Reprocessing completed and order marked as arrived");
      notifySummaryToRefresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to complete reprocessing";
      toast.error(errorMessage);
    }
  };

  const handleExport = (type: "excel" | "pdf" | "png") => {
    if (type === "excel") exportTableToExcel("dyeing-table", `DyeingOrders-${filter}`);
    else if (type === "pdf") exportTableToPDF("dyeing-table", `DyeingOrders-${filter}`);
    else exportTableToPNG("dyeing-table", `DyeingOrders-${filter}`);
  };

  const handleOrderCreatedOrUpdated = (updated: DyeingRecord) => {
    setOrders(prev => {
      const existingIndex = prev.findIndex(o => o.id === updated.id);
      if (existingIndex !== -1) {
        const copy = [...prev];
        copy[existingIndex] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
    setRecordToEdit(null);
    setShowCreateForm(false);
    notifySummaryToRefresh();
  };
  const filterCounts = {
    all: orders.length,
    pending: orders.filter(o => !o.arrivalDate && !o.isReprocessing && !isRecordOverdue(o)).length,
    arrived: orders.filter(o => o.arrivalDate).length,
    overdue: orders.filter(o => !o.arrivalDate && !o.isReprocessing && isRecordOverdue(o)).length,
    reprocessing: orders.filter(o => o.isReprocessing).length,
    dueSoon: orders.filter(o => {
      if (o.arrivalDate || o.isReprocessing || !o.expectedArrivalDate) return false;
      return isBefore(new Date(o.expectedArrivalDate), addDays(new Date(), 4));
    }).length,
  };
  return (
    <div className="min-h-screen p-4 transition-colors duration-200 bg-gray-50 dark:bg-gray-900 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dyeing Orders</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage and track dyeing orders</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {canCreateOrders && (
              <Button 
                onClick={() => { setRecordToEdit(null); setShowCreateForm(true); }}
                className="bg-blue-600 shadow-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Plus size={16} className="mr-2" /> Create Order
              </Button>
            )}
            <div className="flex gap-1 p-1 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport("excel")}
                className="hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-400"
              >
                <FileDown className="mr-1" size={14} /> Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport("pdf")}
                className="hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <FileDown className="mr-1" size={14} /> PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport("png")}
                className="hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
              >
                <FileDown className="mr-1" size={14} /> PNG
              </Button>
            </div>
          </div>        </div>

        {/* Filter Navigation */}
        <div className="mb-6 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
          <nav className="flex gap-1 p-1 overflow-x-auto">
            {["all", "pending", "arrived", "reprocessing", "overdue", "dueSoon"].map((key) => (
              <button
                key={key}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                  filter === key 
                    ? "bg-blue-600 text-white shadow-md dark:bg-blue-600" 
                    : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
                onClick={() => setFilter(key as typeof filter)}
              >
                <span className="capitalize">{key === "dueSoon" ? "Due Soon" : key}</span>
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  filter === key 
                    ? "bg-blue-500 text-white dark:bg-blue-500" 
                    : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                }`}>
                  {filterCounts[key as keyof typeof filterCounts]}
                </span>
              </button>
            ))}
          </nav>
        </div>        {/* Table Section */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table id="dyeing-table" className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Party Name</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Yarn</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Quantity</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Shade</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Count</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Lot</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Dyeing Firm</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Sent</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Expected</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Arrival</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Status</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Remarks</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">Actions</th>
                </tr>              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {filteredOrders.map(record => (
                  <tr key={record.id} className={`transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${getRowBackground(record)}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{record.partyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{record.yarnType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{record.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{record.shade}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{record.count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{record.lot}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{record.dyeingFirm}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{formatSafeDate(record.sentDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{formatSafeDate(record.expectedArrivalDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {record.arrivalDate ? formatSafeDate(record.arrivalDate) : "Not arrived"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record)}`}>
                        {getDyeingStatus(record)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs text-sm text-gray-700 dark:text-gray-300">
                        {record.remarks && <div>{record.remarks}</div>}
                        {record.isReprocessing && record.reprocessingReason && (
                          <div className="px-2 py-1 mt-1 text-xs italic text-orange-600 rounded dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20">
                            Reprocessing: {record.reprocessingReason}
                          </div>
                        )}
                        {record.isReprocessing && !record.reprocessingReason && (
                          <div className="px-2 py-1 mt-1 text-xs italic text-orange-600 rounded dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20">
                            Sent for reprocessing
                          </div>
                        )}
                      </div>                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setRecordToEdit(record); setShowCreateForm(true); }} 
                          title="Edit"
                          className="inline-flex items-center p-2 text-blue-600 transition-colors duration-200 rounded-lg bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40"
                        >
                          <Pencil size={14} />
                        </button>
                        {canManageFollowUps && (
                          <button 
                            onClick={() => { setSelectedRecord(record); setShowFollowUpModal(true); }} 
                            title="View Follow-ups"
                            className="inline-flex items-center p-2 text-gray-600 transition-colors duration-200 rounded-lg bg-gray-50 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {canUpdateStatus && !record.arrivalDate && !record.isReprocessing && (
                          <button 
                            onClick={() => handleMarkAsArrived(record.id)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 transition-colors duration-200 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/40"
                          >
                            Mark Arrived
                          </button>
                        )}
                        {canUpdateStatus && !record.isReprocessing && (
                          <button 
                            onClick={() => handleMarkAsReprocessing(record)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-orange-700 transition-colors duration-200 border border-orange-200 rounded-lg bg-orange-50 hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800 dark:hover:bg-orange-900/40"
                          >
                            Reprocess
                          </button>
                        )}
                        {canUpdateStatus && record.isReprocessing && (
                          <button 
                            onClick={() => handleReprocessingComplete(record.id)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 transition-colors duration-200 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/40"
                          >
                            Complete Reprocessing
                          </button>
                        )}
                        {canDeleteOrders && (
                          <button
                            onClick={() => handleDeleteOrder(record.id)}
                            disabled={isDeletingId === record.id}
                            className="inline-flex items-center p-2 text-red-600 transition-colors duration-200 rounded-lg bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 disabled:opacity-50"
                            title="Delete"
                          >
                            {isDeletingId === record.id ? (
                              <div className="w-4 h-4 border-b-2 border-red-500 rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>        </div>

        {/* Modals */}
        <CreateDyeingOrderForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleOrderCreatedOrUpdated}
          recordToEdit={recordToEdit}
        />

        <FollowUpModal
          isOpen={showFollowUpModal}
          onClose={() => setShowFollowUpModal(false)}
          dyeingRecord={selectedRecord}
          onFollowUpAdded={fetchOrders}
        />

        {/* Reprocessing Modal */}
        {showReprocessingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 overflow-hidden bg-white shadow-2xl dark:bg-gray-800 rounded-2xl">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send for Reprocessing</h3>
              </div>
              
              <div className="px-6 py-4">
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  This will mark the order for reprocessing. If the order has already arrived, it will be reset to pending status.
                </p>
                
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={reprocessingReason}
                    onChange={(e) => setReprocessingReason(e.target.value)}
                    className="w-full px-3 py-2 transition-colors duration-200 border border-gray-300 rounded-lg resize-none dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Enter reason for reprocessing..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                <Button onClick={() => setShowReprocessingModal(false)} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={confirmReprocessing} className="text-white bg-orange-600 hover:bg-orange-700">
                  Confirm Reprocessing
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DyeingOrders;
