import React, { useEffect, useState, useMemo } from "react";
import { format, isAfter, subDays, startOfMonth } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

type DyeingOrder = {
  id: string;
  product: string;
  sentDate: string;
  expectedArrival: string;
  status: "Pending" | "Arrived";
};

const isOverdue = (expectedDate: string) => {
  return new Date(expectedDate) < new Date();
};

const DyeingSummary = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [orders, setOrders] = useState<DyeingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
      const toastId = toast.loading("📦 Fetching dyeing orders...");
      try {
        const res = await fetch("/api/dyeing");
        const data = await res.json();
        setOrders(data || []);
        toast.success("✅ Dyeing orders loaded", { id: toastId });
      } catch (error) {
        toast.error("❌ Failed to load dyeing orders", { id: toastId });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    const now = new Date();
    if (filter === "7days") {
      return orders.filter((o) => isAfter(new Date(o.sentDate), subDays(now, 7)));
    } else if (filter === "month") {
      return orders.filter((o) => isAfter(new Date(o.sentDate), startOfMonth(now)));
    }
    return orders;
  }, [orders, filter]);

  const total = filtered.length;
  const pending = filtered.filter((o) => o.status === "Pending").length;
  const arrived = filtered.filter((o) => o.status === "Arrived").length;
  const overdue = filtered.filter(
    (o) => isOverdue(o.expectedArrival) && o.status !== "Arrived"
  ).length;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4">🎨 Dyeing Summary</h2>

      <div className="flex items-center gap-4 mb-6">
        <label className="font-medium">Filter by:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All</option>
          <option value="7days">Last 7 Days</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">Loading summary...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard title="Total Orders" count={total} color="bg-blue-100 text-blue-700" />
          <SummaryCard title="Pending" count={pending} color="bg-yellow-100 text-yellow-700" />
          <SummaryCard title="Arrived" count={arrived} color="bg-green-100 text-green-700" />
          <SummaryCard title="Overdue" count={overdue} color="bg-red-100 text-red-700" />
        </div>
      )}

      {/* Table Preview */}
      {!loading && filtered.length > 0 && (
        <div className="mt-8 overflow-x-auto">
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
              {filtered.map((order) => (
                <tr key={order.id} className="bg-white dark:bg-gray-900">
                  <td className="p-3 border">{order.product}</td>
                  <td className="p-3 border">{format(new Date(order.sentDate), "dd MMM yyyy")}</td>
                  <td className="p-3 border">
                    {format(new Date(order.expectedArrival), "dd MMM yyyy")}
                  </td>
                  <td className="p-3 border">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "Arrived"
                          ? "bg-green-200 text-green-800"
                          : isOverdue(order.expectedArrival)
                          ? "bg-red-200 text-red-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({
  title,
  count,
  color,
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
