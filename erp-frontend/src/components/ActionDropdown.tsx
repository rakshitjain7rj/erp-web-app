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
    <div className="w-48 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-10">
      <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
        <li
          onClick={onEdit}
          className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        >
          <FaEdit className="mr-2" /> Edit
        </li>
        <li
          onClick={onDelete}
          className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        >
          <FaTrash className="mr-2" /> Delete
        </li>
        <li
          onClick={onFollowUp}
          className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        >
          <FaBell className="mr-2" /> Follow Up
        </li>
        <li
          onClick={onMarkArrived}
          className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        >
          <FaCheckCircle className="mr-2" /> Mark Arrived
        </li>
        <li
          onClick={onReprocessing}
          className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        >
          <FaRecycle className="mr-2" /> Reprocessing
        </li>
      </ul>
    </div>
  );
};

export default ActionDropdown;
