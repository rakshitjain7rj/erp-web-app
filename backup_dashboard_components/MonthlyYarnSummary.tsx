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
import { Calendar, BarChart3, RefreshCw, Package } from "lucide-react";
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

// New interfaces for monthly summary data
interface MonthlyYarnData {
  month: string;
  year: number;
  monthYear: string;
  yarnTypes: Record<string, number>;
  total: number;
}

interface YarnSummaryData {
  monthlyData: MonthlyYarnData[];
  yarnTypes: string[];
  totalByYarnType: Record<string, number>;
  grandTotal: number;
}

interface MonthlyYarnSummaryProps {
  limit?: number;
  months?: number;
  showRefreshButton?: boolean;
}

const MonthlyYarnSummary: React.FC<MonthlyYarnSummaryProps> = ({ 
  limit = 5, 
  months = 3, 
  showRefreshButton = true 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<YarnSummaryData>({
    monthlyData: [],
    yarnTypes: [],
    totalByYarnType: {},
    grandTotal: 0
  });
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Helper function to format date to month and year
  const formatMonthYear = (dateString: string): { month: string, year: number, monthYear: string } => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return { 
      month, 
      year,
      monthYear: `${month} ${year}`
    };
  };

  // Get data for the last N months
  const getLastMonths = (n: number): string[] => {
    const result: string[] = [];
    const today = new Date();
    
    for (let i = 0; i < n; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      result.push(`${month} ${year}`);
    }
    
    return result.reverse(); // Order from oldest to newest
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchYarnSummary();
    setRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Fetch yarn production data and summarize by month
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

      console.log('MonthlyYarnSummary: Attempting to connect to API at:', BASE_URL);
      
      // Try different API endpoints - handle connection issues gracefully
      let machinesData = [];
      let entriesData = [];
      
      try {
        // First try the primary endpoints
        const [machinesResponse, entriesResponse] = await Promise.all([
          axios.get(`${BASE_URL}/asu-unit1/machines`, { headers, timeout: 5000 }),
          axios.get(`${BASE_URL}/asu-unit1/production-entries?limit=1000`, { headers, timeout: 5000 })
        ]);

        // Process responses
        machinesData = machinesResponse.data.success ? machinesResponse.data.data : machinesResponse.data;
        entriesData = entriesResponse.data.success ? entriesResponse.data.data.items : entriesResponse.data;
        
        console.log(`MonthlyYarnSummary: Successfully fetched ${machinesData.length} machines and ${entriesData.length} entries`);
      } catch (error) {
        console.warn('MonthlyYarnSummary: Primary endpoints failed:', error);
        
        // Type guard for error to access its properties
        const primaryError = error as { message?: string; code?: string };
        
        // If we're in development, and it looks like a connection issue, use mock data
        if (import.meta.env.DEV && primaryError.message && 
            (primaryError.message.includes('Network Error') || 
             primaryError.message.includes('ECONNREFUSED') ||
             primaryError.code === 'ERR_NETWORK')) {
          
          console.log('MonthlyYarnSummary: Using mock data since API connection failed in development mode');
          
          // Generate mock machine data
          machinesData = Array(10).fill(0).map((_, i) => ({
            id: i + 1,
            machineNo: i + 1,
            machine_name: `Machine ${i + 1}`,
            yarnType: ['Cotton', 'Polyester', 'CVC', 'PC Blend', 'Viscose'][Math.floor(Math.random() * 5)]
          }));
          
          // Generate mock entries data (past 6 months)
          const today = new Date();
          entriesData = [];
          
          // Create 100 mock entries across last 6 months
          for (let i = 0; i < 100; i++) {
            const randomDate = new Date(today);
            randomDate.setDate(today.getDate() - Math.floor(Math.random() * 180)); // Random date in last 180 days
            
            const machineNumber = Math.floor(Math.random() * 10) + 1;
            const shift = Math.random() > 0.5 ? 'day' : 'night';
            const production = Math.floor(Math.random() * 150) + 50; // Random production between 50-200
            
            entriesData.push({
              id: i + 1,
              machineNumber,
              date: randomDate.toISOString().split('T')[0],
              shift,
              actualProduction: production,
              percentage: Math.floor(Math.random() * 30) + 70 // Efficiency between 70-100%
            });
          }
        } else {
          // In production or if it's not a connection issue, rethrow
          throw primaryError;
        }
      }

      // Create a lookup for machine yarn types
      const machineYarnTypes: Record<string, string> = {};
      machinesData.forEach((machine: any) => {
        const machineId = machine.machineNo || machine.machine_number;
        machineYarnTypes[String(machineId)] = machine.yarnType || 'Unknown';
      });

      // Process and group entries by month and yarn type
      const entriesByMonth: Record<string, Record<string, number>> = {};
      const allYarnTypes = new Set<string>();
      
      entriesData.forEach((entry: any) => {
        // Skip entries without date
        if (!entry.date) return;
        
        // Format date to month-year
        const { monthYear } = formatMonthYear(entry.date);
        
        // Initialize month if it doesn't exist
        if (!entriesByMonth[monthYear]) {
          entriesByMonth[monthYear] = {};
        }
        
        // Get yarn type for this entry
        const machineNumber = entry.machineNumber;
        const yarnType = machineYarnTypes[String(machineNumber)] || 'Unknown';
        allYarnTypes.add(yarnType);
        
        // Get production value (handle different field names)
        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = typeof rawProd === 'string' ? parseFloat(rawProd) : rawProd;
        
        // Add production to month-yarn total
        if (!entriesByMonth[monthYear][yarnType]) {
          entriesByMonth[monthYear][yarnType] = 0;
        }
        entriesByMonth[monthYear][yarnType] += Number(productionValue) || 0;
      });
      
      // Convert to our sorted array format
      const monthsToShow = getLastMonths(months);
      
      // Limit yarn types to the most produced ones
      const yarnTypesWithTotals: [string, number][] = [];
      allYarnTypes.forEach(yarnType => {
        let total = 0;
        Object.values(entriesByMonth).forEach(monthData => {
          total += monthData[yarnType] || 0;
        });
        yarnTypesWithTotals.push([yarnType, total]);
      });
      
      // Sort yarn types by production volume and limit to top N
      const sortedYarnTypes = yarnTypesWithTotals
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(item => item[0]);
      
      // Calculate totals by yarn type
      const totalByYarnType: Record<string, number> = {};
      let grandTotal = 0;
      
      // Create monthly data array with all months we want to show
      const monthlyData: MonthlyYarnData[] = monthsToShow.map(monthYear => {
        const [month, yearStr] = monthYear.split(' ');
        const year = parseInt(yearStr);
        
        // Get data for this month (or empty object if no data)
        const monthData = entriesByMonth[monthYear] || {};
        
        // Calculate total for this month
        let monthTotal = 0;
        
        // Ensure all yarn types are represented
        const yarnTypes: Record<string, number> = {};
        sortedYarnTypes.forEach(yarnType => {
          const amount = monthData[yarnType] || 0;
          yarnTypes[yarnType] = amount;
          
          // Add to totals
          monthTotal += amount;
          totalByYarnType[yarnType] = (totalByYarnType[yarnType] || 0) + amount;
          grandTotal += amount;
        });
        
        return {
          month,
          year,
          monthYear,
          yarnTypes,
          total: monthTotal
        };
      });
      
      // Set the summary data
      setSummaryData({
        monthlyData,
        yarnTypes: sortedYarnTypes,
        totalByYarnType,
        grandTotal
      });
      
    } catch (err: any) {
      console.error("Error fetching yarn monthly summary:", err);
      setError("Failed to fetch yarn production data. Please ensure the API server is running.");
      toast.error("Failed to load monthly yarn data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYarnSummary().then(() => {
      setLastRefreshed(new Date());
    });
  }, [months, limit]);

  if (loading) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Monthly Yarn Production
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="w-6 h-6 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm">Loading monthly yarn data...</span>
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
            Monthly Yarn Production
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
              Monthly Yarn Production
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Summary of {summaryData.yarnTypes.length} yarn types over {months} months
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
        {summaryData.monthlyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
              <BarChart3 className="w-8 h-8 text-blue-500 dark:text-blue-400" />
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
                    <TableHead className="w-[100px]">Month</TableHead>
                    {summaryData.yarnTypes.map(yarnType => (
                      <TableHead key={yarnType} className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className={`w-2 h-2 rounded-full ${getYarnTypeColor(yarnType)}`} />
                          <span>{formatYarnTypeDisplay(yarnType)}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right w-[120px] font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryData.monthlyData.map((monthData) => (
                    <TableRow key={monthData.monthYear}>
                      <TableCell className="font-medium">
                        {monthData.month} {monthData.year}
                      </TableCell>
                      {summaryData.yarnTypes.map(yarnType => (
                        <TableCell key={`${monthData.monthYear}-${yarnType}`} className="text-right">
                          {monthData.yarnTypes[yarnType]?.toFixed(2) || '0.00'} 
                          <span className="text-xs text-gray-500 ml-1">kg</span>
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold">
                        {monthData.total.toFixed(2)} <span className="text-xs text-gray-500">kg</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Totals Row */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 font-bold">
                    <TableCell>Total</TableCell>
                    {summaryData.yarnTypes.map(yarnType => (
                      <TableCell key={`total-${yarnType}`} className="text-right">
                        {summaryData.totalByYarnType[yarnType]?.toFixed(2) || '0.00'} 
                        <span className="text-xs text-gray-500 ml-1">kg</span>
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      {summaryData.grandTotal.toFixed(2)} <span className="text-xs text-gray-500">kg</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {summaryData.grandTotal > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Total Production:</span>
            <span className="font-semibold">{summaryData.grandTotal.toFixed(2)} kg</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyYarnSummary;
