import React, { useEffect, useState } from "react";
import { getAllDyeingRecords, getDyeingStatus } from "../api/dyeingApi";
import { DyeingRecord } from "../types/dyeing";
import CreateDyeingOrderForm from "../components/CreateDyeingOrderForm";
import { Button } from "../components/ui/Button";
import { ChevronDown, ChevronUp } from "lucide-react";

const DyeingOrders: React.FC = () => {
  const [records, setRecords] = useState<DyeingRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);

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
        return <span className={`${base} bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-300`}>Arrived</span>;
      case "Pending":
        return <span className={`${base} bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-300`}>Pending</span>;
      case "Reprocessing":
        return <span className={`${base} bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-300`}>Reprocessing</span>;
      default:
        return <span className={`${base} bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200`}>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🪨 Dyeing Orders Overview
        </h1>
        <Button onClick={() => setIsFormOpen(true)}>+ Add Dyeing Order</Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByFirm).map(([firm, firmRecords]) => (
          <div key={firm} className="overflow-hidden shadow-lg rounded-2xl dark:shadow-gray-800">
            <div
              onClick={() => setExpandedFirm((f) => (f === firm ? null : firm))}
              className="flex items-center justify-between px-6 py-4 bg-white border-b cursor-pointer dark:bg-gray-800 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700"
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
                      <th className="px-6 py-3">Party</th>
                      <th className="px-6 py-3">Yarn</th>
                      <th className="px-6 py-3">Lot</th>
                      <th className="px-6 py-3">Shade</th>
                      <th className="px-6 py-3">Count</th>
                      <th className="px-6 py-3">Quantity</th>
                      <th className="px-6 py-3">Sent</th>
                      <th className="px-6 py-3">Expected</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-900 dark:text-gray-100">
                    {firmRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="transition border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-3 font-medium">{record.partyName}</td>
                        <td className="px-6 py-3">{record.yarnType}</td>
                        <td className="px-6 py-3">{record.lot}</td>
                        <td className="px-6 py-3">{record.shade}</td>
                        <td className="px-6 py-3">{record.count}</td>
                        <td className="px-6 py-3">{Number(record.quantity).toFixed(2)} kg</td>
                        <td className="px-6 py-3">{new Date(record.sentDate).toLocaleDateString()}</td>
                        <td className="px-6 py-3">{new Date(record.expectedArrivalDate).toLocaleDateString()}</td>
                        <td className="px-6 py-3">{statusBadge(getDyeingStatus(record))}</td>
                        <td className="px-6 py-3 italic text-gray-500 dark:text-gray-400">
                          {record.remarks || "-"}
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
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          fetchRecords();
          setIsFormOpen(false);
        }}
      />
    </div>
  );
};

export default DyeingOrders;
