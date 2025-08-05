import React from "react";
import LayoutWrapper from "../components/LayoutWrapper";
import TotalASUUnit1YarnSummary from "../components/dashboard";

function Dashboard() {

  return (
    <LayoutWrapper>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Dashboard</h1>
        
        <div className="mx-auto max-w-4xl">
          <TotalASUUnit1YarnSummary days={31} showRefreshButton={true} />
        </div>
      </div>
    </LayoutWrapper>
  );
}

export default Dashboard;
