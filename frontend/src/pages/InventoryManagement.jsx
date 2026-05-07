import React, { useState, useMemo } from "react";

/* ───────────────────────── CONFIG & HELPERS ───────────────────────── */
const Rs = (n) => `Rs ${Number(n || 0).toLocaleString()}`;

export default function ProfessionalInventory() {
  const [form, setForm] = useState({
    name: "",
    expiry: "",
    purchasePrice: "",
    salePrice: "",
    quantity: "",
  });

  const [inventory, setInventory] = useState([
    { id: 1, name: "Paracetamol 500mg", expiry: "2026-05-20", purchasePrice: 40, salePrice: 50, quantity: 5 }, // Low Stock
    { id: 2, name: "Amoxicillin 250mg", expiry: "2024-12-01", purchasePrice: 100, salePrice: 120, quantity: 50 }, // Expiring
  ]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  /* ───────────── LOGIC ───────────── */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const margin = useMemo(() => {
    if (!form.purchasePrice || !form.salePrice) return 0;
    const diff = form.salePrice - form.purchasePrice;
    return ((diff / form.purchasePrice) * 100).toFixed(1);
  }, [form.purchasePrice, form.salePrice]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newItem = {
      ...form,
      id: editId || Date.now(),
      purchasePrice: Number(form.purchasePrice),
      salePrice: Number(form.salePrice),
      quantity: Number(form.quantity),
    };

    if (editId) {
      setInventory(inventory.map((item) => (item.id === editId ? newItem : item)));
      setEditId(null);
    } else {
      setInventory([newItem, ...inventory]);
    }

    setForm({ name: "", expiry: "", purchasePrice: "", salePrice: "", quantity: "" });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this medicine from records?")) {
      setInventory(inventory.filter((item) => item.id !== id));
    }
  };

  const getStatus = (item) => {
    const today = new Date();
    const expiryDate = new Date(item.expiry);
    const diffMonths = (expiryDate - today) / (1000 * 60 * 60 * 24 * 30);

    if (item.quantity <= 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (item.quantity < 10) return { label: "Low Stock", color: "bg-orange-100 text-orange-700" };
    if (diffMonths < 3) return { label: "Expiring Soon", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Healthy", color: "bg-green-100 text-green-700" };
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: FORM SECTION (33%) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 sticky top-10 border border-white">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">
                {editId ? "Edit Medicine" : "New Entry"}
              </h2>
              <p className="text-slate-400 text-sm font-medium">Update your pharmacy stock</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Medicine Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Panadol CF"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-green-500 focus:bg-white p-4 rounded-2xl outline-none transition-all font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Expiry Date</label>
                <input
                  type="date"
                  name="expiry"
                  value={form.expiry}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-green-500 focus:bg-white p-4 rounded-2xl outline-none transition-all font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Purchase (Rs)</label>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={form.purchasePrice}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-green-500 focus:bg-white p-4 rounded-2xl outline-none transition-all font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Sale (Rs)</label>
                  <input
                    type="number"
                    name="salePrice"
                    value={form.salePrice}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-green-500 focus:bg-white p-4 rounded-2xl outline-none transition-all font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center px-2 py-1">
                <span className="text-xs font-bold text-slate-400">Estimated Margin:</span>
                <span className={`text-xs font-black ${margin > 0 ? 'text-green-600' : 'text-red-500'}`}>{margin}%</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Stock Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="Units"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-green-500 focus:bg-white p-4 rounded-2xl outline-none transition-all font-bold text-xl"
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full py-5 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95
                  ${editId ? 'bg-blue-500 shadow-blue-100 text-white' : 'bg-green-500 shadow-green-100 text-white hover:bg-green-600'}`}
              >
                {editId ? "SAVE CHANGES" : "ADD TO INVENTORY"}
              </button>
              
              {editId && (
                <button 
                  type="button" 
                  onClick={() => { setEditId(null); setForm({ name: "", expiry: "", purchasePrice: "", salePrice: "", quantity: "" }); }}
                  className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </div>

        {/* RIGHT: INVENTORY TABLE (66%) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-3xl font-black tracking-tighter italic">STOCK<span className="text-green-500">MASTER</span></h2>
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Quick search medicines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-4 pl-12 bg-white rounded-2xl border-2 border-transparent focus:border-green-500 outline-none shadow-sm font-bold transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold italic">🔍</span>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Medicine Details</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Financials</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Status</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">No matching stock found</td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const status = getStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-green-50/30 transition-colors group">
                        <td className="p-6">
                          <p className="font-black text-slate-800 text-lg">{item.name}</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Expires: {item.expiry}</p>
                        </td>
                        <td className="p-6">
                          <p className="text-sm font-bold text-slate-600"><span className="text-[10px] uppercase text-slate-300 mr-1">Sale</span> {Rs(item.salePrice)}</p>
                          <p className="text-xs text-slate-400"><span className="text-[10px] uppercase text-slate-300 mr-1">Cost</span> {Rs(item.purchasePrice)}</p>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-2">
                            <span className="text-xl font-black text-slate-800">{item.quantity} <span className="text-[10px] text-slate-400 uppercase">units</span></span>
                            <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setForm(item); setEditId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              className="bg-slate-100 hover:bg-blue-500 hover:text-white p-3 rounded-xl transition-all"
                              title="Edit Item"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="bg-slate-100 hover:bg-red-500 hover:text-white p-3 rounded-xl transition-all"
                              title="Delete Item"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}