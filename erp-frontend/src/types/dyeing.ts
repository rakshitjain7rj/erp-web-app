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

  // Related follow-ups
  followUps?: DyeingFollowUp[];
}

// ================= CREATE/UPDATE REQUEST =================
export interface CreateDyeingRecordRequest {
  yarnType: string;
  sentDate: string;
  expectedArrivalDate: string;
  remarks?: string;
  partyName: string;
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
