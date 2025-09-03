import axios from "axios";
import { Product } from "../types/product"; // Optional: define Product interface here

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/products`;


const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Fetch all products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const res = await api.get("/");
    return res.data;
  } catch (err) {
    console.error("Error fetching products:", err);
    throw err;
  }
};

// Create a new product
export const createProduct = async (product: { name: string; description: string }): Promise<Product> => {
  try {
    const res = await api.post("/", product);
    return res.data;
  } catch (err) {
    console.error("Error creating product:", err);
    throw err;
  }
};

// Delete a product by ID
export const deleteProduct = async (id: string): Promise<{ success: boolean }> => {
  try {
    const res = await api.delete(`/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Error deleting product ${id}:`, err);
    throw err;
  }
};

// Update a product by ID
export const updateProduct = async (
  id: string,
  product: { name: string; description: string }
): Promise<Product> => {
  try {
    const res = await api.put(`/${id}`, product);
    return res.data;
  } catch (err) {
    console.error(`Error updating product ${id}:`, err);
    throw err;
  }
};
