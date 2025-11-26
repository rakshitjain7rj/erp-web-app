import React, { memo } from 'react';
import { Activity, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { ProductionStats as ProductionStatsType } from '../../api/asuUnit1Api';

interface ProductionStatsProps {
    stats: ProductionStatsType | null;
}

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

export const ProductionStats = memo(({ stats }: ProductionStatsProps) => {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                title="Total Machines"
                value={stats.totalMachines || 0}
                icon={BarChart3}
                color="bg-blue-500"
                subtext="Total machines in unit"
            />
            <StatCard
                title="Active Machines"
                value={stats.activeMachines || 0}
                icon={Activity}
                color="bg-green-500"
                subtext="Currently running machines"
            />
            <StatCard
                title="Today's Entries"
                value={stats.todayEntries || 0}
                icon={Calendar}
                color="bg-purple-500"
                subtext="Entries recorded today"
            />
            <StatCard
                title="Average Efficiency"
                value={`${stats.averageEfficiency?.toFixed(1) || '0.0'}%`}
                icon={TrendingUp}
                color="bg-orange-500"
                subtext="Average machine efficiency"
            />
        </div>
    );
});

ProductionStats.displayName = 'ProductionStats';
