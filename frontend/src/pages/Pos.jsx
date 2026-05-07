import React, { useEffect, useMemo, useRef, useState } from "react";

/* ───────────────── CONFIG ───────────────── */
const PRODUCTS_DATA = [
  { id: 1, name: "Paracetamol 500mg", price: 50, stock: 120, barcode: "1001" },
  { id: 2, name: "Amoxicillin 250mg", price: 120, stock: 8, barcode: "1002" }, // Low stock
  { id: 3, name: "Cough Syrup (Sugar Free)", price: 180, stock: 45, barcode: "1003" },
  { id: 4, name: "Vitamin C Chewable", price: 90, stock: 200, barcode: "1004" },
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
      if (e.key === "F1") { e.preventDefault(); document.getElementById("search").focus(); }
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); handleCheckout(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cart, cash]);

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

  const subtotal = useMemo(() => cart.reduce((a, i) => a + i.price * i.qty, 0), [cart]);
  const change = cash ? Number(cash) - subtotal : 0;

  const handleCheckout = () => {
    if (cart.length === 0 || (paymentMethod === "Cash" && cash < subtotal)) return;
    
    // Update master stock
    setProducts(prev => prev.map(p => {
      const item = cart.find(c => c.id === p.id);
      return item ? { ...p, stock: p.stock - item.qty } : p;
    }));

    window.print();
    // Reset after print
    setCart([]);
    setCash("");
    setInvoiceNo(generateInvoice());
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(debounced.toLowerCase()) || p.barcode.includes(debounced)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-4rem)]">
        
        {/* LEFT: PRODUCT DISCOVERY (66%) */}
        <div className="lg:col-span-8 flex flex-col space-y-6 print:hidden">
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="text-xl">🔍</span>
            </div>
            <input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Scan barcode or type medicine name... (F1)"
              className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent shadow-sm rounded-3xl focus:border-green-500 focus:ring-0 outline-none transition-all text-lg font-medium"
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  className={`relative p-5 bg-white rounded-[2rem] border-2 text-left transition-all active:scale-95 group shadow-sm
                    ${p.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'border-white hover:border-green-500 hover:shadow-md'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-black">
                      {Rs(p.price)}
                    </span>
                    {p.stock < 10 && p.stock > 0 && (
                      <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-[10px] font-bold uppercase animate-pulse">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-700 leading-tight group-hover:text-green-600 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter">Stock: {p.stock} units</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: CART & BILLING (34%) */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-50 flex flex-col overflow-hidden print:hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h2 className="font-black text-xl tracking-tight">CURRENT CART</h2>
            <button onClick={() => setCart([])} className="text-xs font-bold text-red-400 hover:text-red-600 uppercase">Clear</button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <span className="text-4xl mb-2">📦</span>
                <p className="text-xs font-bold uppercase tracking-widest">Cart is empty</p>
              </div>
            ) : (
              cart.map((i) => (
                <div key={i.id} className="flex items-center justify-between group animate-in fade-in slide-in-from-right-4">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800">{i.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{Rs(i.price)} / unit</p>
                  </div>
                  
                  <div className="flex items-center bg-slate-100 rounded-xl px-2 py-1">
                    <button onClick={() => updateQty(i.id, -1, i.stock)} className="w-6 h-6 font-bold text-slate-500 hover:text-green-600">-</button>
                    <span className="w-8 text-center text-sm font-black text-slate-700">{i.qty}</span>
                    <button onClick={() => updateQty(i.id, 1, i.stock)} className="w-6 h-6 font-bold text-slate-500 hover:text-green-600">+</button>
                  </div>
                  
                  <button onClick={() => removeItem(i.id)} className="ml-4 text-slate-300 hover:text-red-500 transition-colors">✕</button>
                </div>
              ))
            )}
          </div>

          {/* Checkout Panel */}
          <div className="p-6 bg-slate-50 space-y-4">
            <div className="flex justify-between items-end border-b-2 border-dashed border-slate-200 pb-4">
              <span className="text-slate-500 font-bold uppercase text-xs">Total Amount</span>
              <span className="text-3xl font-black text-green-600">{Rs(subtotal)}</span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                {['Cash', 'Easypaisa', 'Bank'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all
                      ${paymentMethod === method ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-white text-slate-400 border border-slate-200'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {paymentMethod === 'Cash' && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[subtotal, 500, 1000].map(val => (
                      <button key={val} onClick={() => setCash(val)} className="flex-1 bg-white border border-slate-200 py-1 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100">
                        {val === subtotal ? 'Exact' : Rs(val)}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Cash Received"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-green-500 outline-none font-black text-center"
                  />
                  {cash > 0 && (
                    <div className="flex justify-between px-2">
                      <span className="text-xs font-bold text-slate-400">Change Due:</span>
                      <span className={`text-xs font-black ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>{Rs(change)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || (paymentMethod === 'Cash' && cash < subtotal)}
              className="w-full bg-green-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-100 hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              FINALIZE & PRINT
            </button>
          </div>
        </div>

        {/* PRINT AREA (Hidden on UI) */}
        <div className="hidden print:block w-[80mm] mx-auto p-4 text-black font-mono text-[12px] leading-tight">
          <div className="text-center mb-4 border-b-2 border-black pb-2">
            <h1 className="text-lg font-black uppercase">MediStock Pharma</h1>
            <p>Invoice: {invoiceNo}</p>
            <p>{new Date().toLocaleString()}</p>
          </div>
          <div className="border-b border-dashed border-black mb-2">
            {cart.map(i => (
              <div key={i.id} className="flex justify-between mb-1">
                <span>{i.name} x{i.qty}</span>
                <span>{Rs(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-black text-sm mb-4">
            <span>TOTAL</span>
            <span>{Rs(subtotal)}</span>
          </div>
          <div className="text-center text-[10px] uppercase italic">
            <p>Thank you for your visit</p>
            <p>Please keep this receipt</p>
          </div>
        </div>

      </div>
    </div>
  );
}