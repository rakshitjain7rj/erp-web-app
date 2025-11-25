import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Check, X, Eye } from "lucide-react";
import {
    getAllCountProducts,
    updateCountProduct,
    deleteCountProduct,
} from "../api/countProductApi";
import { Button } from "../components/ui/Button";
import { CountProductQuickForm } from "../components/CountProductQuickForm";
import type { CountProduct } from "../api/countProductApi";

const SimplifiedCountProductOverview: React.FC = () => {
    const [countProducts, setCountProducts] = useState<CountProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<CountProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<CountProduct | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Editing state
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
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
            const products = await getAllCountProducts();
            setCountProducts(Array.isArray(products) ? products : []);
            setFilteredProducts(Array.isArray(products) ? products : []);
            toast.success("Count products loaded");
        } catch (error) {
            console.error("Error fetching count products:", error);
            toast.error("Failed to load count products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refreshKey]);

    useEffect(() => {
        const filtered = countProducts.filter(product =>
            (product.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.partyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.dyeingFirm || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.count || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.shade || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [countProducts, searchQuery]);

    const handleEdit = (product: CountProduct) => {
        setProductToEdit(product);
        setIsFormOpen(true);
    };

    const handleDelete = async (productId: number) => {
        if (!confirm("Are you sure you want to delete this count product?")) {
            return;
        }

        try {
            await deleteCountProduct(productId);
            setRefreshKey(prev => prev + 1);
            toast.success("Count product deleted successfully");
        } catch (error) {
            console.error("Error deleting count product:", error);
            toast.error("Failed to delete count product");
        }
    };

    const handleUpdateQuantities = (product: CountProduct) => {
        setEditingProductId(product.id);
        setEditValues({
            quantity: product.quantity || 0,
            sentQuantity: (product as any).sentQuantity || 0,
            receivedQuantity: (product as any).receivedQuantity || 0,
            dispatchQuantity: (product as any).dispatchQuantity || 0,
        });
    };

    const handleSaveQuantities = async (productId: number) => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const updateData = {
                quantity: editValues.quantity,
                sentQuantity: editValues.sentQuantity,
                receivedQuantity: editValues.receivedQuantity,
                dispatchQuantity: editValues.dispatchQuantity,
                sentToDye: editValues.sentQuantity > 0,
                received: editValues.receivedQuantity > 0,
                dispatch: editValues.dispatchQuantity > 0,
            };

            await updateCountProduct(productId, updateData);
            setEditingProductId(null);
            setRefreshKey(prev => prev + 1);
            toast.success("Quantities updated successfully");
        } catch (error) {
            console.error("Error saving quantities:", error);
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingProductId(null);
        setEditValues({ quantity: 0, sentQuantity: 0, receivedQuantity: 0, dispatchQuantity: 0 });
    };

    const handleEditValueChange = (field: keyof typeof editValues, value: string) => {
        setEditValues(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleFormSuccess = (_?: CountProduct) => {
        setIsFormOpen(false);
        setProductToEdit(null);
        setRefreshKey(prev => prev + 1);
    };

    const formatQuantity = (value: number | undefined): string => {
        if (value === undefined || value === null) return "--";
        return `${value % 1 === 0 ? value.toString() : value.toFixed(1)} kg`;
    };

    const formatDate = (date?: string): string => {
        if (!date) return "";
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
    };

    const qualityBadgeColor = (grade: string) => {
        switch (grade?.toUpperCase()) {
            case 'A': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
            case 'B': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
            case 'C': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
        }
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Count Product Overview</h1>
                <Button onClick={() => { setProductToEdit(null); setIsFormOpen(true); }} className="text-sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Product
                </Button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by customer, party, firm, count, or shade..."
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Form */}
            {isFormOpen && (
                <div className="mb-6">
                    <CountProductQuickForm
                        editMode={!!productToEdit}
                        productToEdit={productToEdit || undefined}
                        onSuccess={handleFormSuccess}
                        onCancel={() => { setIsFormOpen(false); setProductToEdit(null); }}
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
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Party</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Firm</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Count</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Shade</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Quality</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Qty</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sent</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Received</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Dispatch</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-900 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                                        No count products found
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const isEditing = editingProductId === product.id;
                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 font-medium">{product.customerName || product.partyName || "Unknown"}</td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{product.partyName || "-"}</td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{product.dyeingFirm || "-"}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded">{product.count || "-"}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">{product.shade || "-"}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${qualityBadgeColor(product.qualityGrade)}`}>{product.qualityGrade || "-"}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isEditing ? (
                                                    <input type="number" value={editValues.quantity} onChange={(e) => handleEditValueChange('quantity', e.target.value)} className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700" step="0.01" min="0" />
                                                ) : (
                                                    <span className="font-semibold">{formatQuantity(product.quantity)}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isEditing ? (
                                                    <input type="number" value={editValues.sentQuantity} onChange={(e) => handleEditValueChange('sentQuantity', e.target.value)} className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700" step="0.01" min="0" />
                                                ) : (
                                                    formatQuantity((product as any).sentQuantity || 0)
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isEditing ? (
                                                    <input type="number" value={editValues.receivedQuantity} onChange={(e) => handleEditValueChange('receivedQuantity', e.target.value)} className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700" step="0.01" min="0" />
                                                ) : (
                                                    formatQuantity((product as any).receivedQuantity || 0)
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isEditing ? (
                                                    <input type="number" value={editValues.dispatchQuantity} onChange={(e) => handleEditValueChange('dispatchQuantity', e.target.value)} className="w-20 px-2 py-1 text-sm border rounded text-right dark:bg-gray-700" step="0.01" min="0" />
                                                ) : (
                                                    formatQuantity((product as any).dispatchQuantity || 0)
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-gray-500">{formatDate(product.completedDate)}</td>
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleSaveQuantities(product.id)} disabled={isSaving} className="p-1.5 rounded bg-green-100 hover:bg-green-200 text-green-700" title="Save">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={handleCancelEdit} disabled={isSaving} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700" title="Cancel">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleEdit(product)} className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400" title="Edit">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleUpdateQuantities(product)} className="p-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400" title="Update Quantities">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400" title="Delete">
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

export default SimplifiedCountProductOverview;
