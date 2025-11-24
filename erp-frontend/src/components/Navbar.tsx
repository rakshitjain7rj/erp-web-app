import React from "react";
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Boxes,
  ClipboardList,
  Users,
  Factory,
  Warehouse,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, login } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

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
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
      if (!event.matches) {
        setSidebarOpen(false);
        setIsCollapsed(false);
      }
    };

    setIsDesktop(mediaQuery.matches);
    if (!mediaQuery.matches) {
      setSidebarOpen(false);
      setIsCollapsed(false);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const width = isDesktop ? (isCollapsed ? "80px" : "272px") : "0px";
    document.documentElement.style.setProperty("--app-sidebar-width", width);
  }, [isCollapsed, isDesktop]);

  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty("--app-sidebar-width");
    };
  }, []);

  const getInitials = () => {
    const nameParts = user?.name?.split(" ") || ["U"];
    return (nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || "");
  };

  const handleLogout = () => {
    const ok = window.confirm("Are you sure you want to logout?");
    if (!ok) return;
    logout();
    setSidebarOpen(false);
    navigate("/login", { replace: true });
  };

  const navLinks = useMemo(() => {
    if (!user) return [];
    const role = user.role;
    const links: { to: string; label: string; icon: LucideIcon }[] = [];

    if (["superadmin", "admin", "manager"].includes(role))
      links.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
    if (["superadmin", "admin", "manager"].includes(role))
      links.push({ to: "/inventory", label: "Inventory", icon: Boxes });
    if (["superadmin", "admin"].includes(role))
      links.push({ to: "/count-product-overview", label: "Count/Product Overview", icon: ClipboardList });
    if (["superadmin", "admin"].includes(role))
      links.push({ to: "/dyeing-orders", label: "Dyeing Orders", icon: ClipboardList });
    if (["superadmin", "admin"].includes(role))
      links.push({ to: "/party-master", label: "Party Master", icon: Users });
    if (["superadmin", "admin", "manager"].includes(role))
      links.push({ to: "/production/asu-unit-1", label: "ASU Unit 1", icon: Factory });
    if (["superadmin", "admin", "manager"].includes(role))
      links.push({ to: "/production/asu-unit-2", label: "ASU Unit 2", icon: Factory });
    if (["superadmin", "admin"].includes(role))
      links.push({ to: "/users", label: "Users", icon: Users });

    return links;
  }, [user]);

  const renderNavLinks = (options?: { compact?: boolean; onNavigate?: () => void }) => {
    const compact = options?.compact ?? false;
    const onNavigate = options?.onNavigate;

    if (navLinks.length === 0) {
      return null;
    }

    return (
      <ul className="mt-4 flex flex-col gap-2">
        {navLinks.map((link) => {
          const currentPath = `${location.pathname}${location.search}`;
          const isActive = link.to.includes("?")
            ? currentPath === link.to
            : location.pathname.startsWith(link.to);
          const Icon = link.icon;
          return (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={() => {
                  onNavigate?.();
                  setSidebarOpen(false);
                }}
                title={compact ? link.label : undefined}
                className={`flex items-center ${compact ? "justify-center" : "gap-3"} px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-100 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="h-5 w-5" />
                {!compact && <span>{link.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {user && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={`fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-md transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white lg:hidden ${
            sidebarOpen ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          aria-label="Open navigation"
          aria-expanded={sidebarOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Desktop Sidebar */}
      {user && (
        <aside
          className={`hidden lg:flex fixed top-0 left-0 h-screen flex-col border-r border-gray-200 bg-white pt-6 transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 ${
            isCollapsed ? "w-20" : "w-72"
          }`}
          style={{ zIndex: 40 }}
          aria-label="Primary navigation"
        >
          <div className="flex items-center justify-between gap-2 px-4 pb-4">
            {!isCollapsed ? (
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/40 dark:text-blue-300">
                  <Warehouse className="h-5 w-5" />
                </div>
                <span className="font-semibold text-blue-700 dark:text-blue-300">ASU ERP</span>
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/40 dark:text-blue-300">
                <Warehouse className="h-5 w-5" />
              </div>
            )}
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 shadow-sm transition hover:bg-blue-100 hover:text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 pb-6">
            {renderNavLinks({ compact: isCollapsed })}
          </nav>
          <div
            className={`border-t border-gray-200 px-4 py-4 dark:border-gray-800 ${
              isCollapsed ? "flex flex-col items-center gap-3" : "flex flex-col gap-3"
            }`}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDark}
            >
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {user && (
              <div
                className={`flex items-center ${
                  isCollapsed ? "justify-center" : "gap-3"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold uppercase text-white">
                  {getInitials()}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user.name || "User"}</p>
                    {user.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    )}
                    <span className="mt-1 inline-block rounded bg-purple-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      {user.role}
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/40 ${
                isCollapsed ? "w-10 p-0" : ""
              }`}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Sidebar Overlay with Animation */}
      <div className={`fixed inset-0 z-40 ${sidebarOpen ? "block" : "hidden"}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <div
          className={`absolute top-0 left-0 flex h-full w-72 flex-col bg-white shadow-lg transition-transform duration-300 dark:bg-gray-900 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ zIndex: 50 }}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h1 className="text-xl font-bold text-blue-700 dark:text-white">ASU ERP</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-600 dark:text-gray-300"
              title="Close Sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-6">
            {renderNavLinks({ onNavigate: () => setSidebarOpen(false) })}
          </div>
          <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-800">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold uppercase text-white">
                {getInitials()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.name || "User"}</p>
                {user?.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                )}
                {user?.role && (
                  <span className="mt-1 inline-block rounded bg-purple-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-pressed={isDark}
              >
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button
                onClick={handleLogout}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
