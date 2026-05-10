import React, { useMemo, useState, useEffect } from "react";
import { Download, Printer, TrendingUp, DollarSign, Activity, AlertTriangle, CalendarDays } from "lucide-react";
import { api } from "../api/api";
import { useToast } from "../common/Toast";

const ITEMS_PER_PAGE = 15;
const Rs = (n) => `Rs ${Number(n).toLocaleString()}`;

const downloadCSV = (data, filename) => {
  if (!data?.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).map((value) => `"${value}"`).join(","));
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function PharmacyReports() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("daily");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ daily: [], profit: [], best: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'daily') {
        const result = await api.getDailySales();
        setData(prev => ({ ...prev, daily: result.sales || [] }));
      } else if (activeTab === 'profit') {
        const now = new Date();
        const result = await api.getMonthlyReport(now.getFullYear(), now.getMonth() + 1);
        setData(prev => ({ ...prev, profit: result.dailyData || [] }));
      } else if (activeTab === 'best') {
        const result = await api.getBestSelling(20);
        setData(prev => ({ ...prev, best: result || [] }));
      }
    } catch (err) {
      addToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const currentData = data[activeTab] || [];
    if (currentData.length > 0) {
      downloadCSV(currentData, `${activeTab}-report`);
      addToast('Report exported successfully', 'success');
    }
  };

  const currentData = data[activeTab] || [];
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return currentData.slice(start, start + ITEMS_PER_PAGE);
  }, [page, activeTab, currentData]);

  const totalSales = data.daily.reduce((acc, item) => acc + (item.total_amount || 0), 0);
  const totalProfit = totalSales * 0.25;

  const tabs = [
    { key: "daily", label: "Daily Sales", icon: TrendingUp },
    { key: "profit", label: "Monthly Profit", icon: DollarSign },
    { key: "best", label: "Best Selling", icon: Activity }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Sales, profit and inventory reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Download size={16} /> Export
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {activeTab === "daily" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Revenue</p>
            <p className="text-2xl font-black text-primary-600 mt-1">{Rs(totalSales)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Est. Profit</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{Rs(totalProfit)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
              activeTab === tab.key ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            {activeTab === "daily" && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-left">Date</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-left">Invoice</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-center">Items</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-right">Revenue</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 font-bold text-sm">{item.invoice_number}</td>
                      <td className="px-4 py-3 text-center"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{item.items?.length || 0}</span></td>
                      <td className="px-4 py-3 text-right font-black text-primary-600">{Rs(item.total_amount)}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">{Rs(item.total_amount * 0.25)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "profit" && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-left">Date</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-right">Revenue</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-right">Cost</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-right">Profit</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((item) => (
                    <tr key={item.date} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold">{item.date}</td>
                      <td className="px-4 py-3 text-right font-bold">{Rs(item.revenue)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{Rs(item.cost)}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">{Rs(item.profit)}</td>
                      <td className="px-4 py-3 text-right"><span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-xs font-bold">{item.margin}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "best" && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500">#</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-left">Medicine</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-center">Sold</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-gray-500 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((item, index) => (
                    <tr key={item.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-black text-primary-600">#{index + 1}</td>
                      <td className="px-4 py-3 font-bold">{item.name}</td>
                      <td className="px-4 py-3 text-center"><span className="bg-primary-50 text-primary-600 px-2 py-1 rounded text-xs font-bold">{item.sold}</span></td>
                      <td className="px-4 py-3 text-right font-black">{Rs(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}