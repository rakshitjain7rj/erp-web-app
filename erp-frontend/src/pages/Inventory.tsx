import { useState, useEffect } from "react";
import { addMaterial, getMaterials } from "../api/inventory";

const Inventory = () => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [materials, setMaterials] = useState([]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMaterial({ name, quantity });
    setName("");
    setQuantity(0);
    fetchMaterials();
  };

  const fetchMaterials = async () => {
    const data = await getMaterials();
    setMaterials(data);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  return (
    <div>
      <h2>Inventory</h2>
      <form onSubmit={handleAdd}>
        <input
          placeholder="Material Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <button type="submit">Add Material</button>
      </form>

      <ul>
        {materials.map((m: any) => (
          <li key={m._id}>
            {m.name} - {m.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Inventory;
