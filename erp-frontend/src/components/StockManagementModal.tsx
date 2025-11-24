import React, { useState, useEffect } from 'react';
import { InventoryItem, StockLog } from '../types/inventory';
import { getStockLogs, addStock, removeStock, logSpoilage } from '../api/stockApi';
import { toast } from 'sonner';
import { X } from 'lucide-react';

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

      toast.success(`Added ${quantity}kg to stock`);

      setStockInForm({
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        source: ''
      });

      await fetchStockLogs();
      onStockUpdate(parseInt(item.id, 10));

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

    const currentBalance = getStockStats().balance;
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

      toast.success(`Removed ${quantity}kg from stock`);

      setStockOutForm({
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        usagePurpose: 'production'
      });

      await fetchStockLogs();
      onStockUpdate(parseInt(item.id, 10));

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

    const currentBalance = getStockStats().balance;
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

      toast.success(`Logged ${quantity}kg spoilage`);

      setSpoilageForm({
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        reason: 'damaged'
      });

      await fetchStockLogs();
      onStockUpdate(parseInt(item.id, 10));

    } catch (error: any) {
      console.error('Error logging spoilage:', error);
      toast.error(error.response?.data?.message || 'Failed to log spoilage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockStats = () => {
    const itemTotalIn = Number(item.totalYarnIn) || 0;
    const itemTotalOut = Number(item.totalYarnOut) || 0;
    const itemTotalSpoiled = Number(item.totalYarnSpoiled) || 0;

    if (itemTotalIn > 0 || itemTotalOut > 0 || itemTotalSpoiled > 0) {
      const balance = itemTotalIn - itemTotalOut - itemTotalSpoiled;
      return {
        totalIn: itemTotalIn,
        totalOut: itemTotalOut,
        totalSpoiled: itemTotalSpoiled,
        balance
      };
    }

    const initialQty = Number(item.initialQuantity) || 0;

    const logsIn = stockLogs
      .filter(log => log.type === 'in')
      .reduce((sum, log) => sum + log.quantity, 0);

    const logsOut = stockLogs
      .filter(log => log.type === 'out')
      .reduce((sum, log) => sum + log.quantity, 0);

    const logsSpoiled = stockLogs
      .filter(log => log.type === 'spoilage')
      .reduce((sum, log) => sum + log.quantity, 0);

    const totalIn = initialQty + logsIn;
    const totalOut = logsOut;
    const totalSpoiled = logsSpoiled;
    const balance = totalIn - totalOut - totalSpoiled;

    return { totalIn, totalOut, totalSpoiled, balance };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  const { totalIn, totalOut, totalSpoiled, balance } = getStockStats();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Stock Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.productName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stock Stats */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">{totalIn.toFixed(1)}kg</div>
              <div className="text-xs text-gray-500">Total In</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{totalOut.toFixed(1)}kg</div>
              <div className="text-xs text-gray-500">Used</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">{totalSpoiled.toFixed(1)}kg</div>
              <div className="text-xs text-gray-500">Spoiled</div>
            </div>
            <div>
              <div className="text-lg font-bold text-indigo-600">{balance.toFixed(1)}kg</div>
              <div className="text-xs text-gray-500">Balance</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'in', label: 'Stock In' },
            { id: 'out', label: 'Stock Out' },
            { id: 'spoilage', label: 'Spoilage' },
            { id: 'logs', label: 'Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Stock In */}
          {activeTab === 'in' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity (kg) *</label>
                  <input
                    type="number"
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.00"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={stockInForm.date}
                    onChange={(e) => setStockInForm({ ...stockInForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <input
                  type="text"
                  value={stockInForm.source}
                  onChange={(e) => setStockInForm({ ...stockInForm, source: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Supplier, transfer, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea
                  value={stockInForm.remarks}
                  onChange={(e) => setStockInForm({ ...stockInForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
              <button
                onClick={handleStockIn}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg"
              >
                {isSubmitting ? 'Adding...' : 'Add Stock'}
              </button>
            </div>
          )}

          {/* Stock Out */}
          {activeTab === 'out' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity (kg) *</label>
                  <input
                    type="number"
                    value={stockOutForm.quantity}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.00"
                    step="0.1"
                    max={balance}
                  />
                  <div className="text-xs text-gray-500 mt-1">Available: {balance.toFixed(1)}kg</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={stockOutForm.date}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purpose</label>
                <select
                  value={stockOutForm.usagePurpose}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, usagePurpose: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="production">Production</option>
                  <option value="testing">Testing</option>
                  <option value="sampling">Sampling</option>
                  <option value="transfer">Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea
                  value={stockOutForm.remarks}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
              <button
                onClick={handleStockOut}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg"
              >
                {isSubmitting ? 'Removing...' : 'Remove Stock'}
              </button>
            </div>
          )}

          {/* Spoilage */}
          {activeTab === 'spoilage' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity (kg) *</label>
                  <input
                    type="number"
                    value={spoilageForm.quantity}
                    onChange={(e) => setSpoilageForm({ ...spoilageForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.00"
                    step="0.1"
                    max={balance}
                  />
                  <div className="text-xs text-gray-500 mt-1">Available: {balance.toFixed(1)}kg</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={spoilageForm.date}
                    onChange={(e) => setSpoilageForm({ ...spoilageForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select
                  value={spoilageForm.reason}
                  onChange={(e) => setSpoilageForm({ ...spoilageForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="damaged">Damaged</option>
                  <option value="expired">Expired</option>
                  <option value="contaminated">Contaminated</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea
                  value={spoilageForm.remarks}
                  onChange={(e) => setSpoilageForm({ ...spoilageForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
              <button
                onClick={handleSpoilage}
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg"
              >
                {isSubmitting ? 'Logging...' : 'Log Spoilage'}
              </button>
            </div>
          )}

          {/* Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading logs...</div>
              ) : stockLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No activity logs yet</div>
              ) : (
                stockLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border-l-4 ${log.type === 'in'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                        : log.type === 'out'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {log.type === 'in' ? 'Stock In' : log.type === 'out' ? 'Stock Out' : 'Spoilage'}: {log.quantity}kg
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(log.createdAt)}</div>
                        {log.remarks && <div className="text-xs text-gray-600 mt-1">{log.remarks}</div>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockManagementModal;
