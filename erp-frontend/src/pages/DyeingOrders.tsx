// DyeingOrders.tsx
import React, { useEffect, useState } from "react";
import {
  getAllDyeingRecords,
  deleteDyeingRecord,
  getDyeingStatus,
  markAsArrived,
  completeReprocessing
} from "../api/dyeingApi";
import { DyeingRecord } from "../types/dyeing";
import CreateDyeingOrderForm from "../components/CreateDyeingOrderForm";
import { Button } from "../components/ui/Button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FaEdit, FaTrash, FaBell, FaCheckCircle, FaRecycle } from "react-icons/fa";
import { toast } from "sonner";
import FollowUpModal from "../components/FollowUpModal";

const DyeingOrders: React.FC = () => {
  const [records, setRecords] = useState<DyeingRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<DyeingRecord | null>(null);
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DyeingRecord | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const data = await getAllDyeingRecords();
      setRecords(data);
    } catch (error) {
      console.error("Failed to fetch dyeing records:", error);
    }
  };

  const groupedByFirm = records.reduce((acc, record) => {
    if (!acc[record.dyeingFirm]) acc[record.dyeingFirm] = [];
    acc[record.dyeingFirm].push(record);
    return acc;
  }, {} as Record<string, DyeingRecord[]>);

  const statusBadge = (status: string) => {
    const base = "px-3 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case "Arrived":
        return <span className={`${base} bg-emerald-100 text-emerald-600`}>Arrived</span>;
      case "Pending":
        return <span className={`${base} bg-yellow-100 text-yellow-600`}>Pending</span>;
      case "Reprocessing":
        return <span className={`${base} bg-orange-100 text-orange-600`}>Reprocessing</span>;
      default:
        return <span className={`${base} bg-gray-200 text-gray-700`}>{status}</span>;
    }
  };

  const handleEdit = (record: DyeingRecord) => {
    setRecordToEdit(record);
    setIsFormOpen(true);
  };

  const handleDelete = async (record: DyeingRecord) => {
    const confirmed = window.confirm(`Are you sure you want to delete order for ${record.partyName}?`);
    if (!confirmed) return;

    try {
      await deleteDyeingRecord(record.id);
      toast.success("Record deleted!");
      fetchRecords();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete");
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

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🪨 Dyeing Orders Overview</h1>
        <Button onClick={() => { setRecordToEdit(null); setIsFormOpen(true); }}>
          + Add Dyeing Order
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByFirm).map(([firm, firmRecords]) => (
          <div key={firm} className="overflow-hidden shadow-lg rounded-2xl dark:shadow-gray-800">
            <div
              onClick={() => setExpandedFirm((f) => (f === firm ? null : firm))}
              className="flex items-center justify-between px-6 py-4 bg-white border-b cursor-pointer dark:bg-gray-800 dark:border-gray-700 hover:bg-purple-50"
            >
              <h2 className="text-xl font-semibold text-purple-700 dark:text-purple-400">
                {firm} ({firmRecords.length} {firmRecords.length === 1 ? "order" : "orders"})
              </h2>
              {expandedFirm === firm ? <ChevronUp /> : <ChevronDown />}
            </div>

            {expandedFirm === firm && (
              <div className="overflow-x-auto bg-white dark:bg-gray-800">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-600 border-b dark:text-gray-300 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-2">Party</th>
                      <th className="px-4 py-2">Yarn</th>
                      <th className="px-4 py-2">Lot</th>
                      <th className="px-4 py-2">Shade</th>
                      <th className="px-4 py-2">Count</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">Sent</th>
                      <th className="px-4 py-2">Expected</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Remarks</th>
                      <th className="px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-900 dark:text-gray-100">
                    {firmRecords.map((record) => (
                      <tr key={record.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-2">{record.partyName}</td>
                        <td className="px-4 py-2">{record.yarnType}</td>
                        <td className="px-4 py-2">{record.lot}</td>
                        <td className="px-4 py-2">{record.shade}</td>
                        <td className="px-4 py-2">{record.count}</td>
                        <td className="px-4 py-2">{Number(record.quantity).toFixed(2)} kg</td>
                        <td className="px-4 py-2">{new Date(record.sentDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{new Date(record.expectedArrivalDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{statusBadge(getDyeingStatus(record))}</td>
                        <td className="px-4 py-2 italic text-gray-500 dark:text-gray-400">{record.remarks || "-"}</td>
                        <td className="px-4 py-2 flex flex-wrap justify-center items-center gap-2 max-w-[200px]">
                          <button onClick={() => handleEdit(record)} title="Edit"><FaEdit /></button>
                          <button onClick={() => handleDelete(record)} title="Delete"><FaTrash /></button>
                          <button onClick={() => handleFollowUp(record)} title="Follow Up"><FaBell /></button>
                          <button onClick={() => handleMarkArrived(record)} title="Mark Arrived"><FaCheckCircle /></button>
                          <button onClick={() => handleReprocessing(record)} title="Reprocessing"><FaRecycle /></button>
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

      <CreateDyeingOrderForm
        isOpen={isFormOpen}
        recordToEdit={recordToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setRecordToEdit(null);
        }}
        onSuccess={() => {
          fetchRecords();
          setIsFormOpen(false);
          setRecordToEdit(null);
        }}
      />

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
