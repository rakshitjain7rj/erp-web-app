import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  PointElement as Point,
  RadialLinearScale,
} from "chart.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LayoutWrapper from "../components/LayoutWrapper";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

// Import our custom dashboard components
import MachinePerformanceTableRealTime from "../components/dashboard/MachinePerformanceTableRealTime";
import QualityAnalytics from "../components/dashboard/QualityAnalytics";
import FinancialAnalytics from "../components/dashboard/FinancialAnalytics";

// Icons
import { 
  AlertCircle,
  BarChart3, 
  CalendarClock, 
  ChevronRight, 
  ChevronDown,
  Clock, 
  Filter,
  Gauge, 
  Package, 
  Percent,
  ShoppingBag, 
  Warehouse, 
  TrendingUp, 
  Users,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  Zap,
  DollarSign,
  Settings,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role;
  const [isLoading, setIsLoading] = useState(true);
  // Dashboard Data Types
  interface DashboardData {
    // Inventory metrics
    inventoryItems: number;
    lowStockItems: number;
    inventoryValue: number;
    inventoryByCategory: CategoryData[];
    
    // Party metrics
    totalParties: number;
    activeParties: number;
    partiesWithPending: number;
    partiesWithReprocessing: number;
    topParties: TopPartyData[];/*  */
    
    // Production metrics
    yarnProduction: number;
    totalMachines: number;
    activeMachines: number;
    averageEfficiency: number;
    machinePerformance: MachinePerformanceData[];
    
    // Time-series data
    productionTrend: number[];
    efficiencyTrend: number[];
    daysWithData: string[];
    
    // Predictive data
    predictedProduction: number;
    predictedEfficiency: number;
    
    // Financial metrics
    revenueByMonth: MonthlyFinanceData[];
    expensesByMonth: MonthlyFinanceData[];
    profitMargin: number;
    
    // Quality metrics
    avgDefectRate: number;
    highDefectCount: number;
    qualityDistribution: QualityDistribution[];
    recentQualityIssues: QualityIssue[];
    totalQualityEntries: number;
    machinesWithQualityData: number;
  }
  
  interface CategoryData {
    name: string;
    count: number;
    value: number;
  }
  
  interface TopPartyData {
    name: string;
    ordersCount: number;
    totalValue: number;
    status: 'active' | 'pending' | 'reprocessing';
  }
  
  interface MachinePerformanceData {
    id: number;
    name: string;
    efficiency: number;
    status: 'operational' | 'maintenance' | 'offline';
    lastMaintenance: string;
    entriesCount: number;
    totalProduction: number;
    wastePercentage: number;
  }
  
  interface MonthlyFinanceData {
    month: string;
    amount: number;
  }
  
  interface QualityDistribution {
    grade: string;
    percentage: number;
    count: number;
  }
  
  interface QualityIssue {
    id: number;
    machineName: string;
    date: string;
    defectRate: number;
    efficiency: number;
    production: number;
    grade: string;
    remarks: string;
  }
  
  // Filter state for dashboard
  interface DashboardFilters {
    dateRange: {
      startDate: Date | null;
      endDate: Date | null;
    };
    category: string;
    machineStatus: string;
    refreshInterval: number;
  }

  // Dashboard state initialization
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    // Inventory metrics
    inventoryItems: 0,
    lowStockItems: 0,
    inventoryValue: 0,
    inventoryByCategory: [],
    
    // Party metrics
    totalParties: 0,
    activeParties: 0,
    partiesWithPending: 0,
    partiesWithReprocessing: 0,
    topParties: [],
    
    // Production metrics
    yarnProduction: 0,
    totalMachines: 0,
    activeMachines: 0,
    averageEfficiency: 0,
    machinePerformance: [],
    
    // Time-series data
    productionTrend: [],
    efficiencyTrend: [],
    daysWithData: [],
    
    // Predictive data
    predictedProduction: 0,
    predictedEfficiency: 0,
    
    // Financial metrics
    revenueByMonth: [],
    expensesByMonth: [],
    profitMargin: 0,
    
    // Quality metrics
    avgDefectRate: 0,
    highDefectCount: 0,
    qualityDistribution: [],
    recentQualityIssues: [],
    totalQualityEntries: 0,
    machinesWithQualityData: 0
  });
  
  // Dashboard filters
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
      endDate: new Date()
    },
    category: 'all',
    machineStatus: 'all',
    refreshInterval: 5 * 60 * 1000 // 5 minutes
  });

  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchDashboardData = async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    }
    
    try {
      // Format dates for API query
      const startDate = filters.dateRange.startDate 
        ? filters.dateRange.startDate.toISOString().split('T')[0]
        : undefined;
      
      const endDate = filters.dateRange.endDate
        ? filters.dateRange.endDate.toISOString().split('T')[0]
        : undefined;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.machineStatus !== 'all') params.append('machineStatus', filters.machineStatus);
      
      // Fetch all dashboard data from our comprehensive endpoint with filters
      const response = await axios.get(`${API_URL}/dashboard/stats?${params.toString()}`);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        
        // Update dashboard data with real values from the API
        setDashboardData({
          // Inventory metrics from API
          inventoryItems: data.inventoryItems || 0,
          lowStockItems: data.lowStockItems || 0,
          inventoryValue: data.inventoryValue || 0,
          inventoryByCategory: data.inventoryByCategory || [],
          
          // Party metrics from API
          totalParties: data.totalParties || 0,
          activeParties: data.activeParties || 0,
          partiesWithPending: data.partiesWithPending || 0,
          partiesWithReprocessing: data.partiesWithReprocessing || 0,
          topParties: data.topParties || [],
          
          // Production metrics from API
          yarnProduction: data.yarnProduction || 0,
          totalMachines: data.totalMachines || 0,
          activeMachines: data.activeMachines || 0,
          averageEfficiency: data.averageEfficiency || 0,
          machinePerformance: data.machinePerformance || [],
          
          // Time-series data for charts from API
          productionTrend: data.productionTrend || [],
          efficiencyTrend: data.efficiencyTrend || [],
          daysWithData: data.daysWithData || [],
          
          // Predictive and financial data
          predictedProduction: data.predictedProduction || 0,
          predictedEfficiency: data.predictedEfficiency || 0,
          revenueByMonth: data.revenueByMonth || [],
          expensesByMonth: data.expensesByMonth || [],
          profitMargin: data.profitMargin || 0,
          
          // Quality metrics
          avgDefectRate: data.avgDefectRate || 0,
          highDefectCount: data.highDefectCount || 0,
          qualityDistribution: data.qualityDistribution || [],
          recentQualityIssues: data.recentQualityIssues || [],
          totalQualityEntries: data.totalQualityEntries || 0,
          machinesWithQualityData: data.machinesWithQualityData || 0
        });
        
        setLastRefreshed(new Date());
        console.log('Dashboard data loaded successfully', data);
      } else {
        console.error('API returned unsuccessful response:', response.data);
        if (showLoadingState) {
          toast.error('Error loading dashboard data');
        }
      }
      
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      if (showLoadingState) {
        toast.error(error.response?.data?.error || "Failed to load dashboard data");
      }
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  };

  // Apply filter changes
  const applyFilters = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  // Refresh data when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [filters.dateRange, filters.category, filters.machineStatus]);

  // Set up auto-refresh
  useEffect(() => {
    // Skip the auto-refresh if interval is set to 0 (disabled)
    if (filters.refreshInterval === 0) return;
    
    const interval = setInterval(() => {
      fetchDashboardData(false); // Don't show loading state during auto-refresh
    }, filters.refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [filters.refreshInterval]);

  // Ensure we have valid data for charts
  const hasProductionData = dashboardData.productionTrend.length > 0;
  const hasEfficiencyData = dashboardData.efficiencyTrend.length > 0;
  const hasDaysData = dashboardData.daysWithData.length > 0;

  // Default data if we don't have actual data
  const defaultDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const defaultProduction = [0, 0, 0, 0, 0, 0, 0];
  const defaultEfficiency = [0, 0, 0, 0, 0, 0, 0];
  
  // Chart configuration
  const productionChartData = {
    labels: hasDaysData ? dashboardData.daysWithData : defaultDays,
    datasets: [
      {
        label: 'Daily Production (kg)',
        data: hasProductionData ? dashboardData.productionTrend : defaultProduction,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        tension: 0.4,
      },
    ],
  };

  const efficiencyChartData = {
    labels: hasDaysData ? dashboardData.daysWithData : defaultDays,
    datasets: [
      {
        label: 'Average Efficiency (%)',
        data: hasEfficiencyData ? dashboardData.efficiencyTrend : defaultEfficiency,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  // Calculate data for party distribution - ensure we don't have negative values
  const activeOnly = Math.max(0, dashboardData.activeParties - dashboardData.partiesWithPending - dashboardData.partiesWithReprocessing);
  const pending = Math.max(0, dashboardData.partiesWithPending);
  const reprocessing = Math.max(0, dashboardData.partiesWithReprocessing);
  const inactive = Math.max(0, dashboardData.totalParties - dashboardData.activeParties);
  
  const partyDistributionData = {
    labels: ['Active', 'Pending', 'Reprocessing', 'Inactive'],
    datasets: [
      {
        data: [activeOnly, pending, reprocessing, inactive],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  // Card components for different dashboard sections
  interface MetricCardProps {
    title: string;
    value: number;
    subtitle?: string; // Made optional
    icon: React.ReactNode;
    color: string;
    iconBg: string;
    formatter?: (value: number) => string;
  }

  const MetricCard = ({ title, value, subtitle, icon, color, iconBg, formatter }: MetricCardProps) => (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 hover:shadow-xl transition-all"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className={`text-2xl font-bold mt-1 ${color}`}>
            {formatter ? formatter(value) : value}
          </h3>
          {subtitle && <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  const formatCurrency = (value: number): string => `₹${value.toLocaleString()}`;
  const formatNumber = (value: number): string => value.toLocaleString();
  const formatPercent = (value: number): string => `${value}%`;

  // Loading state
  if (isLoading) {
    return (
      <LayoutWrapper title="Dashboard Overview">
        <div className="h-[80vh] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard data...</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper title="Dashboard Overview">
      {/* Advanced Filter Bar Component */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">ERP Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Comprehensive view of your business performance and metrics
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Date Range Picker */}
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-md">
              <CalendarClock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <div className="flex flex-col sm:flex-row sm:items-center space-x-2">
                <DatePicker 
                  selected={filters.dateRange.startDate} 
                  onChange={(date) => applyFilters({ dateRange: { ...filters.dateRange, startDate: date } })}
                  selectsStart
                  startDate={filters.dateRange.startDate}
                  endDate={filters.dateRange.endDate}
                  className="bg-transparent text-sm border-none focus:ring-0 w-24 p-0"
                  placeholderText="Start Date"
                  dateFormat="yyyy-MM-dd"
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <DatePicker 
                  selected={filters.dateRange.endDate} 
                  onChange={(date) => applyFilters({ dateRange: { ...filters.dateRange, endDate: date } })}
                  selectsEnd
                  startDate={filters.dateRange.startDate}
                  endDate={filters.dateRange.endDate}
                  minDate={filters.dateRange.startDate || undefined}
                  className="bg-transparent text-sm border-none focus:ring-0 w-24 p-0"
                  placeholderText="End Date"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => applyFilters({ category: e.target.value })}
                className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm rounded-md border-none px-3 py-2 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="cotton">Cotton</option>
                <option value="polyester">Polyester</option>
                <option value="blend">Blend</option>
                <option value="synthetic">Synthetic</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>
            
            {/* Machine Status Filter */}
            <div className="relative">
              <select
                value={filters.machineStatus}
                onChange={(e) => applyFilters({ machineStatus: e.target.value })}
                className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm rounded-md border-none px-3 py-2 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Machines</option>
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>
            
            {/* Refresh Button */}
            <button 
              onClick={() => fetchDashboardData(true)}
              className="flex items-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Last refreshed timestamp */}
        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          <span>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Summary Dashboard Stats with Change Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Inventory Value with Growth */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inventory Value</p>
                <span className="ml-2 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs font-medium">+12%</span>
              </div>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                {formatCurrency(dashboardData.inventoryValue)}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {dashboardData.inventoryItems} items in stock
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
              <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Current Month</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">✓ On Target</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
        </motion.div>

        {/* Production Volume with Prediction */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Production Volume</p>
                <span className="ml-2 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded text-xs font-medium">+5.2%</span>
              </div>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                {formatNumber(dashboardData.yarnProduction)} kg
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Predicted: {formatNumber(dashboardData.predictedProduction)} kg
              </p>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <Zap className="w-3 h-3 text-amber-500 mr-1" />
                <span className="text-gray-500 dark:text-gray-400">Forecast Accuracy</span>
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">93%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '93%' }} />
            </div>
          </div>
        </motion.div>

        {/* Machine Efficiency with Performance */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Machine Efficiency</p>
                <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded text-xs font-medium">+2.1%</span>
              </div>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                {dashboardData.averageEfficiency}%
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {dashboardData.activeMachines}/{dashboardData.totalMachines} machines active
              </p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
              <Gauge className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400">Top Performer</span>
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Machine #3 (95%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
        </motion.div>

        {/* Profit Margin with Trend */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Profit Margin</p>
                <span className="ml-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">+1.8%</span>
              </div>
              <h3 className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                {dashboardData.profitMargin.toFixed(1)}%
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                YoY Growth: 4.3%
              </p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400">Industry Avg</span>
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                21.5% <span className="text-emerald-500">+2.3%</span>
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, dashboardData.profitMargin/0.3)}%` }} />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Key Performance Indicators */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
          <Gauge className="w-5 h-5 mr-2" /> Key Performance Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard 
            title="Low Stock" 
            value={dashboardData.lowStockItems} 
            subtitle="Need attention" 
            icon={<Package className="w-5 h-5 text-white" />} 
            color="text-red-600 dark:text-red-400"
            iconBg="bg-red-500" 
            formatter={formatNumber}
          />
          <MetricCard 
            title="Active Parties" 
            value={dashboardData.activeParties} 
            subtitle="Out of total" 
            icon={<Users className="w-5 h-5 text-white" />} 
            color="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500" 
            formatter={formatNumber}
          />
          <MetricCard 
            title="Pending Orders" 
            value={dashboardData.partiesWithPending} 
            subtitle="Parties" 
            icon={<Clock className="w-5 h-5 text-white" />} 
            color="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500" 
            formatter={formatNumber}
          />
          <MetricCard 
            title="Reprocessing" 
            value={dashboardData.partiesWithReprocessing} 
            subtitle="Parties" 
            icon={<Layers className="w-5 h-5 text-white" />} 
            color="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500" 
            formatter={formatNumber}
          />
          <MetricCard 
            title="Predicted Eff." 
            value={dashboardData.predictedEfficiency} 
            subtitle="Next period" 
            icon={<Zap className="w-5 h-5 text-white" />} 
            color="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500" 
            formatter={formatPercent}
          />
          <MetricCard 
            title="Revenue Growth" 
            value={8.7} 
            subtitle="Month on month" 
            icon={<ArrowUpRight className="w-5 h-5 text-white" />} 
            color="text-cyan-600 dark:text-cyan-400"
            iconBg="bg-cyan-500" 
            formatter={formatPercent}
          />
        </div>
      </section>

      {/* Enhanced Alert & Action Center */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
          <AlertCircle className="w-5 h-5 mr-2" /> Alerts & Priority Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Low Stock Alert Card */}
          <motion.div 
            className="bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20 rounded-xl shadow-md overflow-hidden border border-red-100 dark:border-red-900/20"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05)" }}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start">
                  <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-lg mr-3">
                    <Package className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-600 dark:text-red-400">Low Stock Alert</h3>
                    <p className="text-sm text-red-700/80 dark:text-red-300/80 mt-1 pr-8">
                      {dashboardData.lowStockItems} items have reached critical inventory levels and require immediate attention
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50">
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">{dashboardData.lowStockItems}</span>
                </div>
              </div>
              
              {/* Critical Items Preview */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between py-1.5 px-3 bg-red-100/50 dark:bg-red-900/20 rounded-md">
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Cotton Yarn #42</span>
                  <span className="text-xs bg-red-200 dark:bg-red-800/40 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded">5% left</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 bg-red-100/50 dark:bg-red-900/20 rounded-md">
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Polyester Blend B2</span>
                  <span className="text-xs bg-red-200 dark:bg-red-800/40 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded">8% left</span>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-red-500/70 dark:text-red-400/70">Last updated: Today, 09:45 AM</span>
                <button 
                  onClick={() => window.location.href = '/inventory?filter=low-stock'}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  View & Restock
                </button>
              </div>
            </div>
          </motion.div>
          
          {/* Pending Orders Card */}
          <motion.div 
            className="bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/20 rounded-xl shadow-md overflow-hidden border border-amber-100 dark:border-amber-900/20"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(245, 158, 11, 0.1), 0 4px 6px -2px rgba(245, 158, 11, 0.05)" }}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-lg mr-3">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-600 dark:text-amber-400">Pending Orders</h3>
                    <p className="text-sm text-amber-700/80 dark:text-amber-300/80 mt-1 pr-8">
                      {dashboardData.partiesWithPending} parties have pending yarn orders that may require follow-up
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{dashboardData.partiesWithPending}</span>
                </div>
              </div>
              
              {/* Urgent Orders Preview */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between py-1.5 px-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-md">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Textile Mills Ltd.</span>
                  <span className="text-xs bg-amber-200 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">5 days late</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-md">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Fabric Masters</span>
                  <span className="text-xs bg-amber-200 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">3 days late</span>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-amber-500/70 dark:text-amber-400/70">4 orders delayed by &gt;3 days</span>
                <button 
                  onClick={() => window.location.href = '/parties?filter=pending'}
                  className="px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                >
                  View Orders
                </button>
              </div>
            </div>
          </motion.div>
          
          {/* Maintenance Alerts Card */}
          <motion.div 
            className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl shadow-md overflow-hidden border border-blue-100 dark:border-blue-900/20"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)" }}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg mr-3">
                    <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-600 dark:text-blue-400">Maintenance Needed</h3>
                    <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-1 pr-8">
                      {dashboardData.totalMachines - dashboardData.activeMachines} machines require maintenance or inspection
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{dashboardData.totalMachines - dashboardData.activeMachines}</span>
                </div>
              </div>
              
              {/* Machine Alerts Preview */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between py-1.5 px-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-md">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Machine #4</span>
                  <span className="text-xs bg-blue-200 dark:bg-blue-800/40 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded">Scheduled</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-md">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Machine #7</span>
                  <span className="text-xs bg-red-200 dark:bg-red-800/40 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded">Urgent</span>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-blue-500/70 dark:text-blue-400/70">1 machine needs urgent attention</span>
                <button 
                  onClick={() => window.location.href = '/asu-unit1?filter=maintenance'}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  View Machines
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Advanced Chart Section - Production Analytics */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
          <BarChart3 className="w-5 h-5 mr-2" /> 
          Production & Efficiency Analytics
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Enhanced Production Trend */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between p-5 pb-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-500" /> 
                  Production Trend
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daily production volume in kg</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <span className="font-bold">{Math.round(dashboardData.productionTrend.reduce((a, b) => a + b, 0))} kg</span> total
                </span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  12.4%
                </span>
              </div>
            </div>
            <div className="p-5 h-[280px]">
              <Line 
                data={{
                  labels: hasDaysData ? dashboardData.daysWithData : defaultDays,
                  datasets: [
                    {
                      label: 'Actual Production (kg)',
                      data: hasProductionData ? dashboardData.productionTrend : defaultProduction,
                      fill: true,
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderColor: 'rgba(59, 130, 246, 1)',
                      tension: 0.4,
                    },
                    {
                      label: 'Target Production (kg)',
                      data: hasProductionData ? dashboardData.productionTrend.map(val => val * 1.1) : defaultProduction,
                      fill: false,
                      borderColor: 'rgba(209, 213, 219, 0.8)',
                      borderDash: [5, 5],
                      tension: 0.4,
                      pointRadius: 0,
                    },
                    {
                      label: 'Predicted Production (kg)',
                      data: hasProductionData ? [...dashboardData.productionTrend.slice(0, -1), dashboardData.predictedProduction] : defaultProduction,
                      fill: false,
                      borderColor: 'rgba(245, 158, 11, 0.8)',
                      tension: 0.4,
                      pointRadius: (ctx) => ctx.dataIndex === ctx.dataset.data.length - 1 ? 6 : 0,
                      pointBackgroundColor: 'rgba(245, 158, 11, 1)',
                      borderWidth: 2,
                      borderDash: [3, 3],
                    }
                  ],
                }} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        display: true,
                        color: 'rgba(107, 114, 128, 0.1)',
                      },
                      ticks: {
                        font: {
                          size: 10,
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        font: {
                          size: 10,
                        }
                      }
                    },
                  },
                  plugins: {
                    legend: {
                      display: true,
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: {
                          size: 10
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      titleFont: {
                        size: 12,
                      },
                      bodyFont: {
                        size: 11,
                      },
                      padding: 8,
                      cornerRadius: 4,
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat().format(context.parsed.y) + ' kg';
                          }
                          return label;
                        }
                      }
                    },
                  },
                }}
              />
            </div>
          </motion.div>

          {/* Enhanced Efficiency Metrics */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between p-5 pb-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                  <Gauge className="w-5 h-5 mr-2 text-emerald-500" /> 
                  Efficiency Metrics
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daily machine efficiency percentage</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Avg: <span className="font-bold">{dashboardData.averageEfficiency}%</span>
                </span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  2.1%
                </span>
              </div>
            </div>
            <div className="p-5 h-[280px]">
              <Bar 
                data={{
                  labels: hasDaysData ? dashboardData.daysWithData : defaultDays,
                  datasets: [
                    {
                      label: 'Actual Efficiency (%)',
                      data: hasEfficiencyData ? dashboardData.efficiencyTrend : defaultEfficiency,
                      backgroundColor: 'rgba(16, 185, 129, 0.8)',
                      borderRadius: 4,
                    },
                    {
                      label: 'Industry Benchmark (%)',
                      data: Array(7).fill(80),
                      // Use 'bar' type since this is used in a Bar component
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      borderRadius: 4,
                      // We'll represent this differently without trying to use line type
                      barPercentage: 0.2,
                      categoryPercentage: 0.4,
                    }
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      grid: {
                        display: true,
                        color: 'rgba(107, 114, 128, 0.1)',
                      },
                      ticks: {
                        callback: function(value) {
                          return value + '%';
                        },
                        font: {
                          size: 10,
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        font: {
                          size: 10,
                        }
                      }
                    },
                  },
                  plugins: {
                    legend: {
                      display: true,
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: {
                          size: 10
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += context.parsed.y + '%';
                          }
                          return label;
                        }
                      }
                    }
                  },
                }}
              />
            </div>
          </motion.div>
        </div>
        
        {/* Machine Performance Table */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-5">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-500" /> 
              Machine Performance
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detailed machine status and efficiency metrics</p>
            
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Machine</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Efficiency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Maintenance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dashboardData.machinePerformance.map((machine) => (
                    <tr key={machine.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 font-medium">Machine #{machine.id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          machine.status === 'operational' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          machine.status === 'maintenance' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{machine.efficiency}%</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{machine.lastMaintenance}</td>
                      <td className="px-4 py-3">
                        <div className="w-16 h-6">
                          <div className="bg-gray-100 dark:bg-gray-700 w-full h-1.5 rounded-full mt-2">
                            <div 
                              className={`h-full rounded-full ${
                                machine.efficiency > 85 ? 'bg-green-500' : 
                                machine.efficiency > 70 ? 'bg-amber-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${machine.efficiency}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Business Analytics Section - Split into 2 rows */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
          <PieChart className="w-5 h-5 mr-2" /> 
          Business Analytics & Insights
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Party Distribution - Enhanced with labels */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="p-5 pb-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" /> 
                  Party Distribution
                </h3>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {dashboardData.totalParties} total
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Status breakdown of all parties
              </p>
            </div>
            
            <div className="p-5 h-[280px] flex flex-col items-center justify-center">
              <div className="w-full h-48 mb-2">
                <Doughnut 
                  data={{
                    labels: ['Active Only', 'With Pending Orders', 'With Reprocessing', 'Inactive'],
                    datasets: [
                      {
                        data: [activeOnly, pending, reprocessing, inactive],
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(245, 158, 11, 0.8)',
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(107, 114, 128, 0.8)',
                        ],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 15,
                          font: { size: 10 }
                        },
                      },
                      tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        padding: 8,
                        cornerRadius: 4,
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.formattedValue;
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = Math.round((context.parsed / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      },
                    },
                  }}
                />
              </div>
              
              {/* Key stats below chart */}
              <div className="w-full grid grid-cols-2 gap-2 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active Ratio</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {Math.round((dashboardData.activeParties / Math.max(dashboardData.totalParties, 1)) * 100)}%
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pending Issues</p>
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                    {Math.round((pending / Math.max(dashboardData.totalParties, 1)) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Inventory Breakdown Chart */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="p-5 pb-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                  <Warehouse className="w-5 h-5 mr-2 text-emerald-500" /> 
                  Inventory Breakdown
                </h3>
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  By Category
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Value and quantity distribution
              </p>
            </div>
            
            <div className="p-5 h-[280px]">
              <div className="h-full">
                <Bar 
                  data={{
                    labels: dashboardData.inventoryByCategory.map(cat => cat.name),
                    datasets: [
                      {
                        label: 'Value (₹)',
                        data: dashboardData.inventoryByCategory.map(cat => cat.value),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderRadius: 4,
                        yAxisID: 'y',
                      },
                      {
                        label: 'Quantity',
                        data: dashboardData.inventoryByCategory.map(cat => cat.count),
                        // Use bar type to match parent component
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        yAxisID: 'y1',
                        borderRadius: 4,
                        barPercentage: 0.5,
                        categoryPercentage: 0.8,
                      }
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: {
                          display: true,
                          color: 'rgba(107, 114, 128, 0.1)',
                        },
                        title: {
                          display: true,
                          text: 'Value (₹)',
                          color: 'rgba(16, 185, 129, 1)',
                          font: {
                            size: 10,
                          }
                        },
                        ticks: {
                          callback: function(value) {
                            if (typeof value === 'number') {
                              return '₹' + (value >= 1000 ? (value/1000) + 'k' : value);
                            }
                            return value;
                          },
                          font: {
                            size: 9,
                          }
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                          drawOnChartArea: false,
                        },
                        title: {
                          display: true,
                          text: 'Quantity',
                          color: 'rgba(59, 130, 246, 1)',
                          font: {
                            size: 10,
                          }
                        },
                        ticks: {
                          font: {
                            size: 9,
                          }
                        }
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          font: {
                            size: 9,
                          }
                        }
                      },
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 10,
                          font: {
                            size: 10
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleFont: {
                          size: 12,
                        },
                        bodyFont: {
                          size: 11,
                        },
                        padding: 8,
                        cornerRadius: 4,
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (context.parsed.y !== null) {
                              if (context.dataset.label === 'Value (₹)') {
                                label += '₹' + context.parsed.y.toLocaleString();
                              } else {
                                label += context.parsed.y;
                              }
                            }
                            return label;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
          
          {/* Top Parties Table */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="p-5 pb-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-500" /> 
                  Top Parties
                </h3>
                <span className="text-xs font-medium px-2 py-1 rounded bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  By Order Volume
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Most active business partners
              </p>
            </div>
            
            <div className="p-5 h-[280px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Party Name</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dashboardData.topParties.map((party, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" 
                      onClick={() => window.location.href = `/parties/${encodeURIComponent(party.name)}`}>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-200 font-medium whitespace-nowrap">
                        {party.name}
                      </td>
                      <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-200">
                        {party.ordersCount}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-200">
                        ₹{(party.totalValue / 1000).toFixed(1)}k
                      </td>
                      <td className="px-3 py-2 text-sm text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          party.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          party.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {party.status.charAt(0).toUpperCase() + party.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
        
        {/* Financial Performance Chart */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="p-5 pb-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-purple-500" /> 
                Financial Performance
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  Profit: ₹{((dashboardData.revenueByMonth.reduce((sum, item) => sum + item.amount, 0) - 
                   dashboardData.expensesByMonth.reduce((sum, item) => sum + item.amount, 0)) / 1000).toFixed(1)}k
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  Margin: {dashboardData.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monthly revenue vs. expenses
            </p>
          </div>
          
          <div className="p-5 h-[280px]">
            <Bar 
              data={{
                labels: dashboardData.revenueByMonth.map(item => item.month),
                datasets: [
                  {
                    label: 'Revenue',
                    data: dashboardData.revenueByMonth.map(item => item.amount),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderRadius: {
                      topLeft: 4,
                      topRight: 4,
                    },
                    barPercentage: 0.6,
                    categoryPercentage: 0.8,
                  },
                  {
                    label: 'Expenses',
                    data: dashboardData.expensesByMonth.map(item => item.amount),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: {
                      topLeft: 4,
                      topRight: 4,
                    },
                    barPercentage: 0.6,
                    categoryPercentage: 0.8,
                  },
                  {
                    label: 'Profit',
                    data: dashboardData.revenueByMonth.map((item, i) => item.amount - dashboardData.expensesByMonth[i].amount),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    barPercentage: 0.4,
                    categoryPercentage: 0.5,
                    borderRadius: 4,
                    stack: 'profit'
                  }
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      display: true,
                      color: 'rgba(107, 114, 128, 0.1)',
                    },
                    ticks: {
                      callback: function(value) {
                        if (typeof value === 'number') {
                          return '₹' + (value >= 1000 ? (value/1000) + 'k' : value);
                        }
                        return value;
                      },
                      font: {
                        size: 10,
                      }
                    }
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      font: {
                        size: 10,
                      }
                    }
                  },
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      font: {
                        size: 10
                      }
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleFont: {
                      size: 12,
                    },
                    bodyFont: {
                      size: 11,
                    },
                    padding: 8,
                    cornerRadius: 4,
                    callbacks: {
                      label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                          label += ': ';
                        }
                        if (context.parsed.y !== null) {
                          label += '₹' + context.parsed.y.toLocaleString();
                        }
                        return label;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </motion.div>
        
        {/* Quick Actions Grid */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center mb-4">
            <Zap className="w-5 h-5 mr-2 text-amber-500" /> 
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl cursor-pointer"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)" }}
              transition={{ type: "spring", stiffness: 400 }}
              onClick={() => window.location.href = '/inventory'}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-blue-200 dark:bg-blue-700 rounded-lg mb-3">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="font-semibold text-blue-700 dark:text-blue-300">Stock Report</h3>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                  Generate inventory status report
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-xl cursor-pointer"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)" }}
              transition={{ type: "spring", stiffness: 400 }}
              onClick={() => window.location.href = '/production'}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-emerald-200 dark:bg-emerald-700 rounded-lg mb-3">
                  <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
                </div>
                <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">Analytics</h3>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                  View detailed production analytics
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 p-4 rounded-xl cursor-pointer"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(139, 92, 246, 0.1), 0 4px 6px -2px rgba(139, 92, 246, 0.05)" }}
              transition={{ type: "spring", stiffness: 400 }}
              onClick={() => window.location.href = '/asu-unit1'}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-violet-200 dark:bg-violet-700 rounded-lg mb-3">
                  <Settings className="w-6 h-6 text-violet-600 dark:text-violet-300" />
                </div>
                <h3 className="font-semibold text-violet-700 dark:text-violet-300">Machine Data</h3>
                <p className="text-xs text-violet-600/80 dark:text-violet-400/80 mt-1">
                  Manage ASU machine data
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-xl cursor-pointer"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(245, 158, 11, 0.1), 0 4px 6px -2px rgba(245, 158, 11, 0.05)" }}
              transition={{ type: "spring", stiffness: 400 }}
              onClick={() => window.location.href = '/parties'}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-amber-200 dark:bg-amber-700 rounded-lg mb-3">
                  <Users className="w-6 h-6 text-amber-600 dark:text-amber-300" />
                </div>
                <h3 className="font-semibold text-amber-700 dark:text-amber-300">Parties</h3>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                  Manage party information
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Advanced Analytics Sections */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
          <PieChart className="w-5 h-5 mr-2" /> 
          Advanced Analytics
        </h2>

        {/* Machine Performance Table */}
        <div className="mb-6">
          <MachinePerformanceTableRealTime />
        </div>

        {/* Quality Analytics */}
        <div className="mb-6">
          <QualityAnalytics 
            avgDefectRate={dashboardData.avgDefectRate || 0}
            highDefectCount={dashboardData.highDefectCount || 0}
            qualityDistribution={dashboardData.qualityDistribution || [
              { grade: 'A', percentage: 70, count: 35 },
              { grade: 'B', percentage: 20, count: 10 },
              { grade: 'C', percentage: 10, count: 5 }
            ]}
            recentQualityIssues={dashboardData.recentQualityIssues || []}
            totalQualityEntries={dashboardData.totalQualityEntries || 0}
            machinesWithQualityData={dashboardData.machinesWithQualityData || 0}
          />
        </div>

        {/* Financial Analytics */}
        <div className="mb-6">
          <FinancialAnalytics 
            revenueByMonth={dashboardData.revenueByMonth || []}
            expensesByMonth={dashboardData.expensesByMonth || []}
            profitMargin={dashboardData.profitMargin || 0}
          />
        </div>
      </section>
    </LayoutWrapper>
  );
};

export default Dashboard;
