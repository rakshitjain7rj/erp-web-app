import { useEffect, useState } from "react";
import { getBOM, createBOM, deleteBOM } from "../api/bomApi";
import { getProducts } from "../api/productApi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

type Product = {
  _id: string;
  name: string;
};

type BOM = {
  _id: string;
  product: Product;
  materials: { name: string; quantity: number }[];
};

const BOM = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [products, setProducts] = useState<Product[]>([]);
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [form, setForm] = useState({
    productId: "",
    materials: [{ name: "", quantity: 0 }],
  });

  const fetchData = async () => {
    try {
      const [prod, bom] = await Promise.all([getProducts(), getBOM()]);
      setProducts(prod || []);
      setBOMs(bom || []);
    } catch {
      toast.error("❌ Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMaterialChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...form.materials];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, materials: updated });
  };

  const addMaterialField = () => {
    setForm({ ...form, materials: [...form.materials, { name: "", quantity: 0 }] });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this BOM?")) {
      try {
        await deleteBOM(id);
        toast.success("🗑️ BOM deleted successfully");
        fetchData();
      } catch {
        toast.error("❌ Failed to delete BOM");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBOM(form);
      toast.success("✅ BOM created!");
      setForm({ productId: "", materials: [{ name: "", quantity: 0 }] });
      fetchData();
    } catch {
      toast.error("❌ Failed to create BOM");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-6">
        Bill of Materials
      </h2>

      {role === "manager" && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md text-sm dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-100">
          👀 View-only access: As a <strong>manager</strong>, you can view BOM records but cannot create new entries.
        </div>
      )}

      {(role === "admin" || role === "storekeeper") && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-xl shadow"
        >
          <select
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            className="border p-3 rounded-lg col-span-1 sm:col-span-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {form.materials.map((material, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Material Name"
                value={material.name}
                onChange={(e) =>
                  handleMaterialChange(index, "name", e.target.value)
                }
                className="flex-1 border p-2 rounded dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
              <input
                type="number"
                placeholder="Qty"
                value={material.quantity}
                onChange={(e) =>
                  handleMaterialChange(index, "quantity", +e.target.value)
                }
                className="w-24 border p-2 rounded dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
          ))}

          <div className="col-span-1 sm:col-span-2 flex justify-between">
            <button
              type="button"
              onClick={addMaterialField}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              ➕ Add Material
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
            >
              Create BOM
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Materials</th>
              {(role === "admin" || role === "storekeeper") && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {boms.length > 0 ? (
              boms.map((bom) => (
                <tr
                  key={bom._id}
                  className="border-t dark:border-gray-700 odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800"
                >
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{bom.product.name}</td>
                  <td className="p-3">
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-200">
                      {bom.materials.map((m, idx) => (
                        <li key={idx}>
                          {m.name} - {m.quantity}
                        </li>
                      ))}
                    </ul>
                  </td>
                  {(role === "admin" || role === "storekeeper") && (
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(bom._id)}
                        className="text-red-600 hover:underline text-sm dark:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-400 dark:text-gray-500">
                  No BOMs available.
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
