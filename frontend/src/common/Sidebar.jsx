import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Store, ClipboardPlus, BanknoteArrowDown,
  BarChart3, Users, Settings, LogOut, X, BriefcaseMedical
} from "lucide-react";
import { api } from "../api/api";

// Define permissions for each role
const rolePermissions = {
  admin: {
    dashboard: true, pos: true, inventory: true, returns: true,
    reports: true, users: true, settings: true
  },
  manager: {
    dashboard: true, pos: true, inventory: true, returns: true,
    reports: true, users: false, settings: true
  },
  cashier: {
    dashboard: true, pos: true, inventory: false, returns: true,
    reports: false, users: false, settings: false
  },
  pharmacist: {
    dashboard: true, pos: true, inventory: true, returns: false,
    reports: false, users: false, settings: false
  }
};

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", key: 'dashboard' },
  { label: "POS System", icon: Store, path: "/pos", key: 'pos' },
  { label: "Inventory", icon: ClipboardPlus, path: "/inventory-management", key: 'inventory' },
  { label: "Customer Returns", icon: BanknoteArrowDown, path: "/customer-management", key: 'returns' },
  { label: "Reports & Analytics", icon: BarChart3, path: "/reports", key: 'reports' },
  { label: "User Management", icon: Users, path: "/users", key: 'users' },
  { label: "Settings", icon: Settings, path: "/settings", key: 'settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = rolePermissions[user.role] || rolePermissions.cashier;

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Filter menu items based on permissions
  const allowedMenuItems = menuItems.filter(item => permissions[item.key]);

  // Don't render anything if sidebar is supposed to be closed
  if (!isOpen) return null;

  return (
    <aside className="h-full w-72 bg-primary-950 text-white flex flex-col border-r border-primary-900 fixed left-0 top-0 z-40">
      {/* LOGO */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-2 rounded-xl">
            <BriefcaseMedical size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">
              Med<span className="text-primary-400">Flow</span>
            </h1>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-primary-300">
          <X size={18} />
        </button>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        <nav className="space-y-1">
          {allowedMenuItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary-800 text-white border border-white/10"
                    : "text-primary-200/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 w-1 h-8 bg-primary-400 rounded-r-full" />
                  )}
                  <Icon size={18} className={isActive ? "text-primary-400" : ""} />
                  <span className="text-sm font-semibold">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* USER PROFILE */}
      <div className="p-3 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-primary-200 font-bold text-sm">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.name || 'User'}</p>
            <p className="text-xs text-primary-300 capitalize">{user.role || 'Cashier'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}