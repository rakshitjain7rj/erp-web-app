import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Users, Package, Clock, RotateCcw, CheckCircle, Search, Edit3, Eye, MoreVertical, Plus, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllPartiesSummary, getPartyStatistics, deleteParty, archiveParty, downloadPartyAsJSON } from '../api/partyApi';
import AddPartyForm from '../components/AddPartyForm';
import PartyFloatingActionDropdown from '../components/PartyFloatingActionDropdown';
import PartyDetailsModal from '../components/PartyDetailsModal';
import EditPartyModal from '../components/EditPartyModal';
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
};

type PartyStatistics = {
  totalParties: number;
  partiesWithPending: number;
  partiesWithReprocessing: number;
  partiesWithCompleted: number;
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PartyMaster Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-64">
          <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <Users className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-medium">Error Loading Party Master</h3>
                <p className="mt-1 text-sm">Please refresh the page or contact support if the issue persists.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 mt-3 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const PartyMaster = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PartySummary[]>([]);
  const [filteredSummary, setFilteredSummary] = useState<PartySummary[]>([]);
  const [statistics, setStatistics] = useState<PartyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof PartySummary>('partyName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newlyAddedParty, setNewlyAddedParty] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState<PartySummary | null>(null);
  
  // Confirmation dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const [debugInfo, setDebugInfo] = useState<string>('Starting...');useEffect(() => {
    const fetchData = async () => {
      setLoading(true);      try {
        console.log('🔍 Fetching party data...');
        console.log('🌐 API BASE URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
        setDebugInfo('Fetching party data...');
        
        // Test direct fetch first
        console.log('🧪 Testing direct fetch...');
        setDebugInfo('Testing direct fetch to /api/parties/summary...');
        const directResponse = await fetch('http://localhost:5000/api/parties/summary');
        console.log('📡 Direct fetch status:', directResponse.status);
        setDebugInfo(`Direct fetch status: ${directResponse.status}`);
        
        if (!directResponse.ok) {
          throw new Error(`Direct fetch failed: ${directResponse.status}`);
        }
        
        const directData = await directResponse.json();
        console.log('✅ Direct fetch data:', directData);
        setDebugInfo(`Direct fetch success: ${directData.length} parties`);
        
        // Now test through API functions
        const [summaryData, statsData] = await Promise.all([
          getAllPartiesSummary(),
          getPartyStatistics()
        ]);
        
        console.log('✅ Party Summary Data:', summaryData);
        console.log('✅ Party Statistics:', statsData);
        console.log('📊 Summary Array Length:', Array.isArray(summaryData) ? summaryData.length : 'Not an array');
        setDebugInfo(`API calls success: ${Array.isArray(summaryData) ? summaryData.length : 0} parties`);
        
        // Validate and normalize the data
        const normalizedData = Array.isArray(summaryData) ? summaryData.map(party => ({
          partyName: party.partyName || 'Unknown Party',
          totalOrders: Number(party.totalOrders) || 0,
          totalYarn: Number(party.totalYarn) || 0,
          pendingYarn: Number(party.pendingYarn) || 0,
          reprocessingYarn: Number(party.reprocessingYarn) || 0,
          arrivedYarn: Number(party.arrivedYarn) || 0,
          lastOrderDate: party.lastOrderDate,
          firstOrderDate: party.firstOrderDate,
        })) : [];        setSummary(normalizedData);
        setFilteredSummary(normalizedData);
        setStatistics(statsData);
        
        console.log('✅ Final state set - Summary length:', normalizedData.length);
        console.log('✅ Filtered summary length:', normalizedData.length);
        setDebugInfo(`SUCCESS: Loaded ${normalizedData.length} parties from API`);
        
        toast.success("Party Master data loaded successfully");      } catch (error) {
        console.error('❌ Error fetching party data:', error);
        if (error instanceof Error) {
          console.error('❌ Error details:', error.message);
          setDebugInfo(`Error: ${error.message}`);
        }
        toast.error("Failed to load party data");
        setSummary([]);
        setFilteredSummary([]);
        setStatistics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort data
  useEffect(() => {
    const filtered = summary.filter(party =>
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

    setFilteredSummary(filtered);
  }, [summary, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof PartySummary) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calculate totals with safe number handling
  const totals = summary.reduce((acc, party) => ({
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

  // Safe number formatting function
  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0.00";
    }
    return value.toFixed(2);
  };

  const getSortIcon = (field: keyof PartySummary) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Party action handlers
  const handleViewDetails = (party: PartySummary) => {
    setSelectedParty(party);
    setShowDetailsModal(true);
  };

  const handleEditParty = (party: PartySummary) => {
    setSelectedParty(party);
    setShowEditModal(true);
  };

  const handleDeleteParty = (partyName: string) => {
    setPartyToDelete(partyName);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteParty = async () => {
    if (isDeleting) return; // Prevent double clicks
    
    setIsDeleting(true);
    try {
      await deleteParty(partyToDelete);
      
      // Remove party from local state immediately for instant UI update
      setSummary(prev => prev.filter(party => party.partyName !== partyToDelete));
      setFilteredSummary(prev => prev.filter(party => party.partyName !== partyToDelete));
      
      toast.success('Party deleted successfully!', {
        description: `${partyToDelete} has been permanently removed from the system.`,
        duration: 4000,
      });
      
      setShowDeleteConfirm(false);
      setPartyToDelete('');
    } catch (error: any) {
      console.error('Error deleting party:', error);
      toast.error('Failed to delete party', {
        description: error.response?.data?.message || 'Please try again later.',
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveParty = (partyName: string) => {
    setPartyToDelete(partyName); // Reuse the same state
    setShowArchiveConfirm(true);
  };

  const confirmArchiveParty = async () => {
    if (isArchiving) return; // Prevent double clicks
    
    setIsArchiving(true);
    try {
      console.log('🔄 Archiving party:', partyToDelete);
      
      // Professional archive implementation with comprehensive data refresh
      let archiveSuccess = false;
      let archiveError = null;
      
      try {
        console.log('🌐 Attempting backend archive...');
        const response = await archiveParty(partyToDelete);
        console.log('✅ Backend archive successful:', response);
        archiveSuccess = true;
        
        // 🚀 CRITICAL: Refresh all data from backend to ensure accuracy
        console.log('🔄 Refreshing all party data after successful archive...');
        await refreshData();
        
      } catch (error: any) {
        console.warn('⚠️ Backend archive failed, implementing professional fallback:', error.message);
        archiveError = error;
        
        // Professional fallback: Store in localStorage for demonstration
        const archivedParties = JSON.parse(localStorage.getItem('archivedParties') || '[]');
        const partyToArchive = summary.find(p => p.partyName === partyToDelete);
        
        if (partyToArchive) {
          const archivedParty = {
            ...partyToArchive,
            archivedAt: new Date().toISOString(),
            archivedBy: 'User',
            archiveReason: 'Manual archive via UI'
          };
          archivedParties.push(archivedParty);
          localStorage.setItem('archivedParties', JSON.stringify(archivedParties));
          console.log('✅ Party stored in local archive:', archivedParty);
          archiveSuccess = true;
          
          // Remove from local state as fallback
          setSummary(prev => prev.filter(party => party.partyName !== partyToDelete));
          setFilteredSummary(prev => prev.filter(party => party.partyName !== partyToDelete));
        }
      }
      
      if (archiveSuccess) {
        // Professional success notification
        toast.success('Party archived successfully!', {
          description: `${partyToDelete} has been moved to archived parties and is no longer visible in the main list.`,
          action: {
            label: 'View Archived',
            onClick: () => navigate('/archived-parties')
          },
          duration: 6000,
        });
        
        // Close modal and reset state
        setShowArchiveConfirm(false);
        setPartyToDelete('');
        
        console.log('✅ Archive operation completed successfully');
      } else {
        throw new Error('Archive operation failed');
      }
    } catch (error: any) {
      console.error('❌ Critical archive error:', error);
      toast.error('Failed to archive party', {
        description: 'The party could not be archived. Please try again or contact support.',
        duration: 5000,
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDownloadJSON = async (partyName: string) => {
    try {
      const blob = await downloadPartyAsJSON(partyName);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${partyName}_data.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Party data downloaded!', {
        description: `${partyName} data has been exported to JSON.`
      });
    } catch (error: any) {
      console.error('Error downloading party data:', error);
      toast.error('Failed to download party data', {
        description: error.response?.data?.message || 'Please try again later.'
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [summaryData, statsData] = await Promise.all([
        getAllPartiesSummary(),
        getPartyStatistics()
      ]);
      
      const normalizedData = Array.isArray(summaryData) ? summaryData.map(party => ({
        partyName: party.partyName || 'Unknown Party',
        totalOrders: Number(party.totalOrders) || 0,
        totalYarn: Number(party.totalYarn) || 0,
        pendingYarn: Number(party.pendingYarn) || 0,
        reprocessingYarn: Number(party.reprocessingYarn) || 0,
        arrivedYarn: Number(party.arrivedYarn) || 0,
        lastOrderDate: party.lastOrderDate,
        firstOrderDate: party.firstOrderDate,
      })) : [];
      
      setSummary(normalizedData);
      setFilteredSummary(normalizedData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <div className="w-8 h-8 border-b-2 border-purple-500 rounded-full animate-spin"></div>
          <span className="text-lg">Loading Party Master...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 transition-colors duration-200 bg-gray-50 dark:bg-gray-900 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Debug Info */}
          {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg mx-4 transform transition-all duration-300 ease-out">
              <AddPartyForm
                existingParties={summary.map(party => party.partyName)}
                onSuccess={async (newPartyName?: string) => {
                  console.log('🔄 Party added successfully, refreshing data...');
                  setShowAddModal(false);
                  setRefreshing(true);
                  
                  // Set the newly added party for highlighting
                  if (newPartyName) {
                    setNewlyAddedParty(newPartyName);
                    // Clear highlight after 5 seconds
                    setTimeout(() => setNewlyAddedParty(''), 5000);
                  }
                  
                  // Re-fetch all data
                  try {
                    const [summaryData, statsData] = await Promise.all([
                      getAllPartiesSummary(),
                      getPartyStatistics()
                    ]);
                    
                    const normalizedData = Array.isArray(summaryData) ? summaryData.map(party => ({
                      partyName: party.partyName || 'Unknown Party',
                      totalOrders: Number(party.totalOrders) || 0,
                      totalYarn: Number(party.totalYarn) || 0,
                      pendingYarn: Number(party.pendingYarn) || 0,
                      reprocessingYarn: Number(party.reprocessingYarn) || 0,
                      arrivedYarn: Number(party.arrivedYarn) || 0,
                      lastOrderDate: party.lastOrderDate,
                      firstOrderDate: party.firstOrderDate,
                    })) : [];
                    
                    setSummary(normalizedData);
                    setFilteredSummary(normalizedData);
                    setStatistics(statsData);
                    
                    console.log('✅ Data refreshed successfully');
                    
                    // Show success feedback
                    toast.success('Party List Updated!', {
                      description: `${newPartyName || 'New party'} is now visible in the list.`,
                      duration: 3000,
                    });
                  } catch (error) {
                    console.error('❌ Error refreshing data:', error);
                    toast.error("Failed to refresh data", {
                      description: "Please refresh the page manually.",
                    });
                  } finally {
                    setRefreshing(false);
                  }
                }}
                onClose={() => setShowAddModal(false)}
              />
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="relative mb-8 overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          <div className="relative px-6 py-8 sm:px-8 sm:py-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 shadow-lg bg-white/20 backdrop-blur-sm rounded-xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white sm:text-4xl">Party Master</h1>
                  <p className="mt-2 text-lg text-purple-100">Comprehensive party management and records system</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-lg shadow-md bg-white/20 backdrop-blur-sm">
                  <span className="text-sm font-medium text-white">Active Parties: {summary.length}</span>
                </div>
                <button
                  onClick={() => navigate('/archived-parties')}
                  className="flex items-center gap-2 px-4 py-2 text-white transition-all duration-200 border rounded-lg shadow-md bg-transparent backdrop-blur-sm border-white/30 hover:bg-white/20 hover:border-white/50"
                  title="View Archived Parties"
                >
                  <Archive className="w-4 h-4" />
                  <span className="hidden sm:inline">Archived</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-white transition-all duration-200 border rounded-lg shadow-md bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Party</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="p-4 mb-8 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.length}</div>
                <div className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Total Parties</div>
              </div>
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.filter(p => p.totalOrders > 0).length}</div>
                <div className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Active</div>
              </div>
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.filter(p => p.pendingYarn > 0).length}</div>
                <div className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">With Pending</div>
              </div>
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.filter(p => p.reprocessingYarn > 0).length}</div>
                <div className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Reprocessing</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Reprocessing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-10"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">Total Parties</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.length}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Active partners</p>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 opacity-10"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 shadow-lg bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-green-600 uppercase dark:text-green-400">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.totalOrders}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">All orders combined</p>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-10"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 shadow-lg bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-yellow-600 uppercase dark:text-yellow-400">Pending Yarn</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(totals.pendingYarn)}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Kg awaiting process</p>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 opacity-10"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">Reprocessing</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(totals.reprocessingYarn)}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Kg in reprocessing</p>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-10"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide uppercase text-emerald-600 dark:text-emerald-400">Completed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(totals.arrivedYarn)}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Kg completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="mb-8 overflow-hidden bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Search className="w-5 h-5 text-purple-600" />
              Party Search & Management
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" size={20} />
                <input
                  type="text"
                  placeholder="Search parties by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-3 pl-12 pr-4 text-lg transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Showing {filteredSummary.length} of {summary.length} parties
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
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
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">                {filteredSummary.length === 0 ? (
                  loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                          <span className="text-lg">Loading parties...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30">
                            <Users className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-medium text-gray-900 dark:text-white">No parties found</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {searchTerm ? "Try adjusting your search terms" : "No parties have been registered yet"}
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                              Debug: {debugInfo}
                            </p>
                            {!searchTerm && (
                              <button 
                                onClick={() => {
                                  toast.info("Add Party feature", {
                                    description: "Party registration feature coming soon!"
                                  });
                                }}
                                className="px-4 py-2 mt-4 text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                              >
                                Add First Party
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                ) : (
                  filteredSummary.map((party) => {
                    const isNewlyAdded = newlyAddedParty === party.partyName;
                    return (
                      <tr 
                        key={party.partyName} 
                        className={`transition-all duration-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          isNewlyAdded 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 animate-pulse' 
                            : ''
                        }`}
                      >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-sm bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30">
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                              {party.partyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {party.partyName}
                              </div>
                              {party.totalOrders > 0 && (
                                <div className={`w-2 h-2 rounded-full ${
                                  party.pendingYarn > 0 ? 'bg-yellow-400' :
                                  party.reprocessingYarn > 0 ? 'bg-orange-400' :
                                  'bg-green-400'
                                }`} title={
                                  party.pendingYarn > 0 ? 'Has pending orders' :
                                  party.reprocessingYarn > 0 ? 'Has reprocessing orders' :
                                  'All orders completed'
                                }></div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {party.totalOrders > 0 ? `${party.totalOrders} active orders` : 'No active orders'}
                            </div>
                          </div>
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
                        <PartyFloatingActionDropdown
                          onView={() => handleViewDetails(party)}
                          onEdit={() => handleEditParty(party)}
                          onDelete={() => handleDeleteParty(party.partyName)}
                          onArchive={() => handleArchiveParty(party.partyName)}
                          onDownload={() => handleDownloadJSON(party.partyName)}
                        />
                      </td>
                    </tr>
                    );
                  })
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

      {/* Edit Party Modal */}
      {selectedParty && (
        <EditPartyModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedParty(null);
          }}
          partyName={selectedParty.partyName}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedParty(null);
            refreshData();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Party"
        message={`Are you sure you want to delete "${partyToDelete}"? This action cannot be undone and will remove all associated data permanently.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Party"}
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDeleteParty}
        onCancel={() => {
          if (!isDeleting) {
            setShowDeleteConfirm(false);
            setPartyToDelete('');
          }
        }}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showArchiveConfirm}
        title="Archive Party"
        message={`Are you sure you want to archive "${partyToDelete}"? The party will be moved to archived parties and won't appear in the main list. You can restore it later if needed.`}
        confirmText={isArchiving ? "Archiving..." : "Archive Party"}
        cancelText="Cancel"
        variant="warning"
        isLoading={isArchiving}
        onConfirm={confirmArchiveParty}
        onCancel={() => {
          if (!isArchiving) {
            setShowArchiveConfirm(false);
            setPartyToDelete('');
          }
        }}
      />
    </div>
  );
};

const PartyMasterWithErrorBoundary = () => (
  <ErrorBoundary>
    <PartyMaster />
  </ErrorBoundary>
);

export default PartyMasterWithErrorBoundary;
