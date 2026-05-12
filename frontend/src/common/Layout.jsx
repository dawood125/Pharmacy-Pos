import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { CartProvider } from "./CartContext";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { pathname } = useLocation();

  // Hide sidebar for POS and Inventory pages - full width layout
  const isFullWidthPage = pathname === '/pos' || pathname === '/inventory-management';

  useEffect(() => {
    if (isFullWidthPage) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [pathname]);

  return (
    <CartProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar - Fixed position when visible */}
        {!isFullWidthPage && (
          <div className={`shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0'}`}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          {/* Navbar */}
          <Navbar
            onOpenSidebar={() => setIsSidebarOpen(true)}
            isSidebarOpen={isSidebarOpen}
            isFullWidthPage={isFullWidthPage}
          />

          {/* Page Content */}
          <main className={`flex-1 overflow-y-auto custom-scrollbar bg-gray-50 ${isFullWidthPage ? 'p-0' : 'p-4'}`}>
            {children}
          </main>
        </div>
      </div>
    </CartProvider>
  );
}