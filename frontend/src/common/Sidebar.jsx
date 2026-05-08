import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  ClipboardPlus,
  BanknoteArrowDown,
  BarChart3,
  BriefcaseMedical,
  Users,
  Settings,
  LogOut,
  X
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "POS System", icon: Store, path: "/pos" },
  { label: "Inventory", icon: ClipboardPlus, path: "/inventory-management" },
  { label: "Customer Returns", icon: BanknoteArrowDown, path: "/customer-management" },
  { label: "Reports & Analytics", icon: BarChart3, path: "/reports" },
  { label: "User Management", icon: Users, path: "/users" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <aside className="h-screen w-72 bg-primary-950 text-white flex flex-col border-r border-primary-900 shrink-0">
      
      {/* LOGO */}
      <div className="flex items-center justify-between px-6 py-8 border-b border-white/5 relative">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-2.5 rounded-xl shadow-lg shadow-primary-500/20">
            <BriefcaseMedical size={24} className="text-white" />
          </div>

          <div>
            <h1 className="font-display font-bold text-lg tracking-wide text-white">
              Med<span className="text-primary-400">Flow</span>
            </h1>
          </div>
        </div>
        
        <button 
          onClick={onClose} 
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-primary-300 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <nav className="space-y-1.5">
          {menuItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => {
                if (path === '/pos' || path === '/inventory-management') {
                  onClose();
                }
              }}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
                  isActive
                    ? "bg-primary-900/80 shadow-inner border border-white/5 text-white"
                    : "hover:bg-white/5 text-primary-100/70 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator Line */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-primary-400 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  )}

                  {/* Icon */}
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-colors duration-300 ${
                      isActive ? "text-primary-400" : "text-primary-300/50 group-hover:text-primary-300"
                    }`}
                  />

                  {/* Label */}
                  <span className={`text-sm font-semibold tracking-wide ${isActive ? "font-bold" : ""}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      
      {/* USER PROFILE SECTION (Bottom) */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition cursor-pointer border border-white/5">
          <div className="w-9 h-9 rounded-full bg-primary-800 flex items-center justify-center text-primary-200 font-bold text-sm border border-primary-700">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">Admin User</p>
            <p className="text-xs text-primary-200/70 truncate">Administrator</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}