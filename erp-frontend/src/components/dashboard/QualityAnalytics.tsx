import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle, Calendar, Clipboard, Tag } from 'lucide-react';

interface QualityDistribution {
  grade: string;
  percentage: number;
  count: number;
}

interface QualityIssue {
  id: number;
  machineName: string;
  date: string;
  defectRate: number;
  efficiency: number;
  production: number;
  grade: string;
  remarks: string;
}

interface QualityAnalyticsProps {
  avgDefectRate: number;
  highDefectCount: number;
  qualityDistribution: QualityDistribution[];
  recentQualityIssues: QualityIssue[];
  totalQualityEntries: number;
  machinesWithQualityData: number;
}

const QualityAnalytics: React.FC<QualityAnalyticsProps> = ({
  avgDefectRate,
  highDefectCount,
  qualityDistribution,
  recentQualityIssues,
  totalQualityEntries,
  machinesWithQualityData
}) => {
  // Colors for the pie chart
  const QUALITY_COLORS = ['#10B981', '#3B82F6', '#F59E0B'];
  
  // Format quality distribution for the pie chart
  const qualityData = qualityDistribution.map(item => ({
    name: `Grade ${item.grade}`,
    value: item.percentage,
    count: item.count
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quality Distribution Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 col-span-1">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Quality Distribution</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Yarn quality grading breakdown</p>
        
        <div className="h-[200px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={qualityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {qualityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={QUALITY_COLORS[index % QUALITY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Percentage']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Grade details */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {qualityDistribution.map((grade, index) => (
            <div 
              key={grade.grade} 
              className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className={`w-6 h-6 rounded-full mb-1`} style={{ backgroundColor: QUALITY_COLORS[index] }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Grade {grade.grade}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{grade.count} entries</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Summary Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 col-span-1">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Quality Metrics</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Key production quality indicators</p>

        <div className="space-y-4 mt-6">
          {/* Average Defect Rate */}
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <div className={`p-2 rounded-md ${avgDefectRate > 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Defect Rate</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Overall wastage percentage</p>
              </div>
            </div>
            <div>
              <span className={`text-lg font-semibold ${avgDefectRate > 5 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {avgDefectRate.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* High Defect Entries */}
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Clipboard className="w-4 h-4" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">High Defect Entries</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Entries with &gt;5% defect rate</p>
              </div>
            </div>
            <div>
              <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                {highDefectCount}
              </span>
            </div>
          </div>

          {/* Total Quality Entries */}
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Entries</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Production entries analyzed</p>
              </div>
            </div>
            <div>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {totalQualityEntries}
              </span>
            </div>
          </div>

          {/* Machines With Data */}
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Tag className="w-4 h-4" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Machines</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Machines with quality data</p>
              </div>
            </div>
            <div>
              <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {machinesWithQualityData}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quality Issues */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 col-span-1">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Recent Quality Issues</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Production runs with high defect rates</p>

        <div className="space-y-3 mt-2">
          {recentQualityIssues.length > 0 ? (
            recentQualityIssues.map((issue) => (
              <div 
                key={issue.id} 
                className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{issue.machineName}</span>
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                    issue.defectRate > 10 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 
                    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>
                    {issue.defectRate.toFixed(1)}% defect
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-3 mb-1">
                  <span>{issue.date}</span>
                  <span>•</span>
                  <span>Grade {issue.grade || 'N/A'}</span>
                  <span>•</span>
                  <span>{issue.production} kg</span>
                </div>
                
                {issue.remarks && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {issue.remarks}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center p-6 text-gray-500 dark:text-gray-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No quality issues found in the selected period</p>
            </div>
          )}
        </div>

        {recentQualityIssues.length > 0 && (
          <div className="mt-4 text-center">
            <button 
              onClick={() => window.location.href = '/reports?view=quality-issues'}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all quality issues
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityAnalytics;
