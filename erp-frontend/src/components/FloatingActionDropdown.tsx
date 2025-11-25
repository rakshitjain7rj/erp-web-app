import React from "react";
import {
  Edit,
  Trash2,
  Bell,
  CheckCircle,
  RefreshCw,
  Calculator,
  MoreVertical
} from "lucide-react";
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
  setIsOpen,
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

  const handleActionClick = (action: () => void, event?: React.MouseEvent) => {
    console.log('🎯 FloatingActionDropdown: Action clicked');
    console.log('🔍 Action function type:', typeof action);
    console.log('🔍 Action function:', action);
    
    // Prevent event propagation to avoid triggering auto-refresh
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    try {
      // Close immediately so the menu never lingers, then run the action
      setIsOpen(false);
      onOpenChange?.(false);

      console.log('⚡ Executing action...');
      action();
      console.log('✅ Action executed successfully');
      
    } catch (error) {
      console.error('❌ Error executing action:', error);
      // Ensure dropdown is closed even if action fails
      setIsOpen(false);
      onOpenChange?.(false);
    }
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
      <div ref={refs.setReference} className="relative inline-block FloatingActionDropdown">
        {trigger ? (
          React.cloneElement(trigger as React.ReactElement, {
            ...getReferenceProps(),
            'aria-expanded': dropdownOpen.toString(),
            'aria-haspopup': 'menu',
            'data-dropdown-trigger': 'true',
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
            className="z-[10000] animate-in fade-in-0 zoom-in-95 duration-200"
            data-floating-ui-portal="true"
            {...getFloatingProps()}
          >
            <div className="min-w-[192px] rounded-lg bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-600 overflow-hidden"
                 onClick={(e) => e.stopPropagation()} 
                 onMouseDown={(e) => e.stopPropagation()}>
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={(e) => {
                    console.log('🚨🖊️ EDIT BUTTON CLICKED IN DROPDOWN');
                    console.log('🔍 onEdit function:', onEdit);
                    console.log('🔍 onEdit type:', typeof onEdit);
                    handleActionClick(onEdit, e);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                  role="menuitem"
                >
                  <Edit className="mr-3 text-blue-500 w-4 h-4" />
                  Edit
                </button>

                {onUpdateQuantities && (
                  <button
                    onClick={(e) => {
                      console.log(' UPDATE QUANTITIES BUTTON CLICKED IN DROPDOWN');
                      console.log('🔍 onUpdateQuantities function:', onUpdateQuantities);
                      console.log('🔍 onUpdateQuantities type:', typeof onUpdateQuantities);
                      handleActionClick(onUpdateQuantities, e);
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                    role="menuitem"
                  >
                    <Calculator className="mr-3 text-orange-500 w-4 h-4" />
                    Update Quantities
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    console.log('🚨🗑️ DELETE BUTTON CLICKED IN DROPDOWN');
                    console.log('🔍 onDelete function:', onDelete);
                    console.log('🔍 onDelete type:', typeof onDelete);
                    handleActionClick(onDelete, e);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                  role="menuitem"
                >
                  <Trash2 className="mr-3 text-red-500 w-4 h-4" />
                  Delete
                </button>
                
                <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                
                <button
                  onClick={(e) => {
                    console.log('🚨📋 FOLLOW-UP BUTTON CLICKED IN DROPDOWN');
                    console.log('🔍 onFollowUp function:', onFollowUp);
                    console.log('🔍 onFollowUp type:', typeof onFollowUp);
                    handleActionClick(onFollowUp, e);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                  role="menuitem"
                >
                  <Bell className="mr-3 text-yellow-500 w-4 h-4" />
                  Follow Up
                </button>
                
                {onMarkArrived && (
                  <button
                    onClick={(e) => handleActionClick(onMarkArrived, e)}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                    role="menuitem"
                  >
                    <CheckCircle className="mr-3 text-green-500 w-4 h-4" />
                    Mark Arrived
                  </button>
                )}
                
                {onReprocessing && (
                  <button
                    onClick={(e) => handleActionClick(onReprocessing, e)}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                    role="menuitem"
                  >
                    <RefreshCw className="mr-3 text-purple-500 w-4 h-4" />
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
