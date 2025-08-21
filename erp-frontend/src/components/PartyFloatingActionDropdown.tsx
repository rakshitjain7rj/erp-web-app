import React from "react";
import {
  Eye,
  Edit3,
  Trash2,
  Download,
  Archive,
  MoreVertical
} from "lucide-react";
import useFloatingDropdown from "../hooks/useFloatingDropdown";

interface PartyActionDropdownProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onDownload: () => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PartyFloatingActionDropdown: React.FC<PartyActionDropdownProps> = ({
  onView,
  onEdit,
  onDelete,
  onArchive,
  onDownload,
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

  const handleActionClick = (action: () => void) => {
    // Invoke action first
    action();
    // Then close the dropdown (works for both controlled and uncontrolled)
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setIsOpen(false);
    }
  };

  const actions = [
    {
      label: "View Details",
      icon: <Eye size={16} />,
      onClick: onView,
      className: "hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    },
    {
      label: "Edit Party",
      icon: <Edit3 size={16} />,
      onClick: onEdit,
      className: "hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    },
    {
      label: "Download as JSON",
      icon: <Download size={16} />,
      onClick: onDownload,
      className: "hover:bg-green-50 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400",
    },
    {
      label: "Archive Party",
      icon: <Archive size={16} />,
      onClick: onArchive,
      className: "hover:bg-yellow-50 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    },
    {
      label: "Delete Party",
      icon: <Trash2 size={16} />,
      onClick: onDelete,
      className: "hover:bg-red-50 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400",
    },
  ];

  return (
    <div className="relative">
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
      >
        {trigger || <MoreVertical size={16} />}
      </button>

      <FloatingPortal>
        {dropdownOpen && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 min-w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <div className="py-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleActionClick(action.onClick)}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-150 ${action.className}`}
                >
                  <span className="flex-shrink-0">{action.icon}</span>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </FloatingPortal>
    </div>
  );
};

export default PartyFloatingActionDropdown;
