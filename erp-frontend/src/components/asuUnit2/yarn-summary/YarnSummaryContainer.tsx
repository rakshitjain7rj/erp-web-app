import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../ui/Button';
import { toast } from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import axios from 'axios';
import { asuUnit2Api } from '../../../api/asuUnit2Api';
import { YarnSummaryStats } from './YarnSummaryStats';
import YarnSummaryTable from './YarnSummaryTable';
import { MachineLite, YarnProductionEntryLite, YarnProductionSummaryRow, YarnSummaryStats as YarnSummaryStatsType } from './types';
import { normalizeYarnType, processProductionData } from './utils';

// Simple in-memory cache to persist data across tab switches
let cachedData: {
  summaryData: YarnProductionSummaryRow[];
  distinctYarnTypes: string[];
  stats: YarnSummaryStatsType | null;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const YarnSummaryContainer: React.FC = () => {
  const [summaryData, setSummaryData] = useState<YarnProductionSummaryRow[]>([]);
  const [distinctYarnTypes, setDistinctYarnTypes] = useState<string[]>([]);
  const [stats, setStats] = useState<YarnSummaryStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchYarnSummary = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      setSummaryData(cachedData.summaryData);
      setDistinctYarnTypes(cachedData.distinctYarnTypes);
      setStats(cachedData.stats);
      setLastRefreshed(new Date(cachedData.timestamp));
      setLoading(false);
      return;
    }

    try {
      if (!cachedData) setLoading(true); // Only show full loading if no cache
      setError(null);
      const [machines, paged] = await Promise.all([
        asuUnit2Api.getAllMachines(),
        asuUnit2Api.getProductionEntries({ limit: 500 } as any)
      ]);

      // Collect active machine yarn types (current only)
      const activeMachineYarnTypes = (machines as any[])
        .filter((m: MachineLite) => m.isActive)
        .map((m: MachineLite) => normalizeYarnType(m.yarnType || ''))
        .filter(Boolean);
      const normalizedYarnTypes = [...new Set(activeMachineYarnTypes)].sort((a, b) => a.localeCompare(b));
      
      // Extract raw backend entries (separate day/night)
      const rawItems: any[] = Array.isArray((paged as any)?.items)
        ? (paged as any).items
        : Array.isArray((paged as any)?.data?.items)
        ? (paged as any).data.items
        : Array.isArray((paged as any)?.data)
        ? (paged as any).data
        : Array.isArray(paged as any)
        ? (paged as any)
        : [];

      // Transform into lightweight per-entry records keyed by yarn type
      const entries: YarnProductionEntryLite[] = rawItems.map((it: any) => {
        const normType = normalizeYarnType(it.yarnType || it.machine?.yarnType || '');
        const actual = Number(it.actualProduction || it.production || 0) || 0;
        const theoretical = Number(it.theoreticalProduction || it.productionAt100 || it.machine?.productionAt100 || 0) || 0;
        const pct = theoretical > 0 ? (actual / theoretical) * 100 : 0;
        const machineId = Number(it.machineNumber || it.machineId || 0) || undefined;
        return {
          date: it.date,
          yarnBreakdown: normType ? { [normType]: actual } : {},
          totalProduction: actual,
          machines: 1,
          avgEfficiency: isNaN(pct) ? 0 : pct,
          machineId,
        } as YarnProductionEntryLite;
      });

      const summary = processProductionData(entries, normalizedYarnTypes);
      
      const totalProduction = entries.reduce((sum, e) => sum + (e.totalProduction || 0), 0);
      const uniqueDates = new Set(entries.map(e => e.date));
      const statsData: YarnSummaryStatsType = {
        totalProduction,
        totalDays: uniqueDates.size,
        yarnTypes: normalizedYarnTypes.length,
        averageDaily: uniqueDates.size > 0 ? totalProduction / uniqueDates.size : 0,
      };

      // Update state
      setSummaryData(summary);
      setDistinctYarnTypes(normalizedYarnTypes);
      setStats(statsData);
      setLastRefreshed(new Date());

      // Update cache
      cachedData = {
        summaryData: summary,
        distinctYarnTypes: normalizedYarnTypes,
        stats: statsData,
        timestamp: Date.now()
      };

    } catch (err) {
      let errorMessage = 'Failed to fetch yarn production data (Unit 2)';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (err.response.status === 401) errorMessage = 'Authentication error. Please log in again.';
          else if (err.response.status === 403) errorMessage = 'You do not have permission to access this data.';
          else if (err.response.status === 404) errorMessage = 'Unit 2 yarn data not found.';
          else errorMessage = `Server error: ${err.response.data?.message || err.message}`;
        } else if (err.request) {
          errorMessage = 'No response from server. Please check your connection.';
        }
      }
      setError(errorMessage);
      console.error('Unit 2 yarn summary error:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchYarnSummary(true);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchYarnSummary();
  }, [fetchYarnSummary]);

  if (loading && !summaryData.length) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Yarn Production Summary (Unit 2)</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <span className="text-lg">Loading yarn production data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Yarn Production Summary (Unit 2)</h2>
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="p-3 mb-4 rounded-full bg-red-50 dark:bg-red-900/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-red-500 dark:text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{error}</p>
          <Button onClick={() => fetchYarnSummary(true)} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <YarnSummaryStats stats={stats} />

      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Yarn Production Summary (Unit 2)</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Daily production totals grouped by yarn type (current types only)
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last refreshed:{' '}
                  {lastRefreshed.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              )}
              <Button onClick={handleRefresh} disabled={refreshing} size="sm" variant="default" className="flex items-center gap-2">
                {refreshing ? (
                  <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <YarnSummaryTable summaryData={summaryData} distinctYarnTypes={distinctYarnTypes} />
      </div>
    </div>
  );
};

export default YarnSummaryContainer;
