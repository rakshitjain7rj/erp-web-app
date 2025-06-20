// components/FollowUpModal.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { X, Clock, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { DyeingRecord, DyeingFollowUp } from '../types/dyeing';
import { 
  getFollowUpsByRecordId, 
  createFollowUp, 
  deleteFollowUp 
} from '../api/dyeingApi';
import { useAuth } from '../context/AuthContext';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  dyeingRecord: DyeingRecord | null;
  onFollowUpAdded: () => void;
}

const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  dyeingRecord,
  onFollowUpAdded
}) => {
  const [followUps, setFollowUps] = useState<DyeingFollowUp[]>([]);
  const [newRemarks, setNewRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { user } = useAuth();

  const canManageFollowUps = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (isOpen && dyeingRecord) {
      fetchFollowUps();
    }
  }, [isOpen, dyeingRecord]);

  const fetchFollowUps = async () => {
    if (!dyeingRecord) return;
    
    setIsLoading(true);
    try {
      const data = await getFollowUpsByRecordId(dyeingRecord.id);
      setFollowUps(data);
    } catch (error) {
      console.error('Failed to fetch follow-ups:', error);
      toast.error('Failed to load follow-up history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dyeingRecord || !newRemarks.trim()) {
      toast.error('Please enter follow-up remarks');
      return;
    }

    setIsSubmitting(true);
    try {
      const newFollowUp = await createFollowUp(dyeingRecord.id, {
        remarks: newRemarks.trim()
      });
      
      setFollowUps(prev => [newFollowUp, ...prev]);
      setNewRemarks('');
      toast.success('Follow-up added successfully');
      onFollowUpAdded();
    } catch (error: any) {
      console.error('Failed to add follow-up:', error);
      toast.error(error.response?.data?.message || 'Failed to add follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFollowUp = async (followUpId: number) => {
    if (!dyeingRecord || !canManageFollowUps) return;

    setIsDeleting(followUpId);
    try {
      await deleteFollowUp(dyeingRecord.id, followUpId);
      setFollowUps(prev => prev.filter(f => f.id !== followUpId));
      toast.success('Follow-up deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete follow-up:', error);
      toast.error(error.response?.data?.message || 'Failed to delete follow-up');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClose = () => {
    setNewRemarks('');
    setFollowUps([]);
    onClose();
  };

  if (!isOpen || !dyeingRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Follow-ups for {dyeingRecord.yarnType}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sent on {format(new Date(dyeingRecord.sentDate), 'MMM dd, yyyy')}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Add New Follow-up Form */}
          {canManageFollowUps && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <form onSubmit={handleAddFollowUp} className="space-y-4">
                <div>
                  <label htmlFor="remarks" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add New Follow-up
                  </label>
                  <textarea
                    id="remarks"
                    value={newRemarks}
                    onChange={(e) => setNewRemarks(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    placeholder="Enter follow-up notes..."
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newRemarks.trim()}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Follow-up'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Follow-ups List */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="flex items-center mb-4 text-lg font-medium text-gray-900 dark:text-white">
              <MessageSquare size={20} className="mr-2" />
              Follow-up History ({followUps.length})
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading follow-ups...</span>
              </div>
            ) : followUps.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">No follow-ups recorded yet</p>
                {canManageFollowUps && (
                  <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                    Add the first follow-up using the form above
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {followUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className="p-4 border-l-4 border-blue-500 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock size={16} className="mr-1" />
                          {format(new Date(followUp.followUpDate), 'MMM dd, yyyy \'at\' HH:mm')}
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap dark:text-white">
                          {followUp.remarks}
                        </p>
                      </div>
                      {canManageFollowUps && (
                        <button
                          onClick={() => handleDeleteFollowUp(followUp.id)}
                          disabled={isDeleting === followUp.id}
                          className="ml-4 text-red-500 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete follow-up"
                        >
                          {isDeleting === followUp.id ? (
                            <div className="w-4 h-4 border-b-2 border-red-500 rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FollowUpModal;