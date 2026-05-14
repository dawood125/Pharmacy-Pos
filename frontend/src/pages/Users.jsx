import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Shield, UserCheck, Search, X, CheckSquare, Square } from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../common/Toast';

const defaultPermissions = {
  dashboard: { view: true, create: false, update: false, delete: false },
  pos: { view: true, create: true, update: false, delete: false },
  inventory: { view: false, create: false, update: false, delete: false },
  returns: { view: false, create: false, update: false, delete: false },
  reports: { view: false, create: false, update: false, delete: false },
  users: { view: false, create: false, update: false, delete: false },
  settings: { view: false, create: false, update: false, delete: false }
};

const modules = [
  { id: 'dashboard', name: 'Dashboard', actions: ['view'] },
  { id: 'pos', name: 'POS System', actions: ['view', 'create'] },
  { id: 'inventory', name: 'Inventory', actions: ['view', 'create', 'update', 'delete'] },
  { id: 'returns', name: 'Customer Returns', actions: ['view', 'create'] },
  { id: 'reports', name: 'Reports & Analytics', actions: ['view'] },
  { id: 'users', name: 'User Management', actions: ['view', 'create', 'update', 'delete'] },
  { id: 'settings', name: 'Settings', actions: ['view', 'update'] }
];

const USER_PAGE_SIZE = 8;

export default function Users() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, admins: 0 });
  const [search, setSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'cashier', permissions: JSON.parse(JSON.stringify(defaultPermissions)) });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getUserStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    let newPerms = JSON.parse(JSON.stringify(defaultPermissions));
    if (role === 'admin') {
      Object.keys(newPerms).forEach(mod => {
        Object.keys(newPerms[mod]).forEach(act => newPerms[mod][act] = true);
      });
    } else if (role === 'manager') {
      Object.keys(newPerms).forEach(mod => {
        if (mod !== 'users') {
          Object.keys(newPerms[mod]).forEach(act => newPerms[mod][act] = true);
        }
      });
    } else if (role === 'pharmacist') {
      newPerms.inventory = { view: true, create: true, update: true, delete: false };
      newPerms.returns = { view: true, create: true, update: false, delete: false };
    }
    setFormData({ ...formData, role, permissions: newPerms });
  };

  const togglePermission = (mod, act) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [mod]: {
          ...prev.permissions[mod],
          [act]: !prev.permissions[mod][act]
        }
      }
    }));
  };

  const toggleModule = (mod) => {
    const isAllChecked = modules.find(m => m.id === mod).actions.every(act => formData.permissions[mod][act]);
    setFormData(prev => {
      const newPerms = { ...prev.permissions[mod] };
      modules.find(m => m.id === mod).actions.forEach(act => {
        newPerms[act] = !isAllChecked;
      });
      return { ...prev, permissions: { ...prev.permissions, [mod]: newPerms } };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (editingId) {
        if (!payload.password) delete payload.password;
        await api.updateUser(editingId, payload);
        addToast('User updated successfully', 'success');
      } else {
        await api.createUser(payload);
        addToast('User created successfully', 'success');
      }
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'cashier', permissions: JSON.parse(JSON.stringify(defaultPermissions)) });
      setEditingId(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      addToast(err.message || 'Failed to save user', 'error');
    }
  };

  const handleEdit = (user) => {
    const userPerms = user.permissions || JSON.parse(JSON.stringify(defaultPermissions));
    setFormData({ name: user.name, email: user.email, password: '', role: user.role, permissions: userPerms });
    setEditingId(user.id);
    setShowModal(true);
  };

  const handleDelete = async (id, userName) => {
    if (window.confirm(`Are you sure you want to deactivate "${userName}"? They will no longer be able to log in.`)) {
      try {
        await api.deleteUser(id);
        addToast('User deactivated successfully', 'success');
        fetchUsers();
        fetchStats();
      } catch (err) {
        addToast(err.message || 'Failed to deactivate user', 'error');
      }
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setUserPage(1);
  }, [search]);

  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));

  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * USER_PAGE_SIZE;
    return filteredUsers.slice(start, start + USER_PAGE_SIZE);
  }, [filteredUsers, userPage]);

  useEffect(() => {
    if (userPage > userTotalPages) setUserPage(userTotalPages);
  }, [userPage, userTotalPages]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage staff accounts and permissions</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData({ name: '', email: '', password: '', role: 'cashier', permissions: JSON.parse(JSON.stringify(defaultPermissions)) }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
          </div>
          <div className="p-3 bg-primary-50 rounded-xl">
            <UserCheck size={20} className="text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Active</p>
            <p className="text-2xl font-black text-emerald-600">{stats.active}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <UserCheck size={20} className="text-emerald-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Admins</p>
            <p className="text-2xl font-black text-blue-600">{stats.admins}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <Shield size={20} className="text-blue-600" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">Staff Directory</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-56"
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500">User</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500">Role</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500">Last Login</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <p className="text-sm">No users found</p>
                </td>
              </tr>
            ) : (
              pagedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold capitalize">{user.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100">
                      <button onClick={() => handleEdit(user)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(user.id, user.name)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {userTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-100">
            <button
              type="button"
              disabled={userPage <= 1}
              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {userPage} / {userTotalPages}</span>
            <button
              type="button"
              disabled={userPage >= userTotalPages}
              onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
              className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="text-lg font-bold">{editingId ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:border-primary-400 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:border-primary-400 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Password {editingId && '(leave blank)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:border-primary-400 outline-none"
                    required={!editingId}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Role Template</label>
                  <select
                    value={formData.role}
                    onChange={handleRoleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:border-primary-400 outline-none"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Module Permissions</h4>
                <div className="space-y-3">
                  {modules.map((mod) => {
                    const isAllChecked = mod.actions.every(act => formData.permissions[mod.id]?.[act]);
                    return (
                      <div key={mod.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                          <button type="button" onClick={() => toggleModule(mod.id)} className="text-primary-600">
                            {isAllChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-400" />}
                          </button>
                          <span className="font-bold text-sm text-gray-800">{mod.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 pl-7">
                          {mod.actions.map(act => (
                            <label key={act} className="flex items-center gap-2 cursor-pointer group">
                              <button
                                type="button"
                                onClick={() => togglePermission(mod.id, act)}
                                className={`transition-colors ${formData.permissions[mod.id]?.[act] ? 'text-primary-600' : 'text-gray-300 group-hover:text-primary-400'}`}
                              >
                                {formData.permissions[mod.id]?.[act] ? <CheckSquare size={14} /> : <Square size={14} />}
                              </button>
                              <span className="text-xs font-semibold text-gray-600 capitalize">{act}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
            <div className="flex gap-2 p-4 border-t shrink-0 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-lg font-semibold bg-primary-600 text-white hover:bg-primary-700">
                {editingId ? 'Save Permissions' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}