import React from "react";
import LayoutWrapper from "../components/LayoutWrapper";
import YarnProductionDetail from "../components/dashboard/YarnProductionDetail";

const YarnProductionPage: React.FC = () => {
  return (
    <LayoutWrapper>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Yarn Production Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Detailed breakdown of yarn production data by day, machine, and type
          </p>
        </div>
        
        <div className="mb-6">
          <YarnProductionDetail />
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default YarnProductionPage;
