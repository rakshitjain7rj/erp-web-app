import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-semibold">ERP System</div>
      <div className="space-x-4">
        <Link to="/inventory" className="hover:text-gray-300">
          Inventory
        </Link>
        <Link to="/bom" className="hover:text-gray-300">
          BOM
        </Link>
        <Link to="/workorders" className="hover:text-gray-300">
          Work Orders
        </Link>
        <Link to="/costing" className="hover:text-gray-300">
          Costing
        </Link>
        <Link to="/dashboard" className="hover:text-gray-300">
        Dashboard
        </Link>
        <Link to="/reports" className="hover:text-gray-300">
        Reports
        </Link>

        <button onClick={handleLogout} className="ml-4 text-red-400 hover:text-red-300">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
