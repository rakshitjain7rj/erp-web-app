// types/dyeing.ts
export interface DyeingRecord {
  id: number;
  yarnType: string;
  sentDate: string;
  expectedArrivalDate: string; // Added this field
  arrivalDate?: string;
  isOverdue?: boolean; // This will be calculated on the backend
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  followUps?: DyeingFollowUp[];
}

export interface CreateDyeingRecordRequest {
  yarnType: string;
  sentDate: string;
  expectedArrivalDate: string; // Added this field
  remarks?: string;
}

export interface UpdateArrivalRequest {
  arrivalDate: string;
}

export interface DyeingFollowUp {
  id: number;
  dyeingRecordId: number;
  followUpDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  remarks: string; // Optional field for additional remarks
}

export interface CreateFollowUpRequest {
  notes: string;
  followUpDate?: string;
}

export interface DyeingSummary {
  totalRecords: number;
  pendingRecords: number;
  arrivedRecords: number;
  overdueRecords: number;
  recentArrivals: DyeingRecord[];
  upcomingDue: DyeingRecord[];
}