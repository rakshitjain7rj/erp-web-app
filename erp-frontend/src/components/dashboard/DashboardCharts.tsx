import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    PointElement,
    LineElement
} from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import { asuUnit1Api } from '../../api/asuUnit1Api';
import { asuUnit2Api } from '../../api/asuUnit2Api';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Loader2, Calendar, AlertCircle } from "lucide-react";

// Register ChartJS components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    PointElement,
    LineElement
);

const DashboardCharts = () => {
    const [loading, setLoading] = useState(true);
    const [unit1Data, setUnit1Data] = useState<any[]>([]);
    const [unit2Data, setUnit2Data] = useState<any[]>([]);

    // Initialize with start of the current year to ensure we catch data
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Format dates as YYYY-MM-DD for input type="date"
    // We need to handle timezone offset to ensure the date is correct in local time
    const formatDate = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const [dateFrom, setDateFrom] = useState(formatDate(startOfYear));
    const [dateTo, setDateTo] = useState(formatDate(today));

    useEffect(() => {
        fetchData();
    }, [dateFrom, dateTo]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [u1Response, u2Response] = await Promise.all([
                asuUnit1Api.getProductionEntries({ dateFrom, dateTo, limit: 1000 }),
                asuUnit2Api.getProductionEntries({ dateFrom, dateTo, limit: 1000 })
            ]);

            setUnit1Data(Array.isArray(u1Response) ? u1Response : (u1Response?.items || []));
            setUnit2Data(Array.isArray(u2Response) ? u2Response : (u2Response?.items || []));
        } catch (error) {
            console.error("Error fetching dashboard chart data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Process data for charts
    const processUnitComparison = () => {
        const u1Total = unit1Data.reduce((sum, item) => sum + (Number(item.total) || Number(item.actualProduction) || 0), 0);
        const u2Total = unit2Data.reduce((sum, item) => sum + (Number(item.total) || Number(item.actualProduction) || 0), 0);

        return {
            labels: ['ASU Unit 1', 'ASU Unit 2'],
            datasets: [
                {
                    label: 'Total Production (kg)',
                    data: [u1Total, u2Total],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    const processYarnTypeBreakdown = () => {
        const yarnTypes: Record<string, number> = {};

        // Helper to process entries
        const processEntries = (entries: any[]) => {
            entries.forEach(entry => {
                const type = entry.yarnType || entry.machine?.yarnType || 'Unknown';
                const amount = Number(entry.total) || Number(entry.actualProduction) || 0;
                yarnTypes[type] = (yarnTypes[type] || 0) + amount;
            });
        };

        processEntries(unit1Data);
        processEntries(unit2Data);

        const labels = Object.keys(yarnTypes);
        const data = Object.values(yarnTypes);

        return {
            labels,
            datasets: [
                {
                    label: 'Production by Yarn Type (kg)',
                    data,
                    backgroundColor: [
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    const processDailyTrend = () => {
        const dailyData: Record<string, { u1: number, u2: number }> = {};

        // Initialize dates based on range if needed, or just let them populate

        unit1Data.forEach(entry => {
            const date = entry.date.split('T')[0];
            if (!dailyData[date]) dailyData[date] = { u1: 0, u2: 0 };
            dailyData[date].u1 += Number(entry.total) || Number(entry.actualProduction) || 0;
        });

        unit2Data.forEach(entry => {
            const date = entry.date.split('T')[0];
            if (!dailyData[date]) dailyData[date] = { u1: 0, u2: 0 };
            dailyData[date].u2 += Number(entry.total) || Number(entry.actualProduction) || 0;
        });

        const sortedDates = Object.keys(dailyData).sort();

        return {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Unit 1',
                    data: sortedDates.map(d => dailyData[d].u1),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Unit 2',
                    data: sortedDates.map(d => dailyData[d].u2),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                }
            ]
        };
    };

    const hasData = unit1Data.length > 0 || unit2Data.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-semibold dark:text-white">Production Analytics</h2>

                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-500 font-medium">From:</span>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-transparent border-none text-sm focus:ring-0 p-0 text-gray-900 dark:text-white outline-none"
                        />
                    </div>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">To:</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-transparent border-none text-sm focus:ring-0 p-0 text-gray-900 dark:text-white outline-none"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : !hasData ? (
                <div className="flex flex-col justify-center items-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No production data found for this period</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try selecting a wider date range</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Unit Comparison Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Unit Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex justify-center">
                                <Pie data={processUnitComparison()} options={{ maintainAspectRatio: false }} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Yarn Type Breakdown Doughnut */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Yarn Type Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex justify-center">
                                <Doughnut data={processYarnTypeBreakdown()} options={{ maintainAspectRatio: false }} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daily Trend Bar Chart */}
                    <Card className="md:col-span-2 lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Production Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <Bar
                                    data={processDailyTrend()}
                                    options={{
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: { stacked: true },
                                            y: { stacked: true }
                                        }
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default DashboardCharts;
