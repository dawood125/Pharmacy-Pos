import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { pathname } = useLocation();

  // Hide sidebar for POS and Inventory pages
  const isFullWidthPage = pathname === '/pos' || pathname === '/inventory-management';

  useEffect(() => {
    if (isFullWidthPage) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [pathname]);

  return (
    <div className={`flex h-screen overflow-hidden bg-gray-50 print:bg-white ${isFullWidthPage ? 'sidebar-hidden' : ''}`}>

      {/* SIDEBAR - Only show when not full width */}
      {!isFullWidthPage && (
        <div className="print:hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </div>
      )}

      {/* MAIN AREA */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${isFullWidthPage ? 'w-full' : ''} print:h-auto print:overflow-visible`}>

        {/* NAVBAR */}
        <div className="print:hidden">
          <Navbar
            onOpenSidebar={() => setIsSidebarOpen(true)}
            isSidebarOpen={isSidebarOpen}
            isFullWidthPage={isFullWidthPage}
          />
        </div>

        {/* PAGE CONTENT */}
        <main className={`flex-1 overflow-y-auto custom-scrollbar print:overflow-visible ${isFullWidthPage ? 'p-2 print:p-0' : 'p-4 print:p-0'}`}>
          {children}
        </main>

      </div>
    </div>
  );
}