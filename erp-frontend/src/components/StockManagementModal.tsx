import React, { useState, useEffect } from 'react';
import { InventoryItem, StockLog } from '../types/inventory';
import { getStockLogs, addStock, removeStock, logSpoilage } from '../api/stockApi';
import toast from 'react-hot-toast';

interface StockManagementModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onStockUpdate: (itemId: number) => void;
}

const StockManagementModal: React.FC<StockManagementModalProps> = ({
  item,
  isOpen,
  onClose,
  onStockUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'spoilage' | 'logs'>('in');
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [stockInForm, setStockInForm] = useState({
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    source: ''
  });

  const [stockOutForm, setStockOutForm] = useState({
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    usagePurpose: 'production'
  });

  const [spoilageForm, setSpoilageForm] = useState({
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    reason: 'damaged'
  });

  const spoilageReasons = [
    { value: 'damaged', label: '🔧 Damaged' },
    { value: 'expired', label: '⏰ Expired' },
    { value: 'contaminated', label: '🧪 Contaminated' },
    { value: 'quality_issue', label: '❌ Quality Issue' },
    { value: 'handling_error', label: '🤲 Handling Error' },
    { value: 'vendor_defect', label: '🏭 Vendor Defect' },
    { value: 'other', label: '📝 Other' }
  ];

  const usagePurposes = [
    { value: 'production', label: '🏭 Production' },
    { value: 'testing', label: '🧪 Testing' },
    { value: 'sampling', label: '📊 Sampling' },
    { value: 'maintenance', label: '🔧 Maintenance' },
    { value: 'transfer', label: '🚚 Transfer' },
    { value: 'other', label: '📝 Other' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchStockLogs();
    }
  }, [isOpen, item.id]);

  const fetchStockLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await getStockLogs(item.id);
      setStockLogs(logs);
    } catch (error) {
      console.error('Error fetching stock logs:', error);
      toast.error('Failed to load stock logs');
      // Fallback to empty array
      setStockLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockIn = async () => {
    if (!stockInForm.quantity || !stockInForm.date) {
      toast.error('Please fill in required fields');
      return;
    }

    const quantity = parseFloat(stockInForm.quantity);
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await addStock(item.id, {
        quantity,
        date: stockInForm.date,
        remarks: stockInForm.remarks,
        source: stockInForm.source
      });

      toast.success(`✅ Added ${quantity}kg to stock successfully`);
      
      // Reset form
      setStockInForm({
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        source: ''
      });

      // Refresh logs and notify parent
      await fetchStockLogs();
      onStockUpdate(item.id);
      
    } catch (error: any) {
      console.error('Error adding stock:', error);
      toast.error(error.response?.data?.message || 'Failed to add stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockOut = async () => {
    if (!stockOutForm.quantity || !stockOutForm.date) {
      toast.error('Please fill in required fields');
      return;
    }

    const quantity = parseFloat(stockOutForm.quantity);
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    // Calculate current balance
    const currentBalance = Number(item.currentQuantity) || Number(item.initialQuantity) || 0;
    if (quantity > currentBalance) {
      toast.error(`Insufficient stock. Available: ${currentBalance}kg`);
      return;
    }

    setIsSubmitting(true);
    try {
      await removeStock(item.id, {
        quantity,
        date: stockOutForm.date,
        remarks: stockOutForm.remarks,
        usagePurpose: stockOutForm.usagePurpose
      });

      toast.success(`✅ Removed ${quantity}kg from stock successfully`);
      
      // Reset form
      setStockOutForm({
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        usagePurpose: 'production'
      });

      await fetchStockLogs();
      onStockUpdate(item.id);
      
    } catch (error: any) {
      console.error('Error removing stock:', error);
      toast.error(error.response?.data?.message || 'Failed to remove stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpoilage = async () => {
    if (!spoilageForm.quantity || !spoilageForm.date) {
      toast.error('Please fill in required fields');
      return;
    }

    const quantity = parseFloat(spoilageForm.quantity);
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const currentBalance = Number(item.currentQuantity) || Number(item.initialQuantity) || 0;
    if (quantity > currentBalance) {
      toast.error(`Insufficient stock. Available: ${currentBalance}kg`);
      return;
    }

    setIsSubmitting(true);
    try {
      await logSpoilage(item.id, {
        quantity,
        date: spoilageForm.date,
        remarks: spoilageForm.remarks,
        reason: spoilageForm.reason
      });

      toast.success(`📝 Logged ${quantity}kg spoilage successfully`);
      
      // Reset form
      setSpoilageForm({
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        reason: 'damaged'
      });

      await fetchStockLogs();
      onStockUpdate(item.id);
      
    } catch (error: any) {
      console.error('Error logging spoilage:', error);
      toast.error(error.response?.data?.message || 'Failed to log spoilage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockStats = () => {
    const totalIn = stockLogs
      .filter(log => log.type === 'in')
      .reduce((sum, log) => sum + log.quantity, 0);
    
    const totalOut = stockLogs
      .filter(log => log.type === 'out')
      .reduce((sum, log) => sum + log.quantity, 0);
    
    const totalSpoiled = stockLogs
      .filter(log => log.type === 'spoilage')
      .reduce((sum, log) => sum + log.quantity, 0);

    const balance = totalIn - totalOut - totalSpoiled;

    return { totalIn, totalOut, totalSpoiled, balance };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  const { totalIn, totalOut, totalSpoiled, balance } = getStockStats();
  const totalStock = Number(item.initialQuantity) || 0;
  const usagePercent = totalStock > 0 ? ((totalOut + totalSpoiled) / totalStock) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                📦 Stock Management
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {item.productName} • {item.rawMaterial}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold transition-colors duration-200"
            >
              ×
            </button>
          </div>
        </div>

        {/* Stock Overview */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalIn.toFixed(1)}kg</div>
              <div className="text-xs text-gray-500">Total In</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalOut.toFixed(1)}kg</div>
              <div className="text-xs text-gray-500">Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalSpoiled.toFixed(1)}kg</div>
              <div className="text-xs text-gray-500">Spoiled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{balance.toFixed(1)}kg</div>
              <div className="text-xs text-gray-500">Balance</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div className="flex h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min((totalOut / totalStock) * 100, 100)}%` }}
                  title={`Used: ${totalOut.toFixed(1)}kg`}
                ></div>
                <div 
                  className="bg-red-500 transition-all duration-300"
                  style={{ width: `${Math.min((totalSpoiled / totalStock) * 100, 100)}%` }}
                  title={`Spoiled: ${totalSpoiled.toFixed(1)}kg`}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0kg</span>
              <span>{totalStock}kg Total</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'in', label: '📈 Stock In', color: 'text-green-600' },
            { id: 'out', label: '📉 Stock Out', color: 'text-blue-600' },
            { id: 'spoilage', label: '⚠️ Spoilage', color: 'text-red-600' },
            { id: 'logs', label: '📋 Activity Logs', color: 'text-gray-600' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${
                activeTab === tab.id
                  ? `${tab.color} border-current`
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Stock In Tab */}
          {activeTab === 'in' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter quantity"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={stockInForm.date}
                    onChange={(e) => setStockInForm({ ...stockInForm, date: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source
                  </label>
                  <input
                    type="text"
                    value={stockInForm.source}
                    onChange={(e) => setStockInForm({ ...stockInForm, source: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Supplier, transfer, etc."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remarks
                </label>
                <textarea
                  value={stockInForm.remarks}
                  onChange={(e) => setStockInForm({ ...stockInForm, remarks: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
              <button
                onClick={handleStockIn}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {isSubmitting ? '⏳ Adding...' : '✅ Add Stock'}
              </button>
            </div>
          )}

          {/* Stock Out Tab */}
          {activeTab === 'out' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Remove Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    value={stockOutForm.quantity}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter quantity"
                    min="0"
                    step="0.1"
                    max={balance}
                  />
                  <div className="text-xs text-gray-500 mt-1">Available: {balance.toFixed(1)}kg</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={stockOutForm.date}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, date: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Usage Purpose
                  </label>
                  <select
                    value={stockOutForm.usagePurpose}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, usagePurpose: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {usagePurposes.map((purpose) => (
                      <option key={purpose.value} value={purpose.value}>
                        {purpose.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remarks
                </label>
                <textarea
                  value={stockOutForm.remarks}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, remarks: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Production details, batch number, etc."
                />
              </div>
              <button
                onClick={handleStockOut}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {isSubmitting ? '⏳ Removing...' : '📤 Remove Stock'}
              </button>
            </div>
          )}

          {/* Spoilage Tab */}
          {activeTab === 'spoilage' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Log Spoilage/Wastage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    value={spoilageForm.quantity}
                    onChange={(e) => setSpoilageForm({ ...spoilageForm, quantity: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter quantity"
                    min="0"
                    step="0.1"
                    max={balance}
                  />
                  <div className="text-xs text-gray-500 mt-1">Available: {balance.toFixed(1)}kg</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={spoilageForm.date}
                    onChange={(e) => setSpoilageForm({ ...spoilageForm, date: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Spoilage Reason
                  </label>
                  <select
                    value={spoilageForm.reason}
                    onChange={(e) => setSpoilageForm({ ...spoilageForm, reason: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {spoilageReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remarks
                </label>
                <textarea
                  value={spoilageForm.remarks}
                  onChange={(e) => setSpoilageForm({ ...spoilageForm, remarks: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Detailed explanation of spoilage..."
                />
              </div>
              <button
                onClick={handleSpoilage}
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {isSubmitting ? '⏳ Logging...' : '⚠️ Log Spoilage'}
              </button>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Activity Logs</h3>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <div className="text-sm text-gray-500 mt-2">Loading logs...</div>
                </div>
              ) : stockLogs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <div className="text-gray-500">No stock activity logged yet</div>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stockLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        log.type === 'in'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                          : log.type === 'out'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${
                              log.type === 'in' ? 'text-green-700 dark:text-green-300' :
                              log.type === 'out' ? 'text-blue-700 dark:text-blue-300' :
                              'text-red-700 dark:text-red-300'
                            }`}>
                              {log.type === 'in' ? '📈 Stock In' :
                               log.type === 'out' ? '📉 Stock Out' : '⚠️ Spoilage'}
                            </span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {log.quantity}kg
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(log.createdAt)}
                          </div>
                          {log.remarks && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {log.remarks}
                            </div>
                          )}
                          {log.source && (
                            <div className="text-xs text-gray-500">
                              Source: {log.source}
                            </div>
                          )}
                          {log.usagePurpose && (
                            <div className="text-xs text-gray-500">
                              Purpose: {usagePurposes.find(p => p.value === log.usagePurpose)?.label || log.usagePurpose}
                            </div>
                          )}
                          {log.spoilageReason && (
                            <div className="text-xs text-gray-500">
                              Reason: {spoilageReasons.find(r => r.value === log.spoilageReason)?.label || log.spoilageReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockManagementModal;
