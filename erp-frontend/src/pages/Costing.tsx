import { useEffect, useState } from "react";
import { getWorkOrders } from "../types/workOrder";
import { calculateCost, getCostByWorkOrder } from "../types/costing";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

type WorkOrder = {
  _id: string;
  bom?: {
    product: string;
  };
};

type CostData = {
  workOrderId: string;
  productName: string;
  materialCost: number;
  laborCost: number;
  totalCost: number;
};

const Costing = () => {
  const { user } = useAuth();

  if (user?.role === "manager" || user?.role === "storekeeper") {
    toast.error("⛔ You are not authorized to access Costing.");
    return <Navigate to="/unauthorized" replace />;
  }

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workOrderId, setWorkOrderId] = useState("");
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [costList, setCostList] = useState<CostData[]>([]);

  const [errors, setErrors] = useState({
    workOrderId: false,
    materialCost: false,
    laborCost: false,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const toastId = toast.loading("🔄 Loading work orders...");
    try {
      const data = await getWorkOrders();
      setWorkOrders(data || []);
      toast.success("✅ Work orders loaded.", { id: toastId });
    } catch {
      toast.error("❌ Failed to load work orders.", { id: toastId });
    }
  };

  const validateForm = () => {
    const isValidWorkOrder = workOrderId.trim() !== "";
    const isValidMaterialCost = materialCost >= 0;
    const isValidLaborCost = laborCost >= 0;

    const newErrors = {
      workOrderId: !isValidWorkOrder,
      materialCost: !isValidMaterialCost,
      laborCost: !isValidLaborCost,
    };
    setErrors(newErrors);

    if (!isValidWorkOrder || !isValidMaterialCost || !isValidLaborCost) {
      toast.error("⚠️ Please fill all fields with valid data.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const toastId = toast.loading("🧮 Calculating cost...");
    try {
      await calculateCost({ workOrderId, materialCost, laborCost });
      const costData = await getCostByWorkOrder(workOrderId);

      const productName =
        workOrders.find((wo) => wo._id === workOrderId)?.bom?.product || "Unnamed";

      const newCost: CostData = {
        workOrderId,
        productName,
        materialCost: costData.materialCost,
        laborCost: costData.laborCost,
        totalCost: costData.totalCost,
      };

      setCostList((prev) => [...prev, newCost]);

      toast.success("✅ Cost calculated and added to list!", { id: toastId });

      setWorkOrderId("");
      setMaterialCost(0);
      setLaborCost(0);
    } catch {
      toast.error("❌ Failed to calculate or fetch cost.", { id: toastId });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-6">
        Costing Overview
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 shadow-md rounded-2xl p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <select
          value={workOrderId}
          onChange={(e) => {
            setWorkOrderId(e.target.value);
            if (errors.workOrderId) setErrors({ ...errors, workOrderId: false });
          }}
          className={`p-3 rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
            errors.workOrderId
              ? "border-red-500 focus:ring-red-400"
              : "border border-gray-300 dark:border-gray-600 focus:ring-blue-400"
          }`}
        >
          <option value="">Select Work Order</option>
          {workOrders.map((wo) => (
            <option key={wo._id} value={wo._id}>
              {wo.bom?.product || "Unnamed Product"}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Material Cost"
          value={materialCost}
          onChange={(e) => {
            setMaterialCost(Number(e.target.value));
            if (errors.materialCost) setErrors({ ...errors, materialCost: false });
          }}
          className={`p-3 rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
            errors.materialCost
              ? "border-red-500 focus:ring-red-400"
              : "border border-gray-300 dark:border-gray-600 focus:ring-blue-400"
          }`}
        />

        <input
          type="number"
          placeholder="Labor Cost"
          value={laborCost}
          onChange={(e) => {
            setLaborCost(Number(e.target.value));
            if (errors.laborCost) setErrors({ ...errors, laborCost: false });
          }}
          className={`p-3 rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
            errors.laborCost
              ? "border-red-500 focus:ring-red-400"
              : "border border-gray-300 dark:border-gray-600 focus:ring-blue-400"
          }`}
        />

        <button
          type="submit"
          className="col-span-1 md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition"
        >
          🧮 Calculate
        </button>
      </form>

      {costList.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 shadow rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-4">
            Cost Summary List
          </h3>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="border px-4 py-2 text-left">Product</th>
                <th className="border px-4 py-2 text-left">Material Cost</th>
                <th className="border px-4 py-2 text-left">Labor Cost</th>
                <th className="border px-4 py-2 text-left">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {costList.map((cost) => (
                <tr
                  key={cost.workOrderId}
                  className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800"
                >
                  <td className="border px-4 py-2">{cost.productName}</td>
                  <td className="border px-4 py-2">₹{cost.materialCost}</td>
                  <td className="border px-4 py-2">₹{cost.laborCost}</td>
                  <td className="border px-4 py-2 font-bold text-green-700 dark:text-green-400">
                    ₹{cost.totalCost}
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

export default Costing;
