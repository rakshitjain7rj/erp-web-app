// src/components/Sidebar.tsx
import React from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-600">
        <h2 className="text-xl font-bold text-blue-600">ERP Menu</h2>
        <button onClick={onClose}>
          <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
      <nav className="p-4 flex flex-col gap-4">
        <Link to="/dashboard" onClick={onClose}>Dashboard</Link>
        <Link to="/inventory" onClick={onClose}>Inventory</Link>
        <Link to="/bom" onClick={onClose}>BOM</Link>
        <Link to="/work-orders" onClick={onClose}>Work Orders</Link>
        <Link to="/costing" onClick={onClose}>Costing</Link>
        <Link to="/reports" onClick={onClose}>Reports</Link>
        <Link to="/dyeing-orders" onClick={onClose}>Dyeing Orders</Link>
        <Link to="/dyeing-summary" onClick={onClose}>Dyeing Summary</Link>
        <Link to="/party-master" onClick={onClose}>Party Master</Link>
        <Link to="/users" onClick={onClose}>Users</Link>
      </nav>
    </div>
  );
};

export default Sidebar;
