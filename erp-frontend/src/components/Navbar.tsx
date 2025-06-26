import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { FaUserShield, FaSignOutAlt, FaCog } from "react-icons/fa";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, login } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !user.originalRole) {
      const updatedUser = { ...user, originalRole: user.role };
      login(updatedUser);
    }
  }, [user, login]);

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
    const links: { to: string; label: string; iconOnly?: boolean }[] = [];

    if (["admin", "manager", "storekeeper"].includes(role))
      links.push({ to: "/dashboard", label: "Dashboard" });
    if (["admin", "manager", "storekeeper"].includes(role))
      links.push({ to: "/inventory", label: "Inventory" });
    if (["admin", "manager", "storekeeper"].includes(role))
      links.push({ to: "/bom", label: "BOM" });
    if (["admin", "manager", "storekeeper"].includes(role))
      links.push({ to: "/workorders", label: "Work Orders" });
    if (role === "admin") links.push({ to: "/costing", label: "Costing" });
    if (["admin", "manager"].includes(role))
      links.push({ to: "/reports", label: "Reports" });    if (["admin", "manager"].includes(role))
      links.push({ to: "/dyeing-orders", label: "Dyeing Orders" });
    if (["admin", "manager"].includes(role))
      links.push({ to: "/dyeing-summary", label: "Dyeing Summary" });
    if (["admin", "manager"].includes(role))
      links.push({ to: "/party-master", label: "Party Master" });
    if (["admin", "manager", "operator"].includes(role))
      links.push({ to: "/production-jobs", label: "Production Jobs" });
    if (role === "admin") {
      links.push({ to: "/users", label: "Users" });
      links.push({ to: "/settings", label: "", iconOnly: true }); // Show as icon
    }

    return (
      <div className="flex flex-wrap gap-5 items-center">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center text-sm font-medium tracking-wide transition-all ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-4"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
              title={link.label || "Settings"}
            >
              {link.iconOnly ? <FaCog className="text-lg" /> : link.label}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <nav className="bg-white dark:bg-gray-900 px-6 py-3 shadow flex justify-between items-center transition-colors">
      {/* Left Section */}
      <div className="flex items-center gap-10">
        <h1 className="text-2xl font-bold text-blue-700 dark:text-white whitespace-nowrap">
          ERP System
        </h1>
        <div className="hidden md:flex">{renderNavLinks()}</div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="text-xl text-yellow-600 dark:text-yellow-300"
          title="Toggle Theme"
        >
          {isDark ? "🌙" : "☀️"}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600 text-white hover:opacity-90 whitespace-nowrap"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="font-bold uppercase">{getInitials()}</span>
            <span className="ml-1 capitalize text-sm font-medium">
              {user?.name}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg w-52 z-50 text-sm overflow-hidden">
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
