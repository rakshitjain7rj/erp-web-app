import React, { useState, memo, useCallback } from 'react';
import { Edit, Trash2, Save, X } from 'lucide-react';
import { ASUProductionEntry } from '../../api/asuUnit1Api';

interface ProductionTableProps {
    entries: ASUProductionEntry[];
    onUpdate: (id: number, data: any) => Promise<boolean>;
    onDelete: (id: number) => Promise<boolean>;
}

interface TableRowProps {
    entry: ASUProductionEntry;
    onUpdate: (id: number, data: any) => Promise<boolean>;
    onDelete: (id: number) => Promise<boolean>;
}

// Custom comparison function for TableRow to prevent unnecessary re-renders
const areRowPropsEqual = (prevProps: TableRowProps, nextProps: TableRowProps): boolean => {
    const prev = prevProps.entry;
    const next = nextProps.entry;
    
    return (
        prev.id === next.id &&
        prev.dayShift === next.dayShift &&
        prev.nightShift === next.nightShift &&
        prev.date === next.date &&
        prev.yarnType === next.yarnType &&
        prev.productionAt100 === next.productionAt100
    );
};

const TableRow = memo(({ entry, onUpdate, onDelete }: TableRowProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        dayShift: entry.dayShift || 0,
        nightShift: entry.nightShift || 0
    });

    // Memoized handlers - instant close with optimistic update
    const handleSave = useCallback(() => {
        // Close edit mode IMMEDIATELY (optimistic)
        setIsEditing(false);
        
        // Fire API in background - don't await
        onUpdate(entry.id, {
            dayShift: parseFloat(String(editData.dayShift)),
            nightShift: parseFloat(String(editData.nightShift))
        });
    }, [entry.id, editData.dayShift, editData.nightShift, onUpdate]);

    const handleEdit = useCallback(() => setIsEditing(true), []);
    const handleCancel = useCallback(() => setIsEditing(false), []);
    const handleDelete = useCallback(() => onDelete(entry.id), [entry.id, onDelete]);

    const handleDayShiftChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEditData(prev => ({ ...prev, dayShift: parseFloat(e.target.value) || 0 }));
    }, []);

    const handleNightShiftChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEditData(prev => ({ ...prev, nightShift: parseFloat(e.target.value) || 0 }));
    }, []);

    const total = (parseFloat(String(entry.dayShift || 0)) + parseFloat(String(entry.nightShift || 0)));
    const efficiency = entry.productionAt100 ? (total / entry.productionAt100) * 100 : 0;

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (isEditing) {
        return (
            <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(entry.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {entry.machine?.machineName || entry.machineNumber || <span className="text-red-500">Unknown (ID: {entry.id})</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {entry.yarnType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <input
                        type="number"
                        step="0.01"
                        value={editData.dayShift}
                        onChange={handleDayShiftChange}
                        className="w-24 px-3 py-1.5 text-sm border rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <input
                        type="number"
                        step="0.01"
                        value={editData.nightShift}
                        onChange={handleNightShiftChange}
                        className="w-24 px-3 py-1.5 text-sm border rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {(parseFloat(String(editData.dayShift)) + parseFloat(String(editData.nightShift))).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleSave}
                            className="p-1 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 bg-green-100 dark:bg-green-900/30 rounded"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {formatDate(entry.date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {entry.machine?.machineName || entry.machineNumber}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    {entry.yarnType}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {parseFloat(String(entry.dayShift || 0)).toFixed(2)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {parseFloat(String(entry.nightShift || 0)).toFixed(2)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                {total.toFixed(2)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${efficiency >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    efficiency >= 75 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                    {efficiency.toFixed(1)}%
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                    <button
                        onClick={handleEdit}
                        className="p-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}, areRowPropsEqual);

TableRow.displayName = 'TableRow';

export const ProductionTable = memo(({ entries, onUpdate, onDelete }: ProductionTableProps) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Machine</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yarn Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Day Shift</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Night Shift</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Efficiency</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {entries.length > 0 ? (
                            entries.map((entry) => (
                                <TableRow
                                    key={entry.id}
                                    entry={entry}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No production entries found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

ProductionTable.displayName = 'ProductionTable';
