import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Users, Search, Plus, Archive, RotateCw, MoreVertical, Edit3, Trash2, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllDyeingRecords } from '../api/dyeingApi';
import { deleteParty, archiveParty, downloadPartyAsJSON } from '../api/partyApi';
import AddPartyForm from '../components/AddPartyForm';
import PartyDetailsModal from '../components/PartyDetailsModal';
import EditPartyModal from '../components/EditPartyModal';
import ConfirmationDialog from '../components/ConfirmationDialog';

// ==================== TYPES ====================
interface DyeingRecord {
  id: number;
  partyName: string;
  dyeingFirm: string;
  quantity: number;
  sentDate?: string;
  arrivalDate?: string;
  isReprocessing?: boolean;
  remarks?: string;
}

interface LocalPartySummary {
  partyName: string;
  dyeingFirms: string[];
  totalSent: number;
  totalReceived: number;
  pending: number;
  completed: number;
  reprocessing: number;
  orderCount: number;
}

// ==================== HELPERS ====================
const normalizeKey = (name: string): string => (name || '').trim().toUpperCase();
const toTitle = (name: string): string => 
  name.toLowerCase().split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const parseReceivedFromRemarks = (remarks?: string): number => {
  if (!remarks) return 0;
  const match = remarks.match(/Received:\s*([\d.]+)\s*kg/i);
  return match ? parseFloat(match[1]) : 0;
};

// ==================== MEMOIZED ROW COMPONENT ====================
const PartyRow = React.memo(({ 
  party, 
  onView, 
  onEdit, 
  onDelete, 
  onArchive, 
  onDownload 
}: {
  party: LocalPartySummary;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onDownload: () => void;
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
            {party.partyName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-white">{party.partyName}</span>
            <div className="text-xs text-gray-500">{party.orderCount} orders</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate" title={party.dyeingFirms.join(', ')}>
        {party.dyeingFirms.length > 0 ? party.dyeingFirms.join(', ') : '-'}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-semibold text-gray-900 dark:text-white">{party.totalSent.toFixed(2)}</span>
        <span className="text-xs text-gray-500 ml-1">kg</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
          {party.pending.toFixed(2)} kg
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
          {party.completed.toFixed(2)} kg
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
          -
        </span>
      </td>
      <td className="px-4 py-3 text-center relative">
        <div className="relative inline-block">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
                <button onClick={() => { onView(); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> View Details
                </button>
                <button onClick={() => { onEdit(); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { onDownload(); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export
                </button>
                <button onClick={() => { onArchive(); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600">
                  <Archive className="w-4 h-4" /> Archive
                </button>
                <button onClick={() => { onDelete(); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

// ==================== MAIN COMPONENT ====================
const PartyMaster: React.FC = () => {
  const navigate = useNavigate();
  
  // Core state
  const [dyeingRecords, setDyeingRecords] = useState<DyeingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  
  // Selected party for actions
  const [selectedParty, setSelectedParty] = useState<LocalPartySummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // ==================== DATA FETCHING ====================
  const fetchData = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true);
      
      const records = await getAllDyeingRecords();
      setDyeingRecords(records || []);
      
      if (showRefreshToast) toast.success('Data refreshed');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load party data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== COMPUTED PARTY SUMMARIES ====================
  // Processing = Sent - Received, Completed = Received, Reprocessing = NULL
  const partySummaries = useMemo((): LocalPartySummary[] => {
    const partyMap = new Map<string, LocalPartySummary>();
    
    for (const record of dyeingRecords) {
      const key = normalizeKey(record.partyName);
      if (!key) continue;
      
      const existing = partyMap.get(key);
      const sent = Number(record.quantity) || 0;
      // If arrivalDate exists, the yarn has been received back
      const received = record.arrivalDate ? sent : parseReceivedFromRemarks(record.remarks);
      
      if (existing) {
        existing.totalSent += sent;
        existing.totalReceived += received;
        existing.pending = existing.totalSent - existing.totalReceived; // Processing = Sent - Received
        existing.completed = existing.totalReceived; // Completed = Received
        existing.orderCount += 1;
        if (record.dyeingFirm && !existing.dyeingFirms.includes(record.dyeingFirm)) {
          existing.dyeingFirms.push(record.dyeingFirm);
        }
      } else {
        partyMap.set(key, {
          partyName: toTitle(record.partyName),
          dyeingFirms: record.dyeingFirm ? [record.dyeingFirm] : [],
          totalSent: sent,
          totalReceived: received,
          pending: sent - received, // Processing = Sent - Received
          completed: received, // Completed = Received
          reprocessing: 0, // NULL for now
          orderCount: 1,
        });
      }
    }
    
    return Array.from(partyMap.values()).sort((a, b) => a.partyName.localeCompare(b.partyName));
  }, [dyeingRecords]);

  // ==================== FILTERED SUMMARIES ====================
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return partySummaries;
    const query = searchQuery.toLowerCase();
    return partySummaries.filter(p => 
      p.partyName.toLowerCase().includes(query) ||
      p.dyeingFirms.some(f => f.toLowerCase().includes(query))
    );
  }, [partySummaries, searchQuery]);

  // ==================== TOTALS ====================
  const totals = useMemo(() => {
    return filteredSummaries.reduce((acc, p) => ({
      totalSent: acc.totalSent + p.totalSent,
      pending: acc.pending + p.pending,
      completed: acc.completed + p.completed,
      orderCount: acc.orderCount + p.orderCount,
    }), { totalSent: 0, pending: 0, completed: 0, orderCount: 0 });
  }, [filteredSummaries]);

  // ==================== HANDLERS ====================
  const handleView = useCallback((party: LocalPartySummary) => {
    setSelectedParty(party);
    setShowDetailsModal(true);
  }, []);

  const handleEdit = useCallback((party: LocalPartySummary) => {
    setSelectedParty(party);
    setShowEditModal(true);
  }, []);

  const handleDeleteClick = useCallback((party: LocalPartySummary) => {
    setSelectedParty(party);
    setShowDeleteConfirm(true);
  }, []);

  const handleArchiveClick = useCallback((party: LocalPartySummary) => {
    setSelectedParty(party);
    setShowArchiveConfirm(true);
  }, []);

  const handleDownload = useCallback(async (party: LocalPartySummary) => {
    try {
      const blob = await downloadPartyAsJSON(party.partyName);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${party.partyName}_data.json`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success('Party data exported');
    } catch (error) {
      toast.error('Failed to export party data');
    }
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedParty || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteParty(selectedParty.partyName);
      toast.success(`${selectedParty.partyName} deleted`);
      setShowDeleteConfirm(false);
      setSelectedParty(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete party');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedParty, isDeleting, fetchData]);

  const confirmArchive = useCallback(async () => {
    if (!selectedParty || isArchiving) return;
    setIsArchiving(true);
    try {
      await archiveParty(selectedParty.partyName);
      toast.success(`${selectedParty.partyName} archived`);
      setShowArchiveConfirm(false);
      setSelectedParty(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to archive party');
    } finally {
      setIsArchiving(false);
    }
  }, [selectedParty, isArchiving, fetchData]);

  const handleAddSuccess = useCallback(async (newPartyName?: string) => {
    setShowAddModal(false);
    await fetchData(true);
    if (newPartyName) {
      toast.success(`${newPartyName} added successfully`);
    }
  }, [fetchData]);

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg">Loading Party Master...</span>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Users className="w-7 h-7 text-purple-600" />
          Party Master
        </h1>
        <div className="flex items-center gap-2">
          {refreshing && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400 text-sm">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Refreshing...</span>
            </div>
          )}
          <button
            onClick={() => fetchData(true)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/archived-parties')}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            Archived
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Party
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">{filteredSummaries.length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Parties</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">{totals.totalSent.toFixed(0)} kg</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Sent</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-600">{totals.pending.toFixed(0)} kg</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Processing</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">{totals.completed.toFixed(0)} kg</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Completed</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by party name or dyeing firm..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300">
          Showing {filteredSummaries.length} of {partySummaries.length} parties
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Party</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Dyeing Firms</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total Sent</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Processing</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Completed</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Reprocessing</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No parties found</p>
                  <p className="text-sm mt-1">{searchQuery ? 'Try adjusting your search' : 'Add a new party to get started'}</p>
                </td>
              </tr>
            ) : (
              filteredSummaries.map((party) => (
                <PartyRow
                  key={party.partyName}
                  party={party}
                  onView={() => handleView(party)}
                  onEdit={() => handleEdit(party)}
                  onDelete={() => handleDeleteClick(party)}
                  onArchive={() => handleArchiveClick(party)}
                  onDownload={() => handleDownload(party)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Party Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg mx-4">
            <AddPartyForm
              existingParties={partySummaries.map(p => p.partyName)}
              onSuccess={handleAddSuccess}
              onClose={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedParty && (
        <PartyDetailsModal
          isOpen={showDetailsModal}
          onClose={() => { setShowDetailsModal(false); setSelectedParty(null); }}
          partyName={selectedParty.partyName}
          partySummary={{
            partyName: selectedParty.partyName,
            totalOrders: selectedParty.orderCount,
            totalYarn: selectedParty.totalSent,
            pendingYarn: selectedParty.pending,
            reprocessingYarn: selectedParty.reprocessing,
            arrivedYarn: selectedParty.completed,
          }}
        />
      )}

      {/* Edit Modal */}
      {selectedParty && (
        <EditPartyModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setSelectedParty(null); }}
          partyName={selectedParty.partyName}
          dyeingFirms={selectedParty.dyeingFirms}
          onSuccess={() => { setShowEditModal(false); setSelectedParty(null); fetchData(true); }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Party"
        message={`Are you sure you want to delete "${selectedParty?.partyName}"? This cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => { if (!isDeleting) { setShowDeleteConfirm(false); setSelectedParty(null); } }}
      />

      {/* Archive Confirmation */}
      <ConfirmationDialog
        isOpen={showArchiveConfirm}
        title="Archive Party"
        message={`Archive "${selectedParty?.partyName}"? You can restore it later.`}
        confirmText={isArchiving ? "Archiving..." : "Archive"}
        cancelText="Cancel"
        variant="warning"
        isLoading={isArchiving}
        onConfirm={confirmArchive}
        onCancel={() => { if (!isArchiving) { setShowArchiveConfirm(false); setSelectedParty(null); } }}
      />
    </div>
  );
};

export default PartyMaster;
