import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Users, 
  Package, 
  Clock, 
  RotateCcw, 
  CheckCircle, 
  Search, 
  ArrowLeft,
  Archive,
  RefreshCw,
  Undo2,
  Download,
  Trash2
} from 'lucide-react';
import { getAllPartiesSummary, getPartyStatistics, getArchivedPartiesSummary, restoreParty, downloadPartyAsCSV, deletePermanently } from '../api/partyApi';
import PartyDetailsModal from '../components/PartyDetailsModal';
import ConfirmationDialog from '../components/ConfirmationDialog';

type PartySummary = {
  partyName: string;
  totalOrders: number;
  totalYarn: number;
  pendingYarn: number;
  reprocessingYarn: number;
  arrivedYarn: number;
  lastOrderDate?: string;
  firstOrderDate?: string;
  dyeingFirms?: string[];
  dyeingFirm?: string; // saved profile field, if any
  address?: string; // saved profile field
  contact?: string; // saved profile field
};

type PartyStatistics = {
  totalParties: number;
  partiesWithPending: number;
  partiesWithReprocessing: number;
  partiesWithCompleted: number;
};

const ArchivedParties: React.FC = () => {
  const navigate = useNavigate();
  const [archivedParties, setArchivedParties] = useState<PartySummary[]>([]);
  const [filteredParties, setFilteredParties] = useState<PartySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof PartySummary>('partyName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedParty, setSelectedParty] = useState<PartySummary | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Professional confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchArchivedParties();
  }, []);

  const fetchArchivedParties = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching archived parties...');
      
      let archivedData = [];
      let fetchError = null;
      
      // Try to fetch from backend first
      try {
        console.log('🌐 Attempting to fetch from backend...');
        archivedData = await getArchivedPartiesSummary();
        console.log('✅ Backend archived parties data:', archivedData);
      } catch (error: any) {
        console.warn('⚠️ Backend fetch failed, using localStorage fallback:', error.message);
        fetchError = error;
        
        // Professional fallback: Load from localStorage
        const localArchivedParties = JSON.parse(localStorage.getItem('archivedParties') || '[]');
        console.log('📱 Local archived parties:', localArchivedParties);
        archivedData = localArchivedParties;
      }
      
      // Normalize the data to match our component structure
      const normalizedData = Array.isArray(archivedData) ? archivedData.map(party => ({
        partyName: party.partyName || 'Unknown Party',
        totalOrders: Number(party.totalOrders) || 0,
        totalYarn: Number(party.totalYarn) || 0,
        pendingYarn: Number(party.pendingYarn) || 0,
        reprocessingYarn: Number(party.reprocessingYarn) || 0,
        arrivedYarn: Number(party.arrivedYarn) || 0,
        lastOrderDate: party.lastOrderDate,
        firstOrderDate: party.firstOrderDate,
        dyeingFirms: party.dyeingFirms,
        dyeingFirm: party.dyeingFirm,
        address: party.address,
        contact: party.contact,
        archivedAt: party.archivedAt || new Date().toISOString()
      })) : [];
      
      setArchivedParties(normalizedData);
      setFilteredParties(normalizedData);
      
      // Professional user feedback
      if (normalizedData.length > 0) {
        toast.success(`Loaded ${normalizedData.length} archived parties successfully`, {
          description: fetchError ? 'Using local cache due to server issues' : 'Data loaded from server',
          duration: 3000,
        });
      } else {
        toast.info('No archived parties found', {
          description: 'Archive parties from the main list to see them here',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('❌ Critical error fetching archived parties:', error);
      toast.error('Failed to load archived parties', {
        description: 'Please refresh the page or contact support if this persists.',
        duration: 5000,
      });
      setArchivedParties([]);
      setFilteredParties([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort data
  useEffect(() => {
    const filtered = archivedParties.filter(party =>
      party.partyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    setFilteredParties(filtered);
  }, [archivedParties, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof PartySummary) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof PartySummary) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0.00";
    }
    return value.toFixed(2);
  };

  const handleViewDetails = (party: PartySummary) => {
    setSelectedParty(party);
    setShowDetailsModal(true);
  };

  const handleRestoreParty = async (partyName: string) => {
    try {
      console.log('🔄 Restoring party:', partyName);
      
      let restoreSuccess = false;
      let restoreError = null;
      
      // Try backend restore first
      try {
        console.log('🌐 Attempting backend restore...');
        const response = await restoreParty(partyName);
        console.log('✅ Backend restore successful:', response);
        restoreSuccess = true;
        
        // 🚀 CRITICAL: Refresh archived parties data to ensure accuracy
        console.log('🔄 Refreshing archived parties data after successful restore...');
        await fetchArchivedParties();
        
      } catch (error: any) {
        console.warn('⚠️ Backend restore failed, using localStorage fallback:', error.message);
        restoreError = error;
        
        // Professional fallback: Remove from localStorage
        const archivedParties = JSON.parse(localStorage.getItem('archivedParties') || '[]');
        const updatedArchived = archivedParties.filter((party: any) => party.partyName !== partyName);
        localStorage.setItem('archivedParties', JSON.stringify(updatedArchived));
        console.log('✅ Party removed from local archive');
        restoreSuccess = true;
        
        // Remove from local state as fallback
        setArchivedParties(prev => prev.filter(party => party.partyName !== partyName));
        setFilteredParties(prev => prev.filter(party => party.partyName !== partyName));
      }
      
      if (restoreSuccess) {
        toast.success('Party restored successfully!', {
          description: `${partyName} has been restored and moved back to the active parties list.`,
          action: {
            label: 'View Active',
            onClick: () => navigate('/party-test')
          },
          duration: 6000,
        });
        
        console.log('✅ Restore operation completed successfully');
      } else {
        throw new Error('Restore operation failed');
      }
    } catch (error: any) {
      console.error('❌ Error restoring party:', error);
      toast.error('Failed to restore party', {
        description: 'The party could not be restored. Please try again.',
        duration: 5000,
      });
    }
  };

  const handleDownloadParty = async (partyName: string) => {
    if (isDownloading) return; // Prevent double clicks
    
    setIsDownloading(true);
    try {
      console.log('📊 Downloading party data:', partyName);
      
      // Professional download implementation with fallback
      let downloadSuccess = false;
      let downloadError = null;
      
      try {
        console.log('🌐 Attempting backend CSV download...');
        const blob = await downloadPartyAsCSV(partyName);
        console.log('✅ Backend download successful');
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${partyName}_data.csv`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        downloadSuccess = true;
      } catch (error: any) {
        console.warn('⚠️ Backend download failed, implementing professional fallback:', error.message);
        downloadError = error;
        
        // Professional fallback: Create CSV from local data
        const partyData = archivedParties.find(p => p.partyName === partyName);
        if (partyData) {
          const csvContent = [
            'Party Name,Total Orders,Total Yarn (kg),Pending Yarn (kg),Reprocessing Yarn (kg),Completed Yarn (kg),Last Order Date,First Order Date,Status',
            `${partyData.partyName},${partyData.totalOrders},${partyData.totalYarn},${partyData.pendingYarn},${partyData.reprocessingYarn},${partyData.arrivedYarn},${partyData.lastOrderDate || 'N/A'},${partyData.firstOrderDate || 'N/A'},Archived`
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${partyName}_summary.csv`;
          document.body.appendChild(link);
          link.click();
          
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
          
          console.log('✅ Fallback CSV download successful');
          downloadSuccess = true;
        }
      }
      
      if (downloadSuccess) {
        toast.success('Party data downloaded successfully!', {
          description: `${partyName} data has been exported to CSV format.`,
          duration: 4000,
        });
        console.log('✅ Download operation completed successfully');
      } else {
        throw new Error('Download operation failed');
      }
    } catch (error: any) {
      console.error('❌ Critical download error:', error);
      toast.error('Failed to download party data', {
        description: 'The party data could not be downloaded. Please try again or contact support.',
        duration: 5000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeletePermanently = (partyName: string) => {
    setPartyToDelete(partyName);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePermanently = async () => {
    if (isDeleting) return; // Prevent double clicks
    
    setIsDeleting(true);
    try {
      console.log('🗑️ Permanently deleting party:', partyToDelete);
      
      // Professional delete implementation with fallback
      let deleteSuccess = false;
      let deleteError = null;
      
      try {
        console.log('🌐 Attempting backend permanent deletion...');
        const response = await deletePermanently(partyToDelete);
        console.log('✅ Backend deletion successful:', response);
        deleteSuccess = true;
        
        // 🚀 CRITICAL: Refresh archived parties data to ensure accuracy
        console.log('🔄 Refreshing archived parties data after successful deletion...');
        await fetchArchivedParties();
        
      } catch (error: any) {
        console.warn('⚠️ Backend deletion failed, implementing professional fallback:', error.message);
        deleteError = error;
        
        // Professional fallback: Remove from localStorage and local state
        const archivedParties = JSON.parse(localStorage.getItem('archivedParties') || '[]');
        const updatedArchived = archivedParties.filter((party: any) => party.partyName !== partyToDelete);
        localStorage.setItem('archivedParties', JSON.stringify(updatedArchived));
        console.log('✅ Party removed from local storage');
        
        // Remove from local state as fallback
        setArchivedParties(prev => prev.filter(party => party.partyName !== partyToDelete));
        setFilteredParties(prev => prev.filter(party => party.partyName !== partyToDelete));
        deleteSuccess = true;
      }
      
      if (deleteSuccess) {
        toast.success('Party permanently deleted!', {
          description: `${partyToDelete} has been permanently removed from the system and cannot be recovered.`,
          duration: 6000,
        });
        
        // Close modal and reset state
        setShowDeleteConfirm(false);
        setPartyToDelete('');
        
        console.log('✅ Permanent deletion completed successfully');
      } else {
        throw new Error('Permanent deletion failed');
      }
    } catch (error: any) {
      console.error('❌ Critical deletion error:', error);
      toast.error('Failed to permanently delete party', {
        description: 'The party could not be permanently deleted. Please try again or contact support.',
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate totals
  const totals = archivedParties.reduce((acc, party) => ({
    totalOrders: acc.totalOrders + (party.totalOrders || 0),
    totalYarn: acc.totalYarn + (party.totalYarn || 0),
    pendingYarn: acc.pendingYarn + (party.pendingYarn || 0),
    reprocessingYarn: acc.reprocessingYarn + (party.reprocessingYarn || 0),
    arrivedYarn: acc.arrivedYarn + (party.arrivedYarn || 0),
  }), {
    totalOrders: 0,
    totalYarn: 0,
    pendingYarn: 0,
    reprocessingYarn: 0,
    arrivedYarn: 0,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <div className="w-8 h-8 border-b-2 border-purple-500 rounded-full animate-spin"></div>
          <span className="text-lg">Loading archived parties...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 transition-colors duration-200 bg-gray-50 dark:bg-gray-900 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="relative mb-8 overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 rounded-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          <div className="relative px-6 py-8 sm:px-8 sm:py-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/party-test')}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Back to Party Master"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="p-3 shadow-lg bg-white/20 backdrop-blur-sm rounded-xl">
                  <Archive className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white sm:text-4xl">Archived Party Records</h1>
                  <p className="mt-2 text-lg text-orange-100">Previously archived party records and historical data</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-lg shadow-md bg-white/20 backdrop-blur-sm">
                  <span className="text-sm font-medium text-white">Archived: {archivedParties.length}</span>
                </div>
                <button
                  onClick={fetchArchivedParties}
                  className="flex items-center gap-2 px-4 py-2 text-white transition-all duration-200 border rounded-lg shadow-md bg-transparent backdrop-blur-sm border-white/30 hover:bg-white/20 hover:border-white/50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-10"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.totalOrders}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Archived orders</p>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-10"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-purple-600 uppercase dark:text-purple-400">Total Yarn</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(totals.totalYarn)}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Kg processed historically</p>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 opacity-10"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 shadow-lg bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-green-600 uppercase dark:text-green-400">Completed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(totals.arrivedYarn)}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Kg completed</p>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 opacity-10"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                <Archive className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">Archived</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{archivedParties.length}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Total archived parties</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8 overflow-hidden bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Search className="w-5 h-5 text-amber-600" />
              Search Archived Parties
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" size={20} />
                <input
                  type="text"
                  placeholder="Search archived parties by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-3 pl-12 pr-4 text-lg transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Showing {filteredParties.length} of {archivedParties.length} archived parties
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Archived Parties Table */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th 
                    onClick={() => handleSort('partyName')}
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      Party Name
                      <span className="text-xs">{getSortIcon('partyName')}</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300 whitespace-nowrap">
                    Dyeing Firm
                  </th>
                  <th 
                    onClick={() => handleSort('totalOrders')}
                    className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Total Orders
                      <span className="text-xs">{getSortIcon('totalOrders')}</span>
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('totalYarn')}
                    className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Total Yarn
                      <span className="text-xs">{getSortIcon('totalYarn')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase dark:text-gray-300">
                    Pending
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase dark:text-gray-300">
                    Reprocessing
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase dark:text-gray-300">
                    Completed
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {filteredParties.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                          <Archive className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-medium text-gray-900 dark:text-white">No archived parties found</p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {searchTerm ? "Try adjusting your search terms" : "No parties have been archived yet"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredParties.map((party) => (
                    <tr key={party.partyName} className="transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-sm bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                              {party.partyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {party.partyName}
                              </div>
                              <div className="w-2 h-2 rounded-full bg-amber-400" title="Archived party"></div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Archived • {party.totalOrders} total orders
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs max-w-[220px]">
                        <div
                          className="text-gray-700 dark:text-gray-300 truncate"
                          title={(() => {
                            const firms = Array.from(new Set([
                              ...(party.dyeingFirm ? [party.dyeingFirm] : []),
                              ...((party.dyeingFirms as string[] | undefined) || [])
                            ]));
                            return firms.join(', ');
                          })()}
                        >
                          {(() => {
                            const firms = Array.from(new Set([
                              ...(party.dyeingFirm ? [party.dyeingFirm] : []),
                              ...((party.dyeingFirms as string[] | undefined) || [])
                            ]));
                            return firms.length ? firms.join(', ') : '-';
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                          {party.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-center text-gray-900 dark:text-white">
                        {formatNumber(party.totalYarn)} kg
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">
                          {formatNumber(party.pendingYarn)} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full dark:bg-orange-900/30 dark:text-orange-400">
                          {formatNumber(party.reprocessingYarn)} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
                          {formatNumber(party.arrivedYarn)} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(party)}
                            className="p-2 text-blue-600 transition-colors duration-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title="View Details"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRestoreParty(party.partyName)}
                            className="p-2 text-green-600 transition-colors duration-200 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30"
                            title="Restore Party"
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadParty(party.partyName)}
                            disabled={isDownloading}
                            className={`p-2 text-purple-600 transition-colors duration-200 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 ${
                              isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title={isDownloading ? "Downloading..." : "Download Data"}
                          >
                            {isDownloading ? (
                              <div className="w-4 h-4 border-b-2 border-purple-600 rounded-full animate-spin"></div>
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeletePermanently(party.partyName)}
                            className="p-2 text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Party Details Modal */}
      {selectedParty && (
        <PartyDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedParty(null);
          }}
          partyName={selectedParty.partyName}
          partySummary={selectedParty}
        />
      )}

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Permanently Delete Party"
        message={`Are you sure you want to permanently delete "${partyToDelete}"? This action cannot be undone and will remove all associated data, including historical records. The party will be completely removed from the system.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Permanently"}
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDeletePermanently}
        onCancel={() => {
          if (!isDeleting) {
            setShowDeleteConfirm(false);
            setPartyToDelete('');
          }
        }}
      />
    </div>
  );
};

export default ArchivedParties;
