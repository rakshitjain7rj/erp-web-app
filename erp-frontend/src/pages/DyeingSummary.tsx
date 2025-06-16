import { useEffect, useState } from "react";
import { DyeingOrder } from "../types/dyeing";
import { isOverdue } from "../lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, isAfter, startOfMonth } from "date-fns";
import { fetchDyeingOrders } from "../api/dyeingApi";
import { Button } from "../components/ui/Button";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const COLORS = ["#facc15", "#22c55e", "#ef4444"];

const DyeingSummary = () => {
  const [orders, setOrders] = useState<DyeingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchDyeingOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load dyeing orders", err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const getFilteredOrders = () => {
    const now = new Date();
    if (filter === "7days") {
      return orders.filter((o) => isAfter(new Date(o.sentDate), subDays(now, 7)));
    } else if (filter === "month") {
      return orders.filter((o) => isAfter(new Date(o.sentDate), startOfMonth(now)));
    }
    return orders;
  };

  const filtered = getFilteredOrders();

  const total = filtered.length;
  const pending = filtered.filter((o) => o.status === "Pending").length;
  const arrived = filtered.filter((o) => o.status === "Arrived").length;
  const overdue = filtered.filter(
    (o) => isOverdue(o.expectedArrival) && o.status !== "Arrived"
  ).length;

  const chartData = [
    { name: "Pending", value: pending },
    { name: "Arrived", value: arrived },
    { name: "Overdue", value: overdue },
  ];

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DyeingSummary");
    XLSX.writeFile(wb, "Dyeing_Summary.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Dyeing Summary Report", 14, 16);
    const tableData = filtered.map((o) => [
      o.name,
      o.quantity,
      format(new Date(o.sentDate), "yyyy-MM-dd"),
      format(new Date(o.expectedArrival), "yyyy-MM-dd"),
      o.status,
    ]);
    doc.autoTable({
      head: [["Yarn", "Quantity", "Sent Date", "Expected Arrival", "Status"]],
      body: tableData,
      startY: 20,
    });
    doc.save("Dyeing_Summary.pdf");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-blue-700 mb-4">Dyeing Summary</h1>

      <div className="mb-4 flex flex-col md:flex-row gap-2 items-start md:items-center justify-between">
        <div className="space-x-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "7days" ? "default" : "outline"} onClick={() => setFilter("7days")}>Last 7 Days</Button>
          <Button variant={filter === "month" ? "default" : "outline"} onClick={() => setFilter("month")}>This Month</Button>
        </div>
        <div className="space-x-2 mt-2 md:mt-0">
          <Button onClick={exportToExcel} variant="outline">Export Excel</Button>
          <Button onClick={exportToPDF} variant="outline">Export PDF</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading summary...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard label="Total Entries" value={total} color="text-blue-600" />
            <SummaryCard label="Pending" value={pending} color="text-yellow-500" />
            <SummaryCard label="Arrived" value={arrived} color="text-green-600" />
            <SummaryCard label="Overdue" value={overdue} color="text-red-600" />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Dyeing Order Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-white p-4 rounded-lg shadow text-center">
    <h2 className="text-lg font-medium">{label}</h2>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

export default DyeingSummary;
