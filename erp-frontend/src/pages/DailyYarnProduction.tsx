import React from "react";
import LayoutWrapper from "../components/LayoutWrapper";
import DailyYarnTypeBreakdown from "../components/dashboard/DailyYarnTypeBreakdown";

const DailyYarnProductionPage: React.FC = () => {
  return (
    <LayoutWrapper>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Daily Yarn Production</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Detailed daily breakdown of yarn production by type
          </p>
        </div>
        
        <div className="mb-6">
          <DailyYarnTypeBreakdown limit={10} isStandalonePage={true} />
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default DailyYarnProductionPage;
