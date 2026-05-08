import { useNavigate } from "react-router-dom";
import { TrendingUp, DollarSign, AlertCircle, Clock } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const metrics = [
    {
      title: "Today's Sales",
      value: "Rs 12,500",
      desc: "+14% from yesterday",
      path: "/sales-report",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Profit",
      value: "Rs 3,200",
      desc: "Approx. analysis",
      path: "/profit-report",
      icon: DollarSign,
      color: "text-primary-600",
      bgColor: "bg-primary-50",
    },
    {
      title: "Low Stock",
      value: "5 Items",
      desc: "Requires attention",
      path: "/low-stock-report",
      icon: AlertCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
    {
      title: "Expiring Soon",
      value: "8 Items",
      desc: "Within 30 days",
      path: "/expiring-medicines",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Welcome back! Here's what's happening at your pharmacy today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Date</p>
          <p className="text-gray-900 font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.path)}
            className="group cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all duration-300 relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${item.bgColor}`}></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-3 rounded-2xl ${item.bgColor} ${item.color}`}>
                <item.icon size={24} strokeWidth={2.5} />
              </div>
            </div>

            <div className="relative z-10">
              <h2 className="text-gray-500 font-semibold text-sm uppercase tracking-wider mb-1">
                {item.title}
              </h2>
              <p className="text-3xl font-display font-black text-gray-900 mb-2">
                {item.value}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">
                  {item.desc}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Activity / Chart Placeholder */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center min-h-[300px]">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Analytics</h3>
          <div className="flex-1 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 bg-gray-50/50">
            Chart Visualization Area (To be implemented)
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={() => navigate('/pos')} className="w-full py-4 px-6 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold rounded-2xl transition-colors text-left flex items-center justify-between">
              Open POS Register <TrendingUp size={18} />
            </button>
            <button onClick={() => navigate('/inventory-management')} className="w-full py-4 px-6 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl transition-colors text-left flex items-center justify-between">
              Add New Stock <DollarSign size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}