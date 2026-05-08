import React, { useMemo, useState } from "react";
import { Download, Printer, TrendingUp, DollarSign, Activity, AlertTriangle, CalendarDays } from "lucide-react";

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */

const ITEMS_PER_PAGE = 15;

const Rs = (n) => `Rs ${Number(n).toLocaleString()}`;

/* ─────────────────────────────────────────────
   DEMO DATA
───────────────────────────────────────────── */

const DEMO_DATA = {
  daily: Array.from({ length: 45 }, (_, i) => ({
    date: `2026-05-${String((i % 30) + 1).padStart(2, "0")}`,
    invoiceNo: `INV-${1000 + i}`,
    items: Math.floor(Math.random() * 12) + 1,
    profit: Math.floor(Math.random() * 1500) + 500,
    revenue: Math.floor(Math.random() * 6000) + 1500,
  })),

  profit: [
    { month: "January", revenue: 58000, cost: 39000, margin: "32%", profit: 19000 },
    { month: "February", revenue: 62000, cost: 41000, margin: "34%", profit: 21000 },
    { month: "March", revenue: 70000, cost: 45000, margin: "36%", profit: 25000 },
  ],

  best: [
    { name: "Paracetamol", sold: 840, revenue: 24000 },
    { name: "Amoxicillin", sold: 620, revenue: 18500 },
    { name: "Vitamin C", sold: 510, revenue: 12200 },
    { name: "Insulin", sold: 300, revenue: 45000 },
  ],

  low: [
    { name: "Panadol CF", qty: 4 },
    { name: "Cough Syrup", qty: 2 },
    { name: "Metformin 500mg", qty: 8 },
  ],

  expiry: [
    { name: "Eye Drops", qty: 15, expiry: "2026-06-01" },
    { name: "Vitamin D3", qty: 40, expiry: "2026-07-15" },
    { name: "Aspirin", qty: 100, expiry: "2026-08-20" },
  ],
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────
   UI COMPONENTS
───────────────────────────────────────────── */

const Card = ({ title, value, color, icon: Icon, bgColor }) => (
  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:shadow-lg transition-shadow duration-300">
    <div>
      <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">{title}</p>
      <h2 className={`text-4xl font-display font-black tracking-tight ${color}`}>
        {value}
      </h2>
    </div>
    <div className={`p-4 rounded-2xl ${bgColor} ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={32} strokeWidth={2} />
    </div>
  </div>
);

const Pagination = ({ page, totalPages, setPage }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50/50">
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => setPage(i + 1)}
          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
            page === i + 1
              ? "bg-primary-600 text-white shadow-md shadow-primary-200"
              : "bg-white border border-gray-200 hover:bg-gray-100 text-gray-600"
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
};

const TableWrapper = ({ children }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[700px] border-collapse">
      {children}
    </table>
  </div>
);

const TableHead = ({ headers }) => (
  <thead className="bg-gray-50/80 border-b border-gray-100">
    <tr>
      {headers.map((item, index) => (
        <th
          key={index}
          className={`px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500 ${
            index === headers.length - 1 ? "text-right" : "text-left"
          }`}
        >
          {item}
        </th>
      ))}
    </tr>
  </thead>
);

const TableRow = ({ children }) => (
  <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
    {children}
  </tr>
);

const Td = ({ children, right, className = "" }) => (
  <td className={`px-6 py-4 text-sm font-medium text-gray-700 ${right ? "text-right" : "text-left"} ${className}`}>
    {children}
  </td>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export default function PharmacyReports() {
  const [activeTab, setActiveTab] = useState("daily");
  const [page, setPage] = useState(1);

  const currentData = DEMO_DATA[activeTab];
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return currentData.slice(start, start + ITEMS_PER_PAGE);
  }, [page, activeTab, currentData]);

  const totalSales = DEMO_DATA.daily.reduce((acc, item) => acc + item.revenue, 0);
  const totalProfit = DEMO_DATA.daily.reduce((acc, item) => acc + item.profit, 0);

  const tabs = [
    { key: "daily", label: "Daily Sales", icon: TrendingUp },
    { key: "profit", label: "Monthly Profit", icon: DollarSign },
    { key: "best", label: "Best Selling", icon: Activity },
    { key: "low", label: "Low Stock", icon: AlertTriangle },
    { key: "expiry", label: "Expiry Products", icon: CalendarDays },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 fade-in">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Monitor sales, inventory performance, and financial metrics.
          </p>
        </div>

        <div className="flex gap-3 print:hidden">
          <button
            onClick={() => downloadCSV(currentData, `${activeTab}-report`)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 font-bold text-gray-700 transition-all shadow-sm"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg shadow-primary-200"
          >
            <Printer size={18} /> Print PDF
          </button>
        </div>
      </div>

      {/* STATS */}
      {activeTab === "daily" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="Total Sales Revenue"
            value={Rs(totalSales)}
            color="text-primary-600"
            bgColor="bg-primary-50"
            icon={TrendingUp}
          />
          <Card
            title="Total Net Profit"
            value={Rs(totalProfit)}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            icon={DollarSign}
          />
        </div>
      )}

      {/* TABS */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-2 overflow-x-auto print:hidden shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-gray-900 text-white shadow-md"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* DAILY SALES */}
        {activeTab === "daily" && (
          <TableWrapper>
            <TableHead headers={["Date", "Invoice Number", "Items Sold", "Profit", "Revenue"]} />
            <tbody className="divide-y divide-gray-50">
              {paginatedData.map((item) => (
                <TableRow key={item.invoiceNo}>
                  <Td>{item.date}</Td>
                  <Td className="font-bold text-gray-900">{item.invoiceNo}</Td>
                  <Td>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-bold">{item.items}</span>
                  </Td>
                  <Td className="font-black text-emerald-600 text-base">{Rs(item.profit)}</Td>
                  <Td right className="font-black text-primary-600 text-base">{Rs(item.revenue)}</Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrapper>
        )}

        {/* MONTHLY PROFIT */}
        {activeTab === "profit" && (
          <TableWrapper>
            <TableHead headers={["Month", "Revenue", "Cost", "Profit Margin", "Net Profit"]} />
            <tbody className="divide-y divide-gray-50">
              {paginatedData.map((item) => (
                <TableRow key={item.month}>
                  <Td className="font-bold text-lg text-gray-900">{item.month}</Td>
                  <Td className="font-bold">{Rs(item.revenue)}</Td>
                  <Td className="font-bold text-rose-500">{Rs(item.cost)}</Td>
                  <Td>
                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg font-bold border border-amber-200/50">{item.margin}</span>
                  </Td>
                  <Td right className="font-black text-emerald-600 text-lg">{Rs(item.profit)}</Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrapper>
        )}

        {/* BEST SELLING */}
        {activeTab === "best" && (
          <TableWrapper>
            <TableHead headers={["Rank", "Medicine Name", "Units Sold", "Total Revenue"]} />
            <tbody className="divide-y divide-gray-50">
              {paginatedData.map((item, index) => (
                <TableRow key={item.name}>
                  <Td className="font-black text-primary-600 text-xl">
                    #{(page - 1) * ITEMS_PER_PAGE + index + 1}
                  </Td>
                  <Td className="font-bold text-gray-900 text-base">{item.name}</Td>
                  <Td>
                    <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-lg font-bold border border-primary-100">{item.sold}</span>
                  </Td>
                  <Td right className="font-black text-gray-900 text-base">{Rs(item.revenue)}</Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrapper>
        )}

        {/* LOW STOCK */}
        {activeTab === "low" && (
          <TableWrapper>
            <TableHead headers={["Medicine Name", "Current Stock Level"]} />
            <tbody className="divide-y divide-gray-50">
              {paginatedData.map((item) => (
                <TableRow key={item.name}>
                  <Td className="font-bold text-gray-900 text-base">{item.name}</Td>
                  <Td right>
                    <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-xl">
                      <AlertTriangle size={16} className="text-rose-500" />
                      <span className="font-black text-rose-600">{item.qty} <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">units</span></span>
                    </div>
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrapper>
        )}

        {/* EXPIRY PRODUCTS */}
        {activeTab === "expiry" && (
          <TableWrapper>
            <TableHead headers={["Medicine Name", "Quantity in Stock", "Expiry Date"]} />
            <tbody className="divide-y divide-gray-50">
              {paginatedData.map((item) => (
                <TableRow key={item.name}>
                  <Td className="font-bold text-gray-900 text-base">{item.name}</Td>
                  <Td>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-bold">{item.qty} units</span>
                  </Td>
                  <Td right>
                    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-xl">
                      <CalendarDays size={16} className="text-amber-600" />
                      <span className="font-black text-amber-600">{item.expiry}</span>
                    </div>
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrapper>
        )}

        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      {/* PRINT FOOTER */}
      <div className="hidden print:block text-center text-sm font-bold text-gray-400 pt-12 border-t-2 border-dashed border-gray-200">
        MedFlow Pharmacy Analytics • Generated on {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}