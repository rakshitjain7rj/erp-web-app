import React from 'react';
import { Chart } from 'react-chartjs-2';
import { 
  ChartOptions, 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register the required chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MonthlyFinanceData {
  month: string;
  amount: number;
}

interface FinancialAnalyticsProps {
  revenueByMonth: MonthlyFinanceData[];
  expensesByMonth: MonthlyFinanceData[];
  profitMargin: number;
}

const FinancialAnalytics: React.FC<FinancialAnalyticsProps> = ({
  revenueByMonth,
  expensesByMonth,
  profitMargin
}) => {
  // Format currency
  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
  
  // Calculate profit for each month
  const profitByMonth = revenueByMonth.map((rev, index) => ({
    month: rev.month,
    amount: rev.amount - (expensesByMonth[index]?.amount || 0)
  }));
  
  // Calculate total revenue, expenses and profit
  const totalRevenue = revenueByMonth.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expensesByMonth.reduce((sum, item) => sum + item.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;
  
  // Calculate month-over-month change in revenue and profit
  const revenueChange = revenueByMonth.length >= 2 
    ? ((revenueByMonth[revenueByMonth.length - 1].amount / revenueByMonth[revenueByMonth.length - 2].amount) - 1) * 100
    : 0;
    
  const profitChange = profitByMonth.length >= 2 
    ? ((profitByMonth[profitByMonth.length - 1].amount / profitByMonth[profitByMonth.length - 2].amount) - 1) * 100
    : 0;
  
  // Chart data for revenue and expenses
  const financialChartData = {
    labels: revenueByMonth.map(item => item.month),
    datasets: [
      {
        type: 'line' as const,
        label: 'Profit',
        data: profitByMonth.map(item => item.amount),
        borderColor: 'rgba(16, 185, 129, 1)', // Emerald
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
      },
      {
        type: 'bar' as const,
        label: 'Revenue',
        data: revenueByMonth.map(item => item.amount),
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // Blue
        borderRadius: 4,
        order: 3,
      },
      {
        type: 'bar' as const,
        label: 'Expenses',
        data: expensesByMonth.map(item => item.amount),
        backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red
        borderRadius: 4,
        order: 2,
      },
    ],
  };
  
  // Chart options
  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return '₹' + (Number(value) / 1000) + 'k';
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 10,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-purple-500" />
            Financial Performance
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monthly revenue, expenses and profit trends
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-3 md:mt-0">
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center">
            <span className="text-xs font-medium">Revenue:</span>
            <span className="text-sm font-semibold ml-1.5">{formatCurrency(totalRevenue)}</span>
            <span className={`ml-1.5 text-xs flex items-center ${revenueChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {revenueChange >= 0 ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {Math.abs(revenueChange).toFixed(1)}%
            </span>
          </div>
          
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg flex items-center">
            <span className="text-xs font-medium">Profit:</span>
            <span className="text-sm font-semibold ml-1.5">{formatCurrency(totalProfit)}</span>
            <span className={`ml-1.5 text-xs flex items-center ${profitChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {profitChange >= 0 ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {Math.abs(profitChange).toFixed(1)}%
            </span>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg flex items-center">
            <span className="text-xs font-medium">Margin:</span>
            <span className="text-sm font-semibold ml-1.5">{profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      <div className="h-[350px] mt-4">
        <Chart type='bar' data={financialChartData} options={chartOptions} />
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Revenue Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Direct Sales</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">65%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Export</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">25%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Other</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">10%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>
        
        {/* Expense Categories */}
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expense Categories</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Raw Materials</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">55%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '55%' }}></div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Labor</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">30%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Operational</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">15%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>
        </div>
        
        {/* Profit Forecast */}
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profit Forecast</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Q1 2023</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(Math.floor(totalProfit * 0.8))}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Q2 2023</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(Math.floor(totalProfit * 0.95))}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '95%' }}></div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Q3 2023 (Projected)</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(Math.floor(totalProfit * 1.15))}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalytics;
