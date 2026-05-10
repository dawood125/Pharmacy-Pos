import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Wallet, Printer } from "lucide-react";
import { api } from "../api/api";
import { useToast } from "../common/Toast";
import { useSettings } from "../common/SettingsContext";

const Rs = (n) => `Rs ${Number(n || 0).toLocaleString()}`;
const generateInvoice = () => `INV-${Date.now().toString().slice(-6)}`;

export default function ProfessionalPOS() {
  const { addToast } = useToast();
  const { settings } = useSettings();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cash, setCash] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [invoiceNo, setInvoiceNo] = useState(generateInvoice());
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  const fetchProducts = useCallback(async (searchTerm = "") => {
    try {
      const data = await api.getProducts(searchTerm);
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "F1") { e.preventDefault(); document.getElementById("search")?.focus(); }
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); handleCheckout(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cart, cash, paymentMethod]);

  const addToCart = (product) => {
    if (product.quantity <= 0) return;
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id);
      if (exist) {
        if (exist.qty >= product.quantity) return prev;
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: product.sale_price, qty: 1, stock: product.quantity }];
    });
  };

  const updateQty = (id, delta, stock) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return (newQty > 0 && newQty <= stock) ? { ...i, qty: newQty } : i;
      }
      return i;
    }));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

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

      fetchProducts(debounced);

      // Print the receipt
      setTimeout(() => {
        window.print();
        
        addToast('Sale completed successfully!', 'success');
        setCart([]);
        setCash("");
        setInvoiceNo(generateInvoice());
        setPrinting(false);
      }, 150);
      
    } catch (err) {
      addToast(err.message || "Failed to process sale", 'error');
      setPrinting(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(debounced.toLowerCase()) || (p.barcode && p.barcode.includes(debounced))
  );

  return (
    <div className="h-[calc(100vh-3rem)] grid grid-cols-1 lg:grid-cols-12 gap-3 fade-in print:h-auto print:block">

      {/* PRODUCTS PANE */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden print:hidden">
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or scan barcode... (F1)"
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.quantity <= 0}
                  className={`relative p-3 rounded-xl border text-left transition-all active:scale-95 group ${
                    p.quantity <= 0
                      ? 'opacity-50 border-gray-100 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-md'
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

      {/* CART PANE */}
      <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden print:hidden">
        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-gray-500" />
            <h2 className="font-bold text-gray-900 text-sm">Current Cart</h2>
            {cart.length > 0 && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                {cart.length} items
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">
              Clear
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
      </div>

      {/* PAYMENT PANE */}
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col print:hidden">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
          <p className="text-3xl font-display font-black text-gray-900">{Rs(subtotal)}</p>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { name: 'Cash', icon: Banknote },
              { name: 'EasyPaisa', icon: Wallet },
              { name: 'JazzCash', icon: CreditCard },
              { name: 'Bank', icon: CreditCard }
            ].map(method => (
              <button
                key={method.name}
                onClick={() => setPaymentMethod(method.name)}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl border text-xs font-bold transition-all ${
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
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Cash Received"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-400 outline-none font-bold text-center text-lg"
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
                Print & Complete
              </>
            )}
          </button>
        </div>
      </div>

      {/* PRINT RECEIPT - Hidden normally, shows on print */}
      <div className="hidden print:block w-[80mm] mx-auto p-3 text-black font-sans text-[11px] leading-tight">
        <div className="text-center mb-3 border-b-2 border-black pb-2">
          <h1 className="text-lg font-black uppercase mb-1">{settings.storeName || 'MedFlow Pharmacy'}</h1>
          <p className="text-[9px]">{settings.storeAddress || '123 Health Avenue, Medical City'}</p>
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