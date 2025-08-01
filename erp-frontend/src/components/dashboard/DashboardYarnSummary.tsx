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
import { Calendar, Package, RefreshCw, Settings } from "lucide-react";
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

interface Machine {
  id: number;
  name: string;
  machineNo?: number | string;
  machine_name?: string;
  machine_number?: string;
  yarnType: string;
}

interface YarnProductionEntry {
  date: string;
  yarnType: string;
  machine: Machine;
  totalProduction: number;
  efficiency?: number;
}

interface DashboardYarnSummaryProps {
  limit?: number;
  showRefreshButton?: boolean;
}

const DashboardYarnSummary: React.FC<DashboardYarnSummaryProps> = ({ 
  limit = 10, 
  showRefreshButton = true 
}) => {
  const [entries, setEntries] = useState<YarnProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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
    await fetchYarnSummary();
    setRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Fetch yarn production data across all machines
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

      // Fetch both machine configurations and production data
      const [machinesResponse, entriesResponse] = await Promise.all([
        axios.get(`${BASE_URL}/asu-unit1/machines`, { headers }),
        axios.get(`${BASE_URL}/asu-unit1/production-entries?limit=${limit}`, { headers })
      ]);

      // Get machines
      const machines = machinesResponse.data.success 
        ? machinesResponse.data.data 
        : machinesResponse.data;
      
      // Process production entries
      const rawEntries = entriesResponse.data.success
        ? entriesResponse.data.data.items
        : entriesResponse.data;

      // Format data for our component
      const formattedEntries: YarnProductionEntry[] = [];
      
      // Group entries by date and machine
      const entriesByDateAndMachine: Record<string, any> = {};
      
      rawEntries.forEach((entry: any) => {
        const key = `${entry.date}_${entry.machineNumber}`;
        
        if (!entriesByDateAndMachine[key]) {
          // Find matching machine
          const machine = machines.find((m: any) => 
            String(m.machineNo) === String(entry.machineNumber) || 
            String(m.machine_number) === String(entry.machineNumber)
          );
          
          // Initialize the combined entry
          entriesByDateAndMachine[key] = {
            date: entry.date,
            machineNumber: entry.machineNumber,
            machine: machine || { yarnType: "Unknown" },
            dayShift: 0,
            nightShift: 0,
            total: 0,
            efficiency: entry.percentage || 0,
          };
        }
        
        // Get the production value from appropriate field
        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = typeof rawProd === 'string' ? parseFloat(rawProd) : rawProd;
        
        // Add to the right shift
        if (entry.shift === 'day') {
          entriesByDateAndMachine[key].dayShift = Number(productionValue) || 0;
        } else if (entry.shift === 'night') {
          entriesByDateAndMachine[key].nightShift = Number(productionValue) || 0;
        }
        
        // Update machine data if we have it
        if (entry.machine && !entriesByDateAndMachine[key].machine) {
          entriesByDateAndMachine[key].machine = entry.machine;
        }
      });
      
      // Convert to final format
      Object.values(entriesByDateAndMachine).forEach((entry: any) => {
        const totalProduction = (entry.dayShift || 0) + (entry.nightShift || 0);
        
        formattedEntries.push({
          date: entry.date,
          yarnType: entry.machine.yarnType || "Unknown",
          machine: {
            id: entry.machine.id || 0,
            name: entry.machine.machine_name || entry.machine.machineName || `Machine ${entry.machineNumber}`,
            machineNo: entry.machineNumber,
            yarnType: entry.machine.yarnType || "Unknown",
          },
          totalProduction,
          efficiency: entry.efficiency,
        });
      });
      
      // Sort entries by date (newest first)
      const sortedEntries = formattedEntries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setEntries(sortedEntries);
    } catch (err: any) {
      console.error("Error fetching yarn summary:", err);
      setError("Failed to fetch yarn production data");
      toast.error("Failed to load yarn data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYarnSummary().then(() => {
      setLastRefreshed(new Date());
    });
  }, [limit]);

  // Calculate stats from the entries
  const totalProduction = entries.reduce(
    (sum, entry) => sum + entry.totalProduction,
    0
  );
  
  const uniqueDates = [...new Set(entries.map(entry => entry.date))].length;
  const uniqueYarnTypes = [...new Set(entries.map(entry => entry.yarnType))].length;
  const uniqueMachines = [...new Set(entries.map(entry => entry.machine.id))].length;

  if (loading) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Yarn Production by Machine
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
            Yarn Production by Machine
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
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
              Yarn Production by Machine
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Recent production across {uniqueMachines} machines
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
        {entries.length === 0 ? (
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
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Yarn Type</TableHead>
                    <TableHead className="text-right w-[120px]">Production</TableHead>
                    <TableHead className="text-center w-[100px]">Efficiency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={`${entry.date}-${entry.machine.id}-${index}`}>
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-gray-500" />
                          <span>{entry.machine.name}</span>
                          <span className="text-xs text-gray-500">#{entry.machine.machineNo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${getYarnTypeColor(entry.yarnType)}`} />
                          <span>{formatYarnTypeDisplay(entry.yarnType)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.totalProduction.toFixed(2)} <span className="text-xs text-gray-500">kg</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.efficiency !== undefined && (
                          <Badge variant={entry.efficiency >= 80 ? "default" : 
                                          entry.efficiency >= 70 ? "secondary" : "destructive"}>
                            {entry.efficiency.toFixed(1)}%
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {totalProduction > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Total Production:</span>
            <span className="font-semibold">{totalProduction.toFixed(2)} kg</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardYarnSummary;
