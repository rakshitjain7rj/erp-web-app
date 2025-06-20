// types/dyeing.ts
export interface DyeingRecord {
  id: number;
  yarnType: string;
  sentDate: string; // ISO date string
  arrivalDate?: string | null; // ISO date string, nullable
  isOverdue: boolean;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DyeingFollowUp {
  id: number;
  dyeingRecordId: number;
  followUpDate: string; // ISO date string
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Frontend-specific interfaces
export interface CreateDyeingRecordRequest {
  yarnType: string;
  sentDate: string;
  remarks?: string;
}

export interface UpdateArrivalRequest {
  arrivalDate: string;
}

export interface CreateFollowUpRequest {
  remarks: string;
}

// Combined interface for frontend display
export interface DyeingRecordWithFollowUps extends DyeingRecord {
  followUps?: DyeingFollowUp[];
}

// Status enum for easier management
export enum DyeingStatus {
  PENDING = 'Pending',
  ARRIVED = 'Arrived',
  OVERDUE = 'Overdue'
}

// Summary interface
export interface DyeingSummary {
  total: number;
  pending: number;
  arrived: number;
  overdue: number;
}