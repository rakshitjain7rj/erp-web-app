// src/pages/YarnProductionReportPage.tsx

import React from 'react';
import { Badge } from '../components/ui/badge';
import YarnProductionSummary from '../components/YarnProductionSummary';

const YarnProductionReportPage: React.FC = () => {
  return (
    <div className="min-h-screen p-4 transition-colors duration-200 bg-gray-50 dark:bg-gray-900 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="relative mb-8 overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 rounded-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          <div className="relative px-6 py-8 sm:px-8 sm:py-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Yarn Production Report</h1>
                <p className="mt-2 text-green-100">Comprehensive overview of yarn production by type and date</p>
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-sm text-white bg-white/20 border-white/40">
                Reports
              </Badge>
            </div>
          </div>
        </div>

        {/* Yarn Production Summary Component */}
        <YarnProductionSummary />
      </div>
    </div>
  );
};

export default YarnProductionReportPage;
