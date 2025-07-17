import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'success' | 'warning' | 'danger';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'success'
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    success: {
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
    },
    warning: {
      icon: <CheckCircle className="w-6 h-6 text-yellow-600" />,
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      gradient: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20'
    },
    danger: {
      icon: <X className="w-6 h-6 text-red-600" />,
      confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      gradient: 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20'
    }
  };

  const currentVariant = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
        <div className={`bg-gradient-to-r ${currentVariant.gradient} px-6 py-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {currentVariant.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {message}
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentVariant.confirmButton}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
