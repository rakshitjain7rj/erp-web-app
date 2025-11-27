import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { asuUnit1Api } from "../../../api/asuUnit1Api";
import SummaryStats from "./SummaryStats";
import SummaryTable from "./SummaryTable";
import SummaryLegend from "./SummaryLegend";
import { normalizeYarnType } from "./utils";

// Define machine interface
interface Machine {
  id: number;
  name: string;
  yarnType: string;
  isActive: boolean;
  location?: string;
  description?: string;
}

interface YarnProductionEntry {
  date: string;
  yarnBreakdown: { [key: string]: number };
  totalProduction: number;
  machines: number;
  avgEfficiency: number;
  machineId?: number;
}

interface YarnProductionSummaryRow {
  date: string;
  yarnTypes: { [key: string]: number };
  totalProductionForDate: number;
  machineCount: number;
  averageEfficiency: number;
}

interface YarnSummaryStats {
  totalProduction: number;
  totalDays: number;
  yarnTypes: number;
  averageDaily: number;
}

const YarnSummaryLayout: React.FC = () => {
  const [summaryData, setSummaryData] = useState<YarnProductionSummaryRow[]>([]);
  const [distinctYarnTypes, setDistinctYarnTypes] = useState<string[]>([]);
  const [activeMachineYarnTypes, setActiveMachineYarnTypes] = useState<string[]>([]);
  const [stats, setStats] = useState<YarnSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Aggregated per-column (current yarn types) totals & grand total
  const yarnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    summaryData.forEach(row => {
      Object.entries(row.yarnTypes).forEach(([type, val]) => {
        totals[type] = (totals[type] || 0) + val;
      });
    });
    return totals;
  }, [summaryData]);

  const grandTotal = useMemo(() => Object.values(yarnTotals).reduce((a, b) => a + b, 0), [yarnTotals]);

  // Production-weighted overall average efficiency
  const productionWeightedAvgEfficiency = useMemo(() => {
    let weightedSum = 0;
    let prodSum = 0;
    summaryData.forEach(r => {
      if (!isNaN(r.averageEfficiency) && r.totalProductionForDate > 0) {
        weightedSum += r.averageEfficiency * r.totalProductionForDate;
        prodSum += r.totalProductionForDate;
      }
    });
    if (prodSum > 0) return weightedSum / prodSum;
    const valid = summaryData.filter(r => !isNaN(r.averageEfficiency));
    if (!valid.length) return 0;
    return valid.reduce((s, r) => s + r.averageEfficiency, 0) / valid.length;
  }, [summaryData]);

  const processProductionData = useCallback((
    entries: YarnProductionEntry[],
    currentYarnTypes: string[]
  ): YarnProductionSummaryRow[] => {
    const currentSet = new Set(currentYarnTypes);
    const dailyMap: Map<string, { yarn: Map<string, number>; machines: Set<number>; effSum: number; effCount: number }> = new Map();

    entries.forEach(entry => {
      if (!entry.yarnBreakdown) return;
      if (!dailyMap.has(entry.date)) {
        dailyMap.set(entry.date, { yarn: new Map(), machines: new Set(), effSum: 0, effCount: 0 });
      }
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
      return {
        date,
        yarnTypes: yarnTypesObj,
        totalProductionForDate: total,
        machineCount: rec.machines.size,
        averageEfficiency: avgEff,
      };
    });

    const existingDates = new Set(rows.map(r => r.date));
    entries.forEach(e => {
      if (!existingDates.has(e.date)) {
        const hasCurrent = e.yarnBreakdown && Object.keys(e.yarnBreakdown).some(k => currentSet.has(normalizeYarnType(k)));
        if (hasCurrent) return;
        rows.push({
          date: e.date,
          yarnTypes: {},
          totalProductionForDate: 0,
          machineCount: 0,
          averageEfficiency: 0,
        });
      }
    });

    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const fetchYarnSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [machines, paged] = await Promise.all([
        asuUnit1Api.getAllMachines(),
        asuUnit1Api.getProductionEntries({ limit: 500 })
      ]);

      const entries: YarnProductionEntry[] = (paged?.items || []).map((it: any) => {
        const key = normalizeYarnType(it.yarnType || it.machine?.yarnType || "");
        const total = Number(it.total || 0);
        const pct = Number(it.percentage || 0);
        return {
          date: it.date,
          yarnBreakdown: key ? { [key]: total } : {},
          totalProduction: total,
          machines: 1,
          avgEfficiency: isNaN(pct) ? 0 : pct,
          machineId: it.machineId,
        } as YarnProductionEntry;
      });

      const activeMachines = (machines as any[]).filter((machine: Machine) => machine.isActive);
      const activeMachineYarnTypes = activeMachines
        .filter((machine: Machine) => machine.yarnType)
        .map((machine: Machine) => normalizeYarnType(machine.yarnType));
      setActiveMachineYarnTypes(activeMachineYarnTypes);

      const allYarnTypesFromEntries = entries
        .flatMap(entry => Object.keys(entry.yarnBreakdown))
        .filter(Boolean);
      const normalizedYarnTypes = [...new Set(allYarnTypesFromEntries)].sort((a, b) => a.localeCompare(b));
      setDistinctYarnTypes(normalizedYarnTypes);

      const summary = processProductionData(entries, normalizedYarnTypes);
      setSummaryData(summary);

      const totalProduction = (entries || []).reduce((sum: number, entry: YarnProductionEntry) => sum + (entry.totalProduction || 0), 0);
      const uniqueDates = new Set((entries || []).map((entry: YarnProductionEntry) => entry.date));
      const stats: YarnSummaryStats = {
        totalProduction,
        totalDays: uniqueDates.size,
        yarnTypes: normalizedYarnTypes.length,
        averageDaily: uniqueDates.size > 0 ? totalProduction / uniqueDates.size : 0,
      };
      setStats(stats);
    } catch (err) {
      let errorMessage = "Failed to fetch yarn production data";
      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (err.response.status === 401) errorMessage = "Authentication error. Please log in again.";
          else if (err.response.status === 403) errorMessage = "You do not have permission to access this data.";
          else if (err.response.status === 404) errorMessage = "Data not found.";
          else errorMessage = `Server error: ${err.response.data?.message || err.message}`;
        } else if (err.request) {
          errorMessage = "No response from server. Please check your connection.";
        }
      }
      setError(errorMessage);
      console.error("Error fetching yarn summary:", err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [processProductionData]);

  useEffect(() => {
    fetchYarnSummary().then(() => {
      setLastRefreshed(new Date());
    });
  }, [fetchYarnSummary]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchYarnSummary();
    setRefreshing(false);
    setLastRefreshed(new Date());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SummaryStats stats={stats} loading={loading} />
      
      <SummaryTable 
        data={summaryData}
        distinctYarnTypes={distinctYarnTypes}
        activeMachineYarnTypes={activeMachineYarnTypes}
        yarnTotals={yarnTotals}
        grandTotal={grandTotal}
        productionWeightedAvgEfficiency={productionWeightedAvgEfficiency}
        loading={loading}
        error={error}
        refreshing={refreshing}
        lastRefreshed={lastRefreshed}
        onRefresh={handleRefresh}
      />

      <SummaryLegend show={showLegend} onToggle={setShowLegend} />
    </div>
  );
};

export default YarnSummaryLayout;
