import { useEffect, useState } from "react";
import { getWorkOrders } from "../api/workOrder";
import { calculateCost, getCostByWorkOrder } from "../api/costing";

const Costing = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [workOrderId, setWorkOrderId] = useState("");
  const [materialCost, setMaterialCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [costData, setCostData] = useState<any>(null);

  const fetchOrders = async () => {
    const data = await getWorkOrders();
    setWorkOrders(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await calculateCost({ workOrderId, materialCost, laborCost });
    fetchCost();
  };

  const fetchCost = async () => {
    const data = await getCostByWorkOrder(workOrderId);
    setCostData(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div>
      <h2>Costing</h2>
      <form onSubmit={handleSubmit}>
        <select
          value={workOrderId}
          onChange={(e) => setWorkOrderId(e.target.value)}
        >
          <option value="">Select Work Order</option>
          {workOrders.map((w: any) => (
            <option key={w._id} value={w._id}>
              {w.bom?.product}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Material Cost"
          value={materialCost}
          onChange={(e) => setMaterialCost(Number(e.target.value))}
        />
        <input
          type="number"
          placeholder="Labor Cost"
          value={laborCost}
          onChange={(e) => setLaborCost(Number(e.target.value))}
        />
        <button type="submit">Calculate</button>
      </form>

      {costData && (
        <div>
          <h3>Cost Details:</h3>
          <p>Material Cost: ₹{costData.materialCost}</p>
          <p>Labor Cost: ₹{costData.laborCost}</p>
          <p>Total Cost: ₹{costData.totalCost}</p>
        </div>
      )}
    </div>
  );
};

export default Costing;
