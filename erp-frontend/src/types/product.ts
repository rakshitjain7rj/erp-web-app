export interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  category?: string;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
}
