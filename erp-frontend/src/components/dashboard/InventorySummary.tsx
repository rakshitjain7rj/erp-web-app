import React, { useEffect, useState } from 'react';
import { getInventory } from '../../api/inventoryApi';
import { InventoryItem } from '../../types/inventory';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Package, AlertTriangle, DollarSign, Layers, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const LOW_STOCK_THRESHOLD_KG = 20;

const InventorySummary = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalItems: 0,
        lowStockCount: 0,
        totalValue: 0,
        categoryBreakdown: {} as Record<string, number>
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getInventory();
            processData(data);
        } catch (error) {
            console.error("Error fetching inventory summary:", error);
            toast.error("Failed to load inventory summary");
        } finally {
            setLoading(false);
        }
    };

    const processData = (items: InventoryItem[]) => {
        let lowStock = 0;
        let value = 0;
        const categories: Record<string, number> = {};

        items.forEach(item => {
            // Calculate stock balance similar to Inventory.tsx
            const totalIn = item.totalYarnIn || item.initialQuantity || 0;
            const totalOut = item.totalYarnOut || 0;
            const totalSpoiled = item.totalYarnSpoiled || 0;
            const balance = totalIn - totalOut - totalSpoiled;

            // Use currentQuantity if available and seems updated, otherwise calculated balance
            // But Inventory.tsx logic relies on balance calculation for status
            const currentStock = balance;

            if (currentStock < LOW_STOCK_THRESHOLD_KG) {
                lowStock++;
            }

            // Calculate value
            // Prefer totalValue if set, otherwise calculate
            if (item.totalValue) {
                value += Number(item.totalValue);
            } else if (item.costPerKg) {
                value += Number(item.costPerKg) * currentStock;
            }

            // Category breakdown
            const cat = item.category || 'Uncategorized';
            categories[cat] = (categories[cat] || 0) + 1;
        });

        setStats({
            totalItems: items.length,
            lowStockCount: lowStock,
            totalValue: value,
            categoryBreakdown: categories
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-blue-500">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Items</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                        <Package className="h-6 w-6 text-blue-500" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-red-500">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock Alerts</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowStockCount}</h3>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-green-500">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Inventory Value</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            ₹{stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-full">
                        <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-purple-500">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Categories</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Object.keys(stats.categoryBreakdown).length}
                        </h3>
                    </div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                        <Layers className="h-6 w-6 text-purple-500" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default InventorySummary;
