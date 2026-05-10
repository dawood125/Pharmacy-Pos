import React, { useMemo, useState, useEffect } from "react";
import { Search, ChevronRight, FileText, ArrowLeft, RefreshCcw } from "lucide-react";
import { api } from "../api/api";
import { useToast } from "../common/Toast";
import { useSettings } from "../common/SettingsContext";

const Rs = (n) => `Rs ${Number(n).toLocaleString()}`;

export default function CustomerReturnSystem() {
  const { addToast } = useToast();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [sales, setSales] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [returnQtys, setReturnQtys] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const data = await api.getSales(1, 30);
      setSales(data.sales || []);
    } catch (err) {
      addToast('Failed to load sales', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter((sale) =>
    sale.invoice_number.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
    (sale.customer_name && sale.customer_name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  );

  const handleSelectInvoice = (selectedInvoice) => {
    setInvoice(selectedInvoice);
    setReturnQtys({});
  };

  const updateReturnQty = (id, value, maxQty) => {
    const qty = Math.max(0, Math.min(Number(value), maxQty));
    setReturnQtys((prev) => ({ ...prev, [id]: qty }));
  };

  const totalRefund = useMemo(() => {
    if (!invoice) return 0;
    return invoice.items.reduce((total, item) => {
      return total + (returnQtys[item.product] || 0) * item.unitPrice;
    }, 0);
  }, [invoice, returnQtys]);

  const handleReturnFullBill = () => {
    if (!invoice) return;
    const fullQtys = {};
    invoice.items.forEach(item => {
      fullQtys[item.product] = item.quantity;
    });
    setReturnQtys(fullQtys);
  };

  const processReturn = async () => {
    const hasReturns = Object.values(returnQtys).some((qty) => qty > 0);

    if (!hasReturns) {
      addToast('Please select quantity to return', 'warning');
      return;
    }

    const returnItems = invoice.items.map(item => ({
      productId: item.product,
      productName: item.productName,
      returnQty: returnQtys[item.product] || 0,
      unitPrice: item.unitPrice
    }));

    try {
      await api.createReturn({
        originalInvoice: invoice.invoice_number,
        items: returnItems,
        reason: "Customer return"
      });

      setTimeout(() => {
        window.print();
        
        addToast('Return processed successfully!', 'success');
        setInvoice(null);
        setReturnQtys({});
        fetchSales();
      }, 150);
      
    } catch (err) {
      addToast(err.message || "Failed to process return", 'error');
    }
  };

  // VIEW 1: INVOICE LIST
  if (!invoice) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Customer Returns</h1>
            <p className="text-sm text-gray-500">Select an invoice to process a return</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 text-xs font-bold uppercase text-gray-500">Invoice</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-gray-500">Date</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-gray-500">Customer</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-gray-500 text-right">Amount</th>
                <th className="py-3 px-4 text-xs font-bold uppercase text-gray-500 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No invoices found</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} onClick={() => handleSelectInvoice(sale)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">
                          <FileText size={14} />
                        </div>
                        <span className="font-bold text-sm">{sale.invoice_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{sale.customer_name}</td>
                    <td className="py-3 px-4 text-right font-bold">{Rs(sale.total_amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs text-primary-600 font-semibold flex items-center justify-center gap-1">
                        View <ChevronRight size={14} />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // VIEW 2: RETURN FORM
  return (
    <div className="max-w-3xl mx-auto space-y-4 fade-in pb-8 print:max-w-full">

      <div className="flex justify-between items-center print:hidden">
        <button
          onClick={() => setInvoice(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium text-sm"
        >
          <ArrowLeft size={16} /> Back to Invoices
        </button>
        <button
          onClick={handleReturnFullBill}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
        >
          Return Full Bill
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:hidden">

        <div className="bg-primary-950 text-white p-5 flex justify-between items-center">
          <div>
            <p className="text-xs text-primary-300 uppercase tracking-wider">Return Invoice</p>
            <h2 className="text-2xl font-bold">{invoice.invoice_number}</h2>
          </div>
          <div className="text-right">
            <p className="font-semibold">{invoice.customer_name}</p>
            <p className="text-sm text-primary-300">{new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-5">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-3 text-xs font-bold uppercase text-gray-400">Medicine</th>
                <th className="text-center pb-3 text-xs font-bold uppercase text-gray-400">Qty</th>
                <th className="text-center pb-3 text-xs font-bold uppercase text-gray-400">Return</th>
                <th className="text-right pb-3 text-xs font-bold uppercase text-gray-400">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.items.map((item) => {
                const qty = returnQtys[item.product] || 0;
                return (
                  <tr key={item.product}>
                    <td className="py-3">
                      <p className="font-bold text-sm">{item.productName}</p>
                      <p className="text-xs text-gray-400">{Rs(item.unitPrice)}/unit</p>
                    </td>
                    <td className="py-3 text-center">
                      <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold">{item.quantity}</span>
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={qty}
                        onChange={(e) => updateReturnQty(item.product, e.target.value, item.quantity)}
                        className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm font-bold"
                      />
                    </td>
                    <td className="py-3 text-right font-black text-primary-600">{Rs(qty * item.unitPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 p-5 flex justify-between items-center border-t border-gray-100">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Refund</p>
            <p className="text-3xl font-black text-gray-900">{Rs(totalRefund)}</p>
          </div>
          <button
            onClick={processReturn}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700"
          >
            <RefreshCcw size={16} />
            Process Return & Print
          </button>
        </div>
      </div>

      {/* PRINT RECEIPT - Hidden normally, shows on print */}
      <div className="hidden print:block w-[80mm] mx-auto p-3 text-black font-sans text-[11px] leading-tight">
        <div className="text-center mb-3 border-b-2 border-black pb-2">
          <h1 className="text-lg font-black uppercase mb-1">{settings?.storeName || 'MedFlow Pharmacy'}</h1>
          <p className="text-[9px]">RETURN RECEIPT</p>
          <div className="mt-1 text-left text-[9px]">
            <p>Original Inv: {invoice.invoice_number}</p>
            <p>Return Date: {new Date().toLocaleString()}</p>
            <p>Customer: {invoice.customer_name}</p>
          </div>
        </div>

        <div className="border-b border-dashed border-black mb-2 pb-2">
          <div className="flex justify-between font-bold text-[9px] mb-1 border-b border-black pb-1">
            <span className="w-1/2">Item</span>
            <span className="w-1/4 text-center">Ret Qty</span>
            <span className="w-1/4 text-right">Refund</span>
          </div>
          {invoice.items.filter(i => returnQtys[i.product] > 0).map(i => (
            <div key={i.product} className="flex justify-between mb-0.5">
              <span className="w-1/2 text-[9px] line-clamp-1">{i.productName}</span>
              <span className="w-1/4 text-center text-[9px]">{returnQtys[i.product]}</span>
              <span className="w-1/4 text-right text-[9px]">{Rs((returnQtys[i.product] || 0) * i.unitPrice)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-0.5 mb-3 text-[10px]">
          <div className="flex justify-between font-black text-sm border-b border-black pb-1">
            <span>TOTAL REFUND</span>
            <span>{Rs(totalRefund)}</span>
          </div>
        </div>

        <div className="text-center text-[9px] italic pt-2 border-t border-black">
          <p className="font-bold">Refund Processed</p>
          <p>Please keep this receipt for your records.</p>
        </div>
      </div>

    </div>
  );
}