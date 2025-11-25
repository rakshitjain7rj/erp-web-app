import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Search, Plus, Eye, Edit, Trash2, Check, X } from "lucide-react";
import {
    getAllDyeingRecords,
    deleteDyeingRecord,
    updateDyeingRecord,
} from "../api/dyeingApi";
import { getAllCountProducts, updateCountProduct, deleteCountProduct } from "../api/countProductApi";
import { Button } from "../components/ui/Button";
import SimplifiedDyeingOrderForm from "../components/SimplifiedDyeingOrderForm";
import { dyeingDataStore } from "../stores/dyeingDataStore";
import type { DyeingRecord } from "../types/dyeing";
import type { CountProduct } from "../api/countProductApi";

interface SimplifiedDisplayRecord {
    id: number;
    customerName: string;
    dyeingFirm: string;
    count: string;
    quantity: number;
    sentToDye: number;
    sentDate?: string;
    received: number;
    receivedDate?: string;
    dispatch: number;
    dispatchDate?: string;
    partyNameMiddleman: string;
    type: 'dyeing' | 'countProduct';
    originalRecord: DyeingRecord | CountProduct;
}

// Helper to safely extract string from potential objects
const getSafeString = (val: any): string => {
    if (!val) return "";
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        // Try common properties if it's an object
        return val.partyName || val.name || val.customerName || JSON.stringify(val);
    }
    return String(val);
};

const SimplifiedDyeingOrders: React.FC = () => {
    const [records, setRecords] = useState<SimplifiedDisplayRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<SimplifiedDisplayRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Editing state
    const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
    const [editValues, setEditValues] = useState({
        quantity: 0,
        sentQuantity: 0,
        receivedQuantity: 0,
        dispatchQuantity: 0,
    });
    const [isSaving, setIsSaving] = useState(false);

    // Fetch data
    const fetchData = async () => {
        try {
            const [dyeingRecords, countProducts] = await Promise.all([
                getAllDyeingRecords().catch(() => []),
                getAllCountProducts().catch(() => []),
            ]);

            const mappedRecords: SimplifiedDisplayRecord[] = [
                ...(Array.isArray(dyeingRecords) ? dyeingRecords.map(mapDyeingRecord) : []),
                ...(Array.isArray(countProducts) ? countProducts.map(mapCountProduct) : []),
            ];

            setRecords(mappedRecords);
            setFilteredRecords(mappedRecords);
            toast.success("Data loaded successfully");
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const mapDyeingRecord = (record: DyeingRecord): SimplifiedDisplayRecord => {
        const trackingInfo = parseTrackingInfo(record.remarks);
        return {
            id: record.id,
            customerName: record.customerName || trackingInfo.originalQty ? `Customer ${record.id}` : record.partyName || "Unknown",
            dyeingFirm: record.dyeingFirm || "Unknown",
            count: record.count || "Standard",
            quantity: trackingInfo.originalQty || record.quantity || 0,
            sentToDye: record.quantity || 0,
            sentDate: record.sentDate,
            received: trackingInfo.received || 0,
            receivedDate: trackingInfo.receivedDate,
            dispatch: trackingInfo.dispatch || 0,
            dispatchDate: trackingInfo.dispatchDate,
            partyNameMiddleman: trackingInfo.middleman || getSafeString(record.partyName) || "Direct",
            type: 'dyeing',
            originalRecord: record,
        };
    };

    const mapCountProduct = (product: CountProduct): SimplifiedDisplayRecord => {
        return {
            id: product.id,
            customerName: getSafeString(product.customerName) || getSafeString(product.partyName) || "Unknown",
            dyeingFirm: product.dyeingFirm || "Unknown",
            count: product.count || "Standard",
            quantity: product.quantity || 0,
            sentToDye: (product as any).sentQuantity || product.quantity || 0,
            sentDate: product.sentDate,
            received: (product as any).receivedQuantity || 0,
            receivedDate: product.receivedDate,
            dispatch: (product as any).dispatchQuantity || 0,
            dispatchDate: product.dispatchDate,
            partyNameMiddleman: product.middleman || getSafeString(product.partyName) || "Direct",
            type: 'countProduct',
            originalRecord: product,
        };
    };

    const parseTrackingInfo = (remarks?: string) => {
        const info: any = {};
        if (!remarks) return info;

        const parts = remarks.split('|').map(p => p.trim());
        parts.forEach(part => {
            const receivedMatch = part.match(/Received:\s*(\d+(?:\.\d+)?)\s*kg(?:\s*on\s*(.+))?/i);
            if (receivedMatch) {
                info.received = parseFloat(receivedMatch[1]);
                if (receivedMatch[2]) info.receivedDate = receivedMatch[2].trim();
            }

            const dispatchMatch = part.match(/Dispatched:\s*(\d+(?:\.\d+)?)\s*kg(?:\s*on\s*(.+))?/i);
            if (dispatchMatch) {
                info.dispatch = parseFloat(dispatchMatch[1]);
                if (dispatchMatch[2]) info.dispatchDate = dispatchMatch[2].trim();
            }

            const originalQtyMatch = part.match(/OriginalQty:\s*(\d+(?:\.\d+)?)\s*kg/i);
            if (originalQtyMatch) {
                info.originalQty = parseFloat(originalQtyMatch[1]);
            }

            const middlemanMatch = part.match(/Middleman:\s*(.+)/i);
            if (middlemanMatch) {
                info.middleman = middlemanMatch[1].trim();
            }
        });

        return info;
    };

    useEffect(() => {
        fetchData();
    }, [refreshKey]);

    useEffect(() => {
        const filtered = records.filter(record =>
            record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.dyeingFirm.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.count.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.partyNameMiddleman.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredRecords(filtered);
    }, [records, searchQuery]);

    const handleEdit = (record: SimplifiedDisplayRecord) => {
        if (record.type === 'dyeing') {
            const dyeingRecord = record.originalRecord as DyeingRecord;
            setOrderToEdit({
                id: dyeingRecord.id,
                quantity: record.quantity,
                customerName: record.customerName,
                sentToDye: record.sentToDye,
                sentDate: record.sentDate || "",
                received: record.received,
                receivedDate: record.receivedDate || "",
                dispatch: record.dispatch,
                dispatchDate: record.dispatchDate || "",
                dyeingFirm: record.dyeingFirm,
                partyName: record.partyNameMiddleman,
                yarnType: dyeingRecord.yarnType || "",
                shade: dyeingRecord.shade || "",
                count: record.count,
                lot: dyeingRecord.lot || "",
                expectedArrivalDate: dyeingRecord.expectedArrivalDate || "",
                remarks: dyeingRecord.remarks || "",
            });
            setIsFormOpen(true);
        }
    };

    const handleDelete = async (record: SimplifiedDisplayRecord) => {
        if (!confirm(`Delete this ${record.type === 'dyeing' ? 'dyeing order' : 'count product'}?`)) {
            return;
        }

        try {
            if (record.type === 'dyeing') {
                await deleteDyeingRecord(record.id);
            } else {
                await deleteCountProduct(record.id);
            }
            setRefreshKey(prev => prev + 1);
            toast.success("Deleted successfully");
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Failed to delete");
        }
    };

    const handleUpdateQuantities = (record: SimplifiedDisplayRecord) => {
        setEditingRecordId(record.id);
        setEditValues({
            quantity: record.quantity,
            sentQuantity: record.sentToDye,
            receivedQuantity: record.received,
            dispatchQuantity: record.dispatch,
        });
    };

    const handleSaveQuantities = async (record: SimplifiedDisplayRecord) => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const updateData = {
                quantity: editValues.quantity,
                sentQuantity: editValues.sentQuantity,
                receivedQuantity: editValues.receivedQuantity,
                dispatchQuantity: editValues.dispatchQuantity,
            };

            if (record.type === 'countProduct') {
                await updateCountProduct(record.id, updateData);
            } else {
                await updateDyeingRecord(record.id, updateData as any);
            }

            setEditingRecordId(null);
            setRefreshKey(prev => prev + 1);
            toast.success("Quantities updated successfully");
        } catch (error) {
            console.error("Error saving:", error);
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingRecordId(null);
        setEditValues({ quantity: 0, sentQuantity: 0, receivedQuantity: 0, dispatchQuantity: 0 });
    };

    const handleEditValueChange = (field: keyof typeof editValues, value: string) => {
        setEditValues(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const formatQuantity = (value?: number | string | null): string => {
        if (value === undefined || value === null) return "--";

        const numericValue = Number.parseFloat(String(value).replace(/,/g, '').trim());
        if (!Number.isFinite(numericValue)) return "--";

        const roundedValue = Number.isInteger(numericValue)
            ? numericValue
            : Math.round(numericValue * 10) / 10;

        return `${roundedValue.toString()} kg`;
    };

    const formatDate = (date?: string): string => {
        if (!date) return "";
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                    <span className="text-lg">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dyeing Orders</h1>
                <Button onClick={() => { setOrderToEdit(null); setIsFormOpen(true); }} className="text-sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Order
                </Button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by customer, firm, count, or party..."
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Form */}
            {isFormOpen && (
                <div className="mb-6">
                    <SimplifiedDyeingOrderForm
                        orderToEdit={orderToEdit}
                        onCancel={() => { setIsFormOpen(false); setOrderToEdit(null); }}
                        onSuccess={() => {
                            setIsFormOpen(false);
                            setOrderToEdit(null);
                            setRefreshKey(prev => prev + 1);
                        }}
                        existingFirms={[]}
                    />
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Firm</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Count</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Qty</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sent</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Received</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Dispatch</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Party</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-900 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => {
                                    const isEditing = editingRecordId === record.id;
                                    return (
                                        <tr key={`${record.type}-${record.id}`} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${record.type === 'countProduct' ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{record.customerName}</div>
                                                {record.type === 'countProduct' && <div className="text-xs text-blue-600 dark:text-blue-400">Count Product</div>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{record.dyeingFirm}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded">{record.count}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isEditing ? (
                                                    <input type="number" value={editValues.quantity} onChange={(e) => handleEditValueChange('quantity', e.target.value)} className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700" step="0.01" min="0" />
                                                ) : (
                                                    <span className="font-semibold">{formatQuantity(record.quantity)}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isEditing ? (
                                                    <input type="number" value={editValues.sentQuantity} onChange={(e) => handleEditValueChange('sentQuantity', e.target.value)} className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700" step="0.01" min="0" />
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span>{formatQuantity(record.sentToDye)}</span>
                                                        {record.sentDate && <span className="text-xs text-gray-500">{formatDate(record.sentDate)}</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isEditing ? (
                                                    <input type="number" value={editValues.receivedQuantity} onChange={(e) => handleEditValueChange('receivedQuantity', e.target.value)} className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700" step="0.01" min="0" />
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span>{formatQuantity(record.received)}</span>
                                                        {record.receivedDate && <span className="text-xs text-gray-500">{formatDate(record.receivedDate)}</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isEditing ? (
                                                    <input type="number" value={editValues.dispatchQuantity} onChange={(e) => handleEditValueChange('dispatchQuantity', e.target.value)} className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700" step="0.01" min="0" />
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span>{formatQuantity(record.dispatch)}</span>
                                                        {record.dispatchDate && <span className="text-xs text-gray-500">{formatDate(record.dispatchDate)}</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">{record.partyNameMiddleman}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleSaveQuantities(record)} disabled={isSaving} className="p-1.5 rounded bg-green-100 hover:bg-green-200 text-green-700" title="Save">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={handleCancelEdit} disabled={isSaving} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700" title="Cancel">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleEdit(record)} className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400" title="Edit">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleUpdateQuantities(record)} className="p-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400" title="Update Quantities">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(record)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400" title="Delete">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SimplifiedDyeingOrders;
