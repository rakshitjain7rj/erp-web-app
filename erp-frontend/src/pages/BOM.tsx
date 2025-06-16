import { useEffect, useState } from "react";
import { getBOM, createBOMItem } from "../api/bomApi";
import { getProducts } from "../api/productApi";
import toast from "react-hot-toast";

type BOMItem = {
_id: string;
product: {
_id: string;
name: string;
};
materials: string[];
};

type Product = {
_id: string;
name: string;
};

type SortField = "product" | "materials";
type SortOrder = "asc" | "desc";

const BOM = () => {
const [boms, setBoms] = useState<BOMItem[]>([]);
const [products, setProducts] = useState<Product[]>([]);
const [form, setForm] = useState({ productId: "", materials: "" });
const [errors, setErrors] = useState({ productId: false, materials: false });

const [search, setSearch] = useState("");
const [productFilter, setProductFilter] = useState("");
const [sortField, setSortField] = useState<SortField>("product");
const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

useEffect(() => {
fetchData();
}, []);

const fetchData = async () => {
try {
const [bomData, productData] = await Promise.all([
getBOM(),
getProducts(),
]);
setBoms(bomData || []);
setProducts(productData || []);
} catch {
toast.error("❌ Failed to load BOM or product data.");
}
};

const validateForm = () => {
const productValid = form.productId.trim() !== "";
const materialsValid = form.materials.trim() !== "";

const newErrors = {
  productId: !productValid,
  materials: !materialsValid,
};
setErrors(newErrors);

if (!productValid || !materialsValid) {
  toast.error("⚠️ Please select a product and enter materials.");
  return false;
}

return true;
};

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
if (!validateForm()) return;
const loading = toast.loading("Creating BOM...");
try {
  await createBOMItem({
    productId: form.productId,
    materials: form.materials
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  });

  toast.success("✅ BOM created successfully!");
  setForm({ productId: "", materials: "" });
  fetchData();
} catch {
  toast.error("❌ Failed to create BOM.");
} finally {
  toast.dismiss(loading);
}
};

const toggleSort = (field: SortField) => {
if (sortField === field) {
setSortOrder(sortOrder === "asc" ? "desc" : "asc");
} else {
setSortField(field);
setSortOrder("asc");
}
};

const filteredBOMs = boms
.filter((bom) =>
bom.product?.name.toLowerCase().includes(search.toLowerCase()) ||
bom.materials.join(",").toLowerCase().includes(search.toLowerCase())
)
.filter((bom) =>
productFilter ? bom.product?._id === productFilter : true
)
.sort((a, b) => {
if (sortField === "product") {
const nameA = a.product?.name.toLowerCase() || "";
const nameB = b.product?.name.toLowerCase() || "";
return sortOrder === "asc"
? nameA.localeCompare(nameB)
: nameB.localeCompare(nameA);
} else {
const lenA = a.materials.length;
const lenB = b.materials.length;
return sortOrder === "asc" ? lenA - lenB : lenB - lenA;
}
});

return (
<div className="p-6">
<h2 className="text-3xl font-bold text-blue-700 mb-6">
Bill of Materials (BOM)
</h2>
  {/* Search and Filter */}
  <div className="flex flex-col sm:flex-row gap-4 mb-4">
    <input
      type="text"
      placeholder="🔍 Search by product/material"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full sm:w-1/2 border px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
    <select
      value={productFilter}
      onChange={(e) => setProductFilter(e.target.value)}
      className="w-full sm:w-1/4 border px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <option value="">All Products</option>
      {products.map((product) => (
        <option key={product._id} value={product._id}>
          {product.name}
        </option>
      ))}
    </select>
  </div>

  {/* Form Section */}
  <form
    onSubmit={handleSubmit}
    className="bg-white shadow p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
  >
    <select
      value={form.productId}
      onChange={(e) => {
        setForm({ ...form, productId: e.target.value });
        if (errors.productId) setErrors({ ...errors, productId: false });
      }}
      className={`border p-3 rounded-lg focus:outline-none focus:ring-2 ${
        errors.productId
          ? "border-red-500 focus:ring-red-400"
          : "border-gray-300 focus:ring-blue-400"
      }`}
    >
      <option value="">Select Product</option>
      {products.map((product) => (
        <option key={product._id} value={product._id}>
          {product.name}
        </option>
      ))}
    </select>

    <input
      placeholder="Materials (comma-separated)"
      value={form.materials}
      onChange={(e) => {
        setForm({ ...form, materials: e.target.value });
        if (errors.materials) setErrors({ ...errors, materials: false });
      }}
      className={`border p-3 rounded-lg focus:outline-none focus:ring-2 ${
        errors.materials
          ? "border-red-500 focus:ring-red-400"
          : "border-gray-300 focus:ring-blue-400"
      }`}
    />

    <button
      type="submit"
      className="col-span-1 md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition"
    >
      ➕ Create BOM
    </button>
  </form>

  {/* Table Section */}
  <div className="overflow-x-auto rounded-2xl shadow">
    <table className="w-full table-auto text-sm border">
      <thead className="bg-gray-100 text-gray-700 uppercase">
        <tr>
          <th
            className="px-4 py-2 border cursor-pointer"
            onClick={() => toggleSort("product")}
          >
            Product {sortField === "product" && (sortOrder === "asc" ? "↑" : "↓")}
          </th>
          <th
            className="px-4 py-2 border cursor-pointer"
            onClick={() => toggleSort("materials")}
          >
            Materials {sortField === "materials" && (sortOrder === "asc" ? "↑" : "↓")}
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredBOMs.length > 0 ? (
          filteredBOMs.map((bom) => (
            <tr
              key={bom._id}
              className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition"
            >
              <td className="px-4 py-2 border">{bom.product?.name}</td>
              <td className="px-4 py-2 border">
                {Array.isArray(bom.materials)
                  ? bom.materials.join(", ")
                  : ""}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={2} className="text-center py-4 text-gray-400">
              No BOM records found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
);
};

export default BOM;
