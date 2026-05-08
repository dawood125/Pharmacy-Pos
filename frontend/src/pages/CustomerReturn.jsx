import React, { useMemo, useState } from "react";
import { Search, ChevronRight, FileText, ArrowLeft, RefreshCcw } from "lucide-react";

/* ───────────────────────── DEMO DATA ───────────────────────── */

const DEMO_SALES = [
  {
    invoice: "INV-1001",
    date: "2026-05-01 10:30 AM",
    customer: "Walk-in Customer",
    total: 860,
    items: [
      { id: 1, name: "Paracetamol 500mg", purchasedQty: 10, price: 50 },
      { id: 2, name: "Cough Syrup (Sugar Free)", purchasedQty: 2, price: 180 },
    ],
  },
  {
    invoice: "INV-1002",
    date: "2026-05-03 02:15 PM",
    customer: "Ahmed Khan",
    total: 450,
    items: [{ id: 3, name: "Vitamin C Chewable", purchasedQty: 5, price: 90 }],
  },
  {
    invoice: "INV-1003",
    date: "2026-05-05 11:45 AM",
    customer: "Walk-in Customer",
    total: 120,
    items: [{ id: 4, name: "Amoxicillin 250mg", purchasedQty: 1, price: 120 }],
  },
];

const Rs = (n) => `Rs ${Number(n).toLocaleString()}`;

export default function CustomerReturnSystem() {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [returnQtys, setReturnQtys] = useState({});
  const [message, setMessage] = useState(null);

  /* ───────────────── SEARCH & FILTER ───────────────── */

  const filteredSales = DEMO_SALES.filter((sale) =>
    sale.invoice.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
    sale.customer.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleSelectInvoice = (selectedInvoice) => {
    setInvoice(selectedInvoice);
    setReturnQtys({});
    setMessage(null);
  };

  /* ───────────────── UPDATE RETURN QTY ───────────────── */

  const updateReturnQty = (id, value, maxQty) => {
    const qty = Math.max(0, Math.min(Number(value), maxQty));
    setReturnQtys((prev) => ({ ...prev, [id]: qty }));
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
      setMessage({ type: "error", text: "Please enter return quantity." });
      return;
    }

    setMessage({ type: "success", text: "Return processed successfully." });
    setTimeout(() => window.print(), 500);
  };

  /* ───────────────── UI RENDERING ───────────────── */

  // VIEW 1: INVOICE LIST
  if (!invoice) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 tracking-tight">
              Customer Returns
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Select an invoice below or search to process a return
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search invoice no or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-50 focus:border-primary-400 outline-none transition-all font-medium text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice No</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Amount</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <tr key={sale.invoice} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => handleSelectInvoice(sale)}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-50 text-primary-600 rounded-lg group-hover:bg-primary-100 transition-colors">
                            <FileText size={18} />
                          </div>
                          <span className="font-bold text-gray-900">{sale.invoice}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 font-medium">{sale.date}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-gray-700">{sale.customer}</td>
                      <td className="py-4 px-6 text-right font-bold text-gray-900">{Rs(sale.total)}</td>
                      <td className="py-4 px-6 text-center">
                        <button className="text-primary-600 font-semibold text-sm hover:text-primary-800 flex items-center justify-center gap-1 w-full">
                          View <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={48} className="mb-4 text-gray-300" strokeWidth={1} />
                        <p className="text-lg font-medium text-gray-500">No invoices found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: INVOICE DETAILS & RETURN FORM
  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-10">
      
      {/* Back Button */}
      <button 
        onClick={() => setInvoice(null)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors print:hidden group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Invoices
      </button>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl border font-semibold text-sm flex items-center gap-2 print:hidden ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Invoice Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
        
        {/* Header */}
        <div className="bg-primary-950 text-white p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-800 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="uppercase text-xs tracking-widest text-primary-200 font-bold bg-white/10 px-2 py-1 rounded">
                Return Invoice
              </span>
            </div>
            <h2 className="text-3xl font-display font-bold">{invoice.invoice}</h2>
          </div>

          <div className="sm:text-right relative z-10">
            <p className="font-bold text-lg">{invoice.customer}</p>
            <p className="text-primary-200/80 text-sm font-medium mt-0.5">{invoice.date}</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto p-4 sm:p-8">
          <table className="w-full">
            <thead className="border-b-2 border-gray-100">
              <tr>
                <th className="text-left pb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Medicine</th>
                <th className="text-left pb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Purchased</th>
                <th className="text-center pb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Return Qty</th>
                <th className="text-right pb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Refund Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.items.map((item) => {
                const qty = returnQtys[item.id] || 0;
                const refund = qty * item.price;

                return (
                  <tr key={item.id} className="group">
                    <td className="py-6">
                      <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                      <p className="text-sm font-medium text-gray-400 mt-1">{Rs(item.price)} / unit</p>
                    </td>
                    <td className="py-6">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold">
                        {item.purchasedQty}
                      </div>
                    </td>
                    <td className="py-6 text-center print:hidden">
                      <input
                        type="number"
                        min={0}
                        max={item.purchasedQty}
                        value={qty}
                        onChange={(e) => updateReturnQty(item.id, e.target.value, item.purchasedQty)}
                        className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center font-bold text-lg focus:bg-white focus:ring-4 focus:ring-primary-50 focus:border-primary-400 outline-none transition-all"
                      />
                    </td>
                    <td className="hidden print:table-cell py-6 text-center font-bold text-lg">{qty}</td>
                    <td className="py-6 text-right font-black text-xl text-primary-600">{Rs(refund)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total & Action */}
        <div className="bg-gray-50 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-gray-100">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Refund</p>
            <h3 className="text-4xl font-display font-black text-gray-900 mt-1">{Rs(totalRefund)}</h3>
          </div>

          <button
            onClick={processReturn}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-primary-500/30 active:scale-95 print:hidden"
          >
            <RefreshCcw size={20} />
            Process Return & Print
          </button>
        </div>
      </div>
      
      {/* Print Footer */}
      <div className="hidden print:block text-center mt-12 pt-8 border-t-2 border-dashed border-gray-200">
        <h4 className="font-bold text-lg">Al-Rasheed Pharmacy</h4>
        <p className="text-gray-500 text-sm mt-1">Return Receipt - System Generated</p>
      </div>
    </div>
  );
}