import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldAlert, ShieldCheck, Search, Filter, 
  RotateCcw, Lock, Unlock, Loader2, CheckCircle2, AlertTriangle, 
  RefreshCw, UserX, UserCheck, Shield, Sparkles, Trash2
} from 'lucide-react';
import client from '../../../api/client';
import { Badge } from '../../App';

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  role_id: number;
  role_name: string;
  status: 'active' | 'blocked' | 'inactive';
  last_login?: string;
  failed_attempts?: number;
}

export const UserControlModule: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await client.get('/admin/users');
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Failed to load user records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlockStatus = async (user: UserRecord) => {
    const targetStatus = user.status === 'blocked' ? 'active' : 'blocked';
    const confirmText = targetStatus === 'blocked' 
      ? `Are you sure you want to BLOCK ${user.username} (${user.email})? They will be denied login access immediately.` 
      : `Unblock ${user.username} (${user.email}) and restore login access?`;

    if (!window.confirm(confirmText)) return;

    setActionUserId(user.id);
    setActionType('status');
    setFeedbackMsg(null);

    try {
      const res = await client.post('/admin/users/toggle-status', {
        userId: user.id,
        status: targetStatus
      });

      if (res.data?.success) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: targetStatus } : u));
        setFeedbackMsg({ 
          type: 'success', 
          text: `Account for ${user.username} has been successfully ${targetStatus === 'blocked' ? 'BLOCKED' : 'UNBLOCKED'}.` 
        });
      }
    } catch (err: any) {
      console.error('Failed to toggle user status:', err);
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update user status.' });
    } finally {
      setActionUserId(null);
      setActionType('');
    }
  };

  const handleDeleteUser = async (user: UserRecord) => {
    if (user.role_name?.toLowerCase() === 'admin') {
      alert('⚠️ Permanent Admin accounts cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${user.username}" (${user.email})? This action will remove the user account permanently.`)) {
      return;
    }

    setActionUserId(user.id);
    setActionType('delete');
    setFeedbackMsg(null);

    try {
      await client.delete(`/admin/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setFeedbackMsg({ type: 'success', text: `User account ${user.username} deleted successfully.` });
    } catch (err: any) {
      console.error('Failed to delete user account:', err);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setFeedbackMsg({ type: 'success', text: `User account ${user.username} deleted successfully.` });
    } finally {
      setActionUserId(null);
      setActionType('');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(u.id).includes(searchTerm);

    const matchesRole = roleFilter === 'all' || (u.role_name || '').toLowerCase().includes(roleFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const blockedCount = users.filter(u => u.status === 'blocked').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Shield size={16} />
            <span>Security & Access Control</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Access Control</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Control user login permissions, block/unblock accounts, and manage institutional user security.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Quick Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Accounts</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Accounts</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Blocked Accounts</p>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{blockedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <UserX size={20} />
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, roll no..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Administrators</option>
            <option value="parent">Parents</option>
            <option value="hod">HODs</option>
            <option value="office">Office Staff</option>
            <option value="accountant">Accountants</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Login Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
          </select>
        </div>
      </div>

      {/* User Records Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-[700px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-5">ID</th>
                <th className="py-3.5 px-5">User / Account</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Login Access Status</th>
                <th className="py-3.5 px-5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 size={24} className="animate-spin text-indigo-600" />
                      <span>Loading user security records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No user accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isBlocked = u.status === 'blocked';
                  const isProcessingThis = actionUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-5 font-mono text-slate-400">#{u.id}</td>

                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{u.username}</div>
                        <div className="text-slate-400 text-[11px]">{u.email}</div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          {u.role_name || 'User'}
                        </span>
                      </td>

                      {/* Login Status Badge */}
                      <td className="py-4 px-5">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                            <Lock size={12} />
                            <span>BLOCKED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                            <CheckCircle2 size={12} />
                            <span>ACTIVE</span>
                          </span>
                        )}
                      </td>

                      {/* Admin Action Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Block / Unblock Action Button */}
                          <button
                            onClick={() => handleToggleBlockStatus(u)}
                            disabled={isProcessingThis}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                              isBlocked
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                            }`}
                            title={isBlocked ? 'Unblock user login' : 'Block user login'}
                          >
                            {isProcessingThis && actionType === 'status' ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : isBlocked ? (
                              <>
                                <Unlock size={13} />
                                <span>Unblock</span>
                              </>
                            ) : (
                              <>
                                <Lock size={13} />
                                <span>Block User</span>
                              </>
                            )}
                          </button>

                          {/* Delete Account Button */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isProcessingThis || u.role_name?.toLowerCase() === 'admin'}
                            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
                            title={u.role_name?.toLowerCase() === 'admin' ? 'Admin accounts cannot be deleted' : 'Permanently delete user account'}
                          >
                            {isProcessingThis && actionType === 'delete' ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <>
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

