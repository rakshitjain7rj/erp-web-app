import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getWorkOrders,
  createWorkOrder,
} from "../api/workOrderApi";
import { getProducts } from "../api/productApi";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

type Product = {
  _id: string;
  name: string;
};

type WorkOrder = {
  _id: string;
  product: Product;
  quantity: number;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
};

const statusColors: Record<WorkOrder["status"], string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const WorkOrders = () => {
  const { user } = useAuth();
  const role = user?.role || user?.originalRole;

  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    productId: "",
    quantity: 0,
    status: "Pending" as WorkOrder["status"],
  });
  const [filters, setFilters] = useState({
    productId: "",
    status: "",
  });
  const [errors, setErrors] = useState({
    productId: false,
    quantity: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  const fetchData = async () => {
    const toastId = toast.loading("🔄 Loading work orders...");
    try {
      const [wo, prod] = await Promise.all([getWorkOrders(), getProducts()]);
      setOrders(wo || []);
      setProducts(prod || []);
      toast.success("✅ Data loaded", { id: toastId });
    } catch {
      toast.error("❌ Failed to fetch data", { id: toastId });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const validateForm = () => {
    const isProductValid = form.productId.trim() !== "";
    const isQuantityValid = Number(form.quantity) > 0;

    const newErrors = {
      productId: !isProductValid,
      quantity: !isQuantityValid,
    };
    setErrors(newErrors);

    if (!isProductValid || !isQuantityValid) {
      toast.error("⚠️ Please select a product and enter a valid quantity.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const toastId = toast.loading("🛠️ Creating work order...");
    try {
      await createWorkOrder(form);
      toast.success("✅ Work order created!", { id: toastId });
      setForm({ productId: "", quantity: 0, status: "Pending" });
      fetchData();
    } catch {
      toast.error("❌ Failed to create work order", { id: toastId });
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredOrders.map((order) => ({
        Product: order.product.name,
        Quantity: order.quantity,
        Status: order.status,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "WorkOrders");
    XLSX.writeFile(workbook, "WorkOrders.xlsx");
  };

  const filteredOrders = orders.filter((order) => {
    const matchesProduct =
      !filters.productId || order.product._id === filters.productId;
    const matchesStatus = !filters.status || order.status === filters.status;
    return matchesProduct && matchesStatus;
  });

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredOrders.length / recordsPerPage);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-blue-700 dark:text-white mb-6">Work Orders</h2>

      {role === "manager" && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm">
          👀 View-only access: As a <strong>manager</strong>, you can view work orders but cannot create or modify them.
        </div>
      )}

      {(role === "admin" || role === "storekeeper") && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 shadow p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <select
            value={form.productId}
            onChange={(e) => {
              setForm({ ...form, productId: e.target.value });
              if (errors.productId) setErrors({ ...errors, productId: false });
            }}
            className={`border p-3 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 text-black dark:text-white ${
              errors.productId
                ? "border-red-500 focus:ring-red-400"
                : "border-gray-300 focus:ring-blue-400"
            }`}
          >
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => {
              setForm({ ...form, quantity: +e.target.value });
              if (errors.quantity) setErrors({ ...errors, quantity: false });
            }}
            className={`border p-3 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
              errors.quantity
                ? "border-red-500 focus:ring-red-400"
                : "border-gray-300 focus:ring-blue-400"
            }`}
          />

          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as WorkOrder["status"] })
            }
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-black dark:text-white"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            type="submit"
            className="col-span-1 md:col-span-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition"
          >
            ➕ Create Work Order
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <select
          value={filters.productId}
          onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
          className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-black dark:text-white"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-black dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow"
        >
          📤 Export to Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow">
        <table className="w-full table-auto border text-sm">
          <thead className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <tr>
              <th className="px-4 py-2 border">Product</th>
              <th className="px-4 py-2 border">Quantity</th>
              <th className="px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length > 0 ? (
              currentOrders.map((order) => (
                <tr
                  key={order._id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 dark:odd:bg-gray-900 dark:even:bg-gray-800 dark:hover:bg-gray-700 transition"
                >
                  <td className="px-4 py-2 border">{order.product?.name}</td>
                  <td className="px-4 py-2 border">{order.quantity}</td>
                  <td className="px-4 py-2 border">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-400">
                  No work orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded-md ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WorkOrders;
