import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  ClipboardPlus,
  BanknoteArrowDown,
  BarChart3,
  BriefcaseMedical,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "POS", icon: Store, path: "/pos" },
  { label: "Inventory", icon: ClipboardPlus, path: "/inventory-management" },
  { label: "Customer Return", icon: BanknoteArrowDown, path: "/customer-management" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
];

export default function Sidebar() {
  return (
    <aside className="h-screen w-64 bg-green-500 text-white flex flex-col border-r border-white/20">
      
      {/* LOGO */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/20">
        <div className="bg-white/20 p-2 rounded-xl">
          <BriefcaseMedical size={20} />
        </div>

        <div>
          <h1 className="font-semibold text-sm">
            Al-Rasheed Pharmacy
          </h1>
          <p className="text-xs text-white/70">
            Management System
          </p>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 py-3 px-3 space-y-1">
        {menuItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                isActive
                  ? "bg-white/25 shadow-sm"
                  : "hover:bg-white/10"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full" />
                )}

                {/* Icon */}
                <Icon
                  size={18}
                  className="text-white/80 group-hover:text-white"
                />

                {/* Label */}
                <span className="text-sm font-medium">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}