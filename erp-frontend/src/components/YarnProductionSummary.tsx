// src/components/YarnProductionSummary.tsx

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/Button";
import { toast } from "react-hot-toast";
import { Calendar, Package, RefreshCw, TrendingUp } from "lucide-react";
import axios from "axios";

// Helper function to normalize yarn type
const normalizeYarnType = (type: string | undefined): string => {
  if (!type) return "";
  return type.trim().toLowerCase();
};

// Format yarn type for display (capitalize words)
const formatYarnTypeDisplay = (yarnType: string | undefined): string => {
  if (!yarnType) return "Unknown";
  
  // Split by spaces, hyphens, or slashes and capitalize each word
  return yarnType
    .split(/[\s\-\/]+/) // Split on spaces, hyphens, or slashes
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to get yarn type color
const getYarnTypeColor = (type: string | undefined): string => {
  if (!type) return "bg-gray-500";
  
  // Normalize the type by trimming and converting to lowercase
  const normalizedType = normalizeYarnType(type);
  
  // Extended color mapping for various yarn types
  const colorMap: Record<string, string> = {
    // Base yarn types
    cotton: "bg-green-500",
    polyester: "bg-blue-500",
    blended: "bg-purple-500",
    viscose: "bg-pink-500",
    rayon: "bg-rose-500",
    mixture: "bg-purple-500",  // Same as blended
    wool: "bg-amber-600",
    linen: "bg-lime-600",
    silk: "bg-cyan-500",
    nylon: "bg-indigo-500",
    acrylic: "bg-orange-500",
    
    // Common blends and variations
    "poly-cotton": "bg-teal-500",
    "cotton-poly": "bg-teal-500",
    "poly/cotton": "bg-teal-500",
    "cotton/poly": "bg-teal-500",
    
    // Fallback
    default: "bg-gray-500",
  };
  
  // Check for partial matches if exact match not found
  if (colorMap[normalizedType]) {
    return colorMap[normalizedType];
  }
  
  // Try to find partial matches
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalizedType.includes(key)) {
      return value;
    }
  }
  
  return colorMap.default;
};


interface MachineConfig {
  id: number;
  name: string;
  yarnType: string;
  isActive: boolean;
  location?: string;
  description?: string;
}

interface YarnProductionEntry {
  id: number;
  date: string;
  yarnType: string;
  totalProduction: number;
  efficiency: number;
  machineId: number;
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

const YarnProductionSummary: React.FC = () => {
  const [productionEntries, setProductionEntries] = useState<
    YarnProductionEntry[]
  >([]);
  const [summaryData, setSummaryData] = useState<YarnProductionSummaryRow[]>(
    []
  );
  const [distinctYarnTypes, setDistinctYarnTypes] = useState<string[]>([]);
  const [activeMachineYarnTypes, setActiveMachineYarnTypes] = useState<string[]>([]);
  const [stats, setStats] = useState<YarnSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  // Helper function to process production entries into summary format
  const processProductionData = (
    entries: YarnProductionEntry[]
  ): YarnProductionSummaryRow[] => {
    // Use productionEntries in this function to satisfy the linter
    console.debug(
      `Processing ${entries.length} entries, stored ${productionEntries.length} in state`
    );
    
    // Normalize entry yarn types for consistency
    const normalizedEntries = entries.map(entry => ({
      ...entry,
      yarnType: normalizeYarnType(entry.yarnType),
    }));
    
    // Group entries by date
    const dateGroups = normalizedEntries.reduce((groups, entry) => {
      const date = entry.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    }, {} as { [key: string]: YarnProductionEntry[] });

    // Convert to summary format
    const summaryRows: YarnProductionSummaryRow[] = Object.entries(
      dateGroups
    ).map(([date, entries]) => {
      // Group by yarn type for this date
      const yarnTypeGroups = entries.reduce((types, entry) => {
        // Ensure we're using properly normalized types
        const normalizedType = normalizeYarnType(entry.yarnType);
        
        if (!normalizedType) {
          // Skip entries with empty yarn types
          return types;
        }
        
        if (!types[normalizedType]) {
          types[normalizedType] = {
            production: 0,
            machines: new Set<number>(),
            efficiencies: [],
          };
        }
        types[normalizedType].production += entry.totalProduction;
        types[normalizedType].machines.add(entry.machineId);
        types[normalizedType].efficiencies.push(entry.efficiency);
        return types;
      }, {} as { [key: string]: { production: number; machines: Set<number>; efficiencies: number[] } });

      // Calculate yarn types production
      const yarnTypes: { [key: string]: number } = {};
      let totalProductionForDate = 0;

      // Initialize all distinct yarn types with zero production
      distinctYarnTypes.forEach(yarnType => {
        yarnTypes[yarnType] = 0;
      });
      
      // Fill in the actual production data where available
      Object.entries(yarnTypeGroups).forEach(([type, data]) => {
        yarnTypes[type] = data.production;
        totalProductionForDate += data.production;
      });

      // Calculate unique machines and average efficiency for this date
      const allMachines = new Set<number>();
      const allEfficiencies: number[] = [];
      entries.forEach((entry) => {
        allMachines.add(entry.machineId);
        allEfficiencies.push(entry.efficiency);
      });

      const averageEfficiency =
        allEfficiencies.length > 0
          ? allEfficiencies.reduce((sum, eff) => sum + eff, 0) /
            allEfficiencies.length
          : 0;

      return {
        date,
        yarnTypes,
        totalProductionForDate,
        machineCount: allMachines.size,
        averageEfficiency,
      };
    });

    // Sort by date descending
    return summaryRows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchYarnSummary();
    setRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Fetch yarn production summary data
  const fetchYarnSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const BASE_URL = import.meta.env.VITE_API_URL || "";
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Fetch both machine configurations and production entries in parallel
      const [machinesResponse, entriesResponse] = await Promise.all([
        axios.get(`${BASE_URL}/asu-machines`, { headers }),
        axios.get(`${BASE_URL}/yarn/production-entries`, { headers })
      ]);

      // Parse the production entries data
      const entries: YarnProductionEntry[] = entriesResponse.data.success
        ? entriesResponse.data.data
        : entriesResponse.data;

      setProductionEntries(entries);

      // Extract and normalize yarn types from machine configurations
      const machines = machinesResponse.data.success 
        ? machinesResponse.data.data 
        : machinesResponse.data;
      
      console.log('Fetched machines:', machines);
      
      // Get all yarn types from machines (both active and inactive)
      const allMachineYarnTypes = machines
        .filter((machine: any) => machine.yarnType)
        .map((machine: any) => normalizeYarnType(machine.yarnType));
        
      // Get specifically active machine yarn types for highlighting
      const activeMachines = machines.filter((machine: any) => machine.isActive);
      const activeMachineYarnTypes = activeMachines
        .filter((machine: any) => machine.yarnType)
        .map((machine: any) => normalizeYarnType(machine.yarnType));
      
      console.log('Active machine yarn types:', activeMachineYarnTypes);
      console.log('All machine yarn types:', allMachineYarnTypes);
      
      // Store active machine yarn types separately (for validation/highlighting)
      setActiveMachineYarnTypes(activeMachineYarnTypes);
      
      // Get all yarn types from production entries 
      const entryYarnTypes = entries.map(entry => normalizeYarnType(entry.yarnType))
        .filter(Boolean); // Remove empty types
      
      console.log('Entry yarn types:', entryYarnTypes);
      
      // Create a map of original casing for display purposes
      // This preserves the best casing from either machine configs or entries
      const yarnTypeDisplayMap = new Map<string, string>();
      
      // First add machine yarn types as they're likely more consistently formatted
      machines.forEach((machine: any) => {
        if (machine.yarnType) {
          const normalizedType = normalizeYarnType(machine.yarnType);
          if (!yarnTypeDisplayMap.has(normalizedType)) {
            yarnTypeDisplayMap.set(normalizedType, machine.yarnType.trim());
          }
        }
      });
      
      // Then add any entry types that might be missing
      entries.forEach(entry => {
        if (entry.yarnType) {
          const normalizedType = normalizeYarnType(entry.yarnType);
          if (!yarnTypeDisplayMap.has(normalizedType)) {
            yarnTypeDisplayMap.set(normalizedType, entry.yarnType.trim());
          }
        }
      });
      
      console.log('Yarn type display map:', Object.fromEntries(yarnTypeDisplayMap));
      
      // Combine, normalize, and deduplicate yarn types, prioritizing active machine types first
      const normalizedYarnTypes = [...new Set([
        ...activeMachineYarnTypes, // Put active machine yarn types first
        ...allMachineYarnTypes,    // Then other machine yarn types
        ...entryYarnTypes          // Then any remaining entry yarn types
      ])]
        .filter(Boolean)
        .sort();
      
      console.log('Final normalized yarn types:', normalizedYarnTypes);
      
      // Use this unified, normalized list of yarn types
      setDistinctYarnTypes(normalizedYarnTypes);

      // Process data into summary format
      const summary = processProductionData(entries);
      setSummaryData(summary);

      // Calculate stats
      const totalProduction = entries.reduce(
        (sum, entry) => sum + entry.totalProduction,
        0
      );
      const uniqueDates = new Set(entries.map((entry) => entry.date));
      const stats: YarnSummaryStats = {
        totalProduction,
        totalDays: uniqueDates.size,
        yarnTypes: normalizedYarnTypes.length,
        averageDaily: uniqueDates.size > 0 ? totalProduction / uniqueDates.size : 0,
      };
      setStats(stats);
    } catch (err) {
      // Provide more specific error messages based on the error type
      let errorMessage = "Failed to fetch yarn production data";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          // The request was made and the server responded with an error status
          if (err.response.status === 401) {
            errorMessage = "Authentication error. Please log in again.";
          } else if (err.response.status === 403) {
            errorMessage = "You do not have permission to access this data.";
          } else if (err.response.status === 404) {
            const endpoint = err.config?.url || "";
            if (endpoint.includes("asu-machines")) {
              errorMessage = "Machine configuration data not found.";
            } else {
              errorMessage = "Yarn production data not found.";
            }
          } else {
            errorMessage = `Server error: ${
              err.response.data?.message || err.message
            }`;
          }
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage =
            "No response from server. Please check your connection.";
        }
      }

      setError(errorMessage);
      console.error("Error fetching yarn summary:", err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYarnSummary().then(() => {
      setLastRefreshed(new Date());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get efficiency badge color
  const getEfficiencyBadgeClass = (efficiency: number) => {
    if (efficiency >= 90) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    } else if (efficiency >= 80) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    } else if (efficiency >= 70) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    } else {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }
  };

  // Get efficiency color class for the indicator
  const getEfficiencyColorClass = (efficiency: number): string => {
    if (efficiency >= 90) {
      return "bg-green-500";
    } else if (efficiency >= 80) {
      return "bg-blue-500";
    } else if (efficiency >= 70) {
      return "bg-yellow-500";
    } else {
      return "bg-red-500";
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Yarn Production Summary
          </h2>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Yarn Production Summary
          </h2>
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
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {error}
          </p>
          <Button onClick={fetchYarnSummary} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Production
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalProduction.toFixed(1)} kg
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Days Tracked
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDays}
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Yarn Types
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.yarnTypes}
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-4 overflow-hidden transition-all duration-300 bg-white border-0 shadow-sm rounded-xl dark:bg-gray-800 group hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/30">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Daily Average
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageDaily.toFixed(1)} kg
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Production Summary Table */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Yarn Production Summary
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Daily production totals grouped by yarn type
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last refreshed:{" "}
                  {lastRefreshed.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              )}
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
                variant="default"
                className="flex items-center gap-2"
              >
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

        <div className="p-6">
          {summaryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
                <Package className="w-10 h-10 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                No production data available
              </p>
              <p className="max-w-md mt-2 text-gray-500 dark:text-gray-400">
                Production data will appear here once machines start generating
                yarn production entries.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="w-full min-w-full">
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow className="border-b dark:border-gray-700">
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400">
                      Date
                    </TableHead>
                    {/* Dynamic yarn type columns */}
                    {distinctYarnTypes.map((yarnType, index) => {
                      // Format the display name using our helper function
                      const displayName = formatYarnTypeDisplay(yarnType);
                      
                      // Check if this is an active yarn type from machines
                      const isActiveMachineYarn = activeMachineYarnTypes.includes(yarnType);
                      
                      return (
                        <TableHead 
                          key={`yarn-type-${yarnType}-${index}`}
                          className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <span
                              className={`inline-block w-2 h-2 mb-1 rounded-full ${getYarnTypeColor(yarnType)}`}
                            ></span>
                            <span className={isActiveMachineYarn ? "font-semibold" : ""}>
                              {displayName}
                            </span>
                          </div>
                        </TableHead>
                      );
                    })}

                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-indigo-600 uppercase sm:px-6 dark:text-indigo-400">
                      <div className="flex flex-col items-center justify-center">
                        <span className="inline-block w-2 h-2 mb-1 rounded-full bg-indigo-500"></span>
                        Total (All Types)
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400">
                      Machines
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400">
                      Avg Efficiency
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {summaryData.map((row, index) => (
                    <TableRow
                      key={index}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatDate(row.date)}
                          </span>
                        </div>
                      </TableCell>
                      {/* Dynamic yarn type data columns */}
                      {distinctYarnTypes.map((yarnType, typeIndex) => {
                        // Normalize the yarn type to ensure consistent matching
                        const normalizedType = normalizeYarnType(yarnType);
                        
                        // Check if this yarn type exists in the row data, using normalized comparison
                        const productionValue = Object.entries(row.yarnTypes)
                          .find(([key]) => normalizeYarnType(key) === normalizedType)?.[1] || 0;
                        
                        return (
                          <TableCell
                            key={`row-${index}-type-${normalizedType}-${typeIndex}`}
                            className="px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6"
                          >
                            {(() => {
                              // Check if this is an active yarn type from machines
                              const isActiveMachineYarn = activeMachineYarnTypes.includes(normalizedType);
                              const hasValue = productionValue > 0;
                              
                              return (
                                <span
                                  className={`${
                                    hasValue
                                      ? isActiveMachineYarn 
                                        ? "text-blue-600 dark:text-blue-400 font-medium"
                                        : "text-blue-500 dark:text-blue-300" 
                                      : "text-gray-400 dark:text-gray-500"
                                  }`}
                                >
                                  {hasValue ? productionValue.toFixed(2) : "0.00"}
                                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                    kg
                                  </span>
                                </span>
                              );
                            })()}
                          </TableCell>
                        );
                      })}
                      <TableCell className="px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {row.totalProductionForDate.toFixed(2)}
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                            kg
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center whitespace-nowrap sm:px-6">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {row.machineCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center whitespace-nowrap sm:px-6">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getEfficiencyColorClass(
                              row.averageEfficiency
                            )}`}
                          ></div>
                          <Badge
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyBadgeClass(
                              row.averageEfficiency
                            )}`}
                          >
                            {row.averageEfficiency.toFixed(1)}%
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total row */}
                  <TableRow className="transition-colors bg-gray-50 dark:bg-gray-800/50">
                    <TableCell className="px-4 py-4 font-semibold whitespace-nowrap sm:px-6 text-gray-700 dark:text-gray-200">
                      Total Production
                    </TableCell>
                    {distinctYarnTypes.map((yarnType, typeIndex) => {
                      // Normalize the yarn type to ensure consistent matching
                      const normalizedType = normalizeYarnType(yarnType);
                      
                      // Calculate total for this yarn type using normalized comparison
                      const total = summaryData.reduce((sum, row) => {
                        const matchingYarnType = Object.entries(row.yarnTypes)
                          .find(([key]) => normalizeYarnType(key) === normalizedType);
                        return sum + (matchingYarnType?.[1] || 0);
                      }, 0);
                      
                      // Check if this is an active yarn type from machines
                      const isActiveMachineYarn = activeMachineYarnTypes.includes(normalizedType);

                      return (
                        <TableCell
                          key={`total-type-${yarnType}-${typeIndex}`}
                          className={`px-4 py-4 font-semibold text-center whitespace-nowrap sm:px-6 ${
                            isActiveMachineYarn ? "border-b-2 border-blue-200 dark:border-blue-800/30" : ""
                          }`}
                        >
                          <span className="text-blue-700 dark:text-blue-300">
                            {total.toFixed(2)}
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                              kg
                            </span>
                          </span>
                        </TableCell>
                      );
                    })}
                    <TableCell className="px-4 py-4 font-semibold text-center whitespace-nowrap sm:px-6">
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold">
                        {summaryData
                          .reduce(
                            (sum, row) => sum + row.totalProductionForDate,
                            0
                          )
                          .toFixed(2)}
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          kg
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center whitespace-nowrap sm:px-6">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {summaryData.reduce(
                            (max, row) => Math.max(max, row.machineCount),
                            0
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center whitespace-nowrap sm:px-6">
                      {stats && (
                        <div className="flex items-center justify-center gap-2">
                          {(() => {
                            const weightedAvgEff =
                              summaryData.reduce(
                                (sum, row) => sum + row.averageEfficiency * row.machineCount,
                                0
                              ) /
                              (summaryData.reduce((sum, row) => sum + row.machineCount, 0) || 1);
                            
                            return (
                              <>
                                <div
                                  className={`w-3 h-3 rounded-full ${getEfficiencyColorClass(
                                    weightedAvgEff
                                  )}`}
                                ></div>
                                <Badge
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getEfficiencyBadgeClass(
                                    weightedAvgEff
                                  )}`}
                                >
                                  {weightedAvgEff.toFixed(1)}%
                                </Badge>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YarnProductionSummary;
