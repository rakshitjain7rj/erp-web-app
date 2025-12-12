import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllDyeingRecords } from '../api/dyeingApi';
import { getAllCountProducts, CountProduct } from '../api/countProductApi';
import { getAllPartyNames, deleteParty, getPartyDetails } from '../api/partyApi';
import { DyeingRecord } from '../types/dyeing';
import PartyDashboard from '../components/PartyMasterNew/PartyDashboard';
import PartyModal from '../components/PartyMasterNew/PartyModal';

const PartyMasterNew: React.FC = () => {
  const [records, setRecords] = useState<DyeingRecord[]>([]);
  const [countProducts, setCountProducts] = useState<CountProduct[]>([]);
  const [partyNames, setPartyNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<{ name: string; contact?: string; address?: string } | null>(null);

  const fetchData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const [dyeingData, countProductsData, partiesData] = await Promise.all([
        getAllDyeingRecords(),
        getAllCountProducts(),
        getAllPartyNames()
      ]);
      
      setRecords(dyeingData || []);
      setCountProducts(countProductsData || []);
      // Handle different possible return formats for party names
      if (Array.isArray(partiesData)) {
        if (partiesData.length === 0) {
          setPartyNames([]);
        }
        // If it's an array of strings
        else if (typeof partiesData[0] === 'string') {
          setPartyNames(partiesData as string[]);
        } 
        // If it's an array of objects
        else if (typeof partiesData[0] === 'object' && partiesData[0] !== null) {
          if ('partyName' in partiesData[0]) {
            setPartyNames(partiesData.map((p: any) => p.partyName));
          } else if ('name' in partiesData[0]) {
            setPartyNames(partiesData.map((p: any) => p.name));
          }
        }
        // Fallback
        else {
          setPartyNames([]);
        }
      } else {
        setPartyNames([]);
      }

      if (showToast) toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error fetching party data:', error);
      toast.error('Failed to load party data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleAddParty = () => {
    setEditingParty(null);
    setIsModalOpen(true);
  };

  const handleEditParty = async (partyName: string) => {
    try {
      // Try to fetch details, but if it fails (e.g. party only exists in records), just use name
      let details = { name: partyName, contact: '', address: '' };
      try {
        const apiDetails = await getPartyDetails(partyName);
        if (apiDetails) {
          // Handle nested structure if present (e.g. { summary, orders, party })
          const partyData = apiDetails.party || apiDetails;
          
          details = {
            name: partyData.name || partyData.partyName || partyName,
            contact: partyData.contact || '',
            address: partyData.address || ''
          };
        }
      } catch (e) {
        console.log('Could not fetch details, using name only');
      }
      
      setEditingParty(details);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error preparing edit:', error);
      toast.error('Failed to load party details');
    }
  };

  const handleDeleteParty = async (partyName: string) => {
    if (!window.confirm(`Are you sure you want to delete party "${partyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteParty(partyName);
      toast.success('Party deleted successfully');
      fetchData(true);
    } catch (error) {
      console.error('Error deleting party:', error);
      toast.error('Failed to delete party');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Party Master...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            Party Master
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage parties and track yarn status efficiently
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleAddParty}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Add Party</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <PartyDashboard 
        records={records} 
        countProducts={countProducts}
        partyNames={partyNames}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEdit={handleEditParty}
        onDelete={handleDeleteParty}
      />

      {/* Add/Edit Party Modal */}
      <PartyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData(true)}
        initialData={editingParty}
      />
    </div>
  );
};

export default PartyMasterNew;
