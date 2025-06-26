import React, { useEffect, useState, useMemo, useRef } from "react";
import { format, isValid, startOfMonth, subDays } from "date-fns";
import toast from "react-hot-toast";
import { Bar } from "react-chartjs-2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import "chart.js/auto";
import { getDyeingSummary } from "../api/dyeingApi";

type DyeingOrder = {
  id: string;
  product: string;
  sentDate: string;
  expectedArrival: string;
  status: "Pending" | "Arrived" | "Reprocessing";
};

const isOverdue = (expectedDate: string) => {
  const date = new Date(expectedDate);
  return isValid(date) && date < new Date();
};

const DyeingSummary = () => {
  const [orders, setOrders] = useState<DyeingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "7days" | "month">("all");

  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const getDateRange = () => {
    const now = new Date();
    if (filter === "7days") {
      return { startDate: subDays(now, 7).toISOString(), endDate: now.toISOString() };
    } else if (filter === "month") {
      return { startDate: startOfMonth(now).toISOString(), endDate: now.toISOString() };
    }
    return {};
  };
  const fetchOrders = async () => {
    setLoading(true);
    const toastId = toast.loading("📦 Fetching summary...");
    try {
      const { startDate, endDate } = getDateRange();
      const raw = await getDyeingSummary(startDate, endDate);
      const transformed = raw
        .filter((item: Record<string, unknown>) => item.sentDate && item.expectedArrival)
        .map((item: Record<string, unknown>) => ({
          id: String(item.id),
          product: item.product || "Unknown",
          sentDate: item.sentDate as string,
          expectedArrival: item.expectedArrival as string,
          status: item.status as "Pending" | "Arrived" | "Reprocessing",
        }));
      setOrders(transformed);
      toast.success("✅ Summary loaded", { id: toastId });
    } catch {
      toast.error("❌ Failed to load summary", { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filteredOrders = useMemo(() => orders, [orders]);
  const total = filteredOrders.length;
  const pending = filteredOrders.filter(o => o.status === "Pending").length;
  const arrived = filteredOrders.filter(o => o.status === "Arrived").length;
  const overdue = filteredOrders.filter(o => isOverdue(o.expectedArrival) && o.status !== "Arrived").length;

  const exportList = (data: DyeingOrder[], sheetName: string, fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  };  const exportPDF = (ref: React.RefObject<HTMLDivElement | null>, name: string) => {
    if (!ref.current) return;
    html2canvas(ref.current).then(canvas => {
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const prop = pdf.getImageProperties(img);
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (prop.height * pdfW) / prop.width;
      pdf.addImage(img, "PNG", 10, 10, pdfW - 20, pdfH);
      pdf.save(name);
    });
  };
  const chartData = {
    labels: ["Total", "Pending", "Arrived", "Overdue"],
    datasets: [{ data: [total, pending, arrived, overdue], backgroundColor: ["#60a5fa", "#facc15", "#4ade80", "#f87171"] }]
  };
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4">🎨 Dyeing Summary</h2>

      {/* Filter and Export */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <label className="font-medium">Filter by:</label>        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | "7days" | "month")}
          className="border rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All</option>
          <option value="7days">Last 7 Days</option>
          <option value="month">This Month</option>
        </select>        <button
          onClick={() => exportList(filteredOrders, "Data", "DyeingData.xlsx")}
          className="bg-blue-500 text-white px-3 py-1 rounded"
          title="Export to Excel"
        >📊 Excel</button>

        <button
          onClick={() => exportPDF(tableRef, "DyeingData.pdf")}
          className="bg-red-500 text-white px-3 py-1 rounded"
          title="Export to PDF"
        >🧾 PDF</button>

        <button
          onClick={() => exportPDF(chartRef, "DyeingChart.png")}
          className="bg-green-600 text-white px-3 py-1 rounded"
          title="Export as PNG"
        >🖼 PNG</button>      </div>

      {/* Chart and Table */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[{ title: "Total", count: total, color: "bg-blue-100 text-blue-700" },
              { title: "Pending", count: pending, color: "bg-yellow-100 text-yellow-700" },
              { title: "Arrived", count: arrived, color: "bg-green-100 text-green-700" },
              { title: "Overdue", count: overdue, color: "bg-red-100 text-red-700" }
            ].map((c, i) => <SummaryCard key={i} {...c} />)}
          </div>

          <div ref={chartRef} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-8 max-w-2xl">
            <Bar data={chartData} />
          </div>

          <div ref={tableRef} className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">
                <tr>
                  <th className="p-3 border">Product</th>
                  <th className="p-3 border">Sent Date</th>
                  <th className="p-3 border">Expected Arrival</th>
                  <th className="p-3 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="bg-white dark:bg-gray-900">
                    <td className="p-3 border">{o.product}</td>
                    <td className="p-3 border">{format(new Date(o.sentDate), "dd MMM yyyy")}</td>
                    <td className="p-3 border">{format(new Date(o.expectedArrival), "dd MMM yyyy")}</td>
                    <td className="p-3 border">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        o.status === "Arrived" ? "bg-green-200 text-green-800" :
                        isOverdue(o.expectedArrival) ? "bg-red-200 text-red-800" :
                        "bg-yellow-200 text-yellow-800"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>          </div>
        </>
      )}
    </div>
  );
};

const SummaryCard = ({
  title,
  count,
  color
}: {
  title: string;
  count: number;
  color: string;
}) => (
  <div className={`p-5 rounded-xl shadow-sm ${color}`}>
    <h4 className="text-lg font-semibold">{title}</h4>
    <p className="text-3xl font-bold mt-2">{count}</p>
  </div>
);

export default DyeingSummary;
