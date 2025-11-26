import React, { useState, useEffect, memo, useMemo } from 'react';
import { Plus, Save, Settings } from 'lucide-react';
import { ASUMachine } from '../../api/asuUnit1Api';

interface ProductionEntryFormProps {
    machines: ASUMachine[];
    onSubmit: (data: any) => Promise<boolean>;
    loading: boolean;
    selectedMachineId: number;
    onMachineChange: (id: number) => void;
}

export const ProductionEntryForm = memo(({ machines, onSubmit, loading, selectedMachineId, onMachineChange }: ProductionEntryFormProps) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        dayShift: '',
        nightShift: '',
        yarnType: '',
        productionAt100: 0
    });

    // Get selected machine details
    const selectedMachine = useMemo(() => 
        machines.find(m => m.id === selectedMachineId),
        [machines, selectedMachineId]
    );

    // Update yarn type when machine changes
    useEffect(() => {
        if (selectedMachine) {
            setFormData(prev => ({
                ...prev,
                yarnType: selectedMachine.yarnType || 'Cotton',
                productionAt100: typeof selectedMachine.productionAt100 === 'number' ? selectedMachine.productionAt100 : 400
            }));
        }
    }, [selectedMachine]);

    const handleMachineSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
        onMachineChange(id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const submissionData = {
            machineId: selectedMachineId,
            date: formData.date,
            dayShift: parseFloat(formData.dayShift) || 0,
            nightShift: parseFloat(formData.nightShift) || 0,
            yarnType: formData.yarnType,
            productionAt100: formData.productionAt100
        };

        const success = await onSubmit(submissionData);

        if (success) {
            // Reset form but keep date
            setFormData(prev => ({
                ...prev,
                dayShift: '',
                nightShift: ''
            }));
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Production Entry</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                    </label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    />
                </div>

                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Machine
                    </label>
                    <select
                        value={selectedMachineId}
                        onChange={handleMachineSelect}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value={0} disabled>Select Machine</option>
                        {machines.map((machine) => (
                            <option key={machine.id} value={machine.id}>
                                {machine.machineName || `Machine ${machine.machineNo}`} - {machine.yarnType || 'Unknown'}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Day Shift (kg)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.dayShift}
                        onChange={(e) => setFormData({ ...formData, dayShift: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Night Shift (kg)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.nightShift}
                            onChange={(e) => setFormData({ ...formData, nightShift: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[3rem]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Machine Configuration Display */}
            {selectedMachine && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                        <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Machine Configuration</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Count</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {selectedMachine.count || 0}
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Yarn Type</div>
                            <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                {selectedMachine.yarnType || 'Cotton'}
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Spindles</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {selectedMachine.spindles || 0}
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Speed (RPM)</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {selectedMachine.speed || 0}
                            </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg px-3 py-2">
                            <div className="text-xs text-blue-600 dark:text-blue-400">Prod @ 100%</div>
                            <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                {selectedMachine.productionAt100 ? Number(selectedMachine.productionAt100).toFixed(2) : '0'}
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                            <div className={`text-sm font-semibold ${selectedMachine.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                {selectedMachine.isActive ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

ProductionEntryForm.displayName = 'ProductionEntryForm';
