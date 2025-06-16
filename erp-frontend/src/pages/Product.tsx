import { useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/productApi";
import { getCategories } from "../api/categoryApi";
import * as XLSX from "xlsx";

type Product = {
  _id: string;
  name: string;
  description: string;
  category?: string;
};

type Category = {
  _id: string;
  name: string;
};

const itemsPerPage = 5;

const Product = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [errors, setErrors] = useState({ name: false, description: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      const [productData, categoryData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(productData);
      setCategories(categoryData);
    } catch {
      toast.error("❌ Failed to fetch data.");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const validateForm = () => {
    const nameValid = form.name.trim().length >= 2;
    const descValid = form.description.trim().length >= 3;
    setErrors({ name: !nameValid, description: !descValid });
    if (!nameValid || !descValid) {
      toast.error("⚠️ Name (2+) & Description (3+) required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const toastId = toast.loading(editingId ? "Updating..." : "Adding...");
    try {
      if (editingId) {
        await updateProduct(editingId, form);
        toast.success("✅ Updated", { id: toastId });
      } else {
        await createProduct(form);
        toast.success("✅ Added", { id: toastId });
      }
      setForm({ name: "", description: "", category: "" });
      setEditingId(null);
      fetchData();
    } catch {
      toast.error("❌ Operation failed", { id: toastId });
    }
  };

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description, category: p.category || "" });
    setEditingId(p._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      await deleteProduct(id);
      toast.success("✅ Deleted", { id: toastId });
      fetchData();
    } catch {
      toast.error("❌ Delete failed", { id: toastId });
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, products]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [currentPage, filteredProducts]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProducts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products.xlsx");
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6">
        📦 Product Management
      </h2>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="🔍 Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-1/2 border border-gray-300 px-4 py-2 rounded-lg"
        />
        <button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
        >
          📤 Export to Excel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-white p-6 rounded-xl shadow"
      >
        <input
          placeholder="Product Name"
          value={form.name}
          onChange={(e) => handleFormChange("name", e.target.value)}
          className={`w-full border px-4 py-2 rounded-lg focus:ring-2 ${
            errors.name
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-blue-400"
          }`}
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => handleFormChange("description", e.target.value)}
          className={`w-full border px-4 py-2 rounded-lg focus:ring-2 ${
            errors.description
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-blue-400"
          }`}
        />
        <select
          value={form.category}
          onChange={(e) => handleFormChange("category", e.target.value)}
          className="w-full border border-gray-300 px-4 py-2 rounded-lg"
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="sm:col-span-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg shadow"
        >
          {editingId ? "✏️ Update Product" : "➕ Add Product"}
        </button>
      </form>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Description</th>
              <th className="px-4 py-2 border">Category</th>
              <th className="px-4 py-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p) => (
              <tr key={p._id} className="hover:bg-blue-50">
                <td className="px-4 py-2 border">{p.name}</td>
                <td className="px-4 py-2 border">{p.description}</td>
                <td className="px-4 py-2 border">
                  {categories.find((c) => c._id === p.category)?.name || "N/A"}
                </td>
                <td className="px-4 py-2 border text-center">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center px-4 py-6 text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setCurrentPage(n)}
              className={`px-3 py-1 rounded-lg ${
                currentPage === n
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Product;
