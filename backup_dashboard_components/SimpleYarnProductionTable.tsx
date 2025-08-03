import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/Button";
import { RefreshCw, Calendar } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

// Format yarn type for display (capitalize words)
const formatYarnTypeDisplay = (yarnType: string): string => {
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

// Get color for yarn type (simpler version)
const getYarnTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    cotton: "bg-green-500",
    polyester: "bg-blue-500",
    blended: "bg-purple-500",
    viscose: "bg-pink-500",
    cvc: "bg-teal-500",
    pc: "bg-indigo-500",
    default: "bg-gray-500"
  };
  
  const normalizedType = type.toLowerCase().trim();
  
  // Check for direct match
  if (colorMap[normalizedType]) {
    return colorMap[normalizedType];
  }
  
  // Check for partial match
  for (const [key, color] of Object.entries(colorMap)) {
    if (normalizedType.includes(key)) {
      return color;
    }
  }
  
  return colorMap.default;
};

// Data interfaces
interface DailyYarnProduction {
  date: string;
  formattedDate: string;
  // Map of yarn type to production amount
  yarnProduction: Record<string, number>;
  // Total production for this day
  totalProduction: number;
}

interface SimpleYarnTableProps {
  days?: number; // Number of days to show (default: current month)
}

const SimpleYarnProductionTable: React.FC<SimpleYarnTableProps> = ({ days = 31 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data state
  const [dailyData, setDailyData] = useState<DailyYarnProduction[]>([]);
  const [yarnTypes, setYarnTypes] = useState<string[]>([]);
  const [totalsByYarnType, setTotalsByYarnType] = useState<Record<string, number>>({});
  const [grandTotal, setGrandTotal] = useState(0);
  
  // Fetch data function
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API settings
      const BASE_URL = import.meta.env.VITE_API_URL || "";
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      
      // Calculate date range (last N days)
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - days);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = today.toISOString().split('T')[0];
      
      console.log(`SimpleYarnProductionTable: Fetching data from ${formattedStartDate} to ${formattedEndDate}`);
      
      // Fetch data from API
      let machinesData = [];
      let entriesData = [];
      
      try {
        // Fetch machines and production entries
        const [machinesResponse, entriesResponse] = await Promise.all([
          axios.get(`${BASE_URL}/asu-unit1/machines`, { 
            headers, 
            timeout: 5000 
          }),
          axios.get(`${BASE_URL}/asu-unit1/production-entries`, { 
            params: {
              startDate: formattedStartDate,
              endDate: formattedEndDate,
              limit: 1000
            },
            headers, 
            timeout: 5000 
          })
        ]);
        
        // Process responses
        machinesData = machinesResponse.data.success ? 
          machinesResponse.data.data : 
          machinesResponse.data;
        
        entriesData = entriesResponse.data.success ? 
          entriesResponse.data.data.items : 
          entriesResponse.data;
        
      } catch (error) {
        console.warn('SimpleYarnProductionTable: API connection failed:', error);
        
        // For development fallback
        if (import.meta.env.DEV) {
          console.log('Using mock data in development mode');
          
          // Generate mock machine data with yarn types
          machinesData = Array(10).fill(0).map((_, i) => ({
            id: i + 1,
            machineNo: i + 1,
            machine_name: `Machine ${i + 1}`,
            yarnType: ['Cotton', 'Polyester', 'CVC', 'PC Blend', 'Viscose'][Math.floor(Math.random() * 5)]
          }));
          
          // Generate mock production entries
          entriesData = [];
          
          // Create entries for the last N days
          for (let i = 0; i < days; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() - i);
            const dateString = currentDate.toISOString().split('T')[0];
            
            // Generate 0-5 entries per day (some days might have no entries)
            const entriesCount = Math.floor(Math.random() * 6);
            
            for (let j = 0; j < entriesCount; j++) {
              const machineNumber = Math.floor(Math.random() * 10) + 1;
              const shift = Math.random() > 0.5 ? 'day' : 'night';
              const production = Math.floor(Math.random() * 150) + 50; // 50-200kg
              
              entriesData.push({
                id: i * 100 + j,
                machineNumber,
                date: dateString,
                shift,
                actualProduction: production
              });
            }
          }
        } else {
          throw error;
        }
      }
      
      // Create machine lookup with yarn types
      const machineYarnTypes: Record<string, string> = {};
      machinesData.forEach((machine: any) => {
        const machineId = machine.machineNo || machine.machine_number;
        machineYarnTypes[String(machineId)] = machine.yarnType || 'Unknown';
      });
      
      // Process data by date and yarn type
      const productionByDate: Record<string, Record<string, number>> = {};
      const allYarnTypes = new Set<string>();
      
      // Process each production entry
      entriesData.forEach((entry: any) => {
        if (!entry.date) return;
        
        const entryDate = entry.date;
        const machineNumber = entry.machineNumber;
        const yarnType = machineYarnTypes[String(machineNumber)] || 'Unknown';
        
        // Add yarn type to our set
        allYarnTypes.add(yarnType);
        
        // Initialize date in our map if needed
        if (!productionByDate[entryDate]) {
          productionByDate[entryDate] = {};
        }
        
        // Get production value
        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = typeof rawProd === 'string' ? parseFloat(rawProd) : rawProd;
        
        // Add to the date and yarn type total
        if (!productionByDate[entryDate][yarnType]) {
          productionByDate[entryDate][yarnType] = 0;
        }
        productionByDate[entryDate][yarnType] += Number(productionValue) || 0;
      });
      
      // Convert yarn types to array and sort
      const sortedYarnTypes = Array.from(allYarnTypes).sort();
      
      // Calculate totals
      const yarnTypeTotals: Record<string, number> = {};
      let total = 0;
      
      // Format the daily data for our component
      const formattedDailyData: DailyYarnProduction[] = [];
      
      // Get all dates in our range and sort newest first
      const allDates = Object.keys(productionByDate).sort().reverse();
      
      allDates.forEach(date => {
        const dateData = productionByDate[date];
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        });
        
        // Calculate daily total
        let dailyTotal = 0;
        const yarnProduction: Record<string, number> = {};
        
        // Initialize all yarn types to 0
        sortedYarnTypes.forEach(type => {
          const amount = dateData[type] || 0;
          yarnProduction[type] = amount;
          dailyTotal += amount;
          
          // Add to yarn type totals
          yarnTypeTotals[type] = (yarnTypeTotals[type] || 0) + amount;
          total += amount;
        });
        
        formattedDailyData.push({
          date,
          formattedDate,
          yarnProduction,
          totalProduction: dailyTotal
        });
      });
      
      // Update state with our processed data
      setDailyData(formattedDailyData);
      setYarnTypes(sortedYarnTypes);
      setTotalsByYarnType(yarnTypeTotals);
      setGrandTotal(total);
      
    } catch (err: any) {
      console.error("Error fetching yarn production data:", err);
      setError("Failed to load production data. Please ensure the API server is running.");
      toast.error("Could not load yarn production data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [days]);
  
  // Loading state
  if (loading) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Daily Yarn Production
          </h3>
        </div>
        <div className="flex items-center justify-center p-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading data...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Daily Yarn Production
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
          <Button 
            onClick={handleRefresh} 
            size="sm" 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (dailyData.length === 0 || yarnTypes.length === 0) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Daily Yarn Production
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center p-6">
          <div className="p-3 mb-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <Calendar className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No production data available</p>
          <Button 
            onClick={handleRefresh} 
            size="sm" 
            variant="outline" 
            className="mt-3"
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-lg dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Daily Yarn Production
        </h3>
        <Button
          onClick={handleRefresh}
          size="sm"
          variant="outline"
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          {refreshing ? (
            <div className="w-4 h-4 border-t-2 border-current rounded-full animate-spin"></div>
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Refresh</span>
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              <TableHead className="w-[120px]">Date</TableHead>
              {yarnTypes.map(type => (
                <TableHead key={type} className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className={`w-2 h-2 rounded-full ${getYarnTypeColor(type)}`} />
                    <span>{formatYarnTypeDisplay(type)}</span>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right font-bold w-[100px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyData.map(day => (
              <TableRow key={day.date}>
                <TableCell className="font-medium">
                  {day.formattedDate}
                </TableCell>
                {yarnTypes.map(type => (
                  <TableCell key={`${day.date}-${type}`} className="text-right">
                    {day.yarnProduction[type] > 0 ? (
                      <span className="font-medium">
                        {day.yarnProduction[type].toFixed(1)} <span className="text-xs text-gray-500">kg</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">
                  {day.totalProduction.toFixed(1)} <span className="text-xs text-gray-500">kg</span>
                </TableCell>
              </TableRow>
            ))}
            
            {/* Totals row */}
            <TableRow className="bg-gray-50 dark:bg-gray-800/50 font-bold">
              <TableCell>Total</TableCell>
              {yarnTypes.map(type => (
                <TableCell key={`total-${type}`} className="text-right">
                  {totalsByYarnType[type]?.toFixed(1) || '0.0'} <span className="text-xs text-gray-500">kg</span>
                </TableCell>
              ))}
              <TableCell className="text-right">
                {grandTotal.toFixed(1)} <span className="text-xs text-gray-500">kg</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SimpleYarnProductionTable;
