import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, Check, RefreshCcw, Bug } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ApiTester from '../utils/ApiTester';
import { useAuth } from '../../context/AuthContext';

export interface MachinePerformanceData {
  id: number;
  name: string;
  efficiency: number;
  status: 'operational' | 'maintenance' |                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {machine.totalProduction.toLocaleString()} kg
                    <div className="text-xs text-gray-400">
                      {machine.entriesCount} entries
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(machine.lastMaintenance).toLocaleDateString()}lastMaintenance: string;
  entriesCount: number;
  totalProduction: number;
}

// Base URL should not include API path
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MachinePerformanceTableRealTime: React.FC = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState<MachinePerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<keyof MachinePerformanceData>('efficiency');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [usingMockData, setUsingMockData] = useState(false);
  const [showApiTester, setShowApiTester] = useState(false);
  
  // Mock data for fallback if API fails
  const mockMachines: MachinePerformanceData[] = [
    {
      id: 1,
      name: "Ring Frame 1",
      efficiency: 92.5,
      status: "operational",
      lastMaintenance: "2025-06-15",
      entriesCount: 145,
      totalProduction: 7850
    },
    {
      id: 2,
      name: "Comber 3",
      efficiency: 78.3,
      status: "maintenance",
      lastMaintenance: "2025-07-10",
      entriesCount: 98,
      totalProduction: 4250,
      wastePercentage: 2.8
    },
    entriesCount: 120,
      totalProduction: 5240
    },
    {
      id: 3,
      name: "Blowroom Line 2",
      efficiency: 85.7,
      status: "operational",
      lastMaintenance: "2025-07-01",
      entriesCount: 97,
      totalProduction: 4200
    },
    {
      id: 4,
      name: "Drawing Frame 5",
      efficiency: 68.9,
      status: "offline",
      lastMaintenance: "2025-06-20",
      entriesCount: 82,
      totalProduction: 3100
    },
    {
      id: 4,
      name: "Speed Frame 1",
      efficiency: 65.2,
      status: "offline",
      lastMaintenance: "2025-05-12",
      entriesCount: 63,
      totalProduction: 2180,
      wastePercentage: 4.2
    }
  ];
  
  // Function to use mock data as fallback
  const useMockDataFallback = () => {
    console.log('Falling back to mock data');
    setMachines(mockMachines);
    setUsingMockData(true);
    setLastRefreshed(new Date());
    toast('Using sample data - API connection failed', { icon: '⚠️' });
  };
  
  const fetchMachinePerformance = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching from:', `${API_URL}/api/machines/performance`);
      // Try multiple endpoints in case one is available
      let response;
      let endpointWorked = false;
      
      // First attempt with primary endpoint
      try {
        // Fix URL path - ensure correct API path without duplication
        const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        // Check if baseUrl already contains /api
        const apiPath = baseUrl.includes('/api') ? 'machines/performance' : 'api/machines/performance';
        const machinesPerformanceUrl = `${baseUrl}/${apiPath}`;
        
        // Get token for auth
        const token = user?.token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        console.log('Trying primary endpoint:', machinesPerformanceUrl);
        response = await axios.get(machinesPerformanceUrl, { headers });
        
        if (response.data && response.data.success) {
          setMachines(response.data.data);
          setLastRefreshed(new Date());
          endpointWorked = true;
        } 
      } catch (error) {
        console.warn('Primary endpoint failed, trying alternate endpoint');
        // Try alternate endpoint
        try {
          const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
          // Check if baseUrl already contains /api
          const apiPath = baseUrl.includes('/api') ? 'machines/status' : 'api/machines/status';
          const machinesStatusUrl = `${baseUrl}/${apiPath}`;
          
          // Get token for auth (need to repeat as this is a new scope)
          const token = user?.token;
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          console.log('Trying alternate endpoint:', machinesStatusUrl);
          response = await axios.get(machinesStatusUrl, { headers });
          
          if (response.data && response.data.success) {
            setMachines(response.data.data);
            setLastRefreshed(new Date());
            endpointWorked = true;
          }
        } catch (error) {
          console.warn('Alternate endpoint failed, trying root endpoint');
          // Try root endpoint
          try {
            const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
            // Check if baseUrl already contains /api
            const apiPath = baseUrl.includes('/api') ? 'machines' : 'api/machines';
            const machinesUrl = `${baseUrl}/${apiPath}`;
            
            console.log('Trying root endpoint:', machinesUrl);
            // Get token for auth (need to repeat as this is a new scope)
            const token = user?.token;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            response = await axios.get(machinesUrl, { headers });
            
            if (response.data && response.data.success) {
              // This is just the status endpoint, we don't have actual data
              console.log('Root endpoint works but has no data');
              useMockDataFallback();
              endpointWorked = true;
            }
          } catch (finalError) {
            console.error('All endpoints failed');
          }
        }
      }
      
      // If no endpoint worked, fallback to mock data
      if (!endpointWorked) {
        console.log('All API endpoints failed, using mock data');
        setError('API endpoints available but returned errors - using demo data');
        toast.error('Server error: using demo data');
        useMockDataFallback();
      }
    } catch (error: any) {
      console.error('Error fetching machine performance:', error);
      // Get more detailed error information
      const errorMessage = error.response 
        ? `Error ${error.response.status}: ${error.response.statusText}`
        : error.message;
      setError(`Failed to fetch machine data: ${errorMessage}`);
      toast.error(`Connection error: ${errorMessage}`);
      
      // Fall back to using the mock data
      useMockDataFallback();
    } finally {
      setIsLoading(false);
    }
  };

  // Log environment configuration on component mount
  useEffect(() => {
    console.log('Environment configuration:');
    console.log('API_URL:', API_URL);
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('Full endpoint URL:', `${API_URL}/api/machines/performance`);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchMachinePerformance();
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchMachinePerformance();
    }, 5 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  const handleRefresh = () => {
    toast.success('Refreshing machine data...');
    fetchMachinePerformance();
  };
  
  const handleSort = (field: keyof MachinePerformanceData) => {
    if (field === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };
  
  // Sort machines
  const sortedMachines = [...machines].sort((a, b) => {
    let comparison = 0;
    
    if (a[sortBy] < b[sortBy]) {
      comparison = -1;
    } else if (a[sortBy] > b[sortBy]) {
      comparison = 1;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Get the best and worst machines
  const bestMachine = sortedMachines.length > 0 
    ? [...sortedMachines].sort((a, b) => b.efficiency - a.efficiency)[0] 
    : null;
  
  const worstMachine = sortedMachines.length > 0 
    ? [...sortedMachines].sort((a, b) => a.efficiency - b.efficiency)[0] 
    : null;
  
  // Calculate the average efficiency
  const avgEfficiency = 
    machines.length > 0 
      ? machines.reduce((sum, machine) => sum + machine.efficiency, 0) / machines.length 
      : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 dark:text-green-400';
      case 'maintenance':
        return 'text-orange-500 dark:text-orange-400';
      case 'offline':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <Check className="w-4 h-4 mr-1.5" />;
      case 'maintenance':
        return <AlertTriangle className="w-4 h-4 mr-1.5" />;
      case 'offline':
        return <AlertTriangle className="w-4 h-4 mr-1.5" />;
      default:
        return <AlertTriangle className="w-4 h-4 mr-1.5" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    if (dateString === 'N/A') return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  if (isLoading && machines.length === 0) {
    return (
      <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-md rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error && machines.length === 0) {
    return (
      <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-md rounded-xl p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load data</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-md rounded-xl">
      {showApiTester && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <ApiTester />
        </div>
      )}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
            Machine Performance
            {usingMockData && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Demo Data
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {usingMockData ? 'Sample data for demonstration' : 'Real-time efficiency and production details'}
            <span className="text-xs ml-2">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          </p>
          {usingMockData && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Could not connect to machine data API. Please check server status.
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none"
            title="Refresh data"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowApiTester(!showApiTester)}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none"
            title="API Tester"
          >
            <Bug className={`w-4 h-4 ${showApiTester ? 'text-amber-500' : ''}`} />
          </button>
          <div className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded flex items-center">
            <Activity className="w-3.5 h-3.5 mr-1" />
            <span>Avg: {avgEfficiency.toFixed(1)}%</span>
          </div>
          {bestMachine && (
            <div className="px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              <span>Best: {bestMachine.efficiency.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Machine
                {sortBy === 'name' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('efficiency')}
              >
                Efficiency
                {sortBy === 'efficiency' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status
                {sortBy === 'status' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('totalProduction')}
              >
                Production
                {sortBy === 'totalProduction' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('lastMaintenance')}
              >
                Last Maintenance
                {sortBy === 'lastMaintenance' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedMachines.length > 0 ? (
              sortedMachines.map(machine => (
                <tr key={machine.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {machine.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className={`font-medium ${machine.efficiency >= 90 ? 'text-green-600 dark:text-green-400' : machine.efficiency >= 70 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                      {machine.efficiency.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className={`flex items-center ${getStatusColor(machine.status)}`}>
                      {getStatusIcon(machine.status)}
                      <span className="capitalize">{machine.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {machine.totalProduction.toLocaleString()} kg
                    <div className="text-xs text-gray-400">
                      {machine.entriesCount} entries
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className={'text-gray-500 dark:text-gray-400'}>
                      {machine.wastePercentage !== undefined ? machine.wastePercentage.toFixed(1) : '0.0'}%
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(machine.lastMaintenance)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                  No machine data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MachinePerformanceTableRealTime;
