import React, { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/Button";
import { toast } from "react-hot-toast";
import { Calendar, Package, RefreshCw, TrendingUp } from "lucide-react";
import axios from "axios";
import { asuUnit2Api } from "../../api/asuUnit2Api";

// Helpers copied from Unit 1 and kept consistent
const normalizeYarnType = (type: string | undefined): string => {
  if (!type) return "";
  return type.trim().toLowerCase();
};

const formatYarnTypeDisplay = (yarnType: string | undefined): string => {
  if (!yarnType) return "Unknown";
  const upperCaseWords = ['pp', 'cvc', 'pc'];
  return yarnType
    .split(' ')
    .map(word => {
      const lowerWord = word.toLowerCase();
      if (upperCaseWords.includes(lowerWord)) return lowerWord.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const getYarnTypeColor = (type: string | undefined): string => {
  if (!type) return "bg-gray-500";
  const normalizedType = normalizeYarnType(type);
  const colorMap: Record<string, string> = {
    cotton: "bg-green-500",
    polyester: "bg-blue-500",
    blended: "bg-purple-500",
    viscose: "bg-pink-500",
    rayon: "bg-rose-500",
    mixture: "bg-purple-500",
    wool: "bg-amber-600",
    linen: "bg-lime-600",
    silk: "bg-cyan-500",
    nylon: "bg-indigo-500",
    acrylic: "bg-orange-500",
    "poly-cotton": "bg-teal-500",
    "cotton-poly": "bg-teal-500",
    "poly/cotton": "bg-teal-500",
    "cotton/poly": "bg-teal-500",
    default: "bg-gray-500",
  };
  if (colorMap[normalizedType]) return colorMap[normalizedType];
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalizedType.includes(key)) return value;
  }
  return colorMap.default;
};

interface MachineLite { id: number; yarnType?: string; isActive: boolean; }
interface YarnProductionEntryLite { date: string; yarnBreakdown: { [key: string]: number }; totalProduction: number; machines: number; avgEfficiency: number; machineId?: number; }
interface YarnProductionSummaryRow { date: string; yarnTypes: { [key: string]: number }; totalProductionForDate: number; machineCount: number; averageEfficiency: number; }
interface YarnSummaryStats { totalProduction: number; totalDays: number; yarnTypes: number; averageDaily: number; }

const YarnSummaryUnit2: React.FC = () => {
  const [summaryData, setSummaryData] = useState<YarnProductionSummaryRow[]>([]);
  const [distinctYarnTypes, setDistinctYarnTypes] = useState<string[]>([]);
  const [stats, setStats] = useState<YarnSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  const yarnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    summaryData.forEach(row => {
      Object.entries(row.yarnTypes).forEach(([type, val]) => {
        totals[type] = (totals[type] || 0) + val;
      });
    });
    return totals;
  }, [summaryData]);
  const grandTotal = useMemo(() => Object.values(yarnTotals).reduce((a,b)=>a+b,0), [yarnTotals]);
  const productionWeightedAvgEfficiency = useMemo(() => {
    let weightedSum = 0; let prodSum = 0;
    summaryData.forEach(r => {
      if (!isNaN(r.averageEfficiency) && r.totalProductionForDate > 0) {
        weightedSum += r.averageEfficiency * r.totalProductionForDate;
        prodSum += r.totalProductionForDate;
      }
    });
    if (prodSum > 0) return weightedSum / prodSum;
    const valid = summaryData.filter(r => !isNaN(r.averageEfficiency));
    if (!valid.length) return 0;
    return valid.reduce((s,r)=>s+r.averageEfficiency,0)/valid.length;
  }, [summaryData]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  };

  const processProductionData = (entries: YarnProductionEntryLite[], currentYarnTypes: string[]): YarnProductionSummaryRow[] => {
    const currentSet = new Set(currentYarnTypes);
    const dailyMap: Map<string, { yarn: Map<string, number>; machines: Set<number>; effSum: number; effCount: number }> = new Map();

    entries.forEach(entry => {
      if (!entry.yarnBreakdown) return;
      if (!dailyMap.has(entry.date)) dailyMap.set(entry.date, { yarn: new Map(), machines: new Set(), effSum: 0, effCount: 0 });
      const rec = dailyMap.get(entry.date)!;

      Object.entries(entry.yarnBreakdown).forEach(([rawKey, val]) => {
        if (val <= 0) return;
        const normKey = normalizeYarnType(rawKey);
        if (!currentSet.has(normKey)) return;
        rec.yarn.set(normKey, (rec.yarn.get(normKey) || 0) + val);
      });

      if (entry.machineId) rec.machines.add(entry.machineId);
      if (entry.avgEfficiency !== undefined && !isNaN(entry.avgEfficiency)) {
        rec.effSum += entry.avgEfficiency;
        rec.effCount += 1;
      }
    });

    const rows: YarnProductionSummaryRow[] = Array.from(dailyMap.entries()).map(([date, rec]) => {
      const yarnTypesObj: { [k: string]: number } = {};
      rec.yarn.forEach((v, k) => { yarnTypesObj[k] = v; });
      const total = Array.from(rec.yarn.values()).reduce((a, b) => a + b, 0);
      const avgEff = rec.effCount > 0 ? rec.effSum / rec.effCount : 0;
      return { date, yarnTypes: yarnTypesObj, totalProductionForDate: total, machineCount: rec.machines.size, averageEfficiency: avgEff };
    });

    // Sort desc by date
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchYarnSummary();
    setRefreshing(false);
    setLastRefreshed(new Date());
  };

  const fetchYarnSummary = async () => {
    try {
      setLoading(true); setError(null);
      const [machines, paged] = await Promise.all([
        asuUnit2Api.getAllMachines(),
        asuUnit2Api.getProductionEntries({ limit: 500 } as any)
      ]);

      // Collect active machine yarn types (current only)
      const activeMachineYarnTypes = (machines as any[])
        .filter((m: MachineLite) => m.isActive)
        .map((m: MachineLite) => normalizeYarnType(m.yarnType || ''))
        .filter(Boolean);
      const normalizedYarnTypes = [...new Set(activeMachineYarnTypes)].sort((a,b)=>a.localeCompare(b));
      setDistinctYarnTypes(normalizedYarnTypes);

      // Extract raw backend entries (separate day/night)
      const rawItems: any[] = Array.isArray((paged as any)?.items) ? (paged as any).items
        : Array.isArray((paged as any)?.data?.items) ? (paged as any).data.items
        : Array.isArray((paged as any)?.data) ? (paged as any).data
        : Array.isArray(paged as any) ? (paged as any) : [];

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
      setSummaryData(summary);

      const totalProduction = entries.reduce((sum, e) => sum + (e.totalProduction || 0), 0);
      const uniqueDates = new Set(entries.map(e => e.date));
      const stats: YarnSummaryStats = {
        totalProduction,
        totalDays: uniqueDates.size,
        yarnTypes: normalizedYarnTypes.length,
        averageDaily: uniqueDates.size > 0 ? totalProduction / uniqueDates.size : 0,
      };
      setStats(stats);
    } catch (err) {
      let errorMessage = "Failed to fetch yarn production data (Unit 2)";
      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (err.response.status === 401) errorMessage = "Authentication error. Please log in again.";
          else if (err.response.status === 403) errorMessage = "You do not have permission to access this data.";
          else if (err.response.status === 404) errorMessage = "Unit 2 yarn data not found.";
          else errorMessage = `Server error: ${err.response.data?.message || err.message}`;
        } else if (err.request) {
          errorMessage = "No response from server. Please check your connection.";
        }
      }
      setError(errorMessage);
      console.error("Unit 2 yarn summary error:", err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYarnSummary().then(() => setLastRefreshed(new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEfficiencyBadgeClass = (efficiency: number) => {
    if (efficiency === null || efficiency === undefined || isNaN(efficiency)) return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    if (efficiency >= 90) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (efficiency >= 80) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (efficiency >= 70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };
  const getEfficiencyColorClass = (efficiency: number): string => {
    if (efficiency === null || efficiency === undefined || isNaN(efficiency)) return "bg-gray-500";
    if (efficiency >= 90) return "bg-green-500";
    if (efficiency >= 80) return "bg-blue-500";
    if (efficiency >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{error}</p>
          <Button onClick={fetchYarnSummary} className="mt-4">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30"><Package className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
              <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Production</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProduction.toFixed(1)} kg</p></div>
            </div>
          </div>
          <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30"><Calendar className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
              <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Days Tracked</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDays}</p></div>
            </div>
          </div>
          <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30"><Package className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
              <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Yarn Types</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.yarnTypes}</p></div>
            </div>
          </div>
          <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/30"><TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" /></div>
              <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Average</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageDaily.toFixed(1)} kg</p></div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Yarn Production Summary (Unit 2)</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Daily production totals grouped by yarn type (current types only)</p>
            </div>
            <div className="flex items-center gap-3">
              {lastRefreshed && (<p className="text-sm text-gray-500 dark:text-gray-400">Last refreshed: {lastRefreshed.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}</p>)}
              <Button onClick={handleRefresh} disabled={refreshing} size="sm" variant="default" className="flex items-center gap-2">
                {refreshing ? (<div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>) : (<RefreshCw className="w-4 h-4" />)}
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 pb-6">
          {summaryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30"><Package className="w-10 h-10 text-blue-500 dark:text-blue-400" /></div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No production data available</p>
              <p className="max-w-md mt-2 text-gray-500 dark:text-gray-400">Production data will appear here once machines start generating yarn production entries.</p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto relative">
                  <Table className="w-full min-w-full table-fixed">
                    <TableHeader className="bg-gray-50 dark:bg-gray-800">
                      <TableRow className="border-b dark:border-gray-700">
                        <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[120px]">Date</TableHead>
                        {distinctYarnTypes.map((yarnType, index) => (
                          <TableHead key={`yarn-type-${yarnType}-${index}`} className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[100px]">
                            <div className="flex flex-col items-center justify-center">
                              <span className={`inline-block w-2 h-2 mb-1 rounded-full ${getYarnTypeColor(yarnType)}`}></span>
                              <span className="font-semibold">{formatYarnTypeDisplay(yarnType)}</span>
                              <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">CURRENT</span>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-indigo-600 uppercase sm:px-6 dark:text-indigo-400 w-[140px]">
                          <div className="flex flex-col items-center justify-center"><span className="inline-block w-2 h-2 mb-1 bg-indigo-500 rounded-full"></span>Total (All Types)</div>
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[100px]">Machines</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[120px]">Avg Efficiency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {summaryData.map((row, index) => (
                        <TableRow key={index} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(row.date)}</span></div>
                          </TableCell>
                          {distinctYarnTypes.map((yarnType, typeIndex) => (
                            <TableCell key={`row-${index}-type-${yarnType}-${typeIndex}`} className="px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6">
                              {(() => {
                                const productionValue = row.yarnTypes[yarnType] || 0;
                                const hasValue = productionValue > 0;
                                return (
                                  <span className={`${hasValue ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {hasValue ? productionValue.toFixed(2) : '0.00'}
                                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">kg</span>
                                  </span>
                                );
                              })()}
                            </TableCell>
                          ))}
                          <TableCell className="px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{row.totalProductionForDate.toFixed(2)}<span className="ml-1 text-xs text-gray-500 dark:text-gray-400">kg</span></span>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center whitespace-nowrap sm:px-6">
                            <div className="flex items-center justify-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-gray-700 dark:text-gray-300">{row.machineCount}</span></div>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center whitespace-nowrap sm:px-6">
                            <div className="flex items-center justify-center gap-2">
                              {(() => {
                                const efficiency = row.averageEfficiency;
                                const isValidEfficiency = !isNaN(efficiency) && efficiency !== null && efficiency !== undefined;
                                const displayEfficiency = isValidEfficiency ? efficiency : 0;
                                return (<><div className={`w-3 h-3 rounded-full ${getEfficiencyColorClass(displayEfficiency)}`}></div><Badge className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyBadgeClass(displayEfficiency)}`}>{isValidEfficiency ? displayEfficiency.toFixed(1) : '0.0'}%</Badge></>);
                              })()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {summaryData.length > 0 && (
                <div className="mt-4 w-full overflow-x-auto">
                  <Table className="w-full min-w-full table-fixed">
                    <TableBody>
                      <TableRow className="bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-200 dark:border-indigo-800">
                        <TableCell className="px-4 py-3 font-semibold text-left whitespace-nowrap sm:px-6 text-indigo-700 dark:text-indigo-300">Totals</TableCell>
                        {distinctYarnTypes.map((yarnType, idx) => (
                          <TableCell key={`outside-total-${yarnType}-${idx}`} className="px-4 py-3 font-semibold text-center whitespace-nowrap sm:px-6">
                            <span className="text-indigo-700 dark:text-indigo-300">{(yarnTotals[yarnType] || 0).toFixed(2)}<span className="ml-1 text-xs text-gray-500 dark:text-gray-400">kg</span></span>
                          </TableCell>
                        ))}
                        <TableCell className="px-4 py-3 font-bold text-center whitespace-nowrap sm:px-6 text-indigo-800 dark:text-indigo-200">{grandTotal.toFixed(2)}<span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">kg</span></TableCell>
                        <TableCell className="px-4 py-3 text-center whitespace-nowrap sm:px-6"><span className="text-gray-500 dark:text-gray-400 text-xs font-medium">—</span></TableCell>
                        <TableCell className="px-4 py-3 text-center whitespace-nowrap sm:px-6" title="Production-weighted average efficiency across all visible days"><span className="inline-flex items-center gap-1 text-indigo-800 dark:text-indigo-200 font-semibold">{productionWeightedAvgEfficiency.toFixed(1)}%</span></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {showLegend && (
                <div className="mt-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Legend</h4>
                    <button onClick={() => setShowLegend(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Hide</button>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div><span className="text-xs text-gray-600 dark:text-gray-400">Current Machine Yarn Types Only</span></div>
                    <div className="flex items-center gap-2"><span className="px-1 py-0.5 text-[10px] rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">CURRENT</span><span className="text-xs text-gray-600 dark:text-gray-400">Shows production for current yarn type only</span></div>
                    <div className="flex items-center gap-2"><span className="text-xs text-blue-600 dark:text-blue-400 font-medium">123.45</span><span className="text-xs text-gray-600 dark:text-gray-400">Production amount for current yarn type on this date</span></div>
                    <div className="flex items-center gap-2"><span className="text-xs text-gray-400 dark:text-gray-500">0.00</span><span className="text-xs text-gray-600 dark:text-gray-400">No production for this yarn type on this date</span></div>
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">📝 <strong>Note:</strong> This view shows production data mapped to current machine yarn types only. If a machine's yarn type was changed, past production data will only be visible if it matches the current yarn type.</p>
                  </div>
                </div>
              )}
              {!showLegend && (
                <div className="mt-4 text-center">
                  <button onClick={() => setShowLegend(true)} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Show Legend</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default YarnSummaryUnit2;
