import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import StatsCards from './StatsCards';
import ProductionTrendChart from './ProductionTrendChart';
import RecentActivityList from './RecentActivityList';
import YarnDistributionChart from './YarnDistributionChart';
import { RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

interface ProductionEntry {
  id?: number;
  yarnType?: string;
  machine?: { yarnType?: string };
  actualProduction?: number | string;
  shift?: string;
  date?: string;
}

const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [days, setDays] = useState(30);

  const fetchData = async () => {
    try {
      setLoading(true);
      const to = new Date().toISOString().split('T')[0];
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      const from = fromDate.toISOString().split('T')[0];

      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const apiEndpoint = `${baseUrl}/asu-unit1/production-entries`;
      const token = user?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(apiEndpoint, { 
        params: { dateFrom: from, dateTo: to, limit: 1000 }, 
        headers 
      });

      if (response.data?.success && response.data.data?.items) {
        setEntries(response.data.data.items);
      }
    } catch (err) {
      console.error('Fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  const stats = useMemo(() => {
    let total = 0;
    const typeMap = new Map<string, number>();
    
    entries.forEach(entry => {
      const val = parseFloat(String(entry.actualProduction || 0));
      total += val;
      const type = entry.yarnType || entry.machine?.yarnType || 'Unknown';
      typeMap.set(type, (typeMap.get(type) || 0) + val);
    });

    const typeBreakdown = Array.from(typeMap.entries())
      .map(([type, total]) => ({ type, total }))
      .sort((a, b) => b.total - a.total);

    return {
      totalProduction: total,
      entryCount: entries.length,
      averagePerDay: days ? total / days : 0,
      topYarnType: typeBreakdown[0]?.type,
      yarnTypeBreakdown: typeBreakdown
    };
  }, [entries, days]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h2>
        <div className="flex gap-2">
          <select 
            value={days} 
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 3 Months</option>
          </select>
          <button 
            onClick={fetchData}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <StatsCards 
        totalProduction={stats.totalProduction}
        entryCount={stats.entryCount}
        averagePerDay={stats.averagePerDay}
        topYarnType={stats.topYarnType}
        loading={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProductionTrendChart data={entries} loading={loading} />
        <YarnDistributionChart data={stats.yarnTypeBreakdown} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RecentActivityList entries={entries} loading={loading} />
      </div>
    </div>
  );
};

export default DashboardLayout;
