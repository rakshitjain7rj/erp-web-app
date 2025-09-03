import apiClient from './httpClient';
import { Product } from "../types/product"; // Optional: define Product interface here

const basePath = '/products';

// Fetch all products
export const getProducts = async (): Promise<Product[]> => {
  try {
  const res = await apiClient.get(`${basePath}/`);
    return res.data;
  } catch (err) {
    console.error("Error fetching products:", err);
    throw err;
  }
};

// Create a new product
export const createProduct = async (product: { name: string; description: string }): Promise<Product> => {
  try {
  const res = await apiClient.post(`${basePath}/`, product);
    return res.data;
  } catch (err) {
    console.error("Error creating product:", err);
    throw err;
  }
};

// Delete a product by ID
export const deleteProduct = async (id: string): Promise<{ success: boolean }> => {
  try {
  const res = await apiClient.delete(`${basePath}/${id}`);
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
  const res = await apiClient.put(`${basePath}/${id}`, product);
    return res.data;
  } catch (err) {
    console.error(`Error updating product ${id}:`, err);
    throw err;
  }
};
