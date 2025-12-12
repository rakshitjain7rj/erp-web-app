import React, { useMemo } from 'react';
import { Search, Filter, Package, Building2, Pencil, Trash2, Eye } from 'lucide-react';
import { DyeingRecord } from '../../types/dyeing';
import { CountProduct } from '../../api/countProductApi';

// Helper types
export type PartyStatusSummary = {
  partyName: string;
  dyeingFirms: string[];
  pending: number;
  reprocess: number;
  completed: number;
  totalSent: number;
};

interface PartyDashboardProps {
  records: DyeingRecord[];
  countProducts: CountProduct[];
  partyNames: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEdit: (partyName: string) => void;
  onDelete: (partyName: string) => void;
}

const PartyDashboard: React.FC<PartyDashboardProps> = ({ 
  records, 
  countProducts, 
  partyNames, 
  searchQuery, 
  onSearchChange,
  onEdit,
  onDelete
}) => {
  
  // Process records to get party summaries
  const partySummaries = useMemo(() => {
    const partyMap = new Map<string, PartyStatusSummary>();

    const normalizeKey = (name: string) => name?.trim().toLowerCase() || '';
    const toTitle = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
    const parseReceivedFromRemarks = (remarks?: string) => {
        if (!remarks) return 0;
        
        // Logic from DyeingOrders.tsx to ensure consistency
        const allReceivedMatches = remarks.match(/Received: ([\d.]+)kg/g);
        let finalReceived = 0;

        if (allReceivedMatches && allReceivedMatches.length > 0) {
            // Take the last match
            const lastMatch = allReceivedMatches[allReceivedMatches.length - 1];
            const match = lastMatch.match(/Received: ([\d.]+)kg/);
            if (match) {
                finalReceived = parseFloat(match[1]);
            }
        } else {
             // Fallback to simpler regex if strict format not found, but be careful not to double count
             // This fallback is for legacy or manually entered notes that might miss "kg"
             const simpleMatch = remarks.match(/(?:received|rec|r)[:\s]+(\d+(?:\.\d+)?)/i);
             if (simpleMatch) {
                 finalReceived = parseFloat(simpleMatch[1]);
             }
        }
        
        return finalReceived;
    };

    // Initialize with all known parties
    partyNames.forEach(name => {
      const key = normalizeKey(name);
      if (!key) return;
      
      partyMap.set(key, {
        partyName: name, // Use original name from list
        dyeingFirms: [],
        pending: 0,
        reprocess: 0,
        completed: 0,
        totalSent: 0
      });
    });

    records.forEach(record => {
      if (!record.partyName) return;
      const key = normalizeKey(record.partyName);
      
      const sent = Number(record.quantity) || 0;
      const received = parseReceivedFromRemarks(record.remarks);
      
      if (!partyMap.has(key)) {
        partyMap.set(key, {
          partyName: toTitle(record.partyName),
          dyeingFirms: record.dyeingFirm ? [record.dyeingFirm] : [],
          pending: 0,
          reprocess: 0, // Reserved for future
          completed: 0,
          totalSent: 0
        });
      }

      const party = partyMap.get(key)!;
      party.totalSent += sent;
      
      // Completed is total received quantity (what is received)
      party.completed += received;
      
      // Calculate remaining quantity
      const remaining = Math.max(0, sent - received);

      if (record.isReprocessing) {
        // If marked as reprocessing, the remaining amount is in reprocess
        party.reprocess += remaining;
      } else if (!record.arrivalDate) {
        // If not arrived and not reprocessing, the remaining amount is pending
        party.pending += remaining;
      }
      // If arrived (record.arrivalDate exists), we consider it closed, so no pending/reprocess.
      
      if (record.dyeingFirm && !party.dyeingFirms.includes(record.dyeingFirm)) {
        party.dyeingFirms.push(record.dyeingFirm);
      }
    });

    // Process CountProducts
    countProducts.forEach(product => {
      // Determine party name (middleman takes precedence as per DyeingOrders logic)
      const effectivePartyName = product.middleman || product.partyName;
      if (!effectivePartyName) return;
      
      const key = normalizeKey(effectivePartyName);
      
      // Calculate sent and received
      // If sentToDye is true, use sentQuantity (fallback to quantity). Else 0.
      const sent = Number(product.sentToDye ? (product.sentQuantity ?? product.quantity) : 0) || 0;
      const received = Number(product.received ? (product.receivedQuantity ?? 0) : 0) || 0;
      
      if (!partyMap.has(key)) {
        partyMap.set(key, {
          partyName: toTitle(effectivePartyName),
          dyeingFirms: product.dyeingFirm ? [product.dyeingFirm] : [],
          pending: 0,
          reprocess: 0,
          completed: 0,
          totalSent: 0
        });
      }

      const party = partyMap.get(key)!;
      party.totalSent += sent;
      party.completed += received;
      
      // Pending is Sent - Received
      const remaining = Math.max(0, sent - received);
      party.pending += remaining;
      
      if (product.dyeingFirm && !party.dyeingFirms.includes(product.dyeingFirm)) {
        party.dyeingFirms.push(product.dyeingFirm);
      }
    });

    return Array.from(partyMap.values()).sort((a, b) => a.partyName.localeCompare(b.partyName));
  }, [records, countProducts, partyNames]);

  // Filter based on search
  const filteredParties = useMemo(() => {
    if (!searchQuery.trim()) return partySummaries;
    const query = searchQuery.toLowerCase();
    return partySummaries.filter(p => 
      p.partyName.toLowerCase().includes(query) || 
      p.dyeingFirms.some(f => f.toLowerCase().includes(query))
    );
  }, [partySummaries, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search parties or dyeing firms..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          <span>{filteredParties.length} Parties Found</span>
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 font-semibold">Party Name</th>
                <th className="px-6 py-3 font-semibold">Dyeing Firms</th>
                <th className="px-6 py-3 font-semibold text-right">Pending (kg)</th>
                <th className="px-6 py-3 font-semibold text-right">Reprocess (kg)</th>
                <th className="px-6 py-3 font-semibold text-right">Completed (kg)</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredParties.length > 0 ? (
                filteredParties.map((party) => (
                  <tr 
                    key={party.partyName}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-500" />
                        {party.partyName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {party.dyeingFirms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {party.dyeingFirms.map((firm, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              {firm}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No active firms</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${party.pending > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500'}`}>
                        {Number(party.pending).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${party.completed > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {Number(party.completed).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(party.partyName)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="View/Edit Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(party.partyName)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete Party"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-medium">No parties found</p>
                      <p className="text-sm">Try adjusting your search or add a new party.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartyDashboard;
