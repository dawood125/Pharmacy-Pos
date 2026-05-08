import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === '/pos' || pathname === '/inventory-management') {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* NAVBAR (GLOBAL) */}
        <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} isSidebarOpen={isSidebarOpen} />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {children}
        </main>

      </div>
    </div>
  );
}