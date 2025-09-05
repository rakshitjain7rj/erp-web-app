import React, { useEffect, useMemo, useState } from 'react';
import { asuUnit2Api } from '../../api/asuUnit2Api';
import type { ASUProductionEntry } from '../../api/asuUnit1Api';
import { Input } from '../ui/input';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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
    const days = Object.keys(byDate)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 7)
      .map((d) => ({ date: d, total: byDate[d] }));

    const yarnSummary = Object.entries(byYarn)
      .map(([y, v]) => ({ yarnType: y, total: v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    return {
      totalActual,
      avgEfficiency,
      entryCount,
      machineCount: machines.size,
      days,
      yarnSummary,
    };
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-44 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-44 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} disabled={loading} className="px-4">
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
          <Button
            onClick={() => {
              setDateFrom(startOfCurrentMonth());
              setDateTo(todayISO());
              setTimeout(loadData, 0);
            }}
            className="px-4 bg-gray-300 text-gray-900 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            This Month
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">{error}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Production</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalActual.toFixed(2)} kg</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">Average Efficiency</div>
          <div className="mt-2 text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.avgEfficiency.toFixed(1)}%</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">Entries</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{stats.entryCount}</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">Active Machines (in range)</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{stats.machineCount}</div>
        </div>
      </div>

      {/* Yarn Summary */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium">Yarn Summary</div>
        <div className="p-4 overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Yarn Type</TableHead>
                <TableHead className="text-right">Total (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.yarnSummary.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center py-6 text-sm text-gray-500">No data</TableCell></TableRow>
              ) : (
                stats.yarnSummary.map((row) => (
                  <TableRow key={row.yarnType}>
                    <TableCell className="whitespace-nowrap">{row.yarnType}</TableCell>
                    <TableCell className="text-right">{row.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Last 7 days */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium">Last 7 Days</div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {stats.days.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No data</div>
          ) : (
            stats.days.map((d) => (
              <div key={d.date} className="flex items-center justify-between p-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">{new Date(d.date).toLocaleDateString()}</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{d.total.toFixed(2)} kg</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardUnit2;
