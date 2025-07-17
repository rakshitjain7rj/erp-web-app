// ActionDropdown.tsx
import React from "react";
import {
  FaEdit,
  FaTrash,
  FaBell,
  FaCheckCircle,
  FaRecycle,
} from "react-icons/fa";

interface Props {
  onEdit: () => void;
  onDelete: () => void;
  onFollowUp: () => void;
  onMarkArrived: () => void;
  onReprocessing: () => void;
}

const ActionDropdown: React.FC<Props> = ({
  onEdit,
  onDelete,
  onFollowUp,
  onMarkArrived,
  onReprocessing,
}) => {
  return (
    <div className="w-48 rounded-md bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-10 border border-gray-200 dark:border-gray-600 overflow-hidden">
      <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
        <li
          onClick={onEdit}
          className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
        >
          <FaEdit className="mr-3 text-blue-500" /> Edit
        </li>
        <li
          onClick={onDelete}
          className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
        >
          <FaTrash className="mr-3 text-red-500" /> Delete
        </li>
        <li
          onClick={onFollowUp}
          className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
        >
          <FaBell className="mr-3 text-yellow-500" /> Follow Up
        </li>
        <li
          onClick={onMarkArrived}
          className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
        >
          <FaCheckCircle className="mr-3 text-green-500" /> Mark Arrived
        </li>
        <li
          onClick={onReprocessing}
          className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
        >
          <FaRecycle className="mr-3 text-purple-500" /> Reprocessing
        </li>
      </ul>
    </div>
  );
};

export default ActionDropdown;
