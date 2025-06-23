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
  }, [orders, filter]);
  const getStatusColor = (record: DyeingRecord): string => {
    const status = getDyeingStatus(record);
    if (status === "Arrived") return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    if (status === "Overdue") return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    if (status === "Reprocessing") return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
  };
  const getRowBackground = (record: DyeingRecord): string => {
    const status = getDyeingStatus(record);
    if (status === "Overdue") return "bg-red-50 dark:bg-red-900/20";
    if (status === "Reprocessing") return "bg-orange-50 dark:bg-orange-900/20";
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
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Package className="text-blue-500" /> Dyeing Orders
        </h1>
        <div className="flex flex-wrap gap-2">
          {canCreateOrders && (
            <Button onClick={() => { setRecordToEdit(null); setShowCreateForm(true); }}>
              <Plus size={14} className="mr-2" /> Create Order
            </Button>
          )}
          <Button onClick={() => handleExport("excel")}><FileDown className="mr-2" size={14} /> Excel</Button>
          <Button onClick={() => handleExport("pdf")}><FileDown className="mr-2" size={14} /> PDF</Button>
          <Button onClick={() => handleExport("png")}><FileDown className="mr-2" size={14} /> PNG</Button>
        </div>
      </div>      <nav className="flex gap-4 mb-4 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {["all", "pending", "arrived", "reprocessing", "overdue", "dueSoon"].map((key) => (
          <button
            key={key}
            className={`pb-2 border-b-2 text-sm font-medium whitespace-nowrap ${
              filter === key 
                ? "border-blue-500 text-blue-600 dark:text-blue-400" 
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setFilter(key as typeof filter)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} ({filterCounts[key as keyof typeof filterCounts]})
          </button>
        ))}
      </nav><div className="overflow-x-auto bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">        <table id="dyeing-table" className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Party Name</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Yarn</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Quantity</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Shade</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Count</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Lot</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Dyeing Firm</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Sent</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Expected</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Arrival</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Status</th>
              <th className="px-4 py-3 font-medium text-left text-gray-900 dark:text-white">Remarks</th>
              <th className="px-4 py-3 font-medium text-right text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredOrders.map(record => (
              <tr key={record.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${getRowBackground(record)}`}>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{record.partyName}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{record.yarnType}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{record.quantity}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{record.shade}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{record.count}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{record.lot}</td>
                <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{record.dyeingFirm}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatSafeDate(record.sentDate)}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatSafeDate(record.expectedArrivalDate)}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{record.arrivalDate ? formatSafeDate(record.arrivalDate) : "Not arrived"}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record)}`}>{getDyeingStatus(record)}</span></td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  <div>
                    {record.remarks && <div>{record.remarks}</div>}
                    {record.isReprocessing && record.reprocessingReason && (
                      <div className="mt-1 text-xs italic text-orange-600 dark:text-orange-400">
                        Reprocessing: {record.reprocessingReason}
                      </div>
                    )}
                    {record.isReprocessing && !record.reprocessingReason && (
                      <div className="mt-1 text-xs italic text-orange-600 dark:text-orange-400">
                        Sent for reprocessing
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { setRecordToEdit(record); setShowCreateForm(true); }} 
                      title="Edit"
                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Pencil size={16} />
                    </button>
                    {canManageFollowUps && (
                      <button 
                        onClick={() => { setSelectedRecord(record); setShowFollowUpModal(true); }} 
                        title="View Follow-ups"
                        className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <Eye size={16} />
                      </button>
                    )}                    {canUpdateStatus && !record.arrivalDate && !record.isReprocessing && (
                      <button 
                        onClick={() => handleMarkAsArrived(record.id)}
                        className="px-3 py-1 text-sm text-green-700 border border-green-300 rounded hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
                      >
                        Mark Arrived
                      </button>
                    )}
                    {canUpdateStatus && !record.isReprocessing && (
                      <button 
                        onClick={() => handleMarkAsReprocessing(record)}
                        className="px-3 py-1 text-sm text-orange-700 border border-orange-300 rounded hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-900/20"
                      >
                        Reprocess
                      </button>
                    )}
                    {canUpdateStatus && record.isReprocessing && (
                      <button 
                        onClick={() => handleReprocessingComplete(record.id)}
                        className="px-3 py-1 text-sm text-blue-700 border border-blue-300 rounded hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        Complete Reprocessing
                      </button>
                    )}
                    {canDeleteOrders && (
                      <button
                        onClick={() => handleDeleteOrder(record.id)}
                        disabled={isDeletingId === record.id}
                        className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        title="Delete"
                      >
                        {isDeletingId === record.id ? <div className="w-4 h-4 border-b-2 border-red-500 rounded-full animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {/* Reprocessing Modal */}      {showReprocessingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded-lg dark:bg-gray-800 w-96">
            <h3 className="mb-4 text-lg font-semibold">Send for Reprocessing</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              This will mark the order for reprocessing. If the order has already arrived, it will be reset to pending status.
            </p>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Reason (Optional)</label>
              <textarea
                value={reprocessingReason}
                onChange={(e) => setReprocessingReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                rows={3}
                placeholder="Enter reason for reprocessing..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowReprocessingModal(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={confirmReprocessing} className="bg-orange-600 hover:bg-orange-700">
                Confirm Reprocessing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DyeingOrders;
