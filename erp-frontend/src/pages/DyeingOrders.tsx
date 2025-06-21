// pages/DyeingOrders.tsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Package,
} from "lucide-react";

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

// Add this helper function at the top of your DyeingOrders.tsx file
const formatSafeDate = (dateString: string | null | undefined, fallback: string = "Invalid date"): string => {
  if (!dateString) return fallback;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return fallback;
    }
    return format(date, "MMM dd, yyyy");
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', dateString);
    return fallback;
  }
};

const DyeingOrders = () => {
  const [orders, setOrders] = useState<DyeingRecord[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<DyeingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DyeingRecord | null>(
    null
  );
  const [filter, setFilter] = useState<
    "all" | "pending" | "arrived" | "overdue"
  >("all");
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  const { user } = useAuth();
  const role = user?.role || "storekeeper";

  const canCreateOrders = role === "admin" || role === "manager";
  const canUpdateStatus = role === "admin" || role === "manager";
  const canDeleteOrders = role === "admin";
  const canManageFollowUps = role === "admin" || role === "manager";


  // Fetch all dyeing records
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDyeingRecords();
      setOrders(data);
      toast.success("Dyeing orders loaded successfully");
    } catch (error: any) {
      console.error("Failed to fetch dyeing orders:", error);
      toast.error(
        error.response?.data?.message || "Failed to load dyeing orders"
      );
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter orders based on selected filter - UPDATED
  useEffect(() => {
    let filtered = orders;

    switch (filter) {
      case "pending":
        filtered = orders.filter(order => !order.arrivalDate && !isRecordOverdue(order));
        break;
      case "arrived":
        filtered = orders.filter((order) => order.arrivalDate);
        break;
      case "overdue":
        filtered = orders.filter(order => !order.arrivalDate && isRecordOverdue(order));
        break;
      default:
        filtered = orders;
    }

    setFilteredOrders(filtered);
  }, [orders, filter]);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle marking order as arrived
  const handleMarkAsArrived = async (id: number) => {
  try {
    const updatedRecord = await markAsArrived(id);
    console.log('Updated record received:', updatedRecord);
    console.log('Arrival date:', updatedRecord.arrivalDate);
    console.log('Arrival date type:', typeof updatedRecord.arrivalDate);
    
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? updatedRecord : order))
    );
    toast.success("Order marked as arrived successfully");
  } catch (error: any) {
    console.error("Failed to mark as arrived:", error);
    toast.error(error.response?.data?.message || "Failed to update status");
  }
};

  // Enhanced handleDeleteOrder function with better error logging
  const handleDeleteOrder = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this dyeing order? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeletingId(id);
    try {
      console.log('Attempting to delete order with ID:', id);
      console.log('Current token:', localStorage.getItem('token') ? 'Token exists' : 'No token');
      console.log('API URL will be:', `http://localhost:5000/api/dyeing/${id}`);

      await deleteDyeingRecord(id);
      setOrders((prev) => prev.filter((order) => order.id !== id));
      toast.success("Dyeing order deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete order:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });

      // More specific error messages
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to delete this order.");
      } else if (error.response?.status === 404) {
        toast.error("Order not found. It may have been already deleted.");
      } else if (error.response?.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(error.response?.data?.message || "Failed to delete order");
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  // Handle successful order creation
  const handleOrderCreated = (newRecord: DyeingRecord) => {
    setOrders((prev) => [newRecord, ...prev]);
  };

  // Handle follow-up modal
  const handleShowFollowUps = (record: DyeingRecord) => {
    setSelectedRecord(record);
    setShowFollowUpModal(true);
  };

  // Get status color classes
  const getStatusColor = (record: DyeingRecord): string => {
    const status = getDyeingStatus(record);
    switch (status) {
      case "Arrived":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    }
  };

  // Get row background for overdue items
  const getRowBackground = (record: DyeingRecord): string => {
    const status = getDyeingStatus(record);
    return status === "Overdue" ? "bg-red-50 dark:bg-red-900/10" : "";
  };

  // Updated filter counts calculation
  const filterCounts = {
    all: orders.length,
    pending: orders.filter(o => !o.arrivalDate && !isRecordOverdue(o)).length,
    arrived: orders.filter((o) => o.arrivalDate).length,
    overdue: orders.filter(o => !o.arrivalDate && isRecordOverdue(o)).length,
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span className="ml-4 text-lg text-gray-600 dark:text-gray-400">
            Loading dyeing orders...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center text-2xl font-bold text-gray-900 dark:text-white">
            <Package className="mr-3 text-blue-600" size={28} />
            Dyeing Orders
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage yarn dyeing orders and track their progress
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={isLoading}
            className="flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>

          {canCreateOrders && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Create Order
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { key: "all", label: "All Orders", count: filterCounts.all },
            { key: "pending", label: "Pending", count: filterCounts.pending },
            { key: "arrived", label: "Arrived", count: filterCounts.arrived },
            { key: "overdue", label: "Overdue", count: filterCounts.overdue },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </nav>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Yarn Type
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Sent Date
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Expected Arrival
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Arrival Date
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Remarks
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {filteredOrders.map((record) => (
                <tr
                  key={record.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${getRowBackground(
                    record
                  )}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {record.yarnType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <Calendar size={14} className="mr-2 text-gray-400" />
                      {formatSafeDate(record.sentDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <Calendar size={14} className="mr-2 text-blue-500" />
                      {formatSafeDate(record.expectedArrivalDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {record.arrivalDate ? (
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-green-500" />
                          {formatSafeDate(record.arrivalDate, "Invalid arrival date")}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not arrived</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        record
                      )}`}
                    >
                      {getDyeingStatus(record)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs text-sm text-gray-900 truncate dark:text-white">
                      {record.remarks || (
                        <span className="italic text-gray-400">No remarks</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <div className="flex justify-end space-x-2">
                      {/* Follow-up button */}
                      {canManageFollowUps && (
                        <button
                          onClick={() => handleShowFollowUps(record)}
                          className="text-blue-600 transition-colors hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View/Add Follow-ups"
                        >
                          <Eye size={16} />
                        </button>
                      )}

                      {/* Mark as arrived button */}
                      {canUpdateStatus && !record.arrivalDate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsArrived(record.id)}
                          className="text-xs"
                        >
                          Mark Arrived
                        </Button>
                      )}

                      {/* Delete button */}
                      {canDeleteOrders && (
                        <button
                          onClick={() => handleDeleteOrder(record.id)}
                          disabled={isDeletingId === record.id}
                          className="text-red-600 transition-colors hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Order"
                        >
                          {isDeletingId === record.id ? (
                            <div className="w-4 h-4 border-b-2 border-red-500 rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="py-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No {filter !== "all" ? filter : ""} dyeing orders found
            </h3>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              {filter === "all"
                ? "Get started by creating your first dyeing order."
                : `No ${filter} orders at the moment.`}
            </p>
            {canCreateOrders && filter === "all" && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Create First Order
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <CreateDyeingOrderForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleOrderCreated}
      />

      {/* Follow-up Modal */}
      <FollowUpModal
        isOpen={showFollowUpModal}
        onClose={() => {
          setShowFollowUpModal(false);
          setSelectedRecord(null);
        }}
        dyeingRecord={selectedRecord}
        onFollowUpAdded={fetchOrders}
      />
    </div>
  );
};

export default DyeingOrders;