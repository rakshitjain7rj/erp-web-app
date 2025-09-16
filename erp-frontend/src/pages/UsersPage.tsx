import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Shield, Ban, Check, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { getAllUsers as apiGetAllUsers, updateUser as apiUpdateUser, deleteUser as apiDeleteUser, approveUser as apiApproveUser } from '../api/userApi';

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

interface PaginatedResponse {
  data: UserRecord[];
  page: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 10;

const roleColors: Record<Role, string> = {
  superadmin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-300 dark:border-red-700',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300 dark:border-blue-700',
  manager: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-300 dark:border-green-700',
};

const statusColors: Record<string,string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  inactive: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
};

const UsersPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  // RBAC redirect: managers cannot access
  useEffect(() => {
    if (user && user.role === 'manager') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [records, setRecords] = useState<UserRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEditDelete = (target: UserRecord) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    if (user.role === 'admin') {
      return target.role !== 'superadmin';
    }
    return false;
  };

  const canToggleStatus = (target: UserRecord) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    if (user.role === 'admin' && target.role !== 'superadmin') return true;
    return false;
  };

  const canApprove = (target: UserRecord) => {
    if (!user) return false;
    if (target.status !== 'pending') return false;
    if (user.role === 'superadmin') return true;
    if (user.role === 'admin' && (target.role === 'manager' || target.role === 'admin')) return true;
    return false;
  };

  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const raw = await apiGetAllUsers();
      let list: any[] = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
      if (search || roleFilter !== 'all' || statusFilter !== 'all') {
        list = list.filter((u:any) => {
          if (search && !(u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))) return false;
            if (roleFilter !== 'all' && u.role !== roleFilter) return false;
            if (statusFilter !== 'all' && u.status !== statusFilter) return false;
            return true;
        });
      }
      const normalized: UserRecord[] = list.map((u:any) => ({
        id: (typeof u.id === 'number' ? u.id : (typeof u._id === 'string' ? u._id : Math.random())) as any,
        name: u.name || '(No Name)',
        email: u.email || '(No Email)',
        role: (u.role || 'manager') as Role,
        status: (u.status || 'active') as Status,
        createdAt: u.createdAt || new Date().toISOString()
      }));
      normalized.sort((a,b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setRecords(normalized);
      setTotal(normalized.length);
    } catch (e:any) {
      console.error('[UsersPage] fetchUsers error', e);
      setError(e.message || 'Error loading users');
      setRecords([]);
      setTotal(0);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, [page, roleFilter, statusFilter]);

  const pages = useMemo(() => Math.ceil(total / PAGE_SIZE) || 1, [total]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const updateStatus = async (target: UserRecord, status: 'active' | 'inactive') => {
    try {
      await apiUpdateUser(String(target.id), { status });
      fetchUsers();
    } catch (e) { console.error('Status update failed', e); }
  };

  const approveUser = async (target: UserRecord, approved: boolean) => {
    try {
      await apiApproveUser(String(target.id), approved);
      fetchUsers();
    } catch (e) { console.error('Approval failed', e); }
  };

  const deleteUser = async (target: UserRecord) => {
    if (!window.confirm('Delete user?')) return;
    try {
      await apiDeleteUser(String(target.id));
      fetchUsers();
    } catch (e) { console.error('Delete failed', e); }
  };

  return (
    <div className="p-6 mt-20 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <UsersIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Users</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or email" className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Role</label>
            <select value={roleFilter} onChange={e=>{setRoleFilter(e.target.value as any); setPage(1);}} className="py-2 px-3 rounded-md bg-gray-100 dark:bg-gray-800 text-sm">
              <option value="all">All</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value as any); setPage(1);}} className="py-2 px-3 rounded-md bg-gray-100 dark:bg-gray-800 text-sm">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <button type="submit" className="h-10 inline-flex items-center gap-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow">
            <Filter className="h-4 w-4" /> Apply
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
              )}
              {!loading && records.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No users found.</td></tr>
              )}
              {records.map(r => {
                const canAct = canEditDelete(r) || canApprove(r) || canToggleStatus(r);
                return (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-100">{r.name}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{r.email}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[r.role]}`}>
                        <Shield className="h-3 w-3" /> {r.role}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[r.status] || ''}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      {canAct ? (
                        <div className="flex justify-end gap-2">
                          {canApprove(r) && (
                            <>
                              <button onClick={()=>approveUser(r,true)} className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white" title="Approve"><Check className="h-4 w-4" /></button>
                              <button onClick={()=>approveUser(r,false)} className="p-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white" title="Reject"><Ban className="h-4 w-4" /></button>
                            </>
                          )}
                          {canToggleStatus(r) && (
                            <button onClick={()=>updateStatus(r, r.status === 'active' ? 'inactive' : 'active')} className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white" title="Toggle Status">
                              {r.status === 'active' ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </button>
                          )}
                          {canEditDelete(r) && (
                            <>
                              <button onClick={()=>alert('Edit user TBD')} className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white" title="Edit"><Edit2 className="h-4 w-4" /></button>
                              <button onClick={()=>deleteUser(r)} className="p-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white" title="Delete"><Trash2 className="h-4 w-4" /></button>
                            </>
                          )}
                        </div>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-600 dark:text-gray-300">
          <div>Page {page} of {pages} • {total} users</div>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700">Prev</button>
            <button disabled={page===pages} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700">Next</button>
          </div>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default UsersPage;
