import React, { useState, useMemo } from "react";
import { PlusCircle, Edit2, Trash2, Search, Package } from "lucide-react";

/* ───────────────────────── CONFIG & HELPERS ───────────────────────── */
const Rs = (n) => `Rs ${Number(n || 0).toLocaleString()}`;

export default function ProfessionalInventory() {
  const [form, setForm] = useState({
    name: "",
    batchNumber: "",
    expiry: "",
    purchasePrice: "",
    salePrice: "",
    quantity: "",
  });

  const [inventory, setInventory] = useState([
    { id: 1, name: "Paracetamol 500mg", batchNumber: "BATCH-001", expiry: "2026-05-20", purchasePrice: 40, salePrice: 50, quantity: 5 },
    { id: 2, name: "Amoxicillin 250mg", batchNumber: "BATCH-002", expiry: "2024-12-01", purchasePrice: 100, salePrice: 120, quantity: 50 },
  ]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

    setForm({ name: "", batchNumber: "", expiry: "", purchasePrice: "", salePrice: "", quantity: "" });
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this item?")) {
      setInventory(inventory.filter((item) => item.id !== id));
    }
  };

  const getStatus = (item) => {
    const today = new Date();
    const expiryDate = new Date(item.expiry);
    const diffMonths = (expiryDate - today) / (1000 * 60 * 60 * 24 * 30);

    if (item.quantity <= 0) return { label: "Out", color: "bg-red-50 text-red-600" };
    if (item.quantity < 10) return { label: "Low", color: "bg-orange-50 text-orange-600" };
    if (diffMonths < 3) return { label: "Expiring", color: "bg-amber-50 text-amber-600" };
    return null;
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 fade-in">
      
      {/* LEFT: FORM SECTION (33%) */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              {editId ? <Edit2 size={20} /> : <PlusCircle size={20} />}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {editId ? "Edit Item" : "Add Item"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Medicine Name"
                className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3 rounded-xl outline-none font-medium transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Batch #</label>
                <input
                  name="batchNumber"
                  value={form.batchNumber}
                  onChange={handleChange}
                  placeholder="Batch Number"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3 rounded-xl outline-none font-medium transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Expiry</label>
                <input
                  type="date"
                  name="expiry"
                  value={form.expiry}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3 rounded-xl outline-none font-medium transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Cost</label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={form.purchasePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3 rounded-xl outline-none font-medium transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Price</label>
                <input
                  type="number"
                  name="salePrice"
                  value={form.salePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3 rounded-xl outline-none font-medium transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0"
                className="w-full bg-gray-50 border border-gray-200 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-50 p-3 rounded-xl outline-none font-medium transition-all"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]
                  ${editId ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
              >
                {editId ? "Save Changes" : "Save Item"}
              </button>
            </div>
            
            {editId && (
              <button 
                type="button" 
                onClick={() => { setEditId(null); setForm({ name: "", batchNumber: "", expiry: "", purchasePrice: "", salePrice: "", quantity: "" }); }}
                className="w-full text-gray-400 text-xs font-bold uppercase hover:text-gray-700 transition-colors py-2"
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </div>

      {/* RIGHT: INVENTORY TABLE (66%) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 pl-2">Inventory</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2.5 pl-9 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary-400 focus:bg-white outline-none font-medium text-sm transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-5 py-4 text-[11px] font-bold uppercase text-gray-400">Item</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase text-gray-400">Batch #</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase text-gray-400">Price</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase text-gray-400">Stock</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">
                      <Package size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-sm">No items found</p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const status = getStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-3">
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs font-medium text-gray-400">Exp: {item.expiry}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {item.batchNumber || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-bold text-gray-900">{Rs(item.salePrice)}</p>
                          <p className="text-[10px] text-gray-400 font-medium">Cost: {Rs(item.purchasePrice)}</p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{item.quantity}</span>
                            {status && (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${status.color}`}>
                                {status.label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setForm(item); setEditId(item.id); }}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
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