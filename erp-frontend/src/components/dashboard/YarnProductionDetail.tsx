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
import { Calendar, BarChart3, RefreshCw, Package, Filter, Download } from "lucide-react";
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

// Interfaces for detailed production data
interface ProductionEntry {
  id: number;
  date: string;
  machineNumber: number;
  machineName: string;
  yarnType: string;
  shift: string;
  production: number;
  efficiency?: number;
}

interface YarnTypeFilter {
  label: string;
  value: string;
  count: number;
  total: number;
}

interface YarnProductionDetailProps {
  limit?: number;
  defaultStartDate?: string; // YYYY-MM-DD
  defaultEndDate?: string; // YYYY-MM-DD
}

const YarnProductionDetail: React.FC<YarnProductionDetailProps> = ({ 
  limit = 100,
  defaultStartDate,
  defaultEndDate
}) => {
  // Default date range (last 30 days if not provided)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const [startDate, setStartDate] = useState<string>(
    defaultStartDate || thirtyDaysAgo.toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    defaultEndDate || today.toISOString().split('T')[0]
  );
  
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Filters
  const [yarnTypeFilters, setYarnTypeFilters] = useState<YarnTypeFilter[]>([]);
  const [selectedYarnTypes, setSelectedYarnTypes] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Toggle sort
  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc'); // Default to descending when changing columns
    }
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, dateType: 'start' | 'end') => {
    if (dateType === 'start') {
      setStartDate(e.target.value);
    } else {
      setEndDate(e.target.value);
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...entries];
    
    // Apply yarn type filter
    if (selectedYarnTypes.length > 0) {
      filtered = filtered.filter(entry => 
        selectedYarnTypes.includes(normalizeYarnType(entry.yarnType))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortColumn) {
        case 'date':
          valueA = new Date(a.date).getTime();
          valueB = new Date(b.date).getTime();
          break;
        case 'machine':
          valueA = a.machineNumber;
          valueB = b.machineNumber;
          break;
        case 'yarnType':
          valueA = a.yarnType;
          valueB = b.yarnType;
          break;
        case 'production':
          valueA = a.production;
          valueB = b.production;
          break;
        case 'efficiency':
          valueA = a.efficiency || 0;
          valueB = b.efficiency || 0;
          break;
        default:
          valueA = a.date;
          valueB = b.date;
      }
      
      // Compare based on direction
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredEntries(filtered);
  };

  // Toggle yarn type filter
  const toggleYarnTypeFilter = (yarnType: string) => {
    if (selectedYarnTypes.includes(yarnType)) {
      setSelectedYarnTypes(selectedYarnTypes.filter(type => type !== yarnType));
    } else {
      setSelectedYarnTypes([...selectedYarnTypes, yarnType]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedYarnTypes([]);
    setSortColumn('date');
    setSortDirection('desc');
  };

  // Format date for display
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
    await fetchProductionData();
    setRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Export to CSV
  const exportToCsv = () => {
    // Create CSV header
    const header = ['Date', 'Machine No', 'Machine Name', 'Yarn Type', 'Shift', 'Production (kg)', 'Efficiency (%)'];
    
    // Convert entries to CSV rows
    const rows = filteredEntries.map(entry => [
      entry.date,
      entry.machineNumber,
      entry.machineName,
      entry.yarnType,
      entry.shift,
      entry.production.toFixed(2),
      entry.efficiency ? entry.efficiency.toFixed(1) : 'N/A'
    ]);
    
    // Combine header and rows
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `yarn-production-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch production data
  const fetchProductionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const BASE_URL = import.meta.env.VITE_API_URL || "";
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log('YarnProductionDetail: Attempting to connect to API at:', BASE_URL);
      console.log(`YarnProductionDetail: Fetching data from ${startDate} to ${endDate}`);
      
      // Try different API endpoints - handle connection issues gracefully
      let machinesData = [];
      let entriesData = [];
      
      try {
        // Fetch both machine configurations and production data with date range
        const [machinesResponse, entriesResponse] = await Promise.all([
          axios.get(`${BASE_URL}/asu-unit1/machines`, { headers, timeout: 5000 }),
          axios.get(`${BASE_URL}/asu-unit1/production-entries`, { 
            params: {
              startDate,
              endDate,
              limit
            },
            headers, 
            timeout: 5000 
          })
        ]);

        // Process responses
        machinesData = machinesResponse.data.success ? machinesResponse.data.data : machinesResponse.data;
        entriesData = entriesResponse.data.success ? entriesResponse.data.data.items : entriesResponse.data;
        
        console.log(`YarnProductionDetail: Successfully fetched ${machinesData.length} machines and ${entriesData.length} entries`);
      } catch (error) {
        console.warn('YarnProductionDetail: Primary endpoints failed:', error);
        
        // Type guard for error to access its properties
        const primaryError = error as { message?: string; code?: string };
        
        // If we're in development, and it looks like a connection issue, use mock data
        if (import.meta.env.DEV && primaryError.message && 
            (primaryError.message.includes('Network Error') || 
             primaryError.message.includes('ECONNREFUSED') ||
             primaryError.code === 'ERR_NETWORK')) {
          
          console.log('YarnProductionDetail: Using mock data since API connection failed in development mode');
          
          // Generate mock machine data
          machinesData = Array(10).fill(0).map((_, i) => ({
            id: i + 1,
            machineNo: i + 1,
            machine_name: `Machine ${i + 1}`,
            yarnType: ['Cotton', 'Polyester', 'CVC', 'PC Blend', 'Viscose'][Math.floor(Math.random() * 5)]
          }));
          
          // Generate mock entries for the date range
          entriesData = [];
          
          // Parse date range
          const start = new Date(startDate);
          const end = new Date(endDate);
          const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          
          // Create mock entries
          for (let i = 0; i < Math.min(dayDiff * 10, 100); i++) {
            const randomDayOffset = Math.floor(Math.random() * dayDiff);
            const entryDate = new Date(start);
            entryDate.setDate(start.getDate() + randomDayOffset);
            
            const machineNumber = Math.floor(Math.random() * 10) + 1;
            const shift = Math.random() > 0.5 ? 'day' : 'night';
            const production = Math.floor(Math.random() * 150) + 50; // Random production between 50-200
            
            entriesData.push({
              id: i + 1,
              machineNumber,
              date: entryDate.toISOString().split('T')[0],
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

      // Create a lookup for machine details
      const machineDetails: Record<string, any> = {};
      machinesData.forEach((machine: any) => {
        const machineId = machine.machineNo || machine.machine_number;
        machineDetails[String(machineId)] = {
          name: machine.machine_name || `Machine ${machineId}`,
          yarnType: machine.yarnType || 'Unknown'
        };
      });

      // Process entries into our format
      const processedEntries: ProductionEntry[] = entriesData.map((entry: any) => {
        const machineNumber = entry.machineNumber;
        const machineInfo = machineDetails[String(machineNumber)] || { name: `Machine ${machineNumber}`, yarnType: 'Unknown' };
        
        // Get production value (handle different field names)
        const rawProd = entry.actualProduction || entry.production || 0;
        const productionValue = typeof rawProd === 'string' ? parseFloat(rawProd) : rawProd;
        
        return {
          id: entry.id,
          date: entry.date,
          machineNumber: Number(machineNumber),
          machineName: machineInfo.name,
          yarnType: machineInfo.yarnType,
          shift: entry.shift || 'unknown',
          production: Number(productionValue) || 0,
          efficiency: entry.percentage || undefined
        };
      });
      
      // Calculate yarn type filters
      const yarnTypeCounts: Record<string, { count: number, total: number }> = {};
      processedEntries.forEach(entry => {
        const normalizedType = normalizeYarnType(entry.yarnType);
        
        if (!yarnTypeCounts[normalizedType]) {
          yarnTypeCounts[normalizedType] = { count: 0, total: 0 };
        }
        
        yarnTypeCounts[normalizedType].count++;
        yarnTypeCounts[normalizedType].total += entry.production;
      });
      
      // Convert to filter array
      const filters = Object.entries(yarnTypeCounts).map(([value, data]) => ({
        label: formatYarnTypeDisplay(value),
        value,
        count: data.count,
        total: data.total
      })).sort((a, b) => b.total - a.total);
      
      setYarnTypeFilters(filters);
      setEntries(processedEntries);
      setFilteredEntries(processedEntries);
      
    } catch (err: any) {
      console.error("Error fetching yarn production data:", err);
      setError("Failed to fetch yarn production data. Please ensure the API server is running.");
      toast.error("Failed to load yarn production data");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters when selection changes
  useEffect(() => {
    applyFilters();
  }, [selectedYarnTypes, sortColumn, sortDirection]);

  // Fetch data when date range changes
  useEffect(() => {
    fetchProductionData().then(() => {
      setLastRefreshed(new Date());
    });
  }, [startDate, endDate, limit]);

  if (loading) {
    return (
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Yarn Production Detail
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
            Yarn Production Detail
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

  // Total production for all filtered entries
  const totalProduction = filteredEntries.reduce((sum, entry) => sum + entry.production, 0);

  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Yarn Production Detail
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Detailed production data from {formatDate(startDate)} to {formatDate(endDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              onClick={exportToCsv}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Date Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Date Range:</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => handleDateChange(e, 'start')}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <span className="text-gray-500">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => handleDateChange(e, 'end')}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center ml-auto">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={clearFilters}
              className="text-sm text-gray-500"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Yarn Type Filters */}
        {yarnTypeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {yarnTypeFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => toggleYarnTypeFilter(filter.value)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                  selectedYarnTypes.includes(filter.value)
                    ? `${getYarnTypeColor(filter.value)} text-white`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${getYarnTypeColor(filter.value)}`} />
                <span>{filter.label}</span>
                <span className="ml-1 opacity-70">({filter.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-0">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
              <Package className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              No production data found
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your filters or date range
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        {sortColumn === 'date' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('machine')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Machine</span>
                        {sortColumn === 'machine' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('yarnType')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Yarn Type</span>
                        {sortColumn === 'yarnType' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer"
                      onClick={() => toggleSort('production')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Production</span>
                        {sortColumn === 'production' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center cursor-pointer"
                      onClick={() => toggleSort('efficiency')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Efficiency</span>
                        {sortColumn === 'efficiency' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{entry.machineName}</span>
                          <span className="text-xs text-gray-500">#{entry.machineNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${getYarnTypeColor(entry.yarnType)}`} />
                          <span>{formatYarnTypeDisplay(entry.yarnType)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {entry.shift}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.production.toFixed(2)} <span className="text-xs text-gray-500">kg</span>
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

      <div className="p-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">
            Showing {filteredEntries.length} of {entries.length} entries
          </span>
          <span className="font-semibold">
            Total: {totalProduction.toFixed(2)} kg
          </span>
        </div>
      </div>
    </div>
  );
};

export default YarnProductionDetail;
