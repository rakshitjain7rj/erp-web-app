// DEPRECATED: This legacy Users component is superseded by UsersPage.tsx.
// It uses _id (Mongo-style) while backend now uses numeric id. Kept temporarily for reference.
// Prefer editing UsersPage.tsx and centralized api methods in userApi.ts.
import { useEffect, useState } from "react";
import {
  getAllUsers,
  deleteUser,
  updateUser,
  resetPassword,
  // Removed updateUserStatus and updateUserRole since we use updateUser directly
} from "../api/userApi";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Download, Plus, Trash2, RefreshCw, ShieldCheck } from "lucide-react";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleStatusToggle = async (id: string, current: string) => {
    try {
      await updateUser(id, { status: current === "active" ? "inactive" : "active" });
      toast.success("Status updated");
      fetchUsers();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleRoleChange = async (id: string, current: string) => {
    const newRole = current === "admin" ? "user" : "admin";
    try {
      await updateUser(id, { role: newRole });
      toast.success("Role updated");
      fetchUsers();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleReset = async (id: string) => {
    try {
      await resetPassword(id);
      toast.success("Password reset");
    } catch {
      toast.error("Failed to reset password");
    }
  };

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole ? u.role === filterRole : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4">👥 User Management</h2>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="px-3 py-2 border rounded-md w-64"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <button className="ml-auto bg-green-600 text-white px-3 py-2 rounded flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-200 text-gray-800">
            <tr>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Role</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Created</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u: any) => (
              <tr key={u._id} className="bg-white">
                <td className="p-3 border">{u.name}</td>
                <td className="p-3 border">{u.email}</td>
                <td className="p-3 border">{u.role}</td>
                <td className="p-3 border">{u.status}</td>
                <td className="p-3 border">{format(new Date(u.createdAt), "dd MMM yyyy")}</td>
                <td className="p-3 border space-x-2">
                  <button onClick={() => handleRoleChange(u._id, u.role)} title="Toggle Role" className="text-blue-600 hover:underline">
                    <ShieldCheck size={16} />
                  </button>
                  <button onClick={() => handleStatusToggle(u._id, u.status)} title="Toggle Status" className="text-yellow-600 hover:underline">
                    <RefreshCw size={16} />
                  </button>
                  <button onClick={() => handleReset(u._id)} title="Reset Password" className="text-purple-600 hover:underline">
                    <RefreshCw size={16} />
                  </button>
                  <button onClick={() => handleDelete(u._id)} title="Delete User" className="text-red-600 hover:underline">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
