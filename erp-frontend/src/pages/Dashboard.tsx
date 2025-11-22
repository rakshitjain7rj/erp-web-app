import React from "react";
import LayoutWrapper from "../components/LayoutWrapper";
import InventorySummary from "../components/dashboard/InventorySummary";
import DashboardCharts from "../components/dashboard/DashboardCharts";

function Dashboard() {

  return (
    <LayoutWrapper>
      <div className="w-full px-4 md:px-6 py-4 space-y-6">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">Dashboard</h1>

        {/* Inventory Summary */}
        <InventorySummary />

        {/* Live Data Graphics */}
        <DashboardCharts />
      </div>
    </LayoutWrapper>
  );
}

export default Dashboard;
