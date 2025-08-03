import React, { useState, useEffect } from "react";
import LayoutWrapper from "../components/LayoutWrapper";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import { Gauge, RefreshCw, Activity } from "lucide-react";
import SimpleMachineTable from "../components/dashboard/SimpleMachineTable";
import DashboardYarnSummary from "../components/dashboard/DashboardYarnSummary";
import SimpleYarnProductionTable from "../components/dashboard/SimpleYarnProductionTable";
import TotalYarnProduction from "../components/dashboard/TotalYarnProduction";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  activeUsers: number;
  totalProduction: number;
  averageEfficiency: number;
  machinesOperational: number;
  totalMachines: number;
}

// Simple stat card component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  // Handle cases where value might be undefined or NaN
  const displayValue = value === undefined || value === 'undefined' || value === 'NaN' ? 
    'N/A' : value;
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
          <h3 className="text-xl font-semibold mt-1 text-gray-900 dark:text-white">{displayValue}</h3>
        </div>
        <div className="p-2 bg-blue-50 dark:bg-gray-700 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeUsers: 0,
    totalProduction: 0,
    averageEfficiency: 0,
    machinesOperational: 0,
    totalMachines: 0
  });

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    
    try {
      // Get token from auth context
      const token = user?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Check if API_URL already includes /api to avoid doubling
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const dashboardEndpoint = baseUrl.includes('/api') ? 
        `${baseUrl}/dashboard/stats` : 
        `${baseUrl}/api/dashboard/stats`;
      
      console.log('Trying dashboard endpoint:', dashboardEndpoint);
      
      // Try to fetch dashboard stats, but handle DB schema issues gracefully
      try {
        const response = await axios.get(dashboardEndpoint, { headers });
        
        if (response.data && response.data.success) {
          setStats(response.data.data);
        }
      } catch (dashboardError) {
        console.warn("Dashboard stats endpoint failed, using basic stats fallback", dashboardError);
        
        // Fallback to simpler machine count endpoint
        try {
          const machineEndpoint = baseUrl.includes('/api') ? 
            `${baseUrl}/asu-unit1/machines/count` : 
            `${baseUrl}/api/asu-unit1/machines/count`;
          
          console.log('Trying machine count endpoint:', machineEndpoint);
          const machineResponse = await axios.get(machineEndpoint, { headers });
          
          if (machineResponse.data) {
            // Update just what we can get
            setStats(prev => ({
              ...prev,
              totalMachines: machineResponse.data.count || machineResponse.data.total || 0,
              machinesOperational: machineResponse.data.active || 0
            }));
          }
        } catch (machineCountError) {
          console.error("Machine count fallback failed", machineCountError);
          // Continue with default values
        }
      }
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(`Failed to load dashboard data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up auto-refresh every 30 seconds for real-time dashboard data
    const refreshInterval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <LayoutWrapper>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Dashboard</h1>
            <div className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
              Auto-refreshing
            </div>
          </div>
          <button
            onClick={fetchDashboardStats}
            className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 dark:text-blue-300 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-gray-700 shadow-sm hover:bg-blue-100 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> 
            {isLoading ? 'Loading...' : 'Refresh Now'}
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Production" 
            value={stats.totalProduction ? `${stats.totalProduction.toLocaleString()} kg` : 'N/A'}
            icon={<Gauge className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          />
          <StatCard 
            title="Efficiency" 
            value={stats.averageEfficiency !== undefined ? `${Number(stats.averageEfficiency).toFixed(1)}%` : 'N/A'}
            icon={<Activity className="w-5 h-5 text-green-600 dark:text-green-400" />}
          />
          <StatCard 
            title="Machines" 
            value={stats.totalMachines ? `${stats.machinesOperational || 0}/${stats.totalMachines}` : 'N/A'}
            icon={<Gauge className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          />
          <StatCard 
            title="Active Users" 
            value={stats.activeUsers !== undefined ? stats.activeUsers.toString() : 'N/A'}
            icon={<Gauge className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          />
        </div>

        {/* Total Yarn Production - Auto-detected */}
        <div className="mb-6">
          <TotalYarnProduction timeframe="month" />
        </div>

        {/* Daily Yarn Production Table - Simple Version */}
        <div className="mb-6">
          <SimpleYarnProductionTable days={30} />
        </div>

        {/* Machine Table */}
        <div className="mb-6">
          <SimpleMachineTable />
        </div>
        
        {/* Yarn Production Detail Table */}
        <div className="mb-6">
          <DashboardYarnSummary limit={10} />
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default Dashboard;
