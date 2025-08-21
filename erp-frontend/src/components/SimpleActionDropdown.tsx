import React, { useState, useRef, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaBell,
  FaCheckCircle,
  FaRecycle,
  FaCalculator,
} from "react-icons/fa";
import { MoreVertical } from "lucide-react";

interface SimpleActionDropdownProps {
  onEdit: () => void;
  onDelete: () => void;
  onFollowUp: () => void;
  onMarkArrived?: () => void;
  onReprocessing?: () => void;
  onUpdateQuantities?: () => void;
}

const SimpleActionDropdown: React.FC<SimpleActionDropdownProps> = ({
  onEdit,
  onDelete,
  onFollowUp,
  onMarkArrived,
  onReprocessing,
  onUpdateQuantities,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleActionClick = (action: () => void, event: React.MouseEvent) => {
    console.log('🎯 SimpleActionDropdown: Action clicked');
    event.stopPropagation();
    event.preventDefault();
    
    try {
      console.log('⚡ Executing action...');
      action();
      console.log('✅ Action executed successfully');
      setIsOpen(false);
    } catch (error) {
      console.error('❌ Error executing action:', error);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          console.log('🎯 Dropdown trigger clicked, current isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="More actions"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          style={{ zIndex: 9999 }}
        >
          <div className="py-2">
            {/* Edit Button */}
            <button
              onClick={(e) => {
                console.log('✏️ EDIT BUTTON CLICKED');
                handleActionClick(onEdit, e);
              }}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
              role="menuitem"
            >
              <FaEdit className="mr-3 text-blue-500 w-4 h-4" />
              Edit
            </button>

            {/* Update Quantities Button */}
            {onUpdateQuantities && (
              <button
                onClick={(e) => {
                  console.log(' UPDATE QUANTITIES BUTTON CLICKED');
                  handleActionClick(onUpdateQuantities, e);
                }}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                role="menuitem"
              >
                <FaCalculator className="mr-3 text-orange-500 w-4 h-4" />
                Update Quantities
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={(e) => {
                console.log('️ DELETE BUTTON CLICKED');
                handleActionClick(onDelete, e);
              }}
              className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
              role="menuitem"
            >
              <FaTrash className="mr-3 text-red-500 w-4 h-4" />
              Delete
            </button>

            {/* Follow Up Button */}
            <button
              onClick={(e) => {
                console.log(' FOLLOW UP BUTTON CLICKED');
                handleActionClick(onFollowUp, e);
              }}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
              role="menuitem"
            >
              <FaBell className="mr-3 text-yellow-500 w-4 h-4" />
              Follow Up
            </button>

            {/* Mark Arrived Button */}
            {onMarkArrived && (
              <button
                onClick={(e) => handleActionClick(onMarkArrived, e)}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                role="menuitem"
              >
                <FaCheckCircle className="mr-3 text-green-500 w-4 h-4" />
                Mark Arrived
              </button>
            )}

            {/* Reprocessing Button */}
            {onReprocessing && (
              <button
                onClick={(e) => handleActionClick(onReprocessing, e)}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                role="menuitem"
              >
                <FaRecycle className="mr-3 text-purple-500 w-4 h-4" />
                Reprocessing
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleActionDropdown;
