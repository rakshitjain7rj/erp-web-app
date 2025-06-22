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
  const [recordToEdit, setRecordToEdit] = useState<DyeingRecord | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "arrived" | "overdue" | "dueSoon">("all");
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

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
      toast.success("Dyeing orders loaded successfully");
    } catch (error: any) {
      console.error("Failed to fetch dyeing orders:", error);
      toast.error(error.response?.data?.message || "Failed to load dyeing orders");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;
    switch (filter) {
      case "pending":
        filtered = orders.filter(o => !o.arrivalDate && !isRecordOverdue(o));
        break;
      case "arrived":
        filtered = orders.filter(o => o.arrivalDate);
        break;
      case "overdue":
        filtered = orders.filter(o => !o.arrivalDate && isRecordOverdue(o));
        break;
      case "dueSoon":
        filtered = orders.filter(o => {
          if (o.arrivalDate || !o.expectedArrivalDate) return false;
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
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
  };

  const getRowBackground = (record: DyeingRecord): string =>
    getDyeingStatus(record) === "Overdue" ? "bg-red-50 dark:bg-red-900/10" : "";

  const handleMarkAsArrived = async (id: number) => {
    try {
      const updated = await markAsArrived(id);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
      toast.success("Order marked as arrived");
      notifySummaryToRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this dyeing order?")) return;
    setIsDeletingId(id);
    try {
      await deleteDyeingRecord(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      toast.success("Order deleted");
      notifySummaryToRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete order");
    } finally {
      setIsDeletingId(null);
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
    pending: orders.filter(o => !o.arrivalDate && !isRecordOverdue(o)).length,
    arrived: orders.filter(o => o.arrivalDate).length,
    overdue: orders.filter(o => !o.arrivalDate && isRecordOverdue(o)).length,
    dueSoon: orders.filter(o => {
      if (o.arrivalDate || !o.expectedArrivalDate) return false;
      return isBefore(new Date(o.expectedArrivalDate), addDays(new Date(), 4));
    }).length,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Package className="text-blue-500" /> Dyeing Orders
        </h1>
        <div className="flex gap-2 flex-wrap">
          {canCreateOrders && (
            <Button onClick={() => { setRecordToEdit(null); setShowCreateForm(true); }}>
              <Plus size={14} className="mr-2" /> Create Order
            </Button>
          )}
          <Button onClick={() => handleExport("excel")}><FileDown className="mr-2" size={14} /> Excel</Button>
          <Button onClick={() => handleExport("pdf")}><FileDown className="mr-2" size={14} /> PDF</Button>
          <Button onClick={() => handleExport("png")}><FileDown className="mr-2" size={14} /> PNG</Button>
        </div>
      </div>

      <nav className="mb-4 border-b flex gap-4">
        {["all", "pending", "arrived", "overdue", "dueSoon"].map((key) => (
          <button
            key={key}
            className={`pb-2 border-b-2 text-sm font-medium ${filter === key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"}`}
            onClick={() => setFilter(key as any)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} ({filterCounts[key as keyof typeof filterCounts]})
          </button>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-xl shadow">
        <table id="dyeing-table" className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Yarn</th>
              <th className="px-4 py-2 text-left">Sent</th>
              <th className="px-4 py-2 text-left">Expected</th>
              <th className="px-4 py-2 text-left">Arrival</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Remarks</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(record => (
              <tr key={record.id} className={`hover:bg-gray-50 ${getRowBackground(record)}`}>
                <td className="px-4 py-2">{record.yarnType}</td>
                <td className="px-4 py-2">{formatSafeDate(record.sentDate)}</td>
                <td className="px-4 py-2">{formatSafeDate(record.expectedArrivalDate)}</td>
                <td className="px-4 py-2">{record.arrivalDate ? formatSafeDate(record.arrivalDate) : "Not arrived"}</td>
                <td className="px-4 py-2"><span className={`px-2 py-1 rounded-full ${getStatusColor(record)}`}>{getDyeingStatus(record)}</span></td>
                <td className="px-4 py-2">{record.remarks || "-"}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setRecordToEdit(record); setShowCreateForm(true); }} title="Edit">
                      <Pencil size={16} />
                    </button>
                    {canManageFollowUps && (
                      <button onClick={() => { setSelectedRecord(record); setShowFollowUpModal(true); }} title="View Follow-ups"><Eye size={16} /></button>
                    )}
                    {canUpdateStatus && !record.arrivalDate && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkAsArrived(record.id)}>Mark Arrived</Button>
                    )}
                    {canDeleteOrders && (
                      <button
                        onClick={() => handleDeleteOrder(record.id)}
                        disabled={isDeletingId === record.id}
                        className="text-red-600 hover:text-red-900"
                      >
                        {isDeletingId === record.id ? <div className="w-4 h-4 border-b-2 border-red-500 animate-spin rounded-full" /> : <Trash2 size={16} />}
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
    </div>
  );
};

export default DyeingOrders;
