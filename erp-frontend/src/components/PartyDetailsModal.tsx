import React, { useState, useEffect } from 'react';
import { X, Users, Package, Calendar, Phone, MapPin, Building2, Loader2 } from 'lucide-react';
import { getPartyDetails } from '../api/partyApi';
import { PartySummary } from '../types/party';

interface PartyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyName: string;
  partySummary: PartySummary;
}

interface PartyDetailData {
  partyName: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  dyeingFirm?: string;
  orders: any[];
}

const PartyDetailsModal: React.FC<PartyDetailsModalProps> = ({
  isOpen,
  onClose,
  partyName,
  partySummary
}) => {
  const [details, setDetails] = useState<PartyDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && partyName) {
      fetchPartyDetails();
    }
  }, [isOpen, partyName]);

  const fetchPartyDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPartyDetails(partyName);
      setDetails(data);
    } catch (err) {
      console.error('Error fetching party details:', err);
      setError('Failed to load party details');
      // Use summary data as fallback
      setDetails({
        partyName,
        orders: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0.00";
    }
    return value.toFixed(2);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Party Details</h2>
                <p className="text-purple-100">{partyName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading party details...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <Package className="w-12 h-12 mx-auto mb-2" />
                <p className="font-medium">{error}</p>
                <p className="text-sm text-gray-500 mt-1">Showing summary data only</p>
              </div>
            </div>
          ) : null}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {partySummary.totalOrders}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Total Orders</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {formatNumber(partySummary.totalYarn)} kg
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Total Yarn</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatNumber(partySummary.arrivedYarn)} kg
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Yarn Status */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yarn Status Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-yellow-600 font-bold">{formatNumber(partySummary.pendingYarn)}</span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending (kg)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-orange-600 font-bold">{formatNumber(partySummary.reprocessingYarn)}</span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reprocessing (kg)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold">{formatNumber(partySummary.arrivedYarn)}</span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed (kg)</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {details && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {details.contactPerson && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Contact Person</p>
                      <p className="font-medium text-gray-900 dark:text-white">{details.contactPerson}</p>
                    </div>
                  </div>
                )}
                {details.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{details.phone}</p>
                    </div>
                  </div>
                )}
                {details.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">{details.address}</p>
                    </div>
                  </div>
                )}
                {details.dyeingFirm && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dyeing Firm</p>
                      <p className="font-medium text-gray-900 dark:text-white">{details.dyeingFirm}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order History */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partySummary.firstOrderDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">First Order</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(partySummary.firstOrderDate)}
                    </p>
                  </div>
                </div>
              )}
              {partySummary.lastOrderDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Latest Order</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(partySummary.lastOrderDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartyDetailsModal;
