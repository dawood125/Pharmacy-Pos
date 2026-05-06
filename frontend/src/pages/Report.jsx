import { useState } from "react";

export default function Report() {
  const [tab, setTab] = useState("daily");

  // Demo data (replace with API later)
  const sales = [
    { date: "2026-05-06", total: 500 },
    { date: "2026-05-05", total: 1200 },
  ];

  const profit = [
    { month: "May", profit: 8000 },
    { month: "April", profit: 6500 },
  ];

  const bestSelling = [
    { name: "Paracetamol", sold: 120 },
    { name: "Vitamin C", sold: 90 },
  ];

  const lowStock = [
    { name: "Cough Syrup", qty: 5 },
    { name: "Amoxicillin", qty: 3 },
  ];

  const expiry = [
    { name: "Vitamin C", expiry: "2026-06-10" },
    { name: "Cough Syrup", expiry: "2026-06-15" },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <h1 className="text-xl font-bold">
        Report Section
      </h1>

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">

        <button onClick={() => setTab("daily")} className="px-3 py-1 border rounded">
          Daily Sales
        </button>

        <button onClick={() => setTab("profit")} className="px-3 py-1 border rounded">
          Monthly Profit
        </button>

        <button onClick={() => setTab("best")} className="px-3 py-1 border rounded">
          Best Selling
        </button>

        <button onClick={() => setTab("low")} className="px-3 py-1 border rounded">
          Low Stock
        </button>

        <button onClick={() => setTab("expiry")} className="px-3 py-1 border rounded">
          Expiry List
        </button>

      </div>

      {/* CONTENT */}
      <div className="bg-white p-4 rounded shadow">

        {/* DAILY SALES */}
        {tab === "daily" && (
          <div>
            <h2 className="font-bold mb-3">Daily Sales Report</h2>

            {sales.map((item, i) => (
              <div key={i} className="flex justify-between border-b py-2">
                <span>{item.date}</span>
                <span>Rs {item.total}</span>
              </div>
            ))}
          </div>
        )}

        {/* PROFIT */}
        {tab === "profit" && (
          <div>
            <h2 className="font-bold mb-3">Monthly Profit</h2>

            {profit.map((item, i) => (
              <div key={i} className="flex justify-between border-b py-2">
                <span>{item.month}</span>
                <span>Rs {item.profit}</span>
              </div>
            ))}
          </div>
        )}

        {/* BEST SELLING */}
        {tab === "best" && (
          <div>
            <h2 className="font-bold mb-3">Best Selling Medicines</h2>

            {bestSelling.map((item, i) => (
              <div key={i} className="flex justify-between border-b py-2">
                <span>{item.name}</span>
                <span>{item.sold} sold</span>
              </div>
            ))}
          </div>
        )}

        {/* LOW STOCK */}
        {tab === "low" && (
          <div>
            <h2 className="font-bold mb-3">Low Stock List</h2>

            {lowStock.map((item, i) => (
              <div key={i} className="flex justify-between border-b py-2 text-red-500">
                <span>{item.name}</span>
                <span>{item.qty} left</span>
              </div>
            ))}
          </div>
        )}

        {/* EXPIRY */}
        {tab === "expiry" && (
          <div>
            <h2 className="font-bold mb-3">Expiry Medicines</h2>

            {expiry.map((item, i) => (
              <div key={i} className="flex justify-between border-b py-2 text-orange-500">
                <span>{item.name}</span>
                <span>{item.expiry}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}