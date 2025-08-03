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
import { Calendar, BarChart3, RefreshCw, Package, ChevronLeft, ChevronRight } from "lucide-react";
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

// Interfaces for daily yarn summary data
interface DailyYarnData {
  day: number;
  date: string;
  dateObj: Date;
  yarnTypes: Record<string, number>;
  total: number;
}

interface YarnSummaryData {
  dailyData: DailyYarnData[];
  yarnTypes: string[];
  totalByYarnType: Record<string, number>;
  grandTotal: number;
}

interface DailyYarnSummaryProps {
  limit?: number;  // Limit the number of yarn types to display
  showRefreshButton?: boolean;
  defaultMonth?: string; // Format: "YYYY-MM"
}

const DailyYarnSummary: React.FC<DailyYarnSummaryProps> = ({ 
  limit = 5, 
  showRefreshButton = true,
  defaultMonth
}) => {
  // Get current month if not provided
  const today = new Date();
  const currentYearMonth = defaultMonth || 
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<YarnSummaryData>({
    dailyData: [],
    yarnTypes: [],
    totalByYarnType: {},
    grandTotal: 0
  });
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Format month for display (e.g., "August 2025")
  const formatMonthDisplay = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Go to previous month
  const goToPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // Month is 0-indexed in Date
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  // Go to next month
  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1); // Month is 0-indexed in Date
    setSelectedMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDailyYarnSummary();
    setRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Fetch yarn production data and summarize by day
  const fetchDailyYarnSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const BASE_URL = import.meta.env.VITE_API_URL || "";
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log('DailyYarnSummary: Attempting to connect to API at:', BASE_URL);
      console.log('DailyYarnSummary: Fetching data for month:', selectedMonth);
      
      // Parse selected month to determine date range
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in Date
      const endDate = new Date(year, month, 0); // Last day of the month
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Try different API endpoints - handle connection issues gracefully
      let machinesData = [];
      let entriesData = [];
      
      try {
        // First try fetching data with date range
        const [machinesResponse, entriesResponse] = await Promise.all([
          axios.get(`${BASE_URL}/asu-unit1/machines`, { 
            headers, 
            timeout: 5000 
          }),
          axios.get(`${BASE_URL}/asu-unit1/production-entries`, { 
            params: {
              startDate: formattedStartDate,
              endDate: formattedEndDate,
              limit: 1000 // Get plenty of data for the entire month
            },
            headers, 
            timeout: 5000 
          })
        ]);

        // Process responses
        machinesData = machinesResponse.data.success ? machinesResponse.data.data : machinesResponse.data;
        entriesData = entriesResponse.data.success ? entriesResponse.data.data.items : entriesResponse.data;
        
        console.log(`DailyYarnSummary: Successfully fetched ${machinesData.length} machines and ${entriesData.length} entries`);
      } catch (error) {
        console.warn('DailyYarnSummary: Primary endpoints failed:', error);
        
        // Type guard for error to access its properties
        const primaryError = error as { message?: string; code?: string };
        
        // If we're in development, and it looks like a connection issue, use mock data
        if (import.meta.env.DEV && primaryError.message && 
            (primaryError.message.includes('Network Error') || 
             primaryError.message.includes('ECONNREFUSED') ||
             primaryError.code === 'ERR_NETWORK')) {
          
          console.log('DailyYarnSummary: Using mock data since API connection failed in development mode');
          
          // Generate mock machine data
          machinesData = Array(10).fill(0).map((_, i) => ({
            id: i + 1,
            machineNo: i + 1,
            machine_name: `Machine ${i + 1}`,
            yarnType: ['Cotton', 'Polyester', 'CVC', 'PC Blend', 'Viscose'][Math.floor(Math.random() * 5)]
          }));
          
          // Generate mock entries data for the selected month
          entriesData = [];
          
          // Create mock entries for each day of the month
          const daysInMonth = new Date(year, month, 0).getDate();
          
          for (let day = 1; day <= daysInMonth; day++) {
            // Create 1-3 entries per day
            const entriesPerDay = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < entriesPerDay; i++) {
              const machineNumber = Math.floor(Math.random() * 10) + 1;
              const shift = Math.random() > 0.5 ? 'day' : 'night';
              const production = Math.floor(Math.random() * 150) + 50; // Random production between 50-200
              
              entriesData.push({
                id: day * 100 + i,
                machineNumber,
                date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                shift,
                actualProduction: production,
                percentage: Math.floor(Math.random() * 30) + 70 // Efficiency between 70-100%
              });
            }
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

      // Process and group entries by day and yarn type
      const entriesByDay: Record<string, Record<string, number>> = {};
      const allYarnTypes = new Set<string>();
      
      entriesData.forEach((entry: any) => {
        // Skip entries without date
        if (!entry.date) return;
        
        // Skip entries outside our date range
        const entryDate = new Date(entry.date);
        if (entryDate < startDate || entryDate > endDate) return;
        
        // Get day from date
        const day = entry.date.split('-')[2];
        
        // Initialize day if it doesn't exist
        if (!entriesByDay[day]) {
          entriesByDay[day] = {};
        }
        
        // Get yarn type for this entry
        const machineNumber = entry.machineNumber;
        const yarnType = machineYarnTypes[String(machineNumber)] || 'Unknown';
        allYarnTypes.add(yarnType);
        
        // Get production value (handle different field names)
        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = typeof rawProd === 'string' ? parseFloat(rawProd) : rawProd;
        
        // Add production to day-yarn total
        if (!entriesByDay[day][yarnType]) {
          entriesByDay[day][yarnType] = 0;
        }
        entriesByDay[day][yarnType] += Number(productionValue) || 0;
      });
      
      // Limit yarn types to the most produced ones
      const yarnTypesWithTotals: [string, number][] = [];
      allYarnTypes.forEach(yarnType => {
        let total = 0;
        Object.values(entriesByDay).forEach(dayData => {
          total += dayData[yarnType] || 0;
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
      
      // Create array of all days in the month
      const daysInMonth = new Date(year, month, 0).getDate();
      const dailyData: DailyYarnData[] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(dateStr);
        
        // Get data for this day (or empty object if no data)
        const dayData = entriesByDay[String(day).padStart(2, '0')] || {};
        
        // Calculate total for this day
        let dayTotal = 0;
        
        // Ensure all yarn types are represented
        const yarnTypes: Record<string, number> = {};
        sortedYarnTypes.forEach(yarnType => {
          const amount = dayData[yarnType] || 0;
          yarnTypes[yarnType] = amount;
          
          // Add to totals
          dayTotal += amount;
          totalByYarnType[yarnType] = (totalByYarnType[yarnType] || 0) + amount;
          grandTotal += amount;
        });
        
        dailyData.push({
          day,
          date: dateStr,
          dateObj,
          yarnTypes,
          total: dayTotal
        });
      }
      
      // Set the summary data
      setSummaryData({
        dailyData,
        yarnTypes: sortedYarnTypes,
        totalByYarnType,
        grandTotal
      });
      
    } catch (err: any) {
      console.error("Error fetching daily yarn summary:", err);
      setError("Failed to fetch yarn production data. Please ensure the API server is running.");
      toast.error("Failed to load daily yarn data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyYarnSummary().then(() => {
      setLastRefreshed(new Date());
    });
  }, [selectedMonth, limit]);

  // Format date for display (e.g., "Mon, 15")
  const formatDayDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Daily Yarn Production - {formatMonthDisplay(selectedMonth)}
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="w-6 h-6 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm">Loading daily yarn data...</span>
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
            Daily Yarn Production - {formatMonthDisplay(selectedMonth)}
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
              Daily Yarn Production
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <button 
                onClick={goToPreviousMonth}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatMonthDisplay(selectedMonth)}
              </p>
              <button 
                onClick={goToNextMonth}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
        {summaryData.dailyData.length === 0 || summaryData.grandTotal === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
              <Calendar className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              No production data available for this month
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="w-[100px]">Day</TableHead>
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
                  {summaryData.dailyData.map((dayData) => (
                    <TableRow 
                      key={dayData.date}
                      className={dayData.total === 0 ? 'opacity-50' : ''}
                    >
                      <TableCell className="font-medium">
                        {formatDayDisplay(dayData.date)}
                      </TableCell>
                      {summaryData.yarnTypes.map(yarnType => (
                        <TableCell key={`${dayData.date}-${yarnType}`} className="text-right">
                          {dayData.yarnTypes[yarnType] > 0 
                            ? dayData.yarnTypes[yarnType]?.toFixed(2) 
                            : '-'} 
                          {dayData.yarnTypes[yarnType] > 0 && 
                            <span className="text-xs text-gray-500 ml-1">kg</span>}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold">
                        {dayData.total > 0 ? (
                          <>
                            {dayData.total.toFixed(2)} <span className="text-xs text-gray-500">kg</span>
                          </>
                        ) : (
                          <span className="text-gray-400">No data</span>
                        )}
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
            <span className="text-gray-600 dark:text-gray-300">Month Total Production:</span>
            <span className="font-semibold">{summaryData.grandTotal.toFixed(2)} kg</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyYarnSummary;
