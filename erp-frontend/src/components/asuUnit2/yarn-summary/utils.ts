import { YarnProductionEntryLite, YarnProductionSummaryRow } from './types';

export const normalizeYarnType = (type: string | undefined): string => {
  if (!type) return "";
  return type.trim().toLowerCase();
};

export const formatYarnTypeDisplay = (yarnType: string | undefined): string => {
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

export const getYarnTypeColor = (type: string | undefined): string => {
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

export const getEfficiencyBadgeClass = (efficiency: number) => {
  if (efficiency === null || efficiency === undefined || isNaN(efficiency)) return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  if (efficiency >= 90) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  if (efficiency >= 80) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  if (efficiency >= 70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
};

export const getEfficiencyColorClass = (efficiency: number): string => {
  if (efficiency === null || efficiency === undefined || isNaN(efficiency)) return "bg-gray-500";
  if (efficiency >= 90) return "bg-green-500";
  if (efficiency >= 80) return "bg-blue-500";
  if (efficiency >= 70) return "bg-yellow-500";
  return "bg-red-500";
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
};

export const processProductionData = (entries: YarnProductionEntryLite[], currentYarnTypes: string[]): YarnProductionSummaryRow[] => {
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

