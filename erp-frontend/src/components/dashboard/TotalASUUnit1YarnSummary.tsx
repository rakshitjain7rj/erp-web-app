import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/Button";
import { toast } from "react-hot-toast";
import { Calendar, BarChart, RefreshCw } from "lucide-react";
import axios from "axios";

// Helper function to normalize yarn type
const normalizeYarnType = (type: string | undefined): string => {
  if (!type) return "";
  return type.trim().toLowerCase();
};

// Format yarn type for display (capitalize words)
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

interface DailySummary {
  date: string;
  totalProduction: number;
  yarnTypes: {
    type: string;
    production: number;
  }[];
  avgEfficiency: number;
  activeShifts: number;
  activeMachines: number;
}

interface TotalASUUnit1YarnSummaryProps {
  days?: number;
  showRefreshButton?: boolean;
}

const TotalASUUnit1YarnSummary: React.FC<TotalASUUnit1YarnSummaryProps> = ({ 
  days = 30, 
  showRefreshButton = true 
}) => {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [totalProductionAllDays, setTotalProductionAllDays] = useState<number>(0);

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchYarnSummaryData();
    setRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Fetch yarn production data aggregated by date
  const fetchYarnSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const BASE_URL = import.meta.env.VITE_API_URL || "";
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log('TotalASUUnit1YarnSummary: Attempting to connect to API at:', BASE_URL);
      
      // Try different API endpoints - handle connection issues gracefully
      let productionData = [];
      
      try {
        // Fetch all production entries for the last specified days
        const entriesResponse = await axios.get(
          `${BASE_URL}/asu-unit1/production-entries/daily-summary?days=${days}`, 
          { headers, timeout: 10000 }
        );

        // Process production entries
        productionData = entriesResponse.data.success
          ? entriesResponse.data.data
          : entriesResponse.data;
          
        console.log(`TotalASUUnit1YarnSummary: Successfully fetched daily summary data for ${days} days`);
      } catch (error) {
        console.warn('TotalASUUnit1YarnSummary: Primary endpoint failed:', error);
        
        // Type guard for error to access its properties
        const primaryError = error as { message?: string; code?: string };
        
        // If we're in development, and it looks like a connection issue, use mock data
        if (import.meta.env.DEV && primaryError.message && 
            (primaryError.message.includes('Network Error') || 
             primaryError.message.includes('ECONNREFUSED') ||
             primaryError.code === 'ERR_NETWORK')) {
          
          console.log('TotalASUUnit1YarnSummary: Using mock data since API connection failed in development mode');
          
          // Generate mock daily summary data
          const today = new Date();
          productionData = [];
          
          // Create mock summaries for the last specified days
          for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            // Generate 1-4 yarn types for this day
            const yarnTypeCount = Math.floor(Math.random() * 4) + 1;
            const yarnTypes = [];
            const allTypes = ['Cotton', 'Polyester', 'CVC', 'PC Blend', 'Viscose'];
            
            let dailyTotal = 0;
            for (let j = 0; j < yarnTypeCount; j++) {
              const production = Math.floor(Math.random() * 300) + 100; // 100-400kg
              yarnTypes.push({
                type: allTypes[Math.floor(Math.random() * allTypes.length)],
                production
              });
              dailyTotal += production;
            }
            
            productionData.push({
              date: date.toISOString().split('T')[0],
              totalProduction: dailyTotal,
              yarnTypes,
              avgEfficiency: Math.floor(Math.random() * 30) + 70, // 70-100%
              activeShifts: Math.random() > 0.3 ? 2 : 1, // Mostly 2 shifts
              activeMachines: Math.floor(Math.random() * 5) + 5 // 5-10 machines
            });
          }
        } else {
          // Try to fall back to getting raw production data and aggregating it
          try {
            console.log('TotalASUUnit1YarnSummary: Attempting fallback to raw production data...');
            const rawResponse = await axios.get(
              `${BASE_URL}/asu-unit1/production-entries?limit=1000`, 
              { headers, timeout: 10000 }
            );
            
            const rawEntries = rawResponse.data.success
              ? rawResponse.data.data.items
              : rawResponse.data;
              
            // Manually aggregate by date
            const entriesByDate: Record<string, any> = {};
            
            rawEntries.forEach((entry: any) => {
              if (!entry.date) return;
              
              if (!entriesByDate[entry.date]) {
                entriesByDate[entry.date] = {
                  date: entry.date,
                  totalProduction: 0,
                  yarnTypes: {},
                  efficiencySum: 0,
                  efficiencyCount: 0,
                  uniqueMachines: new Set(),
                  shifts: new Set()
                };
              }
              
              // Get production value
              const production = entry.actualProduction || entry.production || 0;
              const productionValue = typeof production === 'string' ? parseFloat(production) : production;
              
              // Add to total
              entriesByDate[entry.date].totalProduction += productionValue;
              
              // Track yarn type
              const yarnType = entry.yarnType || 
                (entry.machine && entry.machine.yarnType) || 
                "Unknown";
                
              if (!entriesByDate[entry.date].yarnTypes[yarnType]) {
                entriesByDate[entry.date].yarnTypes[yarnType] = 0;
              }
              entriesByDate[entry.date].yarnTypes[yarnType] += productionValue;
              
              // Track efficiency
              if (entry.percentage) {
                entriesByDate[entry.date].efficiencySum += parseFloat(entry.percentage);
                entriesByDate[entry.date].efficiencyCount++;
              }
              
              // Track machines and shifts
              if (entry.machineNumber) {
                entriesByDate[entry.date].uniqueMachines.add(entry.machineNumber);
              }
              if (entry.shift) {
                entriesByDate[entry.date].shifts.add(entry.shift);
              }
            });
            
            // Convert to final format
            productionData = Object.values(entriesByDate).map((day: any) => {
              return {
                date: day.date,
                totalProduction: day.totalProduction,
                yarnTypes: Object.entries(day.yarnTypes).map(([type, production]) => ({
                  type,
                  production
                })),
                avgEfficiency: day.efficiencyCount > 0 
                  ? day.efficiencySum / day.efficiencyCount 
                  : 0,
                activeShifts: day.shifts.size,
                activeMachines: day.uniqueMachines.size
              };
            });
            
          } catch (fallbackError) {
            console.error('TotalASUUnit1YarnSummary: Fallback also failed:', fallbackError);
            throw error; // Throw the original error
          }
        }
      }

      // Sort summaries by date (newest first)
      const sortedSummaries = productionData.sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setSummaries(sortedSummaries);
      
      // Calculate total production across all days
      const total = sortedSummaries.reduce(
        (sum: number, day: any) => sum + day.totalProduction,
        0
      );
      setTotalProductionAllDays(total);
      
    } catch (err: any) {
      console.error("Error fetching yarn summary:", err);
      setError("Failed to fetch yarn production data. Please ensure the API server is running.");
      toast.error("Failed to load yarn data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYarnSummaryData().then(() => {
      setLastRefreshed(new Date());
    });
  }, [days]);

  if (loading) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Total Yarn Production Summary
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="w-6 h-6 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm">Loading production data...</span>
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
            Total Yarn Production Summary
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Could not connect to the API server. Please ensure your backend server is running at <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{import.meta.env.VITE_API_URL || "http://localhost:5000/api"}</code>
          </p>
          <Button onClick={handleRefresh} className="mt-4">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Total Yarn Production Summary
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Production summary for the last {days} days
            </p>
          </div>
          {showRefreshButton && (
            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Updated: {lastRefreshed.toLocaleTimeString()}
                </p>
              )}
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                {refreshing ? (
                  <div className="w-4 h-4 border-b-2 border-primary rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-0">
        {summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
              <BarChart className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              No production data available
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Yarn Types</TableHead>
                    <TableHead className="text-right">Total Production</TableHead>
                    <TableHead className="text-center">Efficiency</TableHead>
                    <TableHead className="text-center">Machines</TableHead>
                    <TableHead className="text-center">Shifts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.map((summary) => (
                    <TableRow key={summary.date}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {formatDate(summary.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {summary.yarnTypes.map((yarn, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <span className={`w-3 h-3 rounded-full ${getYarnTypeColor(yarn.type)}`} />
                              <span className="text-sm">{formatYarnTypeDisplay(yarn.type)}</span>
                              <span className="text-xs text-gray-500">
                                ({yarn.production.toFixed(0)} kg)
                              </span>
                              {index < summary.yarnTypes.length - 1 && <span className="text-gray-300">•</span>}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {summary.totalProduction.toFixed(2)} <span className="text-xs text-gray-500">kg</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {summary.avgEfficiency > 0 && (
                          <Badge variant={summary.avgEfficiency >= 80 ? "default" : 
                                          summary.avgEfficiency >= 70 ? "secondary" : "destructive"}>
                            {summary.avgEfficiency.toFixed(1)}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {summary.activeMachines}
                      </TableCell>
                      <TableCell className="text-center">
                        {summary.activeShifts}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {totalProductionAllDays > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Production ({days} days):</span>
              <span className="font-semibold text-lg">{totalProductionAllDays.toFixed(2)} kg</span>
            </div>
            
            <div className="flex flex-col mt-2 md:mt-0">
              <span className="text-sm text-gray-600 dark:text-gray-300">Daily Average:</span>
              <span className="font-semibold">
                {(totalProductionAllDays / (summaries.length || 1)).toFixed(2)} kg/day
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalASUUnit1YarnSummary;
