import React, { useState } from 'react';
import { Users as UsersIcon, Plus, MoreVertical, Edit2, Trash2, Shield, UserCheck, Search } from 'lucide-react';

const DEMO_USERS = [
  { id: 1, name: "Admin User", email: "admin@pharmacy.com", role: "Administrator", status: "Active", lastLogin: "Just now" },
  { id: 2, name: "Sarah Ahmed", email: "sarah.pharmacist@pharmacy.com", role: "Pharmacist", status: "Active", lastLogin: "2 hours ago" },
  { id: 3, name: "Usman Khan", email: "usman.sales@pharmacy.com", role: "Cashier", status: "Inactive", lastLogin: "3 days ago" },
  { id: 4, name: "Dr. Fatima", email: "fatima.manager@pharmacy.com", role: "Manager", status: "Active", lastLogin: "Yesterday" },
];

export default function Users() {
  const [search, setSearch] = useState("");

  return (
    <div className="max-w-7xl mx-auto space-y-8 fade-in">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">
            User Management
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Manage staff accounts, roles, and access permissions.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold transition-all shadow-lg shadow-gray-200">
            <Plus size={18} /> Add New User
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Total Staff</p>
            <h2 className="text-4xl font-display font-black text-gray-900">4</h2>
          </div>
          <div className="p-4 rounded-2xl bg-primary-50 text-primary-600">
            <UsersIcon size={32} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Active Users</p>
            <h2 className="text-4xl font-display font-black text-emerald-600">3</h2>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
            <UserCheck size={32} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Admin Roles</p>
            <h2 className="text-4xl font-display font-black text-blue-600">1</h2>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
            <Shield size={32} />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">Staff Directory</h2>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50 outline-none transition-all text-sm font-medium"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500">User Profile</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500">Role</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500">Last Login</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {DEMO_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                        <p className="text-xs font-medium text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-700">{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
