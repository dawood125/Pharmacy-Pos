import React, { useState, useMemo, useEffect, useCallback } from "react";
import { PlusCircle, Edit2, Trash2, Search, Package, X } from "lucide-react";
import { api } from "../api/api";
import { useToast } from "../common/Toast";

const Rs = (n) => {
  const x = Number(n);
  return `Rs ${(Number.isFinite(x) ? x : 0).toLocaleString()}`;
};

const PAGE_SIZE = 15;

/** Local calendar date YYYY-MM-DD (avoids UTC vs local mismatch for expiry checks). */
function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MEDICINE_CATEGORIES = [
  'Painkiller',
  'Antibiotic',
  'Syrup',
  'Vitamins',
  'Antacid',
  'Cardiac',
  'Diabetes care',
  'Dermatology',
  'Gastrointestinal',
  'Respiratory',
  'Herbal / Unani',
  'OTC / General',
  'Injection',
  'Other'
];

const OTHER_CATEGORY = 'Other';

function expiryYmd(item) {
  if (!item.expiry_date) return null;
  return String(item.expiry_date).slice(0, 10);
}

export default function ProfessionalInventory() {
  const { addToast } = useToast();
  const defaultForm = {
    name: "", batchNumber: "", barcode: "", category: "", categoryOther: "",
    expiry: "", purchasePrice: "", salePrice: "", quantity: "", lowStockThreshold: 10,
    piecesPerPack: 1, manufacturer: "", rackNumber: "", minDiscount: 0, maxDiscount: 100, isPrintable: true
  };
  const [form, setForm] = useState(defaultForm);
  const [inventory, setInventory] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(search, page, PAGE_SIZE);
      setInventory(data.products || []);
      setTotalPages(Math.max(1, data.totalPages || 1));
      setTotal(data.total ?? 0);
    } catch (err) {
      addToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, page, addToast]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page, fetchInventory]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const margin = useMemo(() => {
    if (!form.purchasePrice || !form.salePrice) return 0;
    return (((form.salePrice - form.purchasePrice) / form.purchasePrice) * 100).toFixed(1);
  }, [form.purchasePrice, form.salePrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) {
      addToast('Please select a category', 'warning');
      return;
    }
    let category = form.category;
    if (category === OTHER_CATEGORY) {
      category = (form.categoryOther || '').trim();
      if (!category) {
        addToast('Please type the category name when you choose Other', 'warning');
        return;
      }
    }
    const purchasePrice = Number(form.purchasePrice);
    const salePrice = Number(form.salePrice);
    if (!Number.isFinite(purchasePrice) || !Number.isFinite(salePrice) || salePrice <= purchasePrice) {
      addToast('Selling price must be higher than cost price', 'warning');
      return;
    }
    try {
      const productData = {
        name: form.name,
        barcode: form.barcode || undefined,
        batchNumber: form.batchNumber || undefined,
        category,
        purchasePrice,
        salePrice,
        quantity: Number(form.quantity),
        expiryDate: form.expiry || undefined,
        lowStockThreshold: Number(form.lowStockThreshold) || 10,
        piecesPerPack: Number(form.piecesPerPack) || 1,
        manufacturer: form.manufacturer || undefined,
        rackNumber: form.rackNumber || undefined,
        minDiscount: Number(form.minDiscount) || 0,
        maxDiscount: Number(form.maxDiscount) || 100,
        isPrintable: form.isPrintable ? 1 : 0
      };

      if (editId) {
        await api.updateProduct(editId, productData);
        addToast('Product updated successfully', 'success');
      } else {
        await api.createProduct(productData);
        addToast('Product added successfully', 'success');
      }

      setForm(defaultForm);
      setEditId(null);
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      addToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleDelete = async (id, itemName) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      try {
        await api.deleteProduct(id);
        addToast('Product deleted successfully', 'success');
        fetchInventory();
      } catch (err) {
        addToast(err.message || 'Failed to delete product', 'error');
      }
    }
  };

  const handleEdit = (item) => {
    const rawCat = item.category || '';
    const usePreset = rawCat && MEDICINE_CATEGORIES.includes(rawCat) && rawCat !== OTHER_CATEGORY;
    const presetCat = usePreset ? rawCat : (rawCat ? OTHER_CATEGORY : '');
    setForm({
      name: item.name,
      batchNumber: item.batch_number || "",
      barcode: item.barcode || "",
      category: presetCat,
      categoryOther: usePreset ? '' : rawCat,
      expiry: item.expiry_date ? item.expiry_date.split('T')[0] : "",
      purchasePrice: item.purchase_price,
      salePrice: item.sale_price,
      quantity: item.quantity,
      lowStockThreshold: item.low_stock_threshold || 10,
      piecesPerPack: item.pieces_per_pack || 1,
      manufacturer: item.manufacturer || "",
      rackNumber: item.rack_number || "",
      minDiscount: item.min_discount !== null ? item.min_discount : 0,
      maxDiscount: item.max_discount !== null ? item.max_discount : 100,
      isPrintable: item.is_printable !== 0
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const getStatus = (item) => {
    const today = todayYmd();
    const exp = expiryYmd(item);

    if (item.quantity <= 0) {
      return { label: "Out", color: "bg-red-50 text-red-600" };
    }
    if (exp && exp < today) {
      return { label: "Expired batch", color: "bg-red-100 text-red-800" };
    }
    if (item.quantity < (item.low_stock_threshold || 10)) {
      return { label: "Low", color: "bg-orange-50 text-orange-600" };
    }
    if (exp) {
      const expMid = new Date(`${exp}T12:00:00`);
      const tMid = new Date(`${today}T12:00:00`);
      const daysUntil = (expMid - tMid) / (1000 * 60 * 60 * 24);
      if (daysUntil >= 0 && daysUntil <= 30) {
        return { label: "Expiring", color: "bg-amber-50 text-amber-600" };
      }
    }
    return null;
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col fade-in">
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{total} items</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:border-primary-400"
            />
          </div>
          <button
            onClick={() => { setEditId(null); setForm(defaultForm); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
          >
            <PlusCircle size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
            <Package size={48} className="mb-2 opacity-30" />
            <p className="text-sm font-medium">No items found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Item</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Manufacturer</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Price</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Location</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Expiry</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map((item) => {
                const status = getStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3">
                      <p className="font-bold text-sm text-gray-900">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{item.category || 'Uncategorized'} {item.barcode && `· ${item.barcode}`}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-gray-700">{item.manufacturer || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-sm text-gray-900">{Rs(item.sale_price)}</p>
                      <p className="text-[10px] text-gray-400">Cost: {Rs(item.purchase_price)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.rack_number || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{item.quantity}</span>
                          {status && (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${status.color}`}>{status.label}</span>
                          )}
                        </div>
                        {item.pieces_per_pack > 1 && (
                          <span className="text-[9px] text-gray-400">{item.pieces_per_pack} / pack</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {item.expiry_date ? item.expiry_date.split('T')[0] : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                          <Edit2 size={14} />
                        </button>
                        <button type="button" onClick={() => handleDelete(item.id, item.name)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-100 bg-white shrink-0">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">{editId ? 'Edit Medicine' : 'Add New Medicine'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Medicine Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold" placeholder="E.g. Panadol" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Manufacturer</label>
                  <input name="manufacturer" value={form.manufacturer} onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="E.g. GSK" />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Category *</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                  >
                    <option value="">Select category…</option>
                    {MEDICINE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {form.category === OTHER_CATEGORY && (
                    <input
                      name="categoryOther"
                      value={form.categoryOther}
                      onChange={handleChange}
                      placeholder="Type category name"
                      className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                    />
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Location / Rack</label>
                  <input name="rackNumber" value={form.rackNumber} onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="E.g. A12" />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Barcode</label>
                  <input name="barcode" value={form.barcode} onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="Scan or type" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Batch #</label>
                  <input name="batchNumber" value={form.batchNumber} onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="Batch" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Expiry Date</label>
                  <input type="date" name="expiry" value={form.expiry} onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm" />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-4 gap-4 p-3 bg-blue-50 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-blue-700 uppercase">Cost *</label>
                  <input type="number" step="0.01" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} required
                    className="w-full bg-white border border-blue-200 rounded-lg p-2 text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-blue-700 uppercase">Sale Price *</label>
                  <input type="number" step="0.01" name="salePrice" value={form.salePrice} onChange={handleChange} required
                    className="w-full bg-white border border-blue-200 rounded-lg p-2 text-sm font-bold text-blue-900" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-blue-700 uppercase">Total Stock *</label>
                  <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required
                    className="w-full bg-white border border-blue-200 rounded-lg p-2 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-blue-700 uppercase">Pcs / Pack</label>
                  <input type="number" min="1" name="piecesPerPack" value={form.piecesPerPack} onChange={handleChange}
                    className="w-full bg-white border border-blue-200 rounded-lg p-2 text-sm" placeholder="1" />
                </div>
              </div>

              {Number(margin) > 0 && (
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-center">
                  Est. Profit Margin: {margin}%
                </div>
              )}

              {/* Row 5 */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Reorder Alert At</label>
                  <input type="number" name="lowStockThreshold" value={form.lowStockThreshold} onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs" placeholder="10" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Min Discount %</label>
                  <input type="number" min="0" max="100" name="minDiscount" value={form.minDiscount} onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs" placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Max Discount %</label>
                  <input type="number" min="0" max="100" name="maxDiscount" value={form.maxDiscount} onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs" placeholder="100" />
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="isPrintable" 
                  name="isPrintable" 
                  checked={form.isPrintable} 
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="isPrintable" className="text-sm font-medium text-gray-700">
                  Show on printed receipt (Uncheck for restricted medicines)
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="w-1/3 py-2.5 rounded-xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className={`w-2/3 py-2.5 rounded-xl font-semibold text-white shadow-sm ${editId ? 'bg-gray-900 hover:bg-black' : 'bg-primary-600 hover:bg-primary-700'}`}>
                  {editId ? 'Save Changes' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
