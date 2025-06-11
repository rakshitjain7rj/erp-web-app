import { useState, useEffect } from "react";
import { getBOMs } from "../api/bom";
import { createWorkOrder, getWorkOrders } from "../api/workOrder";

const WorkOrders = () => {
  const [bomList, setBOMList] = useState([]);
  const [bomId, setBomId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [orders, setOrders] = useState([]);

  const fetchData = async () => {
    const boms = await getBOMs();
    const works = await getWorkOrders();
    setBOMList(boms);
    setOrders(works);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWorkOrder({ bomId, quantity });
    setBomId("");
    setQuantity(0);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h2>Create Work Order</h2>
      <form onSubmit={handleSubmit}>
        <select value={bomId} onChange={(e) => setBomId(e.target.value)}>
          <option value="">Select BOM</option>
          {bomList.map((b: any) => (
            <option key={b._id} value={b._id}>
              {b.product}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <button type="submit">Create</button>
      </form>

      <h3>Work Orders</h3>
      <ul>
        {orders.map((o: any) => (
          <li key={o._id}>
            {o.bom?.product} - Quantity: {o.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkOrders;
