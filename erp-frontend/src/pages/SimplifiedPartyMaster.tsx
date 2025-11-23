import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Users, Search, Plus, Edit, Eye, Trash2, Archive } from 'lucide-react';
import { getAllPartiesSummary, deleteParty, archiveParty } from '../api/partyApi';
import { getAllDyeingRecords } from '../api/dyeingApi';
import { getAllCountProducts } from '../api/countProductApi';
import { Button } from '../components/ui/Button';
import AddPartyForm from '../components/AddPartyForm';
import PartyDetailsModal from '../components/PartyDetailsModal';
import EditPartyModal from '../components/EditPartyModal';
import { useNavigate } from 'react-router-dom';

interface PartySummary {
    partyName: string;
    totalOrders: number;
    totalYarn: number;
    pendingYarn: number;
    reprocessingYarn: number;
    arrivedYarn: number;
    lastOrderDate?: string;
    firstOrderDate?: string;
    dyeingFirms?: string[];
}

const SimplifiedPartyMaster: React.FC = () => {
    const navigate = useNavigate();
    const [parties, setParties] = useState<PartySummary[]>([]);
    const [filteredParties, setFilteredParties] = useState<PartySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedParty, setSelectedParty] = useState<PartySummary | null>(null);

    // Normalize key for comparison
    const normalizeKey = (name: string | undefined | null): string => {
        return (name || '').trim().toUpperCase();
    };

    // Fetch data
    const fetchData = async () => {
        try {
            const [summaryData, dyeingRecords, countProducts] = await Promise.all([
                getAllPartiesSummary(),
                getAllDyeingRecords().catch(() => []),
                getAllCountProducts().catch(() => []),
            ]);

            // Build dyeing firms map
            const firmsByParty = new Map<string, Set<string>>();

            if (Array.isArray(dyeingRecords)) {
                for (const rec of dyeingRecords) {
                    if (rec?.partyName && rec?.dyeingFirm) {
                        const k = normalizeKey(rec.partyName);
                        const set = firmsByParty.get(k) || new Set<string>();
                        set.add(rec.dyeingFirm);
                        firmsByParty.set(k, set);
                    }
                }
            }

            if (Array.isArray(countProducts)) {
                for (const cp of countProducts) {
                    const names = [cp?.partyName, cp?.middleman].filter(Boolean) as string[];
                    if (cp?.dyeingFirm) {
                        for (const nm of names) {
                            const k = normalizeKey(nm);
                            const set = firmsByParty.get(k) || new Set<string>();
                            set.add(cp.dyeingFirm);
                            firmsByParty.set(k, set);
                        }
                    }
                }
            }

            // Process summary data
            const processedParties = Array.isArray(summaryData) ? summaryData.map(party => {
                const k = normalizeKey(party.partyName);
                const firms = firmsByParty.get(k);
                return {
                    partyName: party.partyName || 'Unknown Party',
                    totalOrders: Number(party.totalOrders) || 0,
                    totalYarn: Number(party.totalYarn) || 0,
                    pendingYarn: Number(party.pendingYarn) || 0,
                    reprocessingYarn: Number(party.reprocessingYarn) || 0,
                    arrivedYarn: Number(party.arrivedYarn) || 0,
                    lastOrderDate: party.lastOrderDate,
                    firstOrderDate: party.firstOrderDate,
                    dyeingFirms: firms ? Array.from(firms) : [],
                };
            }) : [];

            setParties(processedParties);
            setFilteredParties(processedParties);
            toast.success('Party data loaded');
        } catch (error) {
            console.error('Error fetching party data:', error);
            toast.error('Failed to load party data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter parties based on search
    useEffect(() => {
        const filtered = parties.filter(party =>
            party.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            party.dyeingFirms?.some(firm => firm.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredParties(filtered);
    }, [parties, searchQuery]);

    const refreshData = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleViewDetails = (party: PartySummary) => {
        setSelectedParty(party);
        setShowDetailsModal(true);
    };

    const handleEditParty = (party: PartySummary) => {
        setSelectedParty(party);
        setShowEditModal(true);
    };

    const handleDeleteParty = async (partyName: string) => {
        if (!confirm(`Are you sure you want to delete "${partyName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteParty(partyName);
            setParties(prev => prev.filter(p => p.partyName !== partyName));
            toast.success('Party deleted successfully');
        } catch (error: any) {
            console.error('Error deleting party:', error);
            toast.error('Failed to delete party');
        }
    };

    const handleArchiveParty = async (partyName: string) => {
        if (!confirm(`Are you sure you want to archive "${partyName}"?`)) {
            return;
        }

        try {
            await archiveParty(partyName);
            setParties(prev => prev.filter(p => p.partyName !== partyName));
            toast.success('Party archived successfully');
        } catch (error: any) {
            console.error('Error archiving party:', error);
            toast.error('Failed to archive party');
        }
    };

    const formatNumber = (value: number | undefined): string => {
        if (value === undefined || value === null || isNaN(value)) {
            return "0.00";
        }
        return value.toFixed(2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <div className="w-8 h-8 border-b-2 border-purple-500 rounded-full animate-spin"></div>
                    <span className="text-lg">Loading Party Master...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Party Master</h1>
                <div className="flex items-center gap-2">
                    {refreshing && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400 text-sm">
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Refreshing...</span>
                        </div>
                    )}
                    <Button onClick={() => setShowAddModal(true)} className="text-sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Party
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by party name or dyeing firm..."
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Party Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Dyeing Firms
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Orders
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Total (kg)
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Pending (kg)
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Reprocess (kg)
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Completed (kg)
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-900 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredParties.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-900 dark:text-white">No parties found</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {searchQuery ? "Try adjusting your search terms" : "No parties have been registered yet"}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredParties.map((party) => (
                                    <tr
                                        key={party.partyName}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        {/* Party Name */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                                        {party.partyName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {party.partyName}
                                                    </div>
                                                    {party.firstOrderDate && party.lastOrderDate && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {new Date(party.firstOrderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} - {new Date(party.lastOrderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Dyeing Firms */}
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                {party.dyeingFirms && party.dyeingFirms.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {party.dyeingFirms.map((firm, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                                                            >
                                                                {firm}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Total Orders */}
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                                                {party.totalOrders}
                                            </span>
                                        </td>

                                        {/* Total Yarn */}
                                        <td className="px-4 py-3 text-right">
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {formatNumber(party.totalYarn)}
                                            </span>
                                        </td>

                                        {/* Pending Yarn */}
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full">
                                                {formatNumber(party.pendingYarn)}
                                            </span>
                                        </td>

                                        {/* Reprocessing Yarn */}
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 rounded-full">
                                                {formatNumber(party.reprocessingYarn)}
                                            </span>
                                        </td>

                                        {/* Completed Yarn */}
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                                                {formatNumber(party.arrivedYarn)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleViewDetails(party)}
                                                    className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditParty(party)}
                                                    className="p-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleArchiveParty(party.partyName)}
                                                    className="p-1.5 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 transition-colors"
                                                    title="Archive"
                                                >
                                                    <Archive className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteParty(party.partyName)}
                                                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                                    title="Delete"
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

            {/* Add Party Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg mx-4 transform transition-all duration-300 ease-out">
                        <AddPartyForm
                            existingParties={parties.map(p => p.partyName)}
                            onSuccess={async () => {
                                setShowAddModal(false);
                                await refreshData();
                            }}
                            onClose={() => setShowAddModal(false)}
                        />
                    </div>
                </div>
            )}

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
                    dyeingFirms={selectedParty.dyeingFirms}
                    onSuccess={() => {
                        setShowEditModal(false);
                        setSelectedParty(null);
                        refreshData();
                    }}
                />
            )}
        </div>
    );
};

export default SimplifiedPartyMaster;
