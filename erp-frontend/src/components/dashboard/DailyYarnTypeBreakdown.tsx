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
import { Calendar, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import ViewMoreLink from "../ui/ViewMoreLink";

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
  
  // Color mapping for yarn types
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
  
  if (colorMap[normalizedType]) {
    return colorMap[normalizedType];
  }
  
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalizedType.includes(key)) {
      return value;
    }
  }
  
  return colorMap.default;
};

interface DayYarnProduction {
  date: string;
  dateObj: Date;
  dayOfMonth: number;
  dayOfWeek: string;
  formattedDate: string;
  yarnProduction: Record<string, number>;
  totalProduction: number;
}

interface YarnTypeTotal {
  yarnType: string;
  displayName: string;
  color: string;
  total: number;
}

interface DailyYarnTypeBreakdownProps {
  limit?: number; // Limit of yarn types to show
  month?: string; // Format: "YYYY-MM" (default: current month)
  showRefreshButton?: boolean;
  isStandalonePage?: boolean;
}

const DailyYarnTypeBreakdown: React.FC<DailyYarnTypeBreakdownProps> = ({
  limit = 10,
  month,
  showRefreshButton = true,
  isStandalonePage = false,
}) => {
  // Get current month if not provided
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(month || defaultMonth);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Table data states
  const [dailyData, setDailyData] = useState<DayYarnProduction[]>([]);
  const [yarnTypes, setYarnTypes] = useState<YarnTypeTotal[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  
  // Format month for display (August 2025)
  const formatMonthDisplay = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Format day for display (Mon 15)
  const formatDayDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric'
    });
  };

  // Navigation for month selection
  const goToPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // Month is 0-indexed in Date
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

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
    await fetchDailyData();
    setRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Fetch daily production data for the selected month
  const fetchDailyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const BASE_URL = import.meta.env.VITE_API_URL || "";
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log('DailyYarnTypeBreakdown: Connecting to API at:', BASE_URL);
      console.log('DailyYarnTypeBreakdown: Fetching data for month:', selectedMonth);
      
      // Parse selected month to determine date range
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in Date
      const endDate = new Date(year, month, 0); // Last day of the month
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Try to fetch data from API
      let machinesData = [];
      let entriesData = [];
      
      try {
        // Fetch both machine configurations and production entries
        const [machinesResponse, entriesResponse] = await Promise.all([
          axios.get(`${BASE_URL}/asu-unit1/machines`, { 
            headers, 
            timeout: 5000 
          }),
          axios.get(`${BASE_URL}/asu-unit1/production-entries`, { 
            params: {
              startDate: formattedStartDate,
              endDate: formattedEndDate,
              limit: 1000 // Get all entries for the month
            },
            headers, 
            timeout: 5000 
          })
        ]);

        // Process responses
        machinesData = machinesResponse.data.success ? machinesResponse.data.data : machinesResponse.data;
        entriesData = entriesResponse.data.success ? entriesResponse.data.data.items : entriesResponse.data;
        
        console.log(`DailyYarnTypeBreakdown: Fetched ${machinesData.length} machines and ${entriesData.length} entries`);
      } catch (error) {
        console.warn('DailyYarnTypeBreakdown: API connection failed:', error);
        
        // Type guard for error
        const primaryError = error as { message?: string; code?: string };
        
        // If in development and it's a connection issue, use mock data
        if (import.meta.env.DEV && primaryError.message && 
            (primaryError.message.includes('Network Error') || 
             primaryError.message.includes('ECONNREFUSED') ||
             primaryError.code === 'ERR_NETWORK')) {
          
          console.log('DailyYarnTypeBreakdown: Using mock data in development mode');
          
          // Generate mock machine data
          machinesData = Array(10).fill(0).map((_, i) => ({
            id: i + 1,
            machineNo: i + 1,
            machine_name: `Machine ${i + 1}`,
            yarnType: ['Cotton', 'Polyester', 'CVC', 'PC Blend', 'Viscose'][Math.floor(Math.random() * 5)]
          }));
          
          // Generate mock entries for the selected month
          entriesData = [];
          
          // Days in the selected month
          const daysInMonth = new Date(year, month, 0).getDate();
          
          // Create entries for each day (with some days having no entries to be realistic)
          for (let day = 1; day <= daysInMonth; day++) {
            // Skip some days randomly (30% chance)
            if (Math.random() > 0.3) { 
              // For each day, create 1-3 entries for different machines
              const entriesPerDay = Math.floor(Math.random() * 3) + 1;
              
              for (let i = 0; i < entriesPerDay; i++) {
                const machineNumber = Math.floor(Math.random() * 10) + 1;
                const shift = Math.random() > 0.5 ? 'day' : 'night';
                const production = Math.floor(Math.random() * 150) + 50; // 50-200kg
                
                entriesData.push({
                  id: day * 100 + i,
                  machineNumber,
                  date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                  shift,
                  actualProduction: production,
                  percentage: Math.floor(Math.random() * 30) + 70 // 70-100%
                });
              }
            }
          }
        } else {
          // In production or non-connection issue, rethrow
          throw primaryError;
        }
      }

      // Create a lookup for machine yarn types
      const machineYarnTypes: Record<string, string> = {};
      machinesData.forEach((machine: any) => {
        const machineId = machine.machineNo || machine.machine_number;
        machineYarnTypes[String(machineId)] = machine.yarnType || 'Unknown';
      });

      // Process entries and group by date and yarn type
      const entriesByDateAndYarnType: Record<string, Record<string, number>> = {};
      const uniqueYarnTypes = new Set<string>();
      
      entriesData.forEach((entry: any) => {
        // Skip entries without date
        if (!entry.date) return;
        
        // Get date and machine info
        const entryDate = entry.date;
        const machineNumber = entry.machineNumber;
        const yarnType = machineYarnTypes[String(machineNumber)] || 'Unknown';
        uniqueYarnTypes.add(yarnType);
        
        // Initialize date record if needed
        if (!entriesByDateAndYarnType[entryDate]) {
          entriesByDateAndYarnType[entryDate] = {};
        }
        
        // Get production value
        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = typeof rawProd === 'string' ? parseFloat(rawProd) : rawProd;
        
        // Add to date-yarn total
        if (!entriesByDateAndYarnType[entryDate][yarnType]) {
          entriesByDateAndYarnType[entryDate][yarnType] = 0;
        }
        entriesByDateAndYarnType[entryDate][yarnType] += Number(productionValue) || 0;
      });
      
      // Calculate totals by yarn type
      const yarnTypeTotals: Record<string, number> = {};
      let totalProduction = 0;
      
      Object.values(entriesByDateAndYarnType).forEach(dateData => {
        Object.entries(dateData).forEach(([yarnType, amount]) => {
          yarnTypeTotals[yarnType] = (yarnTypeTotals[yarnType] || 0) + amount;
          totalProduction += amount;
        });
      });
      
      // Sort yarn types by total production and limit to top N
      const topYarnTypes = Object.entries(yarnTypeTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([yarnType, total]) => ({
          yarnType,
          displayName: formatYarnTypeDisplay(yarnType),
          color: getYarnTypeColor(yarnType),
          total
        }));
      
      // Create array of all days in the month
      const daysInMonth = new Date(year, month, 0).getDate();
      const dailyEntries: DayYarnProduction[] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(dateStr);
        
        // Format for display
        const formattedDate = formatDayDisplay(dateObj);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Get yarn production for this day
        const dayData = entriesByDateAndYarnType[dateStr] || {};
        const yarnProduction: Record<string, number> = {};
        
        // Initialize all yarn types to 0
        topYarnTypes.forEach(({ yarnType }) => {
          yarnProduction[yarnType] = 0;
        });
        
        // Add actual production data
        Object.entries(dayData).forEach(([yarnType, amount]) => {
          if (topYarnTypes.some(type => type.yarnType === yarnType)) {
            yarnProduction[yarnType] = amount;
          }
        });
        
        // Calculate total for this day
        const dailyTotal = Object.values(yarnProduction).reduce((sum, val) => sum + val, 0);
        
        dailyEntries.push({
          date: dateStr,
          dateObj,
          dayOfMonth: day,
          dayOfWeek,
          formattedDate,
          yarnProduction,
          totalProduction: dailyTotal
        });
      }
      
      // Update state with processed data
      setDailyData(dailyEntries);
      setYarnTypes(topYarnTypes);
      setGrandTotal(totalProduction);
      
    } catch (err: any) {
      console.error("Error fetching daily yarn breakdown:", err);
      setError("Failed to fetch production data. Please ensure the API server is running.");
      toast.error("Failed to load daily yarn data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when selected month changes
  useEffect(() => {
    fetchDailyData().then(() => {
      setLastRefreshed(new Date());
    });
  }, [selectedMonth, limit]);

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
            <span className="text-sm">Loading daily production data...</span>
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
        {dailyData.length === 0 || yarnTypes.length === 0 ? (
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
                    {yarnTypes.map(type => (
                      <TableHead key={type.yarnType} className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className={`w-2 h-2 rounded-full ${type.color}`} />
                          <span>{type.displayName}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right w-[100px] font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyData.map((day) => (
                    <TableRow 
                      key={day.date}
                      className={day.totalProduction === 0 ? 'opacity-50' : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">{day.dayOfWeek}</span>
                          <span className="font-semibold">{day.dayOfMonth}</span>
                        </div>
                      </TableCell>
                      {yarnTypes.map(type => (
                        <TableCell key={`${day.date}-${type.yarnType}`} className="text-right">
                          {day.yarnProduction[type.yarnType] > 0 ? (
                            <div className="font-medium">
                              {day.yarnProduction[type.yarnType].toFixed(2)}
                              <span className="text-xs text-gray-500 ml-1">kg</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold">
                        {day.totalProduction > 0 ? (
                          <>
                            {day.totalProduction.toFixed(2)} 
                            <span className="text-xs text-gray-500 ml-1">kg</span>
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
                    {yarnTypes.map(type => (
                      <TableCell key={`total-${type.yarnType}`} className="text-right">
                        {type.total.toFixed(2)} 
                        <span className="text-xs text-gray-500 ml-1">kg</span>
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      {grandTotal.toFixed(2)} 
                      <span className="text-xs text-gray-500 ml-1">kg</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {grandTotal > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">{formatMonthDisplay(selectedMonth)}</span> Total Production:
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{grandTotal.toFixed(2)} kg</span>
              {!isStandalonePage && (
                <ViewMoreLink to="/daily-yarn-production" text="View Full Report" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyYarnTypeBreakdown;
