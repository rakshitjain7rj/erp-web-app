import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import ASUInputForm from "../components/ASUInputForm";
import ASUSummaryTable from "../components/ASUSummaryTable";
import { asuApi } from "../api/asuApi";
import {
  ASUDailyMachinePaginated,
  ASUProductionEfficiencyPaginated,
  ASUMainsReadingPaginated,
  ASUWeeklyPaginated,
  ASUFormData,
  ASUFilters,
} from "../types/asu";
import {
  Activity,
  TrendingUp,
  Zap,
  BarChart3,
  Plus,
  Calendar,
} from "lucide-react";

interface ASUUnitProps {
  unit: 1; // Always Unit 1, Unit 2 functionality has been removed
}

type TabType = "daily" | "production" | "mains" | "weekly";

const ASUUnit: React.FC<ASUUnitProps> = ({ unit }) => {
  const [activeView, setActiveView] = useState<"form" | "summary">("summary");
  const [activeTab, setActiveTab] = useState<TabType>("daily");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dailyMachineData, setDailyMachineData] =
    useState<ASUDailyMachinePaginated>({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

  const [productionEfficiency, setProductionEfficiency] =
    useState<ASUProductionEfficiencyPaginated>({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

  const [mainsReadings, setMainsReadings] = useState<ASUMainsReadingPaginated>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [weeklyData, setWeeklyData] = useState<ASUWeeklyPaginated>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [filters, setFilters] = useState<ASUFilters>({
    page: 1,
    limit: 10,
    machineStart: unit === 1 ? 1 : 10,
    machineEnd: unit === 1 ? 9 : 21,
    unit,
  });

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        const [dailyRes, productionRes, mainsRes, weeklyRes] =
          await Promise.all([
            asuApi.getDailyMachineData(filters),
            asuApi.getProductionEfficiency(filters),
            asuApi.getMainsReadings(filters),
            asuApi.getWeeklyData(filters),
          ]);

        if (dailyRes.success && dailyRes.data) {
          setDailyMachineData(dailyRes.data);
        }
        if (productionRes.success && productionRes.data) {
          setProductionEfficiency(productionRes.data);
        }
        if (mainsRes.success && mainsRes.data) {
          setMainsReadings(mainsRes.data);
        }
        if (weeklyRes.success && weeklyRes.data) {
          setWeeklyData(weeklyRes.data);
        }
      } catch (err) {
        toast.error("Failed to load ASU data");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [filters]);

  const handleFormSubmit = async (formData: ASUFormData) => {
    setIsSubmitting(true);
    try {
      const response = await asuApi.submitDailyData(formData,unit );
      if (response.success) {
        toast.success("ASU data submitted!");
        setFilters((prev) => ({ ...prev, page: 1 }));
        setActiveView("summary");
      } else {
        toast.error(response.error || "Submission failed");
      }
    } catch {
      toast.error("Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFiltersChange = (newFilters: Partial<ASUFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      machineStart: unit === 1 ? 1 : 10,
      machineEnd: unit === 1 ? 9 : 21,
      unit,
    }));
  };

  console.log("[ASUUnit] Loaded for unit:", unit);

  const tabs = [
    {
      label: "Daily Machine Data",
      value: "daily",
      icon: <Activity className="w-4 h-4" />,
    },
    {
      label: "Production Efficiency",
      value: "production",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      label: "Mains Readings",
      value: "mains",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      label: "Weekly Data",
      value: "weekly",
      icon: <Calendar className="w-4 h-4" />,
    },
  ] as const;

  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                ASU Unit {unit} Tracking
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Monitor daily operations, efficiency & power for Unit {unit}
              </p>
            </div>
            <div className="flex mt-4 space-x-3 sm:mt-0">
              <button
                onClick={() => setActiveView("summary")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeView === "summary"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Summary</span>
              </button>
              <button
                onClick={() => setActiveView("form")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeView === "form"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        {activeView === "summary" && (
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
                  activeTab === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {tab.value === "daily"
                    ? dailyMachineData.total
                    : tab.value === "production"
                    ? productionEfficiency.total
                    : tab.value === "mains"
                    ? mainsReadings.total
                    : weeklyData.total}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main View */}
        {activeView === "form" ? (
          <ASUInputForm onSubmit={handleFormSubmit} isLoading={isSubmitting} />
        ) : (
          <ASUSummaryTable
            dailyMachineData={dailyMachineData}
            productionEfficiency={productionEfficiency}
            mainsReadings={mainsReadings}
            weeklyData={weeklyData}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isLoading={isLoading}
            activeTab={activeTab} // ✅ Pass activeTab
          />
        )}
      </div>
    </div>
  );
};

export default ASUUnit;
