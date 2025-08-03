import React, { useState, useEffect } from "react";
import LayoutWrapper from "../components/LayoutWrapper";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import { Gauge, RefreshCw, Activity } from "lucide-react";
import TotalASUUnit1YarnSummary from "../components/dashboard/TotalASUUnit1YarnSummary.jsx";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMachines: 0,
    activeMachines: 0,
    totalProduction: 0,
    efficiency: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Check if API_URL already includes /api to avoid doubling
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const dashboardEndpoint = baseUrl.includes('/api') ? 
        `${baseUrl}/dashboard/stats` : 
        `${baseUrl}/api/dashboard/stats`;
      
      const response = await axios.get(dashboardEndpoint);
      
      if (response.data && response.data.success) {
        setStats({
          totalMachines: response.data.data.totalMachines || 0,
          activeMachines: response.data.data.activeMachines || 0,
          totalProduction: response.data.data.totalProduction || 0,
          efficiency: response.data.data.avgEfficiency || 0
        });
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium">Total Machines</h3>
                  <Gauge className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex items-end">
                  <p className="text-3xl font-bold">{stats.totalMachines}</p>
                  <p className="text-sm text-gray-500 ml-2 mb-1">units</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium">Active Machines</h3>
                  <Activity className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex items-end">
                  <p className="text-3xl font-bold">{stats.activeMachines}</p>
                  <p className="text-sm text-gray-500 ml-2 mb-1">running</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium">Production (30 days)</h3>
                  <Activity className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex items-end">
                  <p className="text-3xl font-bold">{stats.totalProduction.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 ml-2 mb-1">kg</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium">Efficiency</h3>
                  <RefreshCw className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex items-end">
                  <p className="text-3xl font-bold">{stats.efficiency}%</p>
                  <p className="text-sm text-gray-500 ml-2 mb-1">avg</p>
                </div>
              </div>
            </div>
            
            {/* Yarn Production Component */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <TotalASUUnit1YarnSummary days={31} showRefreshButton={true} />
              
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Machine Status</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Running</span>
                    <span className="font-medium">{stats.activeMachines} / {stats.totalMachines}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full" 
                      style={{ 
                        width: `${stats.totalMachines > 0 ? (stats.activeMachines / stats.totalMachines * 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </LayoutWrapper>
  );
}

export default Dashboard;
