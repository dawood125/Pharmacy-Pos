import React, { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Wallet, Printer } from "lucide-react";

/* ───────────────── CONFIG ───────────────── */
const PRODUCTS_DATA = [
  { id: 1, name: "Paracetamol 500mg", price: 50, stock: 120, barcode: "1001", category: "Painkiller" },
  { id: 2, name: "Amoxicillin 250mg", price: 120, stock: 8, barcode: "1002", category: "Antibiotic" }, 
  { id: 3, name: "Cough Syrup (Sugar Free)", price: 180, stock: 45, barcode: "1003", category: "Syrup" },
  { id: 4, name: "Vitamin C Chewable", price: 90, stock: 200, barcode: "1004", category: "Vitamins" },
  { id: 5, name: "Ibuprofen 400mg", price: 65, stock: 80, barcode: "1005", category: "Painkiller" },
  { id: 6, name: "Omeprazole 20mg", price: 150, stock: 30, barcode: "1006", category: "Antacid" },
];

const Rs = (n) => `Rs ${Number(n || 0).toLocaleString()}`;
const generateInvoice = () => `INV-${Date.now().toString().slice(-6)}`;

export default function ProfessionalPOS() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [products, setProducts] = useState(PRODUCTS_DATA);
  const [cart, setCart] = useState([]);
  const [cash, setCash] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [invoiceNo, setInvoiceNo] = useState(generateInvoice());

  /* ───────────── LOGIC: DEBOUNCE & KEYBOARD ───────────── */
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

  /* ───────────── LOGIC: CART ACTIONS ───────────── */
  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id);
      if (exist) {
        if (exist.qty >= product.stock) return prev;
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
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

  const handleCheckout = () => {
    if (cart.length === 0 || (paymentMethod === "Cash" && cash < subtotal)) return;
    
    setProducts(prev => prev.map(p => {
      const item = cart.find(c => c.id === p.id);
      return item ? { ...p, stock: p.stock - item.qty } : p;
    }));

    window.print();
    setCart([]);
    setCash("");
    setInvoiceNo(generateInvoice());
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(debounced.toLowerCase()) || p.barcode.includes(debounced)
  );

  return (
    <div className="h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-12 gap-4 fade-in print:h-auto print:block">
      
      {/* ───────────────── PANE 1: PRODUCTS (Col 5) ───────────────── */}
      <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden print:hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or scan barcode... (F1)"
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className={`relative p-4 rounded-2xl border text-left transition-all active:scale-95 group
                  ${p.stock <= 0 
                    ? 'opacity-50 border-gray-100 bg-gray-50 cursor-not-allowed' 
                    : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-md hover:-translate-y-0.5'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-sm font-black text-primary-600">{Rs(p.price)}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 10 ? 'bg-emerald-400' : p.stock > 0 ? 'bg-amber-400' : 'bg-red-400'}`}></div>
                    <span className="text-[10px] font-bold text-gray-400">{p.stock}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ───────────────── PANE 2: CART TABLE (Col 4) ───────────────── */}
      <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden print:hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-gray-500" />
            <h2 className="font-bold text-gray-900">Current Cart</h2>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">
              Clear All
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <ShoppingCart size={32} className="mb-2 opacity-50" strokeWidth={1.5} />
              <p className="text-xs font-bold">Cart is empty</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400">Item</th>
                  <th className="px-2 py-3 text-[10px] font-bold uppercase text-gray-400 text-center">Qty</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400 text-right">Total</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cart.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50/50 group transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-sm text-gray-900 line-clamp-1">{i.name}</p>
                      <p className="text-xs font-medium text-gray-400">{Rs(i.price)}</p>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                        <button onClick={() => updateQty(i.id, -1, i.stock)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md"><Minus size={12} /></button>
                        <span className="w-6 text-center text-xs font-bold">{i.qty}</span>
                        <button onClick={() => updateQty(i.id, 1, i.stock)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md"><Plus size={12} /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-sm text-gray-900">
                      {Rs(i.price * i.qty)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button onClick={() => removeItem(i.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ───────────────── PANE 3: PAYMENT (Col 3) ───────────────── */}
      <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col print:hidden">
        <div className="p-6 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
          <p className="text-4xl font-display font-black text-gray-900">{Rs(subtotal)}</p>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { name: 'Cash', icon: Banknote },
              { name: 'EasyPaisa', icon: Wallet },
              { name: 'JazzCash', icon: CreditCard },
              { name: 'Bank', icon: CreditCard }
            ].map(method => (
              <button
                key={method.name}
                onClick={() => setPaymentMethod(method.name)}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all ${
                  paymentMethod === method.name
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <method.icon size={18} />
                <span className="text-[10px] font-bold uppercase">{method.name}</span>
              </button>
            ))}
          </div>

          {paymentMethod === 'Cash' && (
            <div className="space-y-3 mt-2">
              <input
                type="number"
                placeholder="Cash Received"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50 outline-none font-black text-xl text-center transition-all"
              />
              <div className="grid grid-cols-3 gap-2">
                {[subtotal, 1000, 5000].map(val => (
                  <button 
                    key={val} 
                    onClick={() => setCash(val)} 
                    className="py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {val === subtotal ? 'Exact' : Rs(val)}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase">Change Due</span>
                <span className={`text-xl font-black ${change < 0 ? 'text-red-500' : 'text-primary-600'}`}>{Rs(change)}</span>
              </div>
            </div>
          )}

          <div className="mt-auto pt-4">
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || (paymentMethod === 'Cash' && cash < subtotal)}
              className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
            >
              <Printer size={18} />
              Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────── PRINT RECEIPT ───────────────── */}
      <div className="hidden print:block w-[80mm] mx-auto p-4 text-black font-sans text-[12px] leading-tight bg-white">
        <div className="text-center mb-4 border-b-2 border-black pb-4">
          <h1 className="text-xl font-black uppercase mb-1">MedFlow Pharmacy</h1>
          <p className="text-[10px]">123 Health Avenue, Medical City</p>
          <div className="mt-2 text-left text-[10px]">
            <p>Invoice: {invoiceNo}</p>
            <p>Date: {new Date().toLocaleString()}</p>
            <p>Payment: {paymentMethod}</p>
          </div>
        </div>
        
        <div className="border-b border-dashed border-black mb-2 pb-2">
          <div className="flex justify-between font-bold text-[10px] mb-2 border-b border-black pb-1">
            <span className="w-1/2">Item</span>
            <span className="w-1/4 text-center">Qty</span>
            <span className="w-1/4 text-right">Total</span>
          </div>
          {cart.map(i => (
            <div key={i.id} className="flex justify-between mb-1">
              <span className="w-1/2 line-clamp-1">{i.name}</span>
              <span className="w-1/4 text-center">{i.qty}</span>
              <span className="w-1/4 text-right">{Rs(i.price * i.qty)}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-1 mb-4 text-[11px]">
          <div className="flex justify-between font-black text-sm border-b border-black pb-1">
            <span>TOTAL</span>
            <span>{Rs(subtotal)}</span>
          </div>
          {paymentMethod === 'Cash' && (
            <>
              <div className="flex justify-between text-gray-600 mt-1">
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
        
        <div className="text-center text-[10px] italic pt-2 border-t border-black">
          <p className="font-bold">Thank you!</p>
          <p>No return without receipt.</p>
        </div>
      </div>
    </div>
  );
}