import { useState, useEffect, useMemo } from "react";
import { Menu } from "@headlessui/react";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Role = "Admin" | "Manager" | "Operator";

const defaultUser = {
  name: "Manan Chawla",
  email: "manan@example.com",
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Manan",
};

const UserProfile = () => {
  const { logout, user: authUser } = useAuth();
  const [role, setRole] = useState<Role>(
    (localStorage.getItem("userRole") as Role) || "Admin"
  );

  const roles = useMemo<Role[]>(() => ["Admin", "Manager", "Operator"], []);

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") as Role;
    if (savedRole && savedRole !== role) {
      setRole(savedRole);
    }
  }, []);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem("userRole", newRole);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex items-center space-x-3">
      <img
        src={defaultUser.avatarUrl}
        alt="User Avatar"
        className="w-10 h-10 rounded-full border"
      />
      <Menu as="div" className="relative" role="menu" aria-label="User menu">
        <Menu.Button className="flex items-center gap-1 text-sm font-medium text-white focus:outline-none focus:ring focus:ring-blue-500">
          {defaultUser.name} <ChevronDown size={16} />
        </Menu.Button>
        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-20">
          <div className="px-3 py-1 text-xs text-gray-500">Switch Role</div>
          {roles.map((r) => (
            <Menu.Item key={r}>
              {({ active }) => (
                <button
                  onClick={() => handleRoleChange(r)}
                  className={`w-full px-4 py-2 text-sm text-left ${
                    active ? "bg-blue-100" : ""
                  } ${role === r ? "font-semibold text-blue-600" : ""}`}
                >
                  <ShieldCheck className="inline mr-2" size={14} />
                  {r}
                </button>
              )}
            </Menu.Item>
          ))}
          <hr className="my-1" />
          <Menu.Item>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
            >
              <LogOut className="inline mr-2" size={14} />
              Logout
            </button>
          </Menu.Item>
        </Menu.Items>
      </Menu>
    </div>
  );
};

export default UserProfile;
