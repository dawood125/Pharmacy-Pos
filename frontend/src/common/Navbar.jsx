import { Bell, LogOut } from "lucide-react";

export default function Navbar() {
  return (
    <div className="w-full h-14 bg-white shadow flex items-center justify-between px-4">

      {/* LEFT SIDE */}
      <h1 className="font-bold text-green-600">
        Pharmacy System
      </h1>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">

        {/* ALERT BELL */}
        <button className="relative">
          <Bell size={20} />

          {/* red dot alert */}
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* LOGOUT */}
        <button className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
          <LogOut size={16} />
          Logout
        </button>

      </div>
    </div>
  );
}