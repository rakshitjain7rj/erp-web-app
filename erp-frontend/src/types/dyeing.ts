// types/dyeing.ts

// ================= DYEING RECORD =================
export interface DyeingRecord {
  id: number;

  // Core fields
  yarnType: string;
  sentDate: string;
  expectedArrivalDate: string; // Expected date of arrival
  arrivalDate?: string;        // Actual arrival (nullable)
  remarks?: string;

  // Party & Firm Info
  partyName: string;
  customerName?: string;    // Customer name (may be different from party name)
  dyeingFirm: string;

  // Order details
  quantity: number;
  shade: string;
  count: string;
  lot: string;

  // Reprocessing Info
  isReprocessing: boolean;
  reprocessingDate?: string;
  reprocessingReason?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Derived (optional frontend flags)
  isOverdue?: boolean;
  status?: "Pending" | "Arrived" | "Overdue" | "Reprocessing"; // <-- ADDED for clarity in filtering

  // Related follow-ups
  followUps?: DyeingFollowUp[];
}

// ================= SIMPLIFIED DISPLAY RECORD =================
export interface SimplifiedDyeingDisplayRecord {
  id: number;
  quantity: number;           // Total quantity ordered
  customerName: string;       // Customer/client name  
  count: string;             // Count value (e.g., "20s", "30s", "Standard")
  sentToDye: number;         // Quantity sent to dyeing firm
  sentDate: string;          // Date when sent to dyeing
  received?: number;         // Quantity received back (optional)
  receivedDate?: string;     // Date when received back (optional)
  dispatch?: number;         // Quantity dispatched to customer (optional)
  dispatchDate?: string;     // Date when dispatched (optional)
  partyNameMiddleman: string; // Party/Middleman handling the order
  dyeingFirm: string;        // Dyeing firm name
  remarks?: string;          // Additional notes
  isReprocessing?: boolean;  // Reprocessing flag
}

// ================= CREATE/UPDATE REQUEST =================
export interface CreateDyeingRecordRequest {
  yarnType: string;
  sentDate: string;
  expectedArrivalDate: string;
  remarks?: string;
  partyName: string;
  customerName?: string;  // Add customerName field
  quantity: number;
  shade: string;
  count: string;
  lot: string;
  dyeingFirm: string;
}

// ================= ARRIVAL UPDATE =================
export interface UpdateArrivalRequest {
  arrivalDate: string;
}

// ================= FOLLOW-UP STRUCTURE =================
export interface DyeingFollowUp {
  id: number;
  dyeingRecordId: number;
  followUpDate: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  addedBy: number;
  addedByName: string;
}

export interface CreateFollowUpRequest {
  remarks: string;
  followUpDate?: string; // Optional: defaults to now if not provided
}

// ================= SUMMARY (for Dashboard) =================
export interface DyeingSummary {
  totalRecords: number;
  pendingRecords: number;
  arrivedRecords: number;
  overdueRecords: number;

  // Helpful aggregations
  recentArrivals: DyeingRecord[];
  upcomingDue: DyeingRecord[]; // Orders arriving in next 3 days
}
