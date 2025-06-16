import { BOMItem } from "../types/bom";

/**
 * Fetch all BOM items from the backend.
 */
export const getBOM = async (): Promise<BOMItem[]> => {
  try {
    const res = await fetch("/api/bom");
    if (!res.ok) throw new Error("Failed to fetch BOM items");
    return await res.json();
  } catch (error) {
    console.error("Error fetching BOM items:", error);
    return [];
  }
};

/**
 * Create a new BOM item.
 * @param data - The BOM item data without the `id`.
 */
export const createBOMItem = async (
  data: Omit<BOMItem, "id">
): Promise<BOMItem | null> => {
  try {
    const res = await fetch("/api/bom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create BOM item");
    return await res.json();
  } catch (error) {
    console.error("Error creating BOM item:", error);
    return null;
  }
};
