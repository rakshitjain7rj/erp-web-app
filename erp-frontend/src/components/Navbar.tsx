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
  FaUsers,
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
    // Role switching removed in new RBAC model (superadmin/admin/manager)
    return [];
  };

  const handleRoleChange = (_selectedRole: string) => {
    // Disabled
    return;
  };

  const getInitials = () => {
    const nameParts = user?.name?.split(" ") || ["U"];
    return (nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || "");
  };

  const renderNavLinks = () => {
    if (!user) return null;
    const { role } = user;
  const links: { to: string; label: string; icon: React.ReactNode }[] = [];

  if (["superadmin", "admin", "manager"].includes(role)) links.push({ to: "/dashboard", label: "Dashboard", icon: <FaChartBar /> });
  if (["superadmin", "admin", "manager"].includes(role)) links.push({ to: "/inventory", label: "Inventory", icon: <FaWarehouse /> });
  if (["superadmin", "admin", "manager"].includes(role)) links.push({ to: "/count-product-overview", label: "Count/Product Overview", icon: <FaClipboardList /> });
  if (["superadmin", "admin"].includes(role)) links.push({ to: "/dyeing-orders", label: "Dyeing Orders", icon: <FaClipboardList /> });
  if (["superadmin", "admin"].includes(role)) links.push({ to: "/party-master", label: "Party Master", icon: <FaUsers /> });
  if (["superadmin", "admin", "manager"].includes(role)) links.push({ to: "/production/asu-unit-1", label: "ASU Unit 1", icon: <FaIndustry /> });
  if (["superadmin", "admin", "manager"].includes(role)) links.push({ to: "/production/asu-unit-2", label: "ASU Unit 2", icon: <FaIndustry /> });
  if (["superadmin", "admin"].includes(role)) links.push({ to: "/users", label: "Users", icon: <FaUsers /> });

    return (
      <ul className="mt-6 flex flex-col gap-3">
        {links.map((link) => {
          const currentPath = `${location.pathname}${location.search}`;
          const isActive = link.to.includes("?")
            ? currentPath === link.to
            : location.pathname.startsWith(link.to);
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
                {/* User Info Section */}
                {user && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {user.name || 'User'}
                    </p>
                    {user.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{user.email}</p>
                    )}
                    <span className="inline-block mt-1 text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 font-medium">
                      {user.role}
                    </span>
                  </div>
                )}
                {getRoleOptions().length > 0 && (
                  <>
                    <p className="px-4 py-2 text-gray-500 dark:text-gray-300 font-medium">Switch Role</p>
                    {getRoleOptions().map((r: string) => (
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
