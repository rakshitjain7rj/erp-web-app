import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Moon, Sun, Package, LayoutDashboard, Boxes, ClipboardList } from "lucide-react";

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-800 text-white p-6 space-y-6">
        <div className="text-2xl font-bold tracking-tight">ERP System</div>
        <nav className="space-y-4">
          <NavLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavLink to="/products" icon={<Package size={20} />} label="Products" />
          <NavLink to="/inventory" icon={<Boxes size={20} />} label="Inventory" />
          {/** BOM/Work Orders/Costing removed */}
          {/** Reports removed */}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-4 bg-white shadow-sm border-b">
          <div className="font-semibold text-lg">Welcome back!</div>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-blue-600">
              <Sun size={20} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 text-white hover:bg-blue-700 px-3 py-2 rounded transition"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export default Layout;
