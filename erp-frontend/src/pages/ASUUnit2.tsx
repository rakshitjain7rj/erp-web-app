import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ASUInputForm from '../components/ASUInputForm';
import ASUSummaryTable from '../components/ASUSummaryTable';
import { asuApi } from '../api/asuApi';
import {
  ASUDailyMachinePaginated,
  ASUProductionEfficiencyPaginated,
  ASUMainsReadingPaginated,
  ASUWeeklyPaginated,
  ASUFormData,
  ASUFilters
} from '../types/asu';
import {
  Activity,
  TrendingUp,
  Zap,
  BarChart3,
  Plus
} from 'lucide-react';

const ASUUnit2: React.FC = () => {
  const [activeView, setActiveView] = useState<'form' | 'summary'>('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paginated data states
  const [dailyMachineData, setDailyMachineData] = useState<ASUDailyMachinePaginated>({ 
    data: [], 
    total: 0, 
    page: 1, 
    limit: 10, 
    totalPages: 1 
  });
  const [productionEfficiency, setProductionEfficiency] = useState<ASUProductionEfficiencyPaginated>({ 
    data: [], 
    total: 0, 
    page: 1, 
    limit: 10, 
    totalPages: 1 
  });
  const [mainsReadings, setMainsReadings] = useState<ASUMainsReadingPaginated>({ 
    data: [], 
    total: 0, 
    page: 1, 
    limit: 10, 
    totalPages: 1 
  });
  const [weeklyData, setWeeklyData] = useState<ASUWeeklyPaginated>({ 
    data: [], 
    total: 0, 
    page: 1, 
    limit: 10, 
    totalPages: 1 
  });

  const [filters, setFilters] = useState<ASUFilters>({ page: 1, limit: 10 });

  const [stats, setStats] = useState({
    totalMachines: 0,
    activeMachines: 0,
    totalProduction: 0,
    averageEfficiency: 0,
    totalPowerConsumption: 0,
    lastWeekComparison: {
      production: { current: 0, previous: 0, change: 0 },
      efficiency: { current: 0, previous: 0, change: 0 },
      power: { current: 0, previous: 0, change: 0 }
    }
  });

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        console.log('🔄 Loading ASU data with filters:', filters);
        
        const [dailyRes, productionRes, mainsRes, weeklyRes] = await Promise.all([
          asuApi.getDailyMachineData(filters),
          asuApi.getProductionEfficiency(filters),
          asuApi.getMainsReadings(filters),
          asuApi.getWeeklyData(filters)
        ]);

        console.log('📊 API Responses:', {
          daily: dailyRes,
          production: productionRes,
          mains: mainsRes,
          weekly: weeklyRes
        });

        // Extract the paginated data from the API response structure
        if (dailyRes.success && dailyRes.data) {
          setDailyMachineData({
            data: dailyRes.data.data || [],
            total: dailyRes.data.total || 0,
            page: dailyRes.data.page || 1,
            limit: dailyRes.data.limit || 10,
            totalPages: dailyRes.data.totalPages || 1
          });
        }
        
        if (productionRes.success && productionRes.data) {
          setProductionEfficiency({
            data: productionRes.data.data || [],
            total: productionRes.data.total || 0,
            page: productionRes.data.page || 1,
            limit: productionRes.data.limit || 10,
            totalPages: productionRes.data.totalPages || 1
          });
        }
        
        if (mainsRes.success && mainsRes.data) {
          setMainsReadings({
            data: mainsRes.data.data || [],
            total: mainsRes.data.total || 0,
            page: mainsRes.data.page || 1,
            limit: mainsRes.data.limit || 10,
            totalPages: mainsRes.data.totalPages || 1
          });
        }
        
        if (weeklyRes.success && weeklyRes.data) {
          setWeeklyData({
            data: weeklyRes.data.data || [],
            total: weeklyRes.data.total || 0,
            page: weeklyRes.data.page || 1,
            limit: weeklyRes.data.limit || 10,
            totalPages: weeklyRes.data.totalPages || 1
          });
        }

        console.log('✅ Data loaded successfully:', {
          dailyCount: dailyRes.data?.data?.length || 0,
          productionCount: productionRes.data?.data?.length || 0,
          mainsCount: mainsRes.data?.data?.length || 0,
          weeklyCount: weeklyRes.data?.data?.length || 0
        });
        
      } catch (error) {
        console.error('Error loading ASU data:', error);
        toast.error('Failed to load ASU data');
      } finally {
        setIsLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        const response = await asuApi.getStats(filters);
        if (response.success && response.data) setStats(response.data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadAllData();
    loadStats();
  }, [filters]);

  const handleFormSubmit = async (formData: ASUFormData) => {
    setIsSubmitting(true);
    try {
      const response = await asuApi.submitDailyData(formData);
      if (response.success) {
        toast.success('ASU data submitted successfully!');
        // Trigger data reload by updating filters
        setFilters(prev => ({ ...prev, page: 1 })); // force re-run useEffect by changing at least 1 field
        setActiveView('summary');
      } else {
        toast.error(response.error || 'Failed to submit data');
      }
    } catch {
      toast.error('Failed to submit ASU data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFiltersChange = (newFilters: Partial<ASUFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

 const safeToFixed = (value: number | undefined | null, decimals: number = 1): string => {
  if (value == null || isNaN(value)) return '0';
  return Number(value).toFixed(decimals);
};

const safeComparison = (data?: { change?: number }) => {
  return {
    change: data?.change ?? 0
  };
};

const renderStatsCards = () => (
  <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
    {/* Card 1: Active Machines */}
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Machines</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.activeMachines || 0}/{stats?.totalMachines || 0}
          </p>
        </div>
        <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>

    {/* Card 2: Total Production */}
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Production</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {safeToFixed(stats?.totalProduction)} kg
          </p>
          <p className={`text-sm ${safeComparison(stats?.lastWeekComparison?.production).change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {safeComparison(stats?.lastWeekComparison?.production).change >= 0 ? '+' : ''}
            {safeToFixed(safeComparison(stats?.lastWeekComparison?.production).change)}% from last week
          </p>
        </div>
        <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
          <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
      </div>
    </div>

    {/* Card 3: Avg Efficiency */}
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Efficiency</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {safeToFixed(stats?.averageEfficiency)} kg/h
          </p>
          <p className={`text-sm ${safeComparison(stats?.lastWeekComparison?.efficiency).change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {safeComparison(stats?.lastWeekComparison?.efficiency).change >= 0 ? '+' : ''}
            {safeToFixed(safeComparison(stats?.lastWeekComparison?.efficiency).change)}% from last week
          </p>
        </div>
        <div className="p-3 bg-yellow-100 rounded-full dark:bg-yellow-900">
          <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        </div>
      </div>
    </div>

    {/* Card 4: Power Consumption */}
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Power Consumption</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {safeToFixed(stats?.totalPowerConsumption, 0)} units
          </p>
          <p className={`text-sm ${safeComparison(stats?.lastWeekComparison?.power).change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {safeComparison(stats?.lastWeekComparison?.power).change >= 0 ? '+' : ''}
            {safeToFixed(safeComparison(stats?.lastWeekComparison?.power).change)}% from last week
          </p>
        </div>
        <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900">
          <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </div>
  </div>
);

  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ASU Unit 2 Tracking</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Monitor and manage daily machine operations, production efficiency, and power consumption
              </p>
            </div>

            <div className="flex mt-4 space-x-3 sm:mt-0">
              <button
                onClick={() => setActiveView('summary')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeView === 'summary'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Summary</span>
              </button>

              <button
                onClick={() => setActiveView('form')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeView === 'form'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {activeView === 'summary' && renderStatsCards()}

        {/* Main View */}
        {activeView === 'form' ? (
          <ASUInputForm onSubmit={handleFormSubmit} isLoading={isSubmitting} />
        ) : (
          <ASUSummaryTable
            dailyMachineData={dailyMachineData}
            productionEfficiency={productionEfficiency}
            mainsReadings={mainsReadings}
            weeklyData={weeklyData}
            onFiltersChange={handleFiltersChange}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default ASUUnit2;
