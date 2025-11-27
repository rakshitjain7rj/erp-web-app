import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface YarnDistributionChartProps {
  data: { type: string; total: number }[];
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const YarnDistributionChart: React.FC<YarnDistributionChartProps> = ({ data, loading }) => {
  const chartData = useMemo(() => {
    return data.slice(0, 6).map(item => ({
      name: item.type,
      value: item.total
    }));
  }, [data]);

  if (loading) {
    return <div className="h-[350px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />;
  }

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Yarn Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(YarnDistributionChart);
