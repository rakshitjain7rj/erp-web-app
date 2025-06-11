import { useState, useEffect } from "react";
import { getMaterials } from "../api/inventory";
import { createBOM, getBOMs } from "../api/bom";

const BOM = () => {
  const [product, setProduct] = useState("");
  const [materials, setMaterials] = useState([]);
  const [bomItems, setBomItems] = useState<
    { materialId: string; quantity: number }[]
  >([]);
  const [boms, setBOMs] = useState([]);

  const fetchMaterials = async () => {
    const data = await getMaterials();
    setMaterials(data);
  };

  const fetchBOMs = async () => {
    const data = await getBOMs();
    setBOMs(data);
  };

  const handleAddToBOM = (id: string) => {
    const existing = bomItems.find((item) => item.materialId === id);
    if (!existing) {
      setBomItems([...bomItems, { materialId: id, quantity: 0 }]);
    }
  };

  const handleChangeQty = (id: string, qty: number) => {
    setBomItems(
      bomItems.map((item) =>
        item.materialId === id ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBOM({ product, materials: bomItems });
    setProduct("");
    setBomItems([]);
    fetchBOMs();
  };

  useEffect(() => {
    fetchMaterials();
    fetchBOMs();
  }, []);

  return (
    <div>
      <h2>Create BOM</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Product Name"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <div>
          {materials.map((m: any) => (
            <div key={m._id}>
              {m.name}
              <button type="button" onClick={() => handleAddToBOM(m._id)}>
                Add
              </button>
            </div>
          ))}
        </div>

        {bomItems.map((item) => (
          <div key={item.materialId}>
            {materials.find((m: any) => m._id === item.materialId)?.name}
            <input
              type="number"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) =>
                handleChangeQty(item.materialId, Number(e.target.value))
              }
            />
          </div>
        ))}

        <button type="submit">Create BOM</button>
      </form>

      <h3>Existing BOMs:</h3>
      <ul>
        {boms.map((b: any) => (
          <li key={b._id}>{b.product}</li>
        ))}
      </ul>
    </div>
  );
};

export default BOM;
