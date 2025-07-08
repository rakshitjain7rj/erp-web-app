// src/types.ts
export interface DyeingOrder {
  id: string;
  name: string;
  quantity: number;
  sentDate: string;
  expectedArrival: string;
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
