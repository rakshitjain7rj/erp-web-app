import React from 'react';
import { AlertTriangle, X, Trash2, Archive } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName: string;
  hasRelatedItems?: boolean;
  relatedItemsCount?: number;
  relatedItemsType?: string;
  onClose: () => void;
  onConfirm: () => void;
  onArchiveInstead?: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  itemName,
  hasRelatedItems = false,
  relatedItemsCount = 0,
  relatedItemsType = 'items',
  onClose,
  onConfirm,
  onArchiveInstead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{message}</p>
          
          {hasRelatedItems && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                Cannot delete {itemName}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                This {itemName} has {relatedItemsCount} {relatedItemsType} associated with it.
                Deleting it would orphan related data.
              </p>
              {onArchiveInstead && (
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Consider archiving instead of deleting to maintain data integrity.
                </p>
              )}
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors flex-1"
            >
              Cancel
            </button>
            
            {onArchiveInstead && hasRelatedItems && (
              <button
                onClick={onArchiveInstead}
                className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-md transition-colors flex-1 flex items-center justify-center"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive Instead
              </button>
            )}
            
            <button
              onClick={onConfirm}
              disabled={hasRelatedItems}
              className={`px-4 py-2 rounded-md transition-colors flex-1 flex items-center justify-center
                ${hasRelatedItems ? 
                  'bg-gray-300 text-gray-500 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed' : 
                  'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;
