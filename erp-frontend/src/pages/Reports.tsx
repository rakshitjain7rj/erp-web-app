import { useEffect, useState, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  Legend, LineChart, Line, CartesianGrid
} from "recharts";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

type ProductChartData = { name: string; inventory: number };
type CostChartData = { name: string; value: number };
type RevenueData = { month: string; revenue: number };

const Reports = () => {
  const { user } = useAuth();
  const role = user?.role || "storekeeper";
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement>(null);

  const [productData, setProductData] = useState<ProductChartData[]>([]);
  const [costData, setCostData] = useState<CostChartData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [filterMonths, setFilterMonths] = useState<number>(6);

  // ❌ Redirect storekeeper
  useEffect(() => {
    if (role === "storekeeper") {
      toast.error("⛔ You are not authorized to view Reports.");
      navigate("/dashboard");
    }
  }, [role, navigate]);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    const toastId = toast.loading("📊 Loading report data...");
    try {
      const fetchedProductData = await fetchInventoryData();
      const fetchedCostData = await fetchCostData();
      const fetchedRevenueData = await fetchRevenueData();

      setProductData(fetchedProductData);
      setCostData(fetchedCostData);
      setRevenueData(fetchedRevenueData);

      toast.success("✅ Report data loaded.", { id: toastId });
    } catch {
      toast.error("❌ Failed to load report data.", { id: toastId });
    }
  };

  const fetchInventoryData = async (): Promise<ProductChartData[]> => [
    { name: "Product A", inventory: 120 },
    { name: "Product B", inventory: 80 },
    { name: "Product C", inventory: 45 },
  ];

  const fetchCostData = async (): Promise<CostChartData[]> => [
    { name: "Material", value: 6000 },
    { name: "Labor", value: 4000 },
    { name: "Overhead", value: 2000 },
  ];

  const fetchRevenueData = async (): Promise<RevenueData[]> => {
    const months = [
      "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
      "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025"
    ];
    return months.map((month, index) => ({
      month,
      revenue: 10000 + (11 - index) * 1500,
    }));
  };

  const filteredRevenue = useMemo(
    () => revenueData.slice(-filterMonths),
    [revenueData, filterMonths]
  );

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productData), "Inventory");
    if (role !== "manager") {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(costData), "Costs");
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(revenueData), "Revenue");
    XLSX.writeFile(wb, "Reports.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Reports Summary", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Product", "Inventory"]],
      body: productData.map((p) => [p.name, p.inventory]),
    });

    if (role !== "manager") {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Category", "Cost"]],
        body: costData.map((c) => [c.name, c.value]),
      });
    }

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Month", "Revenue"]],
      body: revenueData.map((r) => [r.month, r.revenue]),
    });

    doc.save("Reports.pdf");
  };

  const downloadChartAsImage = async () => {
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current);
      const link = document.createElement("a");
      link.download = "chart.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <div className="p-6 space-y-8 text-gray-800 dark:text-gray-100 dark:bg-gray-900">
      <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400">📈 Reports Overview</h2>

      {role === "manager" && (
        <div className="p-4 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm">
          ⚠️ As a <strong>Manager</strong>, you have limited access to financial data.
        </div>
      )}

      {/* Export & Filter Controls */}
      <div className="flex gap-4 flex-wrap">
        <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">📤 Export to Excel</button>
        <button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">📄 Export to PDF</button>
        <button onClick={downloadChartAsImage} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg">📸 Save Chart as PNG</button>
        <select
          value={filterMonths}
          onChange={(e) => setFilterMonths(parseInt(e.target.value))}
          className="border px-3 py-2 rounded-md bg-white text-black dark:bg-gray-700 dark:text-white"
        >
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </div>

      {/* Inventory Chart */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">📦 Inventory Levels</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productData}>
            <XAxis dataKey="name" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Bar dataKey="inventory" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Chart - Admin only (not manager/storekeeper) */}
      {role !== "manager" && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">💰 Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={costData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {costData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6" ref={chartRef}>
        <h3 className="text-xl font-semibold mb-4">📉 Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;
