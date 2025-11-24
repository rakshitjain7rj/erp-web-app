import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Shield, Ban, Check, Trash2, Search } from 'lucide-react';
import { getAllUsers as apiGetAllUsers, updateUser as apiUpdateUser, deleteUser as apiDeleteUser, approveUser as apiApproveUser } from '../api/userApi';
import toast from 'react-hot-toast';

// Types
export type Role = 'superadmin' | 'admin' | 'manager';
export type Status = 'active' | 'inactive' | 'pending';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: Status | 'active' | 'inactive';
  createdAt: string;
}

const roleColors: Record<Role, string> = {
  superadmin: 'bg-red-500 text-white',
  admin: 'bg-blue-500 text-white',
  manager: 'bg-green-500 text-white',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500 text-white',
  inactive: 'bg-gray-400 text-white',
  pending: 'bg-amber-500 text-white'
};

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // RBAC redirect: managers cannot access
  useEffect(() => {
    if (user && user.role === 'manager') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [records, setRecords] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [loading, setLoading] = useState(false);

  const canEditDelete = useCallback((target: UserRecord) => {
    if (!user) return false;
    if ((target.role as string) === 'superadmin') return false;
    if (user.role === 'superadmin') return true;
    if (user.role === 'admin') {
      return (target.role as string) !== 'superadmin';
    }
    return false;
  }, [user]);

  const canToggleStatus = useCallback((target: UserRecord) => {
    if (!user) return false;
    if ((target.role as string) === 'superadmin') return false;
    if (user.role === 'superadmin') return true;
    if (user.role === 'admin' && (target.role as string) !== 'superadmin') return true;
    return false;
  }, [user]);

  const canApprove = useCallback((target: UserRecord) => {
    if (!user) return false;
    if (target.status !== 'pending') return false;
    if ((target.role as string) === 'superadmin') return false;
    if (user.role === 'superadmin') return true;
    if (user.role === 'admin' && (target.role === 'manager' || target.role === 'admin')) return true;
    return false;
  }, [user]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await apiGetAllUsers();
      let list: any[] = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);

      const normalized: UserRecord[] = list.map((u: any) => ({
        id: (typeof u.id === 'number' ? u.id : (typeof u._id === 'string' ? u._id : Math.random())) as any,
        name: u.name || '(No Name)',
        email: u.email || '(No Email)',
        role: (u.role || 'manager') as Role,
        status: (u.status || 'active') as Status,
        createdAt: u.createdAt || new Date().toISOString()
      }));

      // Sort: pending first, then by creation date
      normalized.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setRecords(normalized);
    } catch (e: any) {
      console.error('[UsersPage] fetchUsers error', e);
      toast.error('Failed to load users');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Memoized filtered users for performance
  const filteredUsers = useMemo(() => {
    return records.filter((u) => {
      const searchMatch = search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const roleMatch = roleFilter === 'all' || u.role === roleFilter;
      const statusMatch = statusFilter === 'all' || u.status === statusFilter;
      return searchMatch && roleMatch && statusMatch;
    });
  }, [records, search, roleFilter, statusFilter]);

  const updateStatus = async (target: UserRecord, status: 'active' | 'inactive') => {
    try {
      await apiUpdateUser(String(target.id), { status });
      toast.success(`User ${status === 'active' ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (e) {
      console.error('Status update failed', e);
      toast.error('Failed to update status');
    }
  };

  const approveUser = async (target: UserRecord, approved: boolean) => {
    try {
      await apiApproveUser(String(target.id), approved);
      toast.success(approved ? 'User approved' : 'User rejected');
      fetchUsers();
    } catch (e) {
      console.error('Approval failed', e);
      toast.error('Failed to process approval');
    }
  };

  const deleteUser = async (target: UserRecord) => {
    if (!window.confirm(`Delete user "${target.name}"?`)) return;
    try {
      await apiDeleteUser(String(target.id));
      toast.success('User deleted');
      fetchUsers();
    } catch (e) {
      console.error('Delete failed', e);
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
        <UsersIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
        </div>

      {/* Filters - Simple and Clean */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Results count */}
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredUsers.length} of {records.length} users
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No users found
                    </td>
                  </tr>
                )}

                {!loading && filteredUsers.map(r => {
                  const canAct = canEditDelete(r) || canApprove(r) || canToggleStatus(r);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {r.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {r.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[r.role]}`}>
                          <Shield className="h-3 w-3" />
                          {r.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[r.status] || 'bg-gray-400 text-white'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canAct ? (
                          <div className="flex justify-end gap-1.5">
                            {/* Approve/Reject for pending users */}
                            {canApprove(r) && (
                              <>
                                <button
                                  onClick={() => approveUser(r, true)}
                                  className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                                  title="Approve User"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => approveUser(r, false)}
                                  className="p-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
                                  title="Reject User"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {/* Toggle Status */}
                            {canToggleStatus(r) && r.status !== 'pending' && (
                              <button
                                onClick={() => updateStatus(r, r.status === 'active' ? 'inactive' : 'active')}
                                className={`p-1.5 rounded-md text-white transition-colors shadow-sm ${r.status === 'active'
                                    ? 'bg-orange-600 hover:bg-orange-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                  }`}
                                title={r.status === 'active' ? 'Deactivate' : 'Activate'}
                              >
                                {r.status === 'active' ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                              </button>
                            )}

                            {/* Delete */}
                            {canEditDelete(r) && (
                              <button
                                onClick={() => deleteUser(r)}
                                className="p-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
