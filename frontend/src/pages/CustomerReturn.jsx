import React, { useMemo, useState } from "react";

/* ───────────────────────── DEMO DATA ───────────────────────── */

const DEMO_SALES = [
  {
    invoice: "INV-1001",
    date: "2026-05-01",
    customer: "Walk-in Customer",
    items: [
      { id: 1, name: "Paracetamol", purchasedQty: 10, price: 50 },
      { id: 2, name: "Cough Syrup", purchasedQty: 2, price: 180 },
    ],
  },
  {
    invoice: "INV-1002",
    date: "2026-05-03",
    customer: "Ahmed Khan",
    items: [{ id: 3, name: "Vitamin C", purchasedQty: 5, price: 90 }],
  },
];

const Rs = (n) => `Rs ${Number(n).toLocaleString()}`;

/* ───────────────────────── STATUS MESSAGE ───────────────────────── */

function Message({ type = "success", text }) {
  const styles = {
    success: "bg-green-50 text-green-700 border-green-200",
    error: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div
      className={`p-4 rounded-2xl border font-semibold text-sm ${styles[type]}`}
    >
      {text}
    </div>
  );
}

/* ───────────────────────── MAIN COMPONENT ───────────────────────── */

export default function CustomerReturnSystem() {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [returnQtys, setReturnQtys] = useState({});
  const [message, setMessage] = useState(null);

  /* ───────────────── SEARCH INVOICE ───────────────── */

  const handleSearch = () => {
    const foundInvoice = DEMO_SALES.find(
      (sale) =>
        sale.invoice.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (!foundInvoice) {
      setInvoice(null);
      setMessage({
        type: "error",
        text: "Invoice not found.",
      });
      return;
    }

    setInvoice(foundInvoice);
    setReturnQtys({});
    setMessage(null);
  };

  /* ───────────────── UPDATE RETURN QTY ───────────────── */

  const updateReturnQty = (id, value, maxQty) => {
    const qty = Math.max(0, Math.min(Number(value), maxQty));

    setReturnQtys((prev) => ({
      ...prev,
      [id]: qty,
    }));
  };

  /* ───────────────── TOTAL REFUND ───────────────── */

  const totalRefund = useMemo(() => {
    if (!invoice) return 0;

    return invoice.items.reduce((total, item) => {
      return total + (returnQtys[item.id] || 0) * item.price;
    }, 0);
  }, [invoice, returnQtys]);

  /* ───────────────── PROCESS RETURN ───────────────── */

  const processReturn = () => {
    const hasReturns = Object.values(returnQtys).some((qty) => qty > 0);

    if (!hasReturns) {
      setMessage({
        type: "error",
        text: "Please enter return quantity.",
      });
      return;
    }

    // API CALL HERE
    // update inventory
    // save return invoice

    setMessage({
      type: "success",
      text: "Return processed successfully.",
    });

    setTimeout(() => {
      window.print();
    }, 500);
  };

  /* ───────────────── UI ───────────────── */

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* SEARCH SECTION */}

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div>
              <h1 className="text-3xl font-black text-gray-900">
                Customer Return
              </h1>

              <p className="text-gray-500 mt-1">
                Search invoice and process medicine returns
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Enter invoice no"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="w-full md:w-80 px-5 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none font-medium"
              />

              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold transition"
              >
                Find Sale
              </button>
            </div>
          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <Message type={message.type} text={message.text} />
        )}

        {/* INVOICE */}

        {invoice && (
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">

            {/* HEADER */}

            <div className="bg-green-500 text-white p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="uppercase text-xs tracking-widest opacity-80 font-bold">
                  Return Invoice
                </p>

                <h2 className="text-2xl font-black mt-1">
                  {invoice.invoice}
                </h2>
              </div>

              <div className="text-left md:text-right">
                <p className="font-bold text-lg">
                  {invoice.customer}
                </p>

                <p className="opacity-80 text-sm">
                  {invoice.date}
                </p>
              </div>
            </div>

            {/* TABLE */}

            <div className="overflow-x-auto">
              <table className="w-full">

                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-500">
                      Medicine
                    </th>

                    <th className="text-left p-4 text-xs uppercase tracking-wider text-gray-500">
                      Purchased
                    </th>

                    <th className="text-center p-4 text-xs uppercase tracking-wider text-gray-500">
                      Return Qty
                    </th>

                    <th className="text-right p-4 text-xs uppercase tracking-wider text-gray-500">
                      Refund
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {invoice.items.map((item) => {
                    const qty = returnQtys[item.id] || 0;
                    const refund = qty * item.price;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="p-4">
                          <p className="font-bold text-gray-900">
                            {item.name}
                          </p>

                          <p className="text-sm text-gray-400">
                            {Rs(item.price)} / unit
                          </p>
                        </td>

                        <td className="p-4 font-semibold text-gray-600">
                          {item.purchasedQty}
                        </td>

                        <td className="p-4 text-center print:hidden">
                          <input
                            type="number"
                            min={0}
                            max={item.purchasedQty}
                            value={qty}
                            onChange={(e) =>
                              updateReturnQty(
                                item.id,
                                e.target.value,
                                item.purchasedQty
                              )
                            }
                            className="w-24 px-3 py-2 border border-gray-300 rounded-xl text-center font-bold focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none"
                          />
                        </td>

                        <td className="hidden print:table-cell p-4 text-center font-bold">
                          {qty}
                        </td>

                        <td className="p-4 text-right font-black text-green-600">
                          {Rs(refund)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TOTAL */}

            <div className="border-t border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                  Total Refund
                </p>

                <p className="text-gray-400 text-sm mt-1">
                  Stock will automatically update after return
                </p>
              </div>

              <div className="text-right">
                <h3 className="text-4xl font-black text-gray-900">
                  {Rs(totalRefund)}
                </h3>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="p-6 pt-0 flex flex-col sm:flex-row gap-4 print:hidden">

              <button
                onClick={() => {
                  setInvoice(null);
                  setSearchQuery("");
                  setReturnQtys({});
                  setMessage(null);
                }}
                className="flex-1 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition"
              >
                Cancel
              </button>

              <button
                onClick={processReturn}
                className="flex-[2] py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black transition shadow-lg shadow-green-100"
              >
                Save & Print Receipt
              </button>
            </div>
          </div>
        )}

        {/* PRINT FOOTER */}

        <div className="hidden print:block text-center pt-10 text-gray-400 text-xs uppercase tracking-[0.3em]">
          Pharmacy Management System — Return Receipt
        </div>
      </div>
    </div>
  );
}