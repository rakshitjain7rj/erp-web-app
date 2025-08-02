import React from "react";
import {
  FaEdit,
  FaTrash,
  FaBell,
  FaCheckCircle,
  FaRecycle,
  FaCalculator,
} from "react-icons/fa";
import { MoreVertical } from "lucide-react";
import useFloatingDropdown from "../hooks/useFloatingDropdown";

interface ActionDropdownProps {
  onEdit: () => void;
  onDelete: () => void;
  onFollowUp: () => void;
  onMarkArrived?: () => void;
  onReprocessing?: () => void;
  onUpdateQuantities?: () => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  onEdit,
  onDelete,
  onFollowUp,
  onMarkArrived,
  onReprocessing,
  onUpdateQuantities,
  trigger,
  isOpen: controlledOpen,
  onOpenChange,
}) => {
  const {
    isOpen,
    refs,
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
    FloatingPortal,
  } = useFloatingDropdown({
    placement: 'bottom-start',
    offset: 8,
    onOpenChange,
  });

  // Use controlled state if provided
  const dropdownOpen = controlledOpen !== undefined ? controlledOpen : isOpen;

  const handleActionClick = (action: () => void) => {
    console.log('🎯 FloatingActionDropdown: Action clicked', action.name || 'anonymous function');
    action();
    onOpenChange?.(false);
  };

  const defaultTrigger = (
    <button
      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      aria-label="More actions"
      aria-expanded={dropdownOpen}
      aria-haspopup="menu"
      {...getReferenceProps()}
    >
      <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    </button>
  );

  return (
    <>
      <div ref={refs.setReference} className="relative inline-block">
        {trigger ? (
          React.cloneElement(trigger as React.ReactElement, {
            ...getReferenceProps(),
            'aria-expanded': dropdownOpen.toString(),
            'aria-haspopup': 'menu',
          } as any)
        ) : (
          defaultTrigger
        )}
      </div>

      {dropdownOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles as React.CSSProperties}
            className="z-[1000] animate-in fade-in-0 zoom-in-95 duration-200"
            {...getFloatingProps()}
          >
            <div className="min-w-[192px] rounded-lg bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-600 overflow-hidden">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => handleActionClick(onEdit)}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                  role="menuitem"
                >
                  <FaEdit className="mr-3 text-blue-500 w-4 h-4" />
                  Edit
                </button>

                {onUpdateQuantities && (
                  <button
                    onClick={() => handleActionClick(onUpdateQuantities)}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                    role="menuitem"
                  >
                    <FaCalculator className="mr-3 text-orange-500 w-4 h-4" />
                    Update Quantities
                  </button>
                )}
                
                <button
                  onClick={() => {
                    console.log('🗑️ FloatingActionDropdown: Delete button clicked');
                    handleActionClick(onDelete);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                  role="menuitem"
                >
                  <FaTrash className="mr-3 text-red-500 w-4 h-4" />
                  Delete
                </button>
                
                <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                
                <button
                  onClick={() => handleActionClick(onFollowUp)}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                  role="menuitem"
                >
                  <FaBell className="mr-3 text-yellow-500 w-4 h-4" />
                  Follow Up
                </button>
                
                {onMarkArrived && (
                  <button
                    onClick={() => handleActionClick(onMarkArrived)}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                    role="menuitem"
                  >
                    <FaCheckCircle className="mr-3 text-green-500 w-4 h-4" />
                    Mark Arrived
                  </button>
                )}
                
                {onReprocessing && (
                  <button
                    onClick={() => handleActionClick(onReprocessing)}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                    role="menuitem"
                  >
                    <FaRecycle className="mr-3 text-purple-500 w-4 h-4" />
                    Reprocessing
                  </button>
                )}
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default ActionDropdown;
