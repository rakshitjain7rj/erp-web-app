import React, { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/Button";
import { toast } from "react-hot-toast";
import { Calendar, BarChart3, RefreshCw, ChevronRight } from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";

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

// Interface for daily yarn data
interface DailyProduction {
  day: number;
  date: string;
  dateObj: Date;
  production: number;
  formattedDate: string;
}

interface YarnData {
  yarnType: string;
  color: string;
  displayName: string;
  dailyProduction: DailyProduction[];
  totalProduction: number;
}

interface CurrentMonthSummaryProps {
  limit?: number;
  showHeader?: boolean;
}

const CurrentMonthSummary: React.FC<CurrentMonthSummaryProps> = ({ 
  limit = 5,
  showHeader = true
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yarnData, setYarnData] = useState<YarnData[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [totalProduction, setTotalProduction] = useState<number>(0);
  
  // Get current month info
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();
  
  // Fetch current month's production data
  const fetchCurrentMonthData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const BASE_URL = import.meta.env.VITE_API_URL || "";
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log('CurrentMonthSummary: Attempting to connect to API at:', BASE_URL);
      
      // Calculate current month's date range
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      console.log(`CurrentMonthSummary: Fetching data from ${formattedStartDate} to ${formattedEndDate}`);
      
      // Try different API endpoints - handle connection issues gracefully
      let machinesData = [];
      let entriesData = [];
      
      try {
        // Fetch machines and production entries
        const [machinesResponse, entriesResponse] = await Promise.all([
          axios.get(`${BASE_URL}/asu-unit1/machines`, { headers, timeout: 5000 }),
          axios.get(`${BASE_URL}/asu-unit1/production-entries`, { 
            params: {
              startDate: formattedStartDate,
              endDate: formattedEndDate,
              limit: 1000 // Get all data for the month
            },
            headers, 
            timeout: 5000 
          })
        ]);

        // Process responses
        machinesData = machinesResponse.data.success ? machinesResponse.data.data : machinesResponse.data;
        entriesData = entriesResponse.data.success ? entriesResponse.data.data.items : entriesResponse.data;
        
        console.log(`CurrentMonthSummary: Successfully fetched ${machinesData.length} machines and ${entriesData.length} entries`);
      } catch (error) {
        console.warn('CurrentMonthSummary: Primary endpoints failed:', error);
        
        // Type guard for error to access its properties
        const primaryError = error as { message?: string; code?: string };
        
        // If we're in development, and it looks like a connection issue, use mock data
        if (import.meta.env.DEV && primaryError.message && 
            (primaryError.message.includes('Network Error') || 
             primaryError.message.includes('ECONNREFUSED') ||
             primaryError.code === 'ERR_NETWORK')) {
          
          console.log('CurrentMonthSummary: Using mock data since API connection failed in development mode');
          
          // Generate mock machine data
          machinesData = Array(10).fill(0).map((_, i) => ({
            id: i + 1,
            machineNo: i + 1,
            machine_name: `Machine ${i + 1}`,
            yarnType: ['Cotton', 'Polyester', 'CVC', 'PC Blend', 'Viscose'][Math.floor(Math.random() * 5)]
          }));
          
          // Generate mock entries for the current month
          entriesData = [];
          
          // Create mock entries for each day of the month up to today
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          const currentDay = today.getDate();
          
          for (let day = 1; day <= currentDay; day++) {
            // Create 1-3 entries per day with a higher probability of no entries for some days
            if (Math.random() > 0.3) { // 70% chance to have entries for a day
              const entriesPerDay = Math.floor(Math.random() * 3) + 1;
              
              for (let i = 0; i < entriesPerDay; i++) {
                const machineNumber = Math.floor(Math.random() * 10) + 1;
                const shift = Math.random() > 0.5 ? 'day' : 'night';
                const production = Math.floor(Math.random() * 150) + 50; // Random production between 50-200
                
                entriesData.push({
                  id: day * 100 + i,
                  machineNumber,
                  date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                  shift,
                  actualProduction: production,
                  percentage: Math.floor(Math.random() * 30) + 70 // Efficiency between 70-100%
                });
              }
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

      // Process entries and group by yarn type and day
      const yarnTypeEntries: Record<string, Record<string, number>> = {};
      
      entriesData.forEach((entry: any) => {
        // Skip entries without date
        if (!entry.date) return;
        
        // Get yarn type for this entry
        const machineNumber = entry.machineNumber;
        const yarnType = machineYarnTypes[String(machineNumber)] || 'Unknown';
        
        // Initialize yarn type if not exists
        if (!yarnTypeEntries[yarnType]) {
          yarnTypeEntries[yarnType] = {};
        }
        
        // Get day from date
        const entryDate = entry.date;
        const day = entryDate.split('-')[2];
        
        // Get production value (handle different field names)
        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = typeof rawProd === 'string' ? parseFloat(rawProd) : rawProd;
        
        // Add production to yarn-day total
        if (!yarnTypeEntries[yarnType][entryDate]) {
          yarnTypeEntries[yarnType][entryDate] = 0;
        }
        yarnTypeEntries[yarnType][entryDate] += Number(productionValue) || 0;
      });
      
      // Calculate total production for each yarn type
      const yarnTypeTotals: Record<string, number> = {};
      let grandTotal = 0;
      
      Object.entries(yarnTypeEntries).forEach(([yarnType, dayEntries]) => {
        const total = Object.values(dayEntries).reduce((sum, prod) => sum + prod, 0);
        yarnTypeTotals[yarnType] = total;
        grandTotal += total;
      });
      
      // Sort yarn types by total production and limit to top N
      const topYarnTypes = Object.entries(yarnTypeTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([yarnType]) => yarnType);
      
      // Format data for our component
      const formattedYarnData: YarnData[] = topYarnTypes.map(yarnType => {
        const dailyEntries = yarnTypeEntries[yarnType] || {};
        const dailyProduction: DailyProduction[] = [];
        
        // Get all days in the current month up to today
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const currentDay = today.getDate();
        
        for (let day = 1; day <= currentDay; day++) {
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dateObj = new Date(dateStr);
          
          // Format the date for display (e.g., "Mon 15")
          const formattedDate = dateObj.toLocaleDateString('en-US', { 
            weekday: 'short', 
            day: 'numeric' 
          });
          
          dailyProduction.push({
            day,
            date: dateStr,
            dateObj,
            production: dailyEntries[dateStr] || 0,
            formattedDate
          });
        }
        
        return {
          yarnType,
          color: getYarnTypeColor(yarnType),
          displayName: formatYarnTypeDisplay(yarnType),
          dailyProduction,
          totalProduction: yarnTypeTotals[yarnType] || 0
        };
      });
      
      setYarnData(formattedYarnData);
      setTotalProduction(grandTotal);
      
    } catch (err: any) {
      console.error("Error fetching current month summary:", err);
      setError("Failed to fetch production data. Please ensure the API server is running.");
      toast.error("Failed to load current month data");
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCurrentMonthData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchCurrentMonthData();
  }, [limit]);

  if (loading) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentMonth} {currentYear} Production
            </h2>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="w-6 h-6 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm">Loading current month data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentMonth} {currentYear} Production
            </h2>
          </div>
        )}
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

  if (yarnData.length === 0) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentMonth} {currentYear} Production
            </h2>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
            <Calendar className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
            No production data available for this month
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentMonth} {currentYear} Production
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Daily production for top {yarnData.length} yarn types
              </p>
            </div>
            <div className="flex items-center gap-3">
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
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Daily production chart for each yarn type */}
        <div className="space-y-4">
          {yarnData.map(yarn => (
            <div key={yarn.yarnType} className="pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${yarn.color}`} />
                  <span className="font-medium">{yarn.displayName}</span>
                </div>
                <span className="text-sm font-semibold">
                  {yarn.totalProduction.toFixed(2)} <span className="text-xs text-gray-500">kg</span>
                </span>
              </div>
              
              {/* Mini bar chart for daily production */}
              <div className="flex items-end h-16 gap-1 overflow-x-auto pb-1">
                {yarn.dailyProduction.map(day => (
                  <div 
                    key={day.date} 
                    className="flex flex-col items-center min-w-8"
                    title={`${day.formattedDate}: ${day.production.toFixed(2)} kg`}
                  >
                    {day.production > 0 ? (
                      <>
                        <div 
                          className={`w-6 ${yarn.color} opacity-80 rounded-t`}
                          style={{ 
                            height: `${Math.max(4, (day.production / Math.max(...yarn.dailyProduction.map(d => d.production))) * 50)}px` 
                          }}
                        ></div>
                        <span className="text-[10px] text-gray-500 mt-1">{day.day}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 bg-gray-100 dark:bg-gray-700 h-1 rounded-t"></div>
                        <span className="text-[10px] text-gray-400 mt-1">{day.day}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 pt-2 border-t border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Total Production:</span> {totalProduction.toFixed(2)} kg
          </div>
          <Link 
            to="/yarn-production" 
            className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            View Details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CurrentMonthSummary;
