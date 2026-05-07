import React, { useMemo, useState } from "react";

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
    {
      month: "January",
      revenue: 58000,
      cost: 39000,
      margin: "32%",
      profit: 19000,
    },
    {
      month: "February",
      revenue: 62000,
      cost: 41000,
      margin: "34%",
      profit: 21000,
    },
    {
      month: "March",
      revenue: 70000,
      cost: 45000,
      margin: "36%",
      profit: 25000,
    },
  ],

  best: [
    {
      name: "Paracetamol",
      sold: 840,
      revenue: 24000,
    },
    {
      name: "Amoxicillin",
      sold: 620,
      revenue: 18500,
    },
    {
      name: "Vitamin C",
      sold: 510,
      revenue: 12200,
    },
    {
      name: "Insulin",
      sold: 300,
      revenue: 45000,
    },
  ],

  low: [
    {
      name: "Panadol CF",
      qty: 4,
    },
    {
      name: "Cough Syrup",
      qty: 2,
    },
    {
      name: "Metformin 500mg",
      qty: 8,
    },
  ],

  expiry: [
    {
      name: "Eye Drops",
      qty: 15,
      expiry: "2026-06-01",
    },
    {
      name: "Vitamin D3",
      qty: 40,
      expiry: "2026-07-15",
    },
    {
      name: "Aspirin",
      qty: 100,
      expiry: "2026-08-20",
    },
  ],
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

const downloadCSV = (data, filename) => {
  if (!data?.length) return;

  const headers = Object.keys(data[0]).join(",");

  const rows = data.map((row) =>
    Object.values(row)
      .map((value) => `"${value}"`)
      .join(",")
  );

  const csv = [headers, ...rows].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

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

const Card = ({ title, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{title}</p>

    <h2 className={`text-3xl font-bold mt-3 ${color}`}>
      {value}
    </h2>
  </div>
);

const Pagination = ({ page, totalPages, setPage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => setPage(i + 1)}
          className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
            page === i + 1
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
    <table className="w-full min-w-[700px]">
      {children}
    </table>
  </div>
);

const TableHead = ({ headers }) => (
  <thead className="bg-gray-50">
    <tr>
      {headers.map((item, index) => (
        <th
          key={index}
          className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 ${
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
  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
    {children}
  </tr>
);

const Td = ({ children, right, className = "" }) => (
  <td
    className={`px-5 py-4 text-sm ${
      right ? "text-right" : "text-left"
    } ${className}`}
  >
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

  const totalPages = Math.ceil(
    currentData.length / ITEMS_PER_PAGE
  );

  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;

    return currentData.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [page, activeTab, currentData]);

  const totalSales = DEMO_DATA.daily.reduce(
    (acc, item) => acc + item.revenue,
    0
  );

  const totalProfit = DEMO_DATA.daily.reduce(
    (acc, item) => acc + item.profit,
    0
  );

  const tabs = [
    {
      key: "daily",
      label: "Daily Sales",
    },
    {
      key: "profit",
      label: "Monthly Profit",
    },
    {
      key: "best",
      label: "Best Selling",
    },
    {
      key: "low",
      label: "Low Stock",
    },
    {
      key: "expiry",
      label: "Expiry Products",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>
              <h1 className="text-4xl font-black text-gray-900">
                Pharmacy Reports
              </h1>

              <p className="text-gray-500 mt-2">
                Sales, inventory, expiry and profit analytics
              </p>
            </div>

            <div className="flex gap-3 print:hidden">
              <button
                onClick={() =>
                  downloadCSV(
                    currentData,
                    `${activeTab}-report`
                  )
                }
                className="px-5 py-3 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 font-semibold"
              >
                Download CSV
              </button>

              <button
                onClick={() => window.print()}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg"
              >
                Print PDF
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}

        {activeTab === "daily" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card
              title="Total Sales"
              value={Rs(totalSales)}
              color="text-emerald-600"
            />

            <Card
              title="Total Profit"
              value={Rs(totalProfit)}
              color="text-blue-600"
            />
          </div>
        )}

        {/* TABS */}

        <div className="bg-white rounded-2xl border border-gray-200 p-2 flex gap-2 overflow-x-auto print:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TABLE */}

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

          {/* DAILY SALES */}

          {activeTab === "daily" && (
            <TableWrapper>
              <TableHead
                headers={[
                  "Date",
                  "Invoice Number",
                  "Items",
                  "Profit",
                  "Revenue",
                ]}
              />

              <tbody>
                {paginatedData.map((item) => (
                  <TableRow key={item.invoiceNo}>
                    <Td>{item.date}</Td>

                    <Td className="font-semibold">
                      {item.invoiceNo}
                    </Td>

                    <Td>{item.items}</Td>

                    <Td className="font-semibold text-emerald-600">
                      {Rs(item.profit)}
                    </Td>

                    <Td
                      right
                      className="font-bold text-gray-900"
                    >
                      {Rs(item.revenue)}
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </TableWrapper>
          )}

          {/* MONTHLY PROFIT */}

          {activeTab === "profit" && (
            <TableWrapper>
              <TableHead
                headers={[
                  "Month",
                  "Revenue",
                  "Cost",
                  "Profit Margin",
                  "Profit",
                ]}
              />

              <tbody>
                {paginatedData.map((item) => (
                  <TableRow key={item.month}>
                    <Td className="font-semibold">
                      {item.month}
                    </Td>

                    <Td>{Rs(item.revenue)}</Td>

                    <Td className="text-red-500">
                      {Rs(item.cost)}
                    </Td>

                    <Td className="text-amber-600 font-semibold">
                      {item.margin}
                    </Td>

                    <Td
                      right
                      className="font-bold text-emerald-600"
                    >
                      {Rs(item.profit)}
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </TableWrapper>
          )}

          {/* BEST SELLING */}

          {activeTab === "best" && (
            <TableWrapper>
              <TableHead
                headers={[
                  "No#",
                  "Medicine",
                  "Sold",
                  "Revenue",
                ]}
              />

              <tbody>
                {paginatedData.map((item, index) => (
                  <TableRow key={item.name}>
                    <Td className="font-bold text-emerald-600">
                      #{(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </Td>

                    <Td className="font-semibold">
                      {item.name}
                    </Td>

                    <Td>{item.sold}</Td>

                    <Td
                      right
                      className="font-bold text-gray-900"
                    >
                      {Rs(item.revenue)}
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </TableWrapper>
          )}

          {/* LOW STOCK */}

          {activeTab === "low" && (
            <TableWrapper>
              <TableHead
                headers={[
                  "Medicine Name",
                  "Quantity Left",
                ]}
              />

              <tbody>
                {paginatedData.map((item) => (
                  <TableRow key={item.name}>
                    <Td className="font-semibold">
                      {item.name}
                    </Td>

                    <Td
                      right
                      className="font-bold text-red-600"
                    >
                      {item.qty}
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </TableWrapper>
          )}

          {/* EXPIRY PRODUCTS */}

          {activeTab === "expiry" && (
            <TableWrapper>
              <TableHead
                headers={[
                  "Medicine Name",
                  "Quantity",
                  "Expiry Date",
                ]}
              />

              <tbody>
                {paginatedData.map((item) => (
                  <TableRow key={item.name}>
                    <Td className="font-semibold">
                      {item.name}
                    </Td>

                    <Td>{item.qty}</Td>

                    <Td
                      right
                      className="font-bold text-orange-600"
                    >
                      {item.expiry}
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </TableWrapper>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </div>

        {/* PRINT FOOTER */}

        <div className="hidden print:block text-center text-xs text-gray-400 pt-10">
          Pharmacy Management System Report •{" "}
          {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}