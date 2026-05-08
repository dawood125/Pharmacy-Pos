import { Bell, LogOut, Search, Menu, LayoutDashboard } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";

export default function Navbar({ isSidebarOpen, onOpenSidebar }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="w-full h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-50">

      {/* LEFT SIDE: Hamburger & Optional Dashboard Link */}
      <div className="flex items-center gap-4 flex-1">
        {!isSidebarOpen && (
          <button 
            onClick={onOpenSidebar}
            className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu size={20} />
          </button>
        )}

        {(pathname === '/pos' || pathname === '/inventory-management') && (
          <Link 
            to="/" 
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-600 rounded-lg transition-colors font-semibold text-sm"
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        {/* ALERT BELL */}
        <button className="relative p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="w-px h-6 bg-gray-200"></div>

        {/* LOGOUT */}
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          title="Sign out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}