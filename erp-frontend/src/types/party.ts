export type PartySummary = {
  partyName: string;
  totalOrders: number;
  totalYarn: number;
  pendingYarn: number;
  reprocessingYarn: number;
  arrivedYarn: number;
  lastOrderDate?: string;    // ISO Date String, e.g., "2024-06-30"
  firstOrderDate?: string;   // ISO Date String
};

export type PartyStatistics = {
  totalParties: number;
  partiesWithPending: number;
  partiesWithReprocessing: number;
  partiesWithCompleted: number;
};

// Optional: used in select/dropdown
export type PartyNameOnly = {
  partyName: string;
};

// Optional: detailed party response (e.g., for `/party/:name/details`)
export type PartyDetails = {
  partyName: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  dyeingFirm?: string;
  orders: PartySummary[]; // Or a more specific type if needed
};
