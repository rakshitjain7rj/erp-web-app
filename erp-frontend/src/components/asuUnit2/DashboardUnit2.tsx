import React, { useEffect, useMemo, useState } from 'react';
import { asuUnit2Api } from '../../api/asuUnit2Api';
import type { ASUProductionEntry } from '../../api/asuUnit1Api';
import { Input } from '../ui/input';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Activity, Database, TrendingUp, Layers, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const startOfCurrentMonth = (): string => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const todayISO = (): string => new Date().toISOString().slice(0, 10);

const DashboardUnit2: React.FC = () => {
  const [dateFrom, setDateFrom] = useState<string>(startOfCurrentMonth());
  const [dateTo, setDateTo] = useState<string>(todayISO());
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<ASUProductionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await asuUnit2Api.getProductionEntries({ dateFrom, dateTo, limit: 2000 } as any);
      const items: any[] = resp?.items || resp || [];
      setEntries(items as any);
    } catch (e: any) {
      console.error('Unit2 Dashboard load error:', e);
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => {
    let totalActual = 0;
    let totalTheoretical = 0;
    let entryCount = 0;
    const machines = new Set<number | string>();

    const byDate: Record<string, number> = {};
    const byYarn: Record<string, number> = {};

    for (const e of entries as any[]) {
      const ap = Number(e.actualProduction || 0);
      const tp = Number(e.theoreticalProduction || 0);
      totalActual += isFinite(ap) ? ap : 0;
      totalTheoretical += isFinite(tp) ? tp : 0;
      entryCount++;
      machines.add(e.machineNumber ?? e.machine_no ?? e.machineId ?? e.machine?.machineNo);

      const d = String(e.date || '').slice(0, 10);
      byDate[d] = (byDate[d] || 0) + (isFinite(ap) ? ap : 0);
      const yt = String(e.yarnType || e.yarn_type || 'Unknown');
      byYarn[yt] = (byYarn[yt] || 0) + (isFinite(ap) ? ap : 0);
    }

    const avgEfficiency = totalTheoretical > 0 ? (totalActual / totalTheoretical) * 100 : 0;
    
    // Prepare data for charts
    const days = Object.keys(byDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) // Sort ascending for chart
      .map((d) => ({ date: new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), total: byDate[d], rawDate: d }));

    const yarnSummary = Object.entries(byYarn)
      .map(([y, v]) => ({ name: y, value: v }))
      .sort((a, b) => b.value - a.value);

    return {
      totalActual,
      avgEfficiency,
      entryCount,
      machineCount: machines.size,
      days,
      yarnSummary,
    };
  }, [entries]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100 }
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Filters Header */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Production Dashboard</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                <CalendarIcon className="w-4 h-4 text-gray-500 ml-2" />
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-transparent border-none text-sm focus:ring-0 p-1 text-gray-700 dark:text-gray-300"
                />
                <span className="text-gray-400">-</span>
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-transparent border-none text-sm focus:ring-0 p-1 text-gray-700 dark:text-gray-300"
                />
            </div>
            
            <Button 
                onClick={loadData} 
                disabled={loading} 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="p-5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database size={60} />
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Production</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {loading ? <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" /> : `${stats.totalActual.toFixed(0)} kg`}
          </div>
          <div className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium flex items-center">
             <TrendingUp size={12} className="mr-1" /> Actual vs Theoretical
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={60} />
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Efficiency</div>
          <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
            {loading ? <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" /> : `${stats.avgEfficiency.toFixed(1)}%`}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
             Target: 85%
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers size={60} />
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Entries</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {loading ? <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" /> : stats.entryCount}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
             Records found
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <RefreshCw size={60} />
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Machines</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {loading ? <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" /> : stats.machineCount}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
             Contributing to production
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Production Trend</h3>
            <div className="h-[300px] w-full">
                {loading ? (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700/30 animate-pulse rounded-lg" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.days}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#6B7280', fontSize: 12}} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#6B7280', fontSize: 12}} 
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="total" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorTotal)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Yarn Distribution</h3>
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
                {loading ? (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700/30 animate-pulse rounded-lg" />
                ) : stats.yarnSummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.yarnSummary}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.yarnSummary.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-gray-400 text-sm">No data available</div>
                )}
            </div>
        </motion.div>
      </div>

      {/* Recent Activity / Table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Production Days</h3>
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">Last 7 Days</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium text-right">Total Production</th>
                        <th className="px-6 py-3 font-medium text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <tr key={i}>
                                <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 dark:bg-gray-700 animate-pulse rounded" /></td>
                                <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 dark:bg-gray-700 animate-pulse rounded ml-auto" /></td>
                                <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 dark:bg-gray-700 animate-pulse rounded ml-auto" /></td>
                            </tr>
                        ))
                    ) : stats.days.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No data found</td></tr>
                    ) : (
                        stats.days.slice().reverse().map((day, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{day.date}</td>
                                <td className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">{day.total.toFixed(2)} kg</td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        day.total > 500 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                        {day.total > 500 ? 'High' : 'Normal'}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardUnit2;
