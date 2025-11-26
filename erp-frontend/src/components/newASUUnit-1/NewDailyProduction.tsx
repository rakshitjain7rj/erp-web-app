import React, { useRef } from 'react';
import { useProductionData, DateFilter } from './useProductionData';
import { ProductionStats } from './ProductionStats';
import { ProductionEntryForm } from './ProductionEntryForm';
import { ProductionTable } from './ProductionTable';
import { Toaster } from 'react-hot-toast';
import { Calendar, RotateCcw } from 'lucide-react';

// Helper to format date as YYYY-MM-DD
const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Get date 31 days ago
const getLast31DaysDate = (): string => {
    const date = new Date();
    date.setDate(date.getDate() - 31);
    return formatDateForInput(date);
};

// Get today's date
const getTodayDate = (): string => {
    return formatDateForInput(new Date());
};

const NewDailyProduction: React.FC = () => {
    const {
        machines,
        productionEntries,
        stats,
        loading,
        loadData,
        addEntry,
        updateEntry,
        deleteEntry
    } = useProductionData();

    const [selectedMachineId, setSelectedMachineId] = React.useState<number>(0);
    const [dateFrom, setDateFrom] = React.useState<string>(getLast31DaysDate());
    const [dateTo, setDateTo] = React.useState<string>(getTodayDate());
    
    // Track if initial machine selection has been done to prevent double loading
    const initialSelectionDone = useRef(false);

    // Auto-select first machine when machines are loaded (only once)
    React.useEffect(() => {
        if (machines.length > 0 && selectedMachineId === 0 && !initialSelectionDone.current) {
            initialSelectionDone.current = true;
            setSelectedMachineId(machines[0].id);
        }
    }, [machines, selectedMachineId]);

    // Load data when machine selection or date filters change
    React.useEffect(() => {
        // Skip if this is the initial selection
        if (!initialSelectionDone.current) return;
        
        if (selectedMachineId) {
            const dateFilter: DateFilter = {};
            if (dateFrom) dateFilter.dateFrom = dateFrom;
            if (dateTo) dateFilter.dateTo = dateTo;
            loadData(selectedMachineId, dateFilter);
        }
    }, [selectedMachineId, dateFrom, dateTo, loadData]);

    // Handle "Last 31 Days" button click
    const handleLast31Days = () => {
        setDateFrom(getLast31DaysDate());
        setDateTo(getTodayDate());
    };

    // Handle reset filters
    const handleResetFilters = () => {
        setDateFrom('');
        setDateTo('');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Toaster position="top-right" />

            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Production (New)</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage daily production entries for ASU Unit 1
                </p>
            </div>

            <ProductionStats stats={stats} />

            <ProductionEntryForm
                machines={machines}
                onSubmit={(data) => addEntry(data, selectedMachineId)}
                loading={loading}
                selectedMachineId={selectedMachineId}
                onMachineChange={setSelectedMachineId}
            />

            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Production History</h2>
                    
                    {/* Date Filter Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">From:</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">To:</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <button
                            onClick={handleLast31Days}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            Last 31 Days
                        </button>
                        <button
                            onClick={handleResetFilters}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Reset date filters"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {/* Show date range info */}
                {(dateFrom || dateTo) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing entries {dateFrom ? `from ${dateFrom}` : ''} {dateTo ? `to ${dateTo}` : ''}
                        {' '}({productionEntries.length} entries)
                    </p>
                )}
                
                <ProductionTable
                    entries={productionEntries}
                    onUpdate={(id, data) => updateEntry(id, data, selectedMachineId)}
                    onDelete={(id) => deleteEntry(id, selectedMachineId)}
                />
            </div>
        </div>
    );
};

export default NewDailyProduction;
