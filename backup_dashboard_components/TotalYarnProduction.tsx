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
import { Package, RefreshCw, Calendar } from "lucide-react";
import axios from "axios";

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
  const normalizedType = type.trim().toLowerCase();
  
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

interface YarnProduction {
  yarnType: string;
  totalProduction: number;
  machines: number[];
  percentage: number;
}

interface TotalYarnProductionProps {
  timeframe?: 'all' | 'month' | 'week';
  showRefreshButton?: boolean;
}

const TotalYarnProduction: React.FC<TotalYarnProductionProps> = ({ 
  timeframe = 'month', 
  showRefreshButton = true 
}) => {
  const [yarnProductions, setYarnProductions] = useState<YarnProduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [totalAll, setTotalAll] = useState<number>(0);

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchYarnProduction();
    setRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Fetch yarn production data across all machines
  const fetchYarnProduction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const BASE_URL = import.meta.env.VITE_API_URL || "";
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log('TotalYarnProduction: Attempting to connect to API at:', BASE_URL);
      
      // Try different API endpoints - handle connection issues gracefully
      let machinesData = [];
      let entriesData = [];
      
      try {
        // Calculate date range based on timeframe
        const today = new Date();
        let startDate = new Date();
        
        if (timeframe === 'month') {
          startDate.setMonth(today.getMonth() - 1);
        } else if (timeframe === 'week') {
          startDate.setDate(today.getDate() - 7);
        } else {
          // For 'all', go back 6 months as a reasonable default
          startDate.setMonth(today.getMonth() - 6);
        }
        
        const dateFilter = timeframe !== 'all' ? 
          `&startDate=${startDate.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}` : '';
        
        // Fetch both machine configurations and production data
        const [machinesResponse, entriesResponse] = await Promise.all([
          axios.get(`${BASE_URL}/asu-unit1/machines`, { headers, timeout: 5000 }),
          axios.get(`${BASE_URL}/asu-unit1/production-entries?limit=1000${dateFilter}`, { headers, timeout: 8000 })
        ]);

        // Get machines
        machinesData = machinesResponse.data.success 
          ? machinesResponse.data.data 
          : machinesResponse.data;
        
        // Process production entries
        entriesData = entriesResponse.data.success
          ? entriesResponse.data.data.items
          : entriesResponse.data;
          
        console.log(`TotalYarnProduction: Successfully fetched ${machinesData.length} machines and ${entriesData.length} entries`);
      } catch (error) {
        console.warn('TotalYarnProduction: Primary endpoints failed:', error);
        
        // Type guard for error to access its properties
        const primaryError = error as { message?: string; code?: string };
        
        // If we're in development, and it looks like a connection issue, use mock data
        if (import.meta.env.DEV && primaryError.message && 
            (primaryError.message.includes('Network Error') || 
             primaryError.message.includes('ECONNREFUSED') ||
             primaryError.code === 'ERR_NETWORK')) {
          
          console.log('TotalYarnProduction: Using mock data since API connection failed in development mode');
          
          // Generate mock machine data with various yarn types
          machinesData = Array(15).fill(0).map((_, i) => ({
            id: i + 1,
            machineNo: i + 1,
            machine_name: `Machine ${i + 1}`,
            yarnType: ['Cotton', 'Polyester', 'CVC', 'PC Blend', 'Viscose', 'Cotton/Poly', 'Rayon', 'Linen', 'Acrylic'][Math.floor(Math.random() * 9)]
          }));
          
          // Generate mock entries data
          const today = new Date();
          entriesData = [];
          
          // Create 100 mock entries for different dates and machines
          for (let i = 0; i < 100; i++) {
            const randomDate = new Date(today);
            randomDate.setDate(today.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
            
            const machineNumber = Math.floor(Math.random() * 15) + 1;
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
          throw error;
        }
      }

      // Process data to group by yarn type
      const yarnProductionMap: Record<string, YarnProduction> = {};
      let totalProduction = 0;
      
      entriesData.forEach((entry: any) => {
        // Find matching machine to get yarn type
        const machine = machinesData.find((m: any) => 
          String(m.machineNo) === String(entry.machineNumber) || 
          String(m.machine_number) === String(entry.machineNumber)
        );
        
        // Skip if no matching machine or yarn type
        if (!machine || !machine.yarnType) return;
        
        const yarnType = machine.yarnType;
        
        // Get production value
        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = typeof rawProd === 'string' ? parseFloat(rawProd) : rawProd;
        
        // Add to map
        if (!yarnProductionMap[yarnType]) {
          yarnProductionMap[yarnType] = {
            yarnType,
            totalProduction: 0,
            machines: [],
            percentage: 0
          };
        }
        
        // Update production total and add machine if not already included
        yarnProductionMap[yarnType].totalProduction += productionValue;
        if (!yarnProductionMap[yarnType].machines.includes(machine.id)) {
          yarnProductionMap[yarnType].machines.push(machine.id);
        }
        
        // Add to total
        totalProduction += productionValue;
      });
      
      // Calculate percentages and convert to array
      const yarnProductionArray = Object.values(yarnProductionMap).map(item => {
        return {
          ...item,
          percentage: totalProduction > 0 
            ? Math.round((item.totalProduction / totalProduction) * 100) 
            : 0
        };
      });
      
      // Sort by total production (highest first)
      const sortedProduction = yarnProductionArray.sort(
        (a, b) => b.totalProduction - a.totalProduction
      );
      
      setYarnProductions(sortedProduction);
      setTotalAll(totalProduction);
    } catch (err: any) {
      console.error("Error fetching yarn production:", err);
      setError("Failed to fetch yarn production data. Please ensure the API server is running.");
      toast.error("Failed to load yarn production data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYarnProduction().then(() => {
      setLastRefreshed(new Date());
    });
  }, [timeframe]);

  // Get appropriate title based on timeframe
  const getTitle = () => {
    switch (timeframe) {
      case 'week':
        return 'Weekly Yarn Production';
      case 'month':
        return 'Monthly Yarn Production';
      case 'all':
        return 'All-Time Yarn Production';
      default:
        return 'Yarn Production Summary';
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {getTitle()}
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
            {getTitle()}
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
              {getTitle()}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Total {yarnProductions.length} yarn types detected
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
        {yarnProductions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
              <Package className="w-8 h-8 text-blue-500 dark:text-blue-400" />
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
                    <TableHead>Yarn Type</TableHead>
                    <TableHead className="text-right w-[120px]">Production</TableHead>
                    <TableHead className="text-center w-[100px]">% of Total</TableHead>
                    <TableHead className="text-center w-[100px]">Machines</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yarnProductions.map((production, index) => (
                    <TableRow key={`${production.yarnType}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${getYarnTypeColor(production.yarnType)}`} />
                          <span>{formatYarnTypeDisplay(production.yarnType)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {production.totalProduction.toFixed(2)} <span className="text-xs text-gray-500">kg</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          production.percentage >= 50 ? "default" : 
                          production.percentage >= 25 ? "secondary" : 
                          "outline"
                        }>
                          {production.percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {production.machines.length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {totalAll > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Total Production:</span>
            <span className="font-semibold">{totalAll.toFixed(2)} kg</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalYarnProduction;
