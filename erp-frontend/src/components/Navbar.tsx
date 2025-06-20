import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // 🆕 useLocation added
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { FaUserShield, FaSignOutAlt } from "react-icons/fa";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 🆕 get current route
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, login } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !user.originalRole) {
      const updatedUser = { ...user, originalRole: user.role };
      login(updatedUser);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleOptions = () => {
    const originalRole = user?.originalRole || user?.role;
    if (originalRole === "admin") return ["admin", "manager", "storekeeper"];
    if (originalRole === "manager") return ["manager", "storekeeper"];
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
    const links: { to: string; label: string }[] = [];

    if (["admin", "manager", "storekeeper"].includes(role))
      links.push({ to: "/dashboard", label: "Dashboard" });
    if (["admin", "manager", "storekeeper"].includes(role))
      links.push({ to: "/inventory", label: "Inventory" });
    if (["admin", "manager", "storekeeper"].includes(role))
      links.push({ to: "/bom", label: "BOM" });
    if (["admin", "manager", "storekeeper"].includes(role))
      links.push({ to: "/workorders", label: "Work Orders" });
    if (role === "admin")
      links.push({ to: "/costing", label: "Costing" });
    if (["admin", "manager"].includes(role))
      links.push({ to: "/reports", label: "Reports" });
    if (["admin", "manager"].includes(role))
      links.push({ to: "/dyeing-orders", label: "Dyeing Orders" });
    if (["admin", "manager"].includes(role))
      links.push({ to: "/dyeing-summary", label: "Dyeing Summary" });
    if (role === "admin") {
      links.push({ to: "/users", label: "Users" });
      links.push({ to: "/settings", label: "Settings" });
    }

    return links.map((link) => {
      const isActive = location.pathname.startsWith(link.to); // 🆕 match route prefix
      return (
        <Link
          key={link.to}
          to={link.to}
          className={`text-sm font-medium px-2 transition-all ${
            isActive
              ? "text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-4"
              : "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          {link.label}
        </Link>
      );
    });
  };

  return (
    <nav className="bg-white dark:bg-gray-900 px-4 py-3 shadow flex justify-between items-center transition-colors">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold text-blue-700 dark:text-white">
          ERP System
        </h1>
        <div className="hidden md:flex gap-4">{renderNavLinks()}</div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={toggleTheme}
          className="text-xl text-yellow-600 dark:text-yellow-300"
          title="Toggle Theme"
        >
          {isDark ? "🌙" : "☀️"}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600 text-white hover:opacity-90"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="font-bold uppercase">{getInitials()}</span>
            <span className="ml-1 capitalize">{user?.name}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg w-48 z-50 text-sm overflow-hidden">
              {getRoleOptions().length > 0 && (
                <>
                  <p className="px-4 py-2 text-gray-500 dark:text-gray-300 font-medium">
                    Switch Role
                  </p>
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
    </nav>
  );
};

export default Navbar;
