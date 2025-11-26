import React from 'react';
import { useProductionData } from './useProductionData';
import { ProductionStats } from './ProductionStats';
import { ProductionEntryForm } from './ProductionEntryForm';
import { ProductionTable } from './ProductionTable';
import { Toaster } from 'react-hot-toast';

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

    // Load data when machine selection changes
    React.useEffect(() => {
        if (selectedMachineId) {
            loadData(selectedMachineId);
        } else {
            loadData();
        }
    }, [selectedMachineId, loadData]);

    // Auto-select first machine when machines are loaded
    React.useEffect(() => {
        if (machines.length > 0 && selectedMachineId === 0) {
            setSelectedMachineId(machines[0].id);
        }
    }, [machines, selectedMachineId]);

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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Production History</h2>
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
