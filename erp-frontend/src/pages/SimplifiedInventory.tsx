import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Package, TrendingDown, TrendingUp } from "lucide-react";
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from "../api/inventoryApi";
import { InventoryItem } from "../types/inventory";
import { Button } from "../components/ui/Button";
import StockManagementModal from "../components/StockManagementModal";

const LOW_STOCK_THRESHOLD_KG = 20;

const SimplifiedInventory: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedItemForStock, setSelectedItemForStock] = useState<InventoryItem | null>(null);

    const [formData, setFormData] = useState({
        productName: "",
        rawMaterial: "",
        category: "",
        initialQuantity: "",
        currentQuantity: "",
        effectiveYarn: "",
        count: "",
        gsm: "",
        costPerKg: "",
        warehouseLocation: "",
        batchNumber: "",
        supplierName: "",
        remarks: "",
    });

    const fetchItems = async () => {
        try {
            setLoading(true);
            const data = await getInventory();

            // Ensure data is an array
            const itemsArray = Array.isArray(data) ? data : [];

            console.log("Inventory data received:", itemsArray.length, "items");

            setItems(itemsArray);
            setFilteredItems(itemsArray);

            if (itemsArray.length > 0) {
                toast.success(`Inventory loaded: ${itemsArray.length} items`);
            } else {
                toast.info("No inventory items found");
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
            toast.error("Failed to load inventory");
            setItems([]);
            setFilteredItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        const filtered = items.filter(item =>
            (item.productName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.rawMaterial || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.batchNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredItems(filtered);
    }, [items, searchQuery]);

    const resetForm = () => {
        setFormData({
            productName: "",
            rawMaterial: "",
            category: "",
            initialQuantity: "",
            currentQuantity: "",
            effectiveYarn: "",
            count: "",
            gsm: "",
            costPerKg: "",
            warehouseLocation: "",
            batchNumber: "",
            supplierName: "",
            remarks: "",
        });
        setEditingItem(null);
    };

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setFormData({
            productName: item.productName || "",
            rawMaterial: item.rawMaterial || "",
            category: item.category || "",
            initialQuantity: item.initialQuantity?.toString() || "",
            currentQuantity: item.currentQuantity?.toString() || "",
            effectiveYarn: item.effectiveYarn?.toString() || "",
            count: item.count?.toString() || "",
            gsm: item.gsm?.toString() || "",
            costPerKg: item.costPerKg?.toString() || "",
            warehouseLocation: item.warehouseLocation || "",
            batchNumber: item.batchNumber || "",
            supplierName: item.supplierName || "",
            remarks: item.remarks || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (item: InventoryItem) => {
        if (!confirm(`Delete ${item.productName}?`)) return;

        try {
            await deleteInventoryItem(item.id);
            toast.success("Item deleted successfully");
            fetchItems();
        } catch (error) {
            console.error("Error deleting item:", error);
            toast.error("Failed to delete item");
        }
    };

    const handleManageStock = (item: InventoryItem) => {
        setSelectedItemForStock(item);
        setShowStockModal(true);
    };

    const handleSubmit = async () => {
        const { productName, rawMaterial, initialQuantity, effectiveYarn, count } = formData;

        if (!productName || !rawMaterial || !initialQuantity || !effectiveYarn || !count) {
            toast.error("Please fill all required fields");
            return;
        }

        const payload = {
            productName,
            rawMaterial,
            effectiveYarn: parseFloat(effectiveYarn) || 0,
            count: parseFloat(count) || 0,
            initialQuantity: parseFloat(initialQuantity) || 0,
            category: formData.category || "Unspecified",
            costPerKg: parseFloat(formData.costPerKg) || 0,
            currentQuantity: parseFloat(formData.currentQuantity) || parseFloat(initialQuantity) || 0,
            gsm: parseFloat(formData.gsm) || 0,
            totalValue: (parseFloat(formData.costPerKg) || 0) * (parseFloat(initialQuantity) || 0),
            warehouseLocation: formData.warehouseLocation || "Main Warehouse",
            batchNumber: formData.batchNumber || "",
            supplierName: formData.supplierName || "",
            remarks: formData.remarks || "",
            unitsProduced: editingItem?.unitsProduced || 0,
            location: formData.warehouseLocation || "Main Warehouse",
            status: editingItem?.status || "Available",
        };

        try {
            if (editingItem) {
                await updateInventoryItem(editingItem.id, payload);
                toast.success("Item updated successfully");
            } else {
                await createInventoryItem(payload);
                toast.success("Item added successfully");
            }
            setShowModal(false);
            resetForm();
            fetchItems();
        } catch (error) {
            console.error("Error saving item:", error);
            toast.error("Failed to save item");
        }
    };

    const getStockStatus = (item: InventoryItem) => {
        const totalIn = item.totalYarnIn || item.initialQuantity || 0;
        const totalOut = item.totalYarnOut || 0;
        const totalSpoiled = item.totalYarnSpoiled || 0;
        const balance = totalIn - totalOut - totalSpoiled;

        return {
            balance,
            isLowStock: balance < LOW_STOCK_THRESHOLD_KG,
            hasSpoilage: totalSpoiled > 0
        };
    };

    const formatNumber = (value: number | undefined | null | string): string => {
        if (value === undefined || value === null || value === "") return "0.00";
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(numValue)) return "0.00";
        return numValue.toFixed(2);
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
                <Button onClick={() => { resetForm(); setShowModal(true); }} className="text-sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                </Button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product, material, category, or batch..."
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Material</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Initial (kg)</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Current (kg)</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Stock Balance</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Cost/kg</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total Value</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-900 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                                        No inventory items found
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const stockStatus = getStockStatus(item);
                                    const totalValue = (item.currentQuantity || 0) * (item.costPerKg || 0);

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <div>
                                                        <div className="font-medium">{item.productName}</div>
                                                        {item.batchNumber && (
                                                            <div className="text-xs text-gray-500">Batch: {item.batchNumber}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.rawMaterial || "-"}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded">
                                                    {item.category || "Unspecified"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">{formatNumber(item.initialQuantity)}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{formatNumber(item.currentQuantity)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-semibold ${stockStatus.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                        {formatNumber(stockStatus.balance)}
                                                    </span>
                                                    {stockStatus.isLowStock && (
                                                        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                                            <TrendingDown className="w-3 h-3" />
                                                            Low Stock
                                                        </span>
                                                    )}
                                                    {stockStatus.hasSpoilage && (
                                                        <span className="text-xs text-orange-600 dark:text-orange-400">Has Spoilage</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">₹{formatNumber(item.costPerKg)}</td>
                                            <td className="px-4 py-3 text-right font-semibold">₹{formatNumber(totalValue)}</td>
                                            <td className="px-4 py-3 text-center">
                                                {item.status === "Available" && (
                                                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                                        Available
                                                    </span>
                                                )}
                                                {item.status === "Reserved" && (
                                                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                                                        Reserved
                                                    </span>
                                                )}
                                                {item.status === "Out of Stock" && (
                                                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                                                        Out of Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleManageStock(item)}
                                                        className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400"
                                                        title="Manage Stock"
                                                    >
                                                        <TrendingUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {editingItem ? "Edit Item" : "Add New Item"}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Product Name *</label>
                                    <input
                                        type="text"
                                        value={formData.productName}
                                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Raw Material *</label>
                                    <input
                                        type="text"
                                        value={formData.rawMaterial}
                                        onChange={(e) => setFormData({ ...formData, rawMaterial: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Initial Quantity (kg) *</label>
                                    <input
                                        type="number"
                                        value={formData.initialQuantity}
                                        onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Effective Yarn *</label>
                                    <input
                                        type="number"
                                        value={formData.effectiveYarn}
                                        onChange={(e) => setFormData({ ...formData, effectiveYarn: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Count *</label>
                                    <input
                                        type="number"
                                        value={formData.count}
                                        onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cost per kg</label>
                                    <input
                                        type="number"
                                        value={formData.costPerKg}
                                        onChange={(e) => setFormData({ ...formData, costPerKg: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Batch Number</label>
                                    <input
                                        type="text"
                                        value={formData.batchNumber}
                                        onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                            <Button onClick={() => { setShowModal(false); resetForm(); }} variant="outline">
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit}>
                                {editingItem ? "Update" : "Add"} Item
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Management Modal */}
            {showStockModal && selectedItemForStock && (
                <StockManagementModal
                    isOpen={showStockModal}
                    onClose={() => { setShowStockModal(false); setSelectedItemForStock(null); }}
                    item={selectedItemForStock}
                    onStockUpdate={() => fetchItems()}
                />
            )}
        </div>
    );
};

export default SimplifiedInventory;
