// src/types/dyeing.ts

export interface DyeingOrder {
  id: string;
  name: string;
  quantity: number;
  sentDate: string;           // ISO date string, e.g., "2025-06-14"
  expectedArrival: string;    // ISO date string
  status: "Pending" | "Arrived" | "Overdue";
}
// src/types/dyeing.ts
export interface FollowUp {
  id: string;
  date: string; // ISO format date
  time: string; // HH:mm format
  notes: string;
}

export interface DyeingOrder {
  id: string;
  name: string;
  quantity: number;
  sentDate: string;
  expectedArrival: string;
  status: "Pending" | "Arrived" | "Overdue";
  followUps?: FollowUp[]; // optional list of follow-ups
}
