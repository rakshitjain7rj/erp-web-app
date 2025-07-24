// Import our new components
import MachinePerformanceTable from "../components/dashboard/MachinePerformanceTable";
import QualityAnalytics from "../components/dashboard/QualityAnalytics";
import FinancialAnalytics from "../components/dashboard/FinancialAnalytics";

// Add this code before the last </section> in Dashboard.tsx

{/* Advanced Analytics Sections */}
<h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
  <PieChart className="w-5 h-5 mr-2" /> 
  Advanced Analytics
</h2>

{/* Machine Performance Analytics */}
<section className="mb-8">
  <MachinePerformanceTable machines={dashboardData.machinePerformance || []} />
</section>

{/* Quality Analytics */}
<section className="mb-8">
  <QualityAnalytics 
    avgDefectRate={dashboardData.avgDefectRate || 0}
    highDefectCount={dashboardData.highDefectCount || 0}
    qualityDistribution={dashboardData.qualityDistribution || [
      { grade: 'A', percentage: 70, count: 35 },
      { grade: 'B', percentage: 20, count: 10 },
      { grade: 'C', percentage: 10, count: 5 }
    ]}
    recentQualityIssues={dashboardData.recentQualityIssues || []}
    totalQualityEntries={dashboardData.totalQualityEntries || 0}
    machinesWithQualityData={dashboardData.machinesWithQualityData || 0}
  />
</section>

{/* Financial Analytics */}
<section className="mb-8">
  <FinancialAnalytics 
    revenueByMonth={dashboardData.revenueByMonth || []}
    expensesByMonth={dashboardData.expensesByMonth || []}
    profitMargin={dashboardData.profitMargin || 0}
  />
</section>
