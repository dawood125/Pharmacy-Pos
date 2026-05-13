import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Wallet, Printer, X } from "lucide-react";
import { api } from "../api/api";
import { useToast } from "../common/Toast";
import { useCart } from "../common/CartContext";

const Rs = (n) => `Rs ${Number(n || 0).toLocaleString()}`;
const generateInvoice = () => `INV-${Date.now().toString().slice(-6)}`;
const SUGGEST_LIMIT = 15;
const GRID_PAGE_SIZE = 100;

export default function ProfessionalPOS() {
  const { addToast } = useToast();
  const {
    cart, addToCart, updateQty, removeItem, clearCart,
    paymentMethod, setPaymentMethod, cash, setCash
  } = useCart();

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [invoiceNo, setInvoiceNo] = useState(generateInvoice());
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const searchWrapRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProducts("", 1, GRID_PAGE_SIZE);
      const sorted = (data.products || []).sort((a, b) => a.name.localeCompare(b.name));
      setProducts(sorted);
    } catch (err) {
      addToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSuggestions([]);
      setHighlightIndex(-1);
      setSuggestLoading(false);
      fetchProducts();
      return;
    }

    setSuggestLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.getProducts(q, 1, SUGGEST_LIMIT);
        const sorted = (data.products || []).sort((a, b) => a.name.localeCompare(b.name));
        setSuggestions(sorted);
        setHighlightIndex(sorted.length ? 0 : -1);
        setProducts(sorted);
      } catch {
        addToast('Search failed', 'error');
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [search, fetchProducts, addToast]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pickSuggestion = useCallback((p) => {
    if (p.quantity > 0) addToCart(p);
    else addToast("Out of stock", "warning");
    setSearch("");
    setSuggestions([]);
    setHighlightIndex(-1);
    fetchProducts();
  }, [addToCart, addToast, fetchProducts]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "F1") { e.preventDefault(); document.getElementById("search")?.focus(); }
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); handleCheckout(); }
      if (e.key === "Escape" && cart.length > 0) { handleCancelCart(); }
      if (e.ctrlKey && e.key === "x") { e.preventDefault(); handleCancelCart(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cart, cash, paymentMethod]);

  const handleSearchKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(suggestions.length - 1, i + 1 < 0 ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = highlightIndex >= 0 ? highlightIndex : 0;
      if (suggestions[idx]) pickSuggestion(suggestions[idx]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setHighlightIndex(-1);
    }
  };

  const handleCancelCart = () => {
    if (cart.length > 0 && window.confirm("Are you sure you want to cancel the cart? All items will be removed.")) {
      clearCart();
      setInvoiceNo(generateInvoice());
      addToast('Cart cancelled', 'success');
    }
  };

  const subtotal = useMemo(() => cart.reduce((a, i) => a + i.price * i.qty, 0), [cart]);
  const change = cash ? Number(cash) - subtotal : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty', 'warning');
      return;
    }
    if (paymentMethod === "Cash" && (!cash || Number(cash) < subtotal)) {
      addToast('Please enter sufficient cash', 'warning');
      return;
    }

    setPrinting(true);
    try {
      const saleData = {
        items: cart.map(item => ({ id: item.id, name: item.name, qty: item.qty })),
        paymentMethod: paymentMethod.toLowerCase(),
        cashReceived: paymentMethod === "Cash" ? Number(cash) : null,
        customerName: "Walk-in Customer"
      };

      await api.createSale(saleData);

      fetchProducts();

      window.print();

      addToast('Sale completed successfully!', 'success');
      clearCart();
      setInvoiceNo(generateInvoice());
      setSearch("");
      setSuggestions([]);
    } catch (err) {
      addToast(err.message || "Failed to process sale", 'error');
    } finally {
      setPrinting(false);
    }
  };

  const showDropdown = search.trim().length > 0 && (suggestLoading || suggestions.length > 0);

  return (
    <div className="h-full flex gap-3 p-3">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100 relative z-20" ref={searchWrapRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search product... (F1)"
              autoComplete="off"
              autoFocus
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-400 outline-none transition-all text-sm font-medium"
            />
            {showDropdown && (
              <ul className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-30 custom-scrollbar">
                {suggestLoading && suggestions.length === 0 && (
                  <li className="px-3 py-2 text-xs text-gray-500">Searching…</li>
                )}
                {suggestions.map((p, idx) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSuggestion(p)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 text-sm ${
                        idx === highlightIndex ? "bg-primary-50" : "hover:bg-gray-50"
                      } ${p.quantity <= 0 ? "opacity-50" : ""}`}
                    >
                      <span className="font-semibold text-gray-900 truncate">{p.name}</span>
                      <span className="shrink-0 text-xs font-black text-primary-600">{Rs(p.sale_price)}</span>
                    </button>
                  </li>
                ))}
                {!suggestLoading && suggestions.length === 0 && (
                  <li className="px-3 py-2 text-xs text-gray-500">No matches</li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.quantity <= 0}
                  className={`relative p-3 rounded-xl border text-left transition-all active:scale-95 ${
                    p.quantity <= 0
                      ? 'opacity-50 border-gray-100 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-md hover:bg-primary-50/30'
                  }`}
                >
                  <span className="font-bold text-gray-900 text-sm line-clamp-2 block">
                    {p.name}
                  </span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-black text-primary-600">{Rs(p.sale_price)}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.quantity > 10 ? 'bg-emerald-400' : p.quantity > 0 ? 'bg-amber-400' : 'bg-red-400'}`}></div>
                      <span className="text-[10px] font-bold text-gray-400">{p.quantity}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-gray-500" />
            <h2 className="font-bold text-gray-900 text-sm">Current Cart</h2>
            {cart.length > 0 && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleCancelCart}
              className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
              title="Cancel (Esc)"
            >
              <X size={14} /> Cancel
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 p-4">
              <ShoppingCart size={40} className="mb-2 opacity-30" strokeWidth={1.5} />
              <p className="text-xs font-bold text-center">Cart is empty<br/>Click products to add</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase text-gray-400">Item</th>
                  <th className="px-2 py-2 text-[10px] font-bold uppercase text-gray-400 text-center">Qty</th>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase text-gray-400 text-right">Total</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cart.map((i) => (
                  <tr key={i.id} className="group hover:bg-gray-50/50">
                    <td className="px-3 py-2">
                      <p className="font-bold text-xs text-gray-900 line-clamp-1">{i.name}</p>
                      <p className="text-[10px] font-medium text-gray-400">{Rs(i.price)}</p>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-0.5 bg-white border border-gray-200 rounded-lg p-0.5">
                        <button onClick={() => updateQty(i.id, -1, i.stock)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-primary-600 rounded"><Minus size={10} /></button>
                        <span className="w-5 text-center text-xs font-bold">{i.qty}</span>
                        <button onClick={() => updateQty(i.id, 1, i.stock)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-primary-600 rounded"><Plus size={10} /></button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-xs text-gray-900">
                      {Rs(i.price * i.qty)}
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => removeItem(i.id)} className="p-1 text-gray-300 hover:text-red-500 rounded">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-3 border-t border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
            <p className="text-2xl font-black text-gray-900">{Rs(subtotal)}</p>
          </div>

          <div className="grid grid-cols-4 gap-1 mb-3">
            {[
              { name: 'Cash', icon: Banknote },
              { name: 'EasyPaisa', icon: Wallet },
              { name: 'JazzCash', icon: CreditCard },
              { name: 'Bank', icon: CreditCard }
            ].map(method => (
              <button
                key={method.name}
                onClick={() => setPaymentMethod(method.name)}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                  paymentMethod === method.name
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <method.icon size={14} />
                {method.name}
              </button>
            ))}
          </div>

          {paymentMethod === 'Cash' && (
            <div className="space-y-2 mb-3">
              <input
                type="number"
                placeholder="Cash Received"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-400 outline-none font-bold text-center text-lg"
              />
              <div className="flex gap-1">
                {[subtotal, 500, 1000, 2000, 5000].map(val => (
                  <button
                    key={val}
                    onClick={() => setCash(val)}
                    className="flex-1 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50"
                  >
                    {val === subtotal ? 'Exact' : Rs(val)}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400">Change</span>
                <span className={`text-lg font-black ${change < 0 ? 'text-red-500' : 'text-primary-600'}`}>
                  {Rs(change)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || (paymentMethod === 'Cash' && (!cash || Number(cash) < subtotal)) || printing}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
          >
            {printing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Printer size={16} />
                Print & Complete (Ctrl+P)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="hidden print:block w-[80mm] mx-auto p-3 text-black font-sans text-[11px] leading-tight">
        <div className="text-center mb-3 border-b-2 border-black pb-2">
          <h1 className="text-lg font-black uppercase mb-1">MedFlow Pharmacy</h1>
          <p className="text-[9px]">123 Health Avenue, Medical City</p>
          <div className="mt-1 text-left text-[9px]">
            <p>Invoice: {invoiceNo}</p>
            <p>Date: {new Date().toLocaleString()}</p>
            <p>Payment: {paymentMethod}</p>
          </div>
        </div>

        <div className="border-b border-dashed border-black mb-2 pb-2">
          <div className="flex justify-between font-bold text-[9px] mb-1 border-b border-black pb-1">
            <span className="w-1/2">Item</span>
            <span className="w-1/4 text-center">Qty</span>
            <span className="w-1/4 text-right">Total</span>
          </div>
          {cart.map(i => (
            <div key={i.id} className="flex justify-between mb-0.5">
              <span className="w-1/2 text-[9px] line-clamp-1">{i.name}</span>
              <span className="w-1/4 text-center text-[9px]">{i.qty}</span>
              <span className="w-1/4 text-right text-[9px]">{Rs(i.price * i.qty)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-0.5 mb-3 text-[10px]">
          <div className="flex justify-between font-black text-sm border-b border-black pb-1">
            <span>TOTAL</span>
            <span>{Rs(subtotal)}</span>
          </div>
          {paymentMethod === 'Cash' && cash && (
            <>
              <div className="flex justify-between text-gray-600">
                <span>Cash</span>
                <span>{Rs(cash)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Change</span>
                <span>{Rs(change)}</span>
              </div>
            </>
          )}
        </div>

        <div className="text-center text-[9px] italic pt-2 border-t border-black">
          <p className="font-bold">Thank you!</p>
          <p>No return without receipt.</p>
        </div>
      </div>
    </div>
  );
}
