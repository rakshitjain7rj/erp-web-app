import React from "react";
import LayoutWrapper from "../components/LayoutWrapper";
import TotalASUUnit1YarnSummary from "../components/dashboard/TotalASUUnit1YarnSummary";

function Dashboard() {

  return (
    <LayoutWrapper>
      <div className="w-full px-4 md:px-6 py-4">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">Dashboard</h1>
        <TotalASUUnit1YarnSummary days={31} showRefreshButton={true} />
      </div>
    </LayoutWrapper>
  );
}

export default Dashboard;
