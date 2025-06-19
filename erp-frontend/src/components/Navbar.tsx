import { useState, useCallback, useEffect, memo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";
import UserProfile from "../components/UserProfile";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Inventory", to: "/inventory" },
  { label: "BOM", to: "/bom" },
  { label: "Work Orders", to: "/workorders" },
  { label: "Costing", to: "/costing" },
  { label: "Reports", to: "/reports" },
];

const NavLinkList = memo(({ currentPath, onClick }: { currentPath: string; onClick?: () => void }) => (
  <>
    {navLinks.map((link) => {
      const isActive = currentPath.startsWith(link.to);
      return (
        <Link
          key={link.to}
          to={link.to}
          onClick={onClick}
          className={`transition block md:inline px-4 py-2 rounded focus:outline-none focus:ring-2 ${
            isActive
              ? "bg-blue-700 text-white font-semibold"
              : "hover:text-blue-400 text-gray-200"
          }`}
        >
          {link.label}
        </Link>
      );
    })}
  </>
));

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">(
    localStorage.getItem("theme") === "dark" || window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  );

  const handleLogout = useCallback(() => {
    logout();
    toast.success("👋 Logged out");
    navigate("/login");
  }, [logout, navigate]);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    if (menuOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowNavbar(currentScrollY < lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <motion.nav
      className="bg-gray-800 text-white px-6 py-4 shadow-md sticky top-0 z-50"
      role="navigation"
      aria-label="Main Navigation"
      initial={{ y: 0 }}
      animate={{ y: showNavbar ? 0 : -80 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold tracking-tight text-blue-300">
          ERP System
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center" role="menubar">
          <NavLinkList currentPath={location.pathname} />

          <button
            onClick={toggleTheme}
            className="text-white hover:text-yellow-400 transition focus:outline-none focus:ring-2 focus:ring-yellow-500"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
          </button>

          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 font-medium transition focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Logout
          </button>

          <UserProfile />
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="md:hidden mt-4 space-y-2"
            role="menu"
            aria-label="Mobile Menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <NavLinkList currentPath={location.pathname} onClick={closeMenu} />

            <div className="px-4 flex items-center justify-between">
              <button
                onClick={toggleTheme}
                className="text-white hover:text-yellow-400 transition focus:outline-none focus:ring-2 focus:ring-yellow-500"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
              </button>
              <UserProfile />
            </div>

            <button
              onClick={() => {
                closeMenu();
                handleLogout();
              }}
              className="block w-full text-left py-2 px-4 text-red-400 hover:bg-red-900 hover:text-white transition rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
