import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface ProductionEntry {
  date?: string;
  actualProduction?: number | string;
}

interface ProductionTrendChartProps {
  data: ProductionEntry[];
  loading?: boolean;
}

const ProductionTrendChart: React.FC<ProductionTrendChartProps> = ({ data, loading }) => {
  const chartData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      const date = curr.date || 'Unknown';
      const val = parseFloat(String(curr.actualProduction || 0));
      acc[date] = (acc[date] || 0) + val;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  if (loading) {
    return (
      <div className="col-span-2 h-[400px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
    );
  }

  return (
    <Card className="col-span-2 border-none shadow-sm bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Production Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}kg`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                }}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(ProductionTrendChart);
