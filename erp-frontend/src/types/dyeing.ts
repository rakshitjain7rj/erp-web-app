// types/dyeing.ts

export interface DyeingRecord {
  id: number;
  yarnType: string;
  sentDate: string;
  expectedArrivalDate: string; // Used to track when the order is expected
  arrivalDate?: string;        // Set once the order arrives
  isOverdue?: boolean;         // Calculated on backend or frontend helper
  remarks?: string;
  partyName: string;
  quantity: number;
  shade: string;
  count: string;
  lot: string;
  dyeingFirm: string;
  isReprocessing: boolean;
  reprocessingDate?: string;
  reprocessingReason?: string;
  createdAt: string;
  updatedAt: string;
  followUps?: DyeingFollowUp[];
}

// Payload used when creating or updating a dyeing record
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

// Used to update only the arrival date
export interface UpdateArrivalRequest {
  arrivalDate: string;
}

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
  followUpDate?: string; // Optional: default to now if not provided
}

// Aggregated summary for dashboard or status cards
export interface DyeingSummary {
  totalRecords: number;
  pendingRecords: number;
  arrivedRecords: number;
  overdueRecords: number;
  recentArrivals: DyeingRecord[];
  upcomingDue: DyeingRecord[]; // Orders arriving in the next 3 days
}
