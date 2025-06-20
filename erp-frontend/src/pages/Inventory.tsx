import { useEffect, useState } from "react";
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
} from "../api/inventoryApi";
import { InventoryItem } from "../types/inventory";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

type SortField = "name" | "quantity" | "unitPrice";
type SortOrder = "asc" | "desc";

const Inventory = () => {
  const { user } = useAuth();
  const role = user?.role || "storekeeper";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [form, setForm] = useState<Omit<InventoryItem, "id">>({
    name: "",
    category: "",
    quantity: 0,
    unitPrice: 0,
    location: "",
  });
  const [errors, setErrors] = useState({
    name: false,
    category: false,
    quantity: false,
    unitPrice: false,
    location: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await getInventory();
      setItems(data);
    } catch {
      toast.error("❌ Failed to load inventory");
    }
  };

  const validateForm = () => {
    const nameValid = form.name.trim() !== "";
    const categoryValid = form.category.trim() !== "";
    const quantityValid = form.quantity > 0;
    const unitPriceValid = form.unitPrice >= 0;
    const locationValid = form.location.trim() !== "";

    const newErrors = {
      name: !nameValid,
      category: !categoryValid,
      quantity: !quantityValid,
      unitPrice: !unitPriceValid,
      location: !locationValid,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      toast.error("⚠️ Please fill all fields correctly before submitting.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "manager") return;
    if (!validateForm()) return;

    const loading = toast.loading(editingId ? "Updating item..." : "Adding item...");
    try {
      if (editingId) {
        await updateInventoryItem(editingId, form);
        toast.success("✅ Item updated!");
        setEditingId(null);
      } else {
        await createInventoryItem(form);
        toast.success("✅ Item added!");
      }
      setForm({ name: "", category: "", quantity: 0, unitPrice: 0, location: "" });
      fetchItems();
    } catch {
      toast.error("❌ Operation failed.");
    } finally {
      toast.dismiss(loading);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    if (role === "manager") return;
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      location: item.location,
    });
  };

  const filteredItems = items
    .filter((item) =>
      [item.name, item.category, item.location].some((field) =>
        field.toLowerCase().includes(search.toLowerCase())
      )
    )
    .filter((item) =>
      categoryFilter ? item.category.toLowerCase() === categoryFilter.toLowerCase() : true
    )
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-black dark:text-white px-4 py-6 sm:px-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-white mb-6 text-center sm:text-left">
        Inventory Management
      </h2>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="🔍 Search by name/category/location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2 border px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-gray-900 text-black dark:text-white"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-1/4 border px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-black dark:text-white"
        >
          <option value="">All Categories</option>
          {[...new Set(items.map((item) => item.category))].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Manager Warning */}
      {role === "manager" && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md text-sm">
          👀 View-only access: As a <strong>manager</strong>, you can view inventory but cannot add or update items.
        </div>
      )}

      {/* Form */}
      {role !== "manager" && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-xl shadow"
        >
          {["name", "category", "quantity", "unitPrice", "location"].map((field) => (
            <input
              key={field}
              type={field === "quantity" || field === "unitPrice" ? "number" : "text"}
              value={(form as any)[field]}
              onChange={(e) =>
                setForm({
                  ...form,
                  [field]:
                    field === "quantity" || field === "unitPrice"
                      ? Number(e.target.value)
                      : e.target.value,
                })
              }
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className={`border px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-gray-900 text-black dark:text-white ${
                errors[field as keyof typeof errors]
                  ? "border-red-500 ring-red-300"
                  : "focus:ring-blue-400"
              }`}
            />
          ))}
          <button
            type="submit"
            className={`sm:col-span-2 ${
              role === "manager"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold py-2 rounded-lg shadow transition`}
          >
            {editingId ? "✏️ Update Item" : "➕ Add Item"}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow">
        <table className="min-w-full text-sm text-left border">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-4 py-2 border cursor-pointer" onClick={() => toggleSort("name")}>
                Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-2 border">Category</th>
              <th className="px-4 py-2 border cursor-pointer" onClick={() => toggleSort("quantity")}>
                Quantity {sortField === "quantity" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-2 border cursor-pointer" onClick={() => toggleSort("unitPrice")}>
                Unit Price {sortField === "unitPrice" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-2 border">Location</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50 dark:hover:bg-gray-800 transition">
                <td className="px-4 py-2 border">{item.name}</td>
                <td className="px-4 py-2 border">{item.category}</td>
                <td className="px-4 py-2 border">{item.quantity}</td>
                <td className="px-4 py-2 border">₹{item.unitPrice}</td>
                <td className="px-4 py-2 border">{item.location}</td>
                <td className="px-4 py-2 border">
                  {role !== "manager" && (
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-4 dark:text-gray-400">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
