import React, { useEffect, useState, useRef } from "react"; 
import {
  getAllDyeingRecords,
  deleteDyeingRecord,
  getDyeingStatus,
  markAsArrived,
  completeReprocessing,
} from "../api/dyeingApi";
import { DyeingRecord } from "../types/dyeing";
import CreateDyeingOrderForm from "../components/CreateDyeingOrderForm";
import { Button } from "../components/ui/Button";
import { ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import FollowUpModal from "../components/FollowUpModal";
import { exportDataToCSV } from "../utils/exportUtils";
import ActionDropdown from "../components/ActionDropdown";

const DyeingOrders: React.FC = () => {
  const [records, setRecords] = useState<DyeingRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<DyeingRecord | null>(null);
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DyeingRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [firmFilter, setFirmFilter] = useState<string>("");
  const [partyFilter, setPartyFilter] = useState<string>("");

  const [openDropdownRecord, setOpenDropdownRecord] = useState<DyeingRecord | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleActionClick = (
    record: DyeingRecord,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownWidth = 180;
    const dropdownHeight = dropdownRef.current?.offsetHeight || 250;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < dropdownHeight;

    setDropdownPosition({
      top: openAbove
        ? rect.top + window.scrollY - dropdownHeight
        : rect.bottom + window.scrollY,
      left: rect.left + window.scrollX - dropdownWidth + 32,
    });

    setOpenDropdownRecord(openDropdownRecord?.id === record.id ? null : record);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownRecord(null);
      }
    };
    if (openDropdownRecord) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownRecord]);

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
  const uniqueFirms = Array.from(new Set(records.map((r) => r.dyeingFirm)));
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
    setRecordToEdit(record);
    setIsFormOpen(true);
    setOpenDropdownRecord(null);
  };

  const handleDelete = async (record: DyeingRecord) => {
    const confirmed = window.confirm(`Are you sure you want to delete order for ${record.partyName}?`);
    if (!confirmed) return;
    try {
      await deleteDyeingRecord(record.id);
      toast.success("Record deleted!");
      fetchRecords();
      setOpenDropdownRecord(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete");
    }
  };

  const handleFollowUp = (record: DyeingRecord) => {
    setSelectedRecord(record);
    setIsFollowUpModalOpen(true);
    setOpenDropdownRecord(null);
  };

  const handleMarkArrived = async (record: DyeingRecord) => {
    try {
      await markAsArrived(record.id);
      toast.success("Marked as Arrived");
      fetchRecords();
      setOpenDropdownRecord(null);
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
      setOpenDropdownRecord(null);
    } catch (error) {
      console.error("Reprocessing error:", error);
      toast.error("Failed to complete reprocessing");
    }
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
          <Button onClick={() => { setRecordToEdit(null); setIsFormOpen(true); }}>+ Add Dyeing Order</Button>
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
              <div className="overflow-x-auto bg-white dark:bg-gray-800" id="dyeing-orders-table">
                <table className="min-w-full text-sm">
                  <thead className="text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
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
                  <tbody className="text-gray-900 dark:text-white">
                    {firmRecords.map((record) => {
                      const status = getDyeingStatus(record);
                      return (
                        <tr key={record.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-2">{record.partyName}</td>
                          <td className="px-4 py-2">{record.yarnType}</td>
                          <td className="px-4 py-2">{record.lot}</td>
                          <td className="px-4 py-2">{record.shade}</td>
                          <td className="px-4 py-2">{record.count}</td>
                          <td className="px-4 py-2">{record.quantity} kg</td>
                          <td className="px-4 py-2">{new Date(record.sentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{new Date(record.expectedArrivalDate).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{statusBadge(status)}</td>
                          <td className="px-4 py-2 italic text-gray-500 dark:text-gray-400">{record.remarks || "-"}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              onClick={(e) => handleActionClick(record, e)}
                            >
                              <MoreVertical />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

        {openDropdownRecord && (
        <div
          ref={dropdownRef}
          className="fixed z-[1000] w-[180px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          <ActionDropdown
            onEdit={() => handleEdit(openDropdownRecord)}
            onDelete={() => handleDelete(openDropdownRecord)}
            onFollowUp={() => handleFollowUp(openDropdownRecord)}
            onMarkArrived={() => handleMarkArrived(openDropdownRecord)}
            onReprocessing={() => handleReprocessing(openDropdownRecord)}
          />
        </div>
      )}

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