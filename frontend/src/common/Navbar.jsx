import { Bell, LogOut, Search, Menu, LayoutDashboard, ArrowLeft } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useToast } from "./Toast";

export default function Navbar({ isSidebarOpen, onOpenSidebar, isFullWidthPage }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    addToast('Logged out successfully', 'success');
    navigate('/login');
  };

  return (
    <div className={`h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0 z-50 ${isFullWidthPage ? 'border-b-0' : ''}`}>

      {/* LEFT SIDE: Dashboard Link for Full Width Pages */}
      <div className="flex items-center gap-3 flex-1">
        {isFullWidthPage ? (
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl transition-all font-bold text-sm shadow-sm"
          >
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </Link>
        ) : (
          <>
            {!isSidebarOpen && (
              <button
                onClick={onOpenSidebar}
                className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              {pathname === '/' ? 'Dashboard' :
               pathname === '/pos' ? 'POS System' :
               pathname === '/inventory-management' ? 'Inventory' :
               pathname === '/customer-management' ? 'Returns' :
               pathname === '/reports' ? 'Reports' :
               pathname === '/users' ? 'Users' :
               pathname === '/settings' ? 'Settings' : 'Pharmacy POS'}
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        {/* ALERT BELL */}
        <button className="relative p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="w-px h-6 bg-gray-200"></div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-sm font-medium"
          title="Sign out"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}