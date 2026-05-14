import { useNavigate } from "react-router-dom";
import { TrendingUp, DollarSign, AlertCircle, Clock, ArrowDownRight, Ban, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { api } from "../api/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") fetchDashboardStats();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", fetchDashboardStats);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", fetchDashboardStats);
    };
  }, [fetchDashboardStats]);

  const Rs = (n) => `Rs ${Number(n || 0).toLocaleString()}`;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canAddStock = user.permissions?.inventory?.create || (!user.permissions && (user.role === 'admin' || user.role === 'pharmacist' || user.role === 'manager'));
  const canViewReports = user.permissions?.reports?.view || (!user.permissions && (user.role === 'admin' || user.role === 'manager'));

  const revenue = stats?.todayRevenue || 0;
  const profit = stats?.todayProfit || 0;
  const marginPct = Number.isFinite(Number(stats?.todayMarginPct)) ? Number(stats.todayMarginPct) : 0;
  const revenueBarPct = revenue > 0 ? 100 : 0;
  const profitBarPct = revenue > 0 ? Math.max(0, Math.min(100, (profit / revenue) * 100)) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, {user.name || 'User'}! Here's what's happening at your pharmacy today.
          </p>
        </div>
        <div className="flex items-end gap-3 justify-end">
          <button
            type="button"
            onClick={() => { setLoading(true); fetchDashboardStats(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
            <p className="text-gray-900 font-semibold text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div
          onClick={() => navigate('/reports')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            {revenue > 0 && (
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                Margin {marginPct}%
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase">Today's Sales</p>
          <p className="text-2xl font-display font-black text-gray-900 mt-1">
            {stats ? Rs(stats.todayRevenue) : '...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats?.todaySales ?? 0} invoices today</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-primary-50">
              <DollarSign size={20} className="text-primary-600" />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase">Gross Profit</p>
          <p className="text-2xl font-display font-black text-gray-900 mt-1">
            {stats ? Rs(stats.todayProfit) : '...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Sale price minus purchase cost (net of returns)</p>
        </div>

        <div
          onClick={() => canAddStock ? navigate('/inventory-management') : null}
          className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all ${canAddStock ? 'cursor-pointer hover:shadow-md' : 'opacity-80'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-rose-50">
              <AlertCircle size={20} className="text-rose-600" />
            </div>
            {stats?.lowStockCount > 0 && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                {stats.lowStockCount} items
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase">Low Stock</p>
          <p className="text-2xl font-display font-black text-gray-900 mt-1">
            {stats ? stats.lowStockCount : '...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Need restock</p>
        </div>

        <div
          onClick={() => canAddStock ? navigate('/inventory-management') : null}
          className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all ${canAddStock ? 'cursor-pointer hover:shadow-md' : 'opacity-80'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50">
              <Clock size={20} className="text-amber-600" />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase">Expiring Soon</p>
          <p className="text-2xl font-display font-black text-gray-900 mt-1">
            {stats ? stats.expiringCount : '...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
        </div>

        <div
          onClick={() => canAddStock ? navigate('/inventory-management') : null}
          className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all ${canAddStock ? 'cursor-pointer hover:shadow-md' : 'opacity-80'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-red-50">
              <Ban size={20} className="text-red-600" />
            </div>
            {stats?.expiredCount > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                {stats.expiredCount} batches
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase">Expired (in stock)</p>
          <p className="text-2xl font-display font-black text-gray-900 mt-1">
            {stats ? stats.expiredCount ?? 0 : '...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Past expiry — remove from shelf</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Sales Overview</h3>
            {canViewReports && (
              <button onClick={() => navigate('/reports')} className="text-xs font-bold text-primary-600 hover:underline">
                View Details
              </button>
            )}
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-600">Today's revenue</span>
                    <span className="font-bold text-primary-600">{Rs(revenue)}</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${revenueBarPct}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-600">Today's gross profit</span>
                    <span className="font-bold text-emerald-600">{Rs(profit)}</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${profitBarPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-black text-gray-900">{stats?.todaySales ?? 0}</p>
                  <p className="text-xs text-gray-500 font-medium">Invoices</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-black text-gray-900">{stats?.lowStockCount ?? 0}</p>
                  <p className="text-xs text-gray-500 font-medium">Low stock</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-black text-gray-900">{stats?.expiringCount ?? 0}</p>
                  <p className="text-xs text-gray-500 font-medium">Expiring</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <p className="text-2xl font-black text-red-700">{stats?.expiredCount ?? 0}</p>
                  <p className="text-xs text-red-600 font-medium">Expired</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/pos')}
                className="w-full py-2.5 px-4 bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold rounded-xl transition-colors text-sm text-left flex items-center justify-between"
              >
                New Sale (POS)
                <TrendingUp size={16} />
              </button>
              {canAddStock && (
                <button
                  onClick={() => navigate('/inventory-management')}
                  className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-colors text-sm text-left flex items-center justify-between"
                >
                  Add Stock
                  <DollarSign size={16} />
                </button>
              )}
              <button
                onClick={() => navigate('/customer-management')}
                className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-colors text-sm text-left flex items-center justify-between"
              >
                Process Return
                <ArrowDownRight size={16} />
              </button>
            </div>
          </div>

          {stats?.lowStockItems?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={18} className="text-rose-500" />
                <h3 className="text-base font-bold text-gray-800">Low Stock Alert</h3>
              </div>
              <div className="space-y-2">
                {stats.lowStockItems.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-rose-50 rounded-lg">
                    <span className="text-xs font-semibold text-gray-900 truncate">{item.name}</span>
                    <span className="text-xs font-black text-rose-600">{item.quantity} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.expiringItems?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={18} className="text-amber-500" />
                <h3 className="text-base font-bold text-gray-800">Expiring Soon</h3>
              </div>
              <div className="space-y-2">
                {stats.expiringItems.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
                    <span className="text-xs font-semibold text-gray-900 truncate">{item.name}</span>
                    <span className="text-xs font-medium text-amber-600">{item.expiry_date?.split('T')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.expiredItems?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-red-100">
              <div className="flex items-center gap-2 mb-3">
                <Ban size={18} className="text-red-500" />
                <h3 className="text-base font-bold text-gray-800">Expired (remove)</h3>
              </div>
              <div className="space-y-2">
                {stats.expiredItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                    <span className="text-xs font-semibold text-gray-900 truncate">{item.name}</span>
                    <span className="text-xs font-medium text-red-600">{item.expiry_date?.split('T')[0]} · qty {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
