import React from "react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  FaUserShield,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChartBar,
  FaWarehouse,
  FaClipboardList,
  FaCogs,
  FaFileInvoice,
  FaUsers,
  FaTools,
  FaIndustry,
} from "react-icons/fa";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, login } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (user && !user.originalRole) {
      const updatedUser = { ...user, originalRole: user.role };
      login(updatedUser);
    }
  }, [user, login]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleOptions = () => {
    const originalRole = user?.originalRole || user?.role;
    if (originalRole === "admin") return ["admin", "manager", "storekeeper", "operator"];
    if (originalRole === "manager") return ["manager", "storekeeper", "operator"];
    if (originalRole === "operator") return ["operator"];
    return [];
  };

  const handleRoleChange = (selectedRole: string) => {
    if (user) {
      const updatedUser = { ...user, role: selectedRole };
      login(updatedUser);
      setMenuOpen(false);
      navigate("/dashboard");
    }
  };

  const getInitials = () => {
    const nameParts = user?.name?.split(" ") || ["U"];
    return (nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || "");
  };

  const renderNavLinks = () => {
    if (!user) return null;
    const { role } = user;
    const links: { to: string; label: string; icon: React.ReactNode }[] = [];

    if (["admin", "manager", "storekeeper"].includes(role)) links.push({ to: "/dashboard", label: "Dashboard", icon: <FaChartBar /> });
    if (["admin", "manager", "storekeeper"].includes(role)) links.push({ to: "/inventory", label: "Inventory", icon: <FaWarehouse /> });
    if (["admin", "manager", "storekeeper"].includes(role)) links.push({ to: "/count-product-overview", label: "Count/Product Overview", icon: <FaClipboardList /> });
    if (["admin", "manager", "storekeeper"].includes(role)) links.push({ to: "/bom", label: "BOM", icon: <FaClipboardList /> });
    if (["admin", "manager", "storekeeper"].includes(role)) links.push({ to: "/workorders", label: "Work Orders", icon: <FaTools /> });
    if (role === "admin") links.push({ to: "/costing", label: "Costing", icon: <FaFileInvoice /> });
    if (["admin", "manager"].includes(role)) links.push({ to: "/reports", label: "Reports", icon: <FaChartBar /> });
    if (["admin", "manager"].includes(role)) links.push({ to: "/dyeing-orders", label: "Dyeing Orders", icon: <FaClipboardList /> });
    if (["admin", "manager"].includes(role)) links.push({ to: "/dyeing-summary", label: "Dyeing Summary", icon: <FaClipboardList /> });
    if (["admin", "manager"].includes(role)) links.push({ to: "/party-master", label: "Party Master", icon: <FaUsers /> });
    
    // Production Module
    if (["admin", "manager", "operator"].includes(role)) links.push({ to: "/production/asu-unit-1", label: "ASU Unit 1", icon: <FaIndustry /> });
    if (["admin", "manager", "operator"].includes(role)) links.push({ to: "/production/asu-unit-2", label: "ASU Unit 2", icon: <FaIndustry /> });
    // ASU Machines link removed - functionality now integrated into ASU Unit 1 page
    
    if (role === "admin") {
      links.push({ to: "/users", label: "Users", icon: <FaUsers /> });
      links.push({ to: "/settings", label: "Settings", icon: <FaCogs /> });
    }

    return (
      <ul className="mt-6 flex flex-col gap-3">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.to);
          return (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-100 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {link.icon} {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 shadow-md fixed top-0 left-0 w-full z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700 dark:text-gray-200 text-xl"
            title="Open Menu"
          >
            <FaBars />
          </button>
          <h1 className="text-xl font-bold text-blue-700 dark:text-white">ERP System</h1>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} title="Toggle Theme" className="text-xl">
            {isDark ? "🌙" : "☀️"}
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded-full"
            >
              <span className="font-bold uppercase">{getInitials()}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg w-56 z-50 text-sm overflow-hidden">
                {getRoleOptions().length > 0 && (
                  <>
                    <p className="px-4 py-2 text-gray-500 dark:text-gray-300 font-medium">Switch Role</p>
                    {getRoleOptions().map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={`w-full text-left px-4 py-2 flex items-center gap-2 transition ${
                          user?.role === r
                            ? "text-blue-600 dark:text-blue-400 font-semibold bg-gray-100 dark:bg-gray-700"
                            : "text-gray-800 dark:text-gray-200"
                        } hover:bg-gray-100 dark:hover:bg-gray-700`}
                      >
                        <FaUserShield /> {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                    <hr className="border-t border-gray-200 dark:border-gray-600" />
                  </>
                )}
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 flex items-center gap-2"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Overlay with Animation */}
      <div className={`fixed inset-0 z-40 ${sidebarOpen ? "block" : "hidden"}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <div
          className={`absolute top-0 left-0 w-72 h-full bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-blue-700 dark:text-white">ERP System</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-600 dark:text-gray-300"
              title="Close Sidebar"
            >
              <FaTimes />
            </button>
          </div>
          {renderNavLinks()}
        </div>
      </div>
    </>
  );
};

export default Navbar;
