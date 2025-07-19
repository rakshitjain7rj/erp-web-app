import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { 
  ArrowRight, 
  AlertCircle, 
  Check, 
  Clock, 
  Package, 
  Gauge, 
  Calendar, 
  PlusCircle, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/Button";
import LayoutWrapper from "../components/LayoutWrapper";
import { useAuth } from "../context/AuthContext";

// Types
interface DyeingOrdersSummary {
  totalOrders: number;
  inProgress: number;
  overdue: number;
  completed: number;
  reprocessRequired: number;
  loading: boolean;
}

interface ASUProduction {
  totalMachines: number;
  activeMachines: number;
  todayProduction: number;
  avgEfficiency: number;
  yarnTypes: {
    type: string;
    quantity: number;
    color: string;
  }[];
  loading: boolean;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [dyeingOrders, setDyeingOrders] = useState<DyeingOrdersSummary>({
    totalOrders: 0,
    inProgress: 0,
    overdue: 0,
    completed: 0,
    reprocessRequired: 0,
    loading: true,
  });

  const [asuProduction, setAsuProduction] = useState<ASUProduction>({
    totalMachines: 0,
    activeMachines: 0,
    todayProduction: 0,
    avgEfficiency: 0,
    yarnTypes: [],
    loading: true,
  });

  // Section visibility states
  const [sectionVisibility, setSectionVisibility] = useState({
    dyeingOrders: true,
    asuProduction: true,
  });

  // Toggle section visibility
  const toggleSection = (section: keyof typeof sectionVisibility) => {
    setSectionVisibility({
      ...sectionVisibility,
      [section]: !sectionVisibility[section],
    });
  };

  // Fetch Dyeing Orders Summary
  useEffect(() => {
    const fetchDyeingOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const BASE_URL = import.meta.env.VITE_API_URL || "";
        const response = await axios.get(`${BASE_URL}/dyeing-orders/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setDyeingOrders({
            ...response.data.data,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Error fetching dyeing orders summary:", error);
        // Use placeholder data in case of error
        setDyeingOrders({
          totalOrders: 45,
          inProgress: 12,
          overdue: 5,
          completed: 25,
          reprocessRequired: 3,
          loading: false,
        });
      }
    };

    fetchDyeingOrders();
  }, []);

  // Fetch ASU Production Summary
  useEffect(() => {
    const fetchASUProduction = async () => {
      try {
        const token = localStorage.getItem("token");
        const BASE_URL = import.meta.env.VITE_API_URL || "";
        const response = await axios.get(`${BASE_URL}/yarn/production-summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          const data = response.data.data;
          setAsuProduction({
            totalMachines: data.totalMachines || 9,
            activeMachines: data.activeMachines || 7,
            todayProduction: data.todayProduction || 0,
            avgEfficiency: data.avgEfficiency || 0,
            yarnTypes: data.yarnTypes || [
              { type: "Miraadii", quantity: 139, color: "bg-purple-500" },
              { type: "Mixture", quantity: 345.99, color: "bg-blue-500" },
              { type: "Polyester", quantity: 4, color: "bg-green-500" },
              { type: "Sharp Cotton", quantity: 192.96, color: "bg-pink-500" },
              { type: "Lommar", quantity: 130, color: "bg-yellow-500" },
            ],
            loading: false,
          });
        }
      } catch (error) {
        console.error("Error fetching ASU production summary:", error);
        // Use placeholder data in case of error
        setAsuProduction({
          totalMachines: 9,
          activeMachines: 7,
          todayProduction: 811.95,
          avgEfficiency: 38.3,
          yarnTypes: [
            { type: "Miraadii", quantity: 139, color: "bg-purple-500" },
            { type: "Mixture", quantity: 345.99, color: "bg-blue-500" },
            { type: "Polyester", quantity: 4, color: "bg-green-500" },
            { type: "Sharp Cotton", quantity: 192.96, color: "bg-pink-500" },
            { type: "Lommar", quantity: 130, color: "bg-yellow-500" },
          ],
          loading: false,
        });
      }
    };

    fetchASUProduction();
  }, []);

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="ml-2 text-gray-500 dark:text-gray-400">Loading data...</span>
    </div>
  );

  // Empty State Component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
        <Package className="w-8 h-8 text-blue-500 dark:text-blue-400" />
      </div>
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );

  return (
    <LayoutWrapper title="Home">
      <div className="space-y-6">
        {/* Home Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ERP Home Overview
          </h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Dyeing Orders Section */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-md dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div 
            className="flex items-center justify-between px-6 py-4 border-b border-gray-200 cursor-pointer bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700"
            onClick={() => toggleSection('dyeingOrders')}
          >
            <div className="flex items-center">
              <div className="p-2 mr-3 bg-indigo-100 rounded-lg dark:bg-indigo-900/30">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dyeing Orders Summary</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Overview of current dyeing orders and their status</p>
              </div>
            </div>
            <div>
              {sectionVisibility.dyeingOrders ? (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </div>
          
          {sectionVisibility.dyeingOrders && (
            <div className="p-6">
              {dyeingOrders.loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <motion.div 
                      className="p-4 shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Total Orders</h3>
                        <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-indigo-700 dark:text-indigo-300">{dyeingOrders.totalOrders}</p>
                    </motion.div>
                    
                    <motion.div 
                      className="p-4 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">In Progress</h3>
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-300">{dyeingOrders.inProgress}</p>
                    </motion.div>
                    
                    <motion.div 
                      className="p-4 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-amber-900 dark:text-amber-300">Overdue</h3>
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">{dyeingOrders.overdue}</p>
                    </motion.div>
                    
                    <motion.div 
                      className="p-4 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-green-900 dark:text-green-300">Completed</h3>
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-green-700 dark:text-green-300">{dyeingOrders.completed}</p>
                    </motion.div>
                    
                    <motion.div 
                      className="p-4 shadow-sm bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-red-900 dark:text-red-300">Reprocess Required</h3>
                        <RefreshCw className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-red-700 dark:text-red-300">{dyeingOrders.reprocessRequired}</p>
                    </motion.div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => window.location.href = '/dyeing-orders/new'}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>New Order</span>
                    </Button>
                    <Button 
                      variant="default"
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => window.location.href = '/dyeing-orders'}
                    >
                      <span>View All</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ASU Unit 1 Production Section */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-md dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div 
            className="flex items-center justify-between px-6 py-4 border-b border-gray-200 cursor-pointer bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700"
            onClick={() => toggleSection('asuProduction')}
          >
            <div className="flex items-center">
              <div className="p-2 mr-3 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                <Gauge className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">ASU Unit 1 Production</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Machine status, efficiency and production breakdown</p>
              </div>
            </div>
            <div>
              {sectionVisibility.asuProduction ? (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </div>
          
          {sectionVisibility.asuProduction && (
            <div className="p-6">
              {asuProduction.loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                    <motion.div 
                      className="p-5 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Machines</h3>
                      <div className="flex items-end gap-2 mt-2">
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{asuProduction.activeMachines}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">/ {asuProduction.totalMachines} active</p>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${(asuProduction.activeMachines / asuProduction.totalMachines) * 100}%` }}
                        ></div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="p-5 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Production</h3>
                      <div className="flex items-end gap-1 mt-2">
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{asuProduction.todayProduction.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">kg</p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 inline mr-1" />
                        {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      className="p-5 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Efficiency</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-3 h-3 rounded-full ${
                          asuProduction.avgEfficiency >= 70 ? 'bg-green-500' : 
                          asuProduction.avgEfficiency >= 50 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}></div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{asuProduction.avgEfficiency}%</p>
                      </div>
                      <Badge className={`mt-2 ${
                        asuProduction.avgEfficiency >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                        asuProduction.avgEfficiency >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {
                          asuProduction.avgEfficiency >= 70 ? 'Good' : 
                          asuProduction.avgEfficiency >= 50 ? 'Average' : 
                          'Needs Attention'
                        }
                      </Badge>
                    </motion.div>
                    
                    <motion.div 
                      className="p-5 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Yarn Types</h3>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{asuProduction.yarnTypes.length}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {asuProduction.yarnTypes.slice(0, 5).map((yarn, index) => (
                          <div 
                            key={index} 
                            className={`w-3 h-3 rounded-full ${yarn.color}`}
                            title={yarn.type}
                          ></div>
                        ))}
                        {asuProduction.yarnTypes.length > 5 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">+{asuProduction.yarnTypes.length - 5}</span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                  
                  <div className="p-4 border border-gray-100 bg-gray-50 dark:bg-gray-800/50 rounded-xl dark:border-gray-700">
                    <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Production by Yarn Type</h3>
                    <div className="space-y-2">
                      {asuProduction.yarnTypes.map((yarn, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${yarn.color}`}></div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1 text-xs">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{yarn.type}</span>
                              <span className="text-gray-600 dark:text-gray-400">{yarn.quantity.toFixed(2)} kg</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${yarn.color}`} 
                                style={{ 
                                  width: `${(yarn.quantity / asuProduction.todayProduction) * 100}%`,
                                  opacity: 0.8 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <Button 
                      variant="default"
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => window.location.href = '/asu-production'}
                    >
                      <span>Production Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default Home;
