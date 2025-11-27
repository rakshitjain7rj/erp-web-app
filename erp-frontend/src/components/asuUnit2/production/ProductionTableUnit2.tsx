import React, { useState, memo, useCallback, useMemo } from 'react';
import { Edit, Trash2, Save, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ASUProductionEntryUnit2 } from '../../../api/asuUnit2Api';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductionTableProps {
    entries: ASUProductionEntryUnit2[];
    onUpdate: (id: number, data: any) => Promise<boolean>;
    onDelete: (id: number) => Promise<boolean>;
}

interface TableRowProps {
    entry: ASUProductionEntryUnit2;
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
        prev.productionAt100 === next.productionAt100 &&
        prev.dayShiftWorker === next.dayShiftWorker &&
        prev.nightShiftWorker === next.nightShiftWorker &&
        prev.dayMainsReading === next.dayMainsReading &&
        prev.nightMainsReading === next.nightMainsReading
    );
};

const TableRow = memo(({ entry, onUpdate, onDelete }: TableRowProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        dayShift: entry.dayShift || 0,
        nightShift: entry.nightShift || 0,
        dayShiftWorker: entry.dayShiftWorker || '',
        nightShiftWorker: entry.nightShiftWorker || '',
        dayMainsReading: entry.dayMainsReading || 0,
        nightMainsReading: entry.nightMainsReading || 0
    });

    // Memoized handlers - instant close with optimistic update
    const handleSave = useCallback(() => {
        // Close edit mode IMMEDIATELY (optimistic)
        setIsEditing(false);
        
        // Fire API in background - don't await
        onUpdate(entry.id, {
            dayShift: parseFloat(String(editData.dayShift)),
            nightShift: parseFloat(String(editData.nightShift)),
            dayShiftWorker: editData.dayShiftWorker,
            nightShiftWorker: editData.nightShiftWorker,
            dayMainsReading: parseFloat(String(editData.dayMainsReading)),
            nightMainsReading: parseFloat(String(editData.nightMainsReading))
        });
    }, [entry.id, editData, onUpdate]);

    const handleEdit = useCallback(() => setIsEditing(true), []);
    const handleCancel = useCallback(() => setIsEditing(false), []);
    const handleDelete = useCallback(() => onDelete(entry.id), [entry.id, onDelete]);

    const handleChange = (field: string, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

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
            <motion.tr 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-blue-50/50 dark:bg-blue-900/10"
            >
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(entry.date)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {entry.machine?.machineName || entry.machineNumber || <span className="text-red-500">Unknown (ID: {entry.id})</span>}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {entry.yarnType}
                </td>
                {/* Day Shift Edit */}
                <td className="px-2 py-4 whitespace-nowrap">
                    <input
                        type="number"
                        step="0.01"
                        value={editData.dayShift}
                        onChange={(e) => handleChange('dayShift', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-sm border rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                    <input
                        type="text"
                        value={editData.dayShiftWorker}
                        onChange={(e) => handleChange('dayShiftWorker', e.target.value)}
                        className="w-24 px-2 py-1 text-sm border rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                    <input
                        type="number"
                        step="0.01"
                        value={editData.dayMainsReading}
                        onChange={(e) => handleChange('dayMainsReading', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-sm border rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </td>
                {/* Night Shift Edit */}
                <td className="px-2 py-4 whitespace-nowrap">
                    <input
                        type="number"
                        step="0.01"
                        value={editData.nightShift}
                        onChange={(e) => handleChange('nightShift', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-sm border rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                    <input
                        type="text"
                        value={editData.nightShiftWorker}
                        onChange={(e) => handleChange('nightShiftWorker', e.target.value)}
                        className="w-24 px-2 py-1 text-sm border rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                    <input
                        type="number"
                        step="0.01"
                        value={editData.nightMainsReading}
                        onChange={(e) => handleChange('nightMainsReading', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-sm border rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {(parseFloat(String(editData.dayShift)) + parseFloat(String(editData.nightShift))).toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    -
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
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
            </motion.tr>
        );
    }

    return (
        <motion.tr 
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {formatDate(entry.date)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {entry.machine?.machineName || entry.machineNumber}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    {entry.yarnType}
                </span>
            </td>
            {/* Day Shift Display */}
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 bg-yellow-50/30 dark:bg-yellow-900/5">
                {parseFloat(String(entry.dayShift || 0)).toFixed(2)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 bg-yellow-50/30 dark:bg-yellow-900/5">
                {entry.dayShiftWorker || '-'}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 bg-yellow-50/30 dark:bg-yellow-900/5">
                {entry.dayMainsReading || '-'}
            </td>
            {/* Night Shift Display */}
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 bg-indigo-50/30 dark:bg-indigo-900/5">
                {parseFloat(String(entry.nightShift || 0)).toFixed(2)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 bg-indigo-50/30 dark:bg-indigo-900/5">
                {entry.nightShiftWorker || '-'}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 bg-indigo-50/30 dark:bg-indigo-900/5">
                {entry.nightMainsReading || '-'}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                {total.toFixed(2)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${efficiency >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    efficiency >= 75 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                    {efficiency.toFixed(1)}%
                </span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
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
        </motion.tr>
    );
}, areRowPropsEqual);

TableRow.displayName = 'TableRow';

export const ProductionTableUnit2 = memo(({ entries, onUpdate, onDelete }: ProductionTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Reset page when entries change significantly (e.g. filter change)
    // But keep page if just updating a row
    // We can use a ref to track previous entries length to detect filter changes
    
    const totalPages = Math.ceil(entries.length / itemsPerPage);
    
    const paginatedEntries = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return entries.slice(start, start + itemsPerPage);
    }, [entries, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.min(Math.max(1, page), totalPages));
    };

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Machine</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yarn</th>
                                
                                {/* Day Shift Group */}
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-yellow-700 dark:text-yellow-500 uppercase tracking-wider bg-yellow-50 dark:bg-yellow-900/20 border-l border-yellow-100 dark:border-yellow-900/30">Day Prod</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-yellow-700 dark:text-yellow-500 uppercase tracking-wider bg-yellow-50 dark:bg-yellow-900/20">Worker</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-yellow-700 dark:text-yellow-500 uppercase tracking-wider bg-yellow-50 dark:bg-yellow-900/20 border-r border-yellow-100 dark:border-yellow-900/30">Mains</th>
                                
                                {/* Night Shift Group */}
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-indigo-700 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 border-l border-indigo-100 dark:border-indigo-900/30">Night Prod</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-indigo-700 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20">Worker</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-indigo-700 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 border-r border-indigo-100 dark:border-indigo-900/30">Mains</th>
                                
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Eff%</th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <AnimatePresence initial={false}>
                                {paginatedEntries.length > 0 ? (
                                    paginatedEntries.map((entry) => (
                                        <TableRow
                                            key={entry.id}
                                            entry={entry}
                                            onUpdate={onUpdate}
                                            onDelete={onDelete}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={12} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No production entries found
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {entries.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Show</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>entries</span>
                        <span className="ml-2 text-gray-500">
                            (Total {entries.length})
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="First Page"
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Previous Page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <span className="px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Page {currentPage} of {totalPages || 1}
                        </span>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Next Page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Last Page"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

ProductionTableUnit2.displayName = 'ProductionTableUnit2';
