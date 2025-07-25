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
};  // Format yarn type for display (capitalize words)
const formatYarnTypeDisplay = (yarnType: string | undefined): string => {
  if (!yarnType) return "Unknown";
  
  // Common abbreviations that should remain uppercase
  const upperCaseWords = ['pp', 'cvc', 'pc'];
  
  return yarnType
    .split(' ')
    .map(word => {
      const lowerWord = word.toLowerCase();
      if (upperCaseWords.includes(lowerWord)) {
        return lowerWord.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
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
    // The backend already returns data in the correct format, we just need to transform it
    const summaryRows: YarnProductionSummaryRow[] = entries.map((entry) => {
      // The backend returns yarnBreakdown which is exactly what we need
      const yarnTypes: { [key: string]: number } = {};
      
      // Initialize all distinct yarn types with zero production
      distinctYarnTypes.forEach(yarnType => {
        yarnTypes[yarnType] = 0;
      });
      
      // Fill in the actual production data from yarnBreakdown
      if (entry.yarnBreakdown) {
        Object.entries(entry.yarnBreakdown).forEach(([type, production]) => {
          const normalizedType = normalizeYarnType(type);
          if (normalizedType) {
            yarnTypes[normalizedType] = production || 0;
          }
        });
      }

      return {
        date: entry.date,
        yarnTypes,
        totalProductionForDate: entry.totalProduction || 0,
        machineCount: entry.machines || 0,
        averageEfficiency: entry.avgEfficiency || 0,
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

      // Extract and normalize yarn types from machine configurations
      const machines: Machine[] = machinesResponse.data.success 
        ? machinesResponse.data.data 
        : machinesResponse.data;
      
      // Get all yarn types from machines (both active and inactive)
      const allMachineYarnTypes = machines
        .filter((machine: Machine) => machine.yarnType)
        .map((machine: Machine) => normalizeYarnType(machine.yarnType));
      
      // Get yarn types specifically from active machines for special highlighting
      const activeMachines = machines.filter((machine: Machine) => machine.isActive);
      const activeMachineYarnTypes = activeMachines
        .filter((machine: Machine) => machine.yarnType)
        .map((machine: Machine) => normalizeYarnType(machine.yarnType));
      
      // Store active machine yarn types separately (for validation/highlighting)
      setActiveMachineYarnTypes(activeMachineYarnTypes);
      
      // Extract yarn types from the breakdown data in entries
      const breakdownYarnTypes: string[] = [];
      entries.forEach(entry => {
        if (entry.yarnBreakdown && typeof entry.yarnBreakdown === 'object') {
          Object.keys(entry.yarnBreakdown).forEach(key => {
            const normalizedKey = normalizeYarnType(key);
            if (normalizedKey) breakdownYarnTypes.push(normalizedKey);
          });
        }
      });
      
      // Combine all sources, normalize, deduplicate and sort
      const normalizedYarnTypes = [...new Set([
        ...allMachineYarnTypes,
        ...breakdownYarnTypes
      ])]
        .filter(Boolean)
        .sort((a, b) => {
          // Prioritize active machine yarn types
          const aIsActive = activeMachineYarnTypes.includes(a);
          const bIsActive = activeMachineYarnTypes.includes(b);
          
          if (aIsActive && !bIsActive) return -1;
          if (!aIsActive && bIsActive) return 1;
          
          // Then sort alphabetically
          return a.localeCompare(b);
        });
      
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
    // Handle invalid values
    if (efficiency === null || efficiency === undefined || isNaN(efficiency)) {
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
    
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
    // Handle invalid values
    if (efficiency === null || efficiency === undefined || isNaN(efficiency)) {
      return "bg-gray-500";
    }
    
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
          <div className="flex items-center justify-between">
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

        <div className="p-6 pb-6">
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
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto relative">
                <Table className="w-full min-w-full table-fixed">
                  <TableHeader className="bg-gray-50 dark:bg-gray-800">
                      <TableRow className="border-b dark:border-gray-700">
                        <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[120px]">
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
                          className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[100px]"
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

                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-indigo-600 uppercase sm:px-6 dark:text-indigo-400 w-[140px]">
                      <div className="flex flex-col items-center justify-center">
                        <span className="inline-block w-2 h-2 mb-1 bg-indigo-500 rounded-full"></span>
                        Total (All Types)
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[100px]">
                      Machines
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[120px]">
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
                      {distinctYarnTypes.map((yarnType, typeIndex) => (
                        <TableCell
                          key={`row-${index}-type-${yarnType}-${typeIndex}`}
                          className="px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6"
                        >
                          {(() => {
                            // Find the proper value for this yarn type (handle normalization)
                            let productionValue = 0;
                            
                            // Try exact match first
                            if (yarnType in row.yarnTypes) {
                              productionValue = row.yarnTypes[yarnType] || 0;
                            } else {
                              // If no exact match, try normalized matching
                              for (const [key, value] of Object.entries(row.yarnTypes)) {
                                if (normalizeYarnType(key) === yarnType) {
                                  productionValue = value || 0;
                                  break;
                                }
                              }
                            }
                            
                            // Check if this is an active yarn type from machines
                            const isActiveMachineYarn = activeMachineYarnTypes.includes(yarnType);
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
                                {hasValue
                                  ? productionValue.toFixed(2)
                                  : "0.00"}
                                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                  kg
                                </span>
                              </span>
                            );
                          })()}
                        </TableCell>
                      ))}
                      <TableCell className="px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
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
                          {(() => {
                            const efficiency = row.averageEfficiency;
                            const isValidEfficiency = !isNaN(efficiency) && efficiency !== null && efficiency !== undefined;
                            const displayEfficiency = isValidEfficiency ? efficiency : 0;
                            
                            return (
                              <>
                                <div
                                  className={`w-3 h-3 rounded-full ${getEfficiencyColorClass(displayEfficiency)}`}
                                ></div>
                                <Badge
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyBadgeClass(displayEfficiency)}`}
                                >
                                  {isValidEfficiency ? displayEfficiency.toFixed(1) : "0.0"}%
                                </Badge>
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
                
                {/* Sticky Total Production Row - positioned at bottom of scrollable area */}
                {summaryData.length > 0 && (
                  <div className="sticky bottom-0 w-full bg-gray-50 dark:bg-gray-800/95 border-t border-gray-200 dark:border-gray-700 shadow-[0_-1px_3px_0_rgba(0,0,0,0.1)] backdrop-blur-sm z-10">
                    <Table className="w-full min-w-full border-collapse table-fixed">
                      <TableBody>
                        <TableRow className="font-semibold transition-colors">
                        <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6 w-[120px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">Total Production</span>
                          </div>
                        </TableCell>
                      {distinctYarnTypes.map((yarnType, typeIndex) => {
                        // Calculate total for this yarn type (handle normalization)
                        const total = summaryData.reduce((sum, row) => {
                          // Try exact match first
                          if (yarnType in row.yarnTypes) {
                            return sum + (row.yarnTypes[yarnType] || 0);
                          }
                          
                          // If no exact match, try to find a match with normalization
                          for (const [key, value] of Object.entries(row.yarnTypes)) {
                            if (normalizeYarnType(key) === yarnType) {
                              return sum + (value || 0);
                            }
                          }
                          
                          return sum;
                        }, 0);
                        
                        // Check if this is an active yarn type from machines
                        const isActiveMachineYarn = activeMachineYarnTypes.includes(yarnType);

                        return (
                          <TableCell
                            key={`total-type-${yarnType}-${typeIndex}`}
                            className={`px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6 w-[100px] ${
                              isActiveMachineYarn ? "border-b-2 border-blue-200 dark:border-blue-800/30" : ""
                            }`}
                          >
                            <span 
                              className={`${
                                total > 0
                                  ? isActiveMachineYarn 
                                    ? "text-blue-700 dark:text-blue-300 font-bold"
                                    : "text-blue-600 dark:text-blue-400"
                                  : "text-gray-500 dark:text-gray-500"
                              }`}
                            >
                              {total.toFixed(2)}
                              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                kg
                              </span>
                            </span>
                          </TableCell>
                        );
                      })}
                      <TableCell className="px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6 w-[140px]">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
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
                      <TableCell className="px-4 py-4 text-center whitespace-nowrap sm:px-6 w-[100px]">
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
                      <TableCell className="px-4 py-4 text-center whitespace-nowrap sm:px-6 w-[120px]">
                        {stats && (
                          <div className="flex items-center justify-center gap-2">
                            {(() => {
                              // Calculate weighted average efficiency with safety checks
                              const validRows = summaryData.filter(row => 
                                !isNaN(row.averageEfficiency) && 
                                row.averageEfficiency !== null && 
                                row.averageEfficiency !== undefined
                              );
                              
                              if (validRows.length === 0) {
                                return (
                                  <>
                                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                    <Badge className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                                      No Data
                                    </Badge>
                                  </>
                                );
                              }
                              
                              const weightedSum = validRows.reduce((sum, row) => 
                                sum + (row.averageEfficiency * row.machineCount), 0);
                              const totalMachines = validRows.reduce((sum, row) => sum + row.machineCount, 0);
                              
                              const weightedAvgEff = totalMachines > 0 ? weightedSum / totalMachines : 0;
                              const displayEfficiency = isNaN(weightedAvgEff) ? 0 : weightedAvgEff;
                              
                              return (
                                <>
                                  <div
                                    className={`w-3 h-3 rounded-full ${getEfficiencyColorClass(
                                      displayEfficiency
                                    )}`}
                                  ></div>
                                  <Badge
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getEfficiencyBadgeClass(
                                      displayEfficiency
                                    )}`}
                                  >
                                    {displayEfficiency.toFixed(1)}%
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
          )}
        </div>
      </div>
    </div>
  );
};

export default YarnProductionSummary;
