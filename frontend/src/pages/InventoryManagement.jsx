import { useState } from "react";

export default function InventoryManagement() {
  const [form, setForm] = useState({
    name: "",
    expiry: "",
    purchasePrice: "",
    salePrice: "",
    quantity: "",
  });

  const [inventory, setInventory] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ADD / UPDATE ITEM
  const handleSubmit = (e) => {
    e.preventDefault();

    const newItem = {
      id: editId || Date.now(),
      name: form.name,
      expiry: form.expiry,
      purchasePrice: Number(form.purchasePrice),
      salePrice: Number(form.salePrice),
      quantity: Number(form.quantity),
    };

    if (editId) {
      setInventory(
        inventory.map((item) =>
          item.id === editId ? newItem : item
        )
      );
      setEditId(null);
    } else {
      setInventory([...inventory, newItem]);
    }

    setForm({
      name: "",
      expiry: "",
      purchasePrice: "",
      salePrice: "",
      quantity: "",
    });
  };

  // EDIT
  const handleEdit = (item) => {
    setForm(item);
    setEditId(item.id);
  };

  // DELETE
  const handleDelete = (id) => {
    setInventory(inventory.filter((item) => item.id !== id));
  };

  // SIMULATED STOCK REDUCE (for POS later use)
  const reduceStock = (id, qty) => {
    setInventory(
      inventory.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity - qty }
          : item
      )
    );
  };

  // SIMULATED STOCK INCREASE (for return)
  const increaseStock = (id, qty) => {
    setInventory(
      inventory.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + qty }
          : item
      )
    );
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* FORM SECTION */}
      <div className="bg-white p-5 rounded-lg shadow space-y-3">

        <h2 className="text-lg font-bold">
          {editId ? "Update Medicine" : "Add Medicine"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Medicine Name"
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="date"
            name="expiry"
            value={form.expiry}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="number"
            name="purchasePrice"
            value={form.purchasePrice}
            onChange={handleChange}
            placeholder="Purchase Price"
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="number"
            name="salePrice"
            value={form.salePrice}
            onChange={handleChange}
            placeholder="Sale Price"
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            placeholder="Quantity"
            className="w-full border p-2 rounded"
            required
          />

          <button
            type="submit"
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            {editId ? "Update Stock" : "Add Stock"}
          </button>

        </form>
      </div>

      {/* INVENTORY LIST */}
      <div className="lg:col-span-2 bg-white p-5 rounded-lg shadow">

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search medicine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 p-2 border rounded focus:ring-2 focus:ring-green-400"
        />

        <h2 className="text-lg font-bold mb-4">
          Inventory List
        </h2>

        {inventory.length === 0 && (
          <p className="text-sm text-gray-500">
            No stock added yet
          </p>
        )}

        <div className="space-y-3">

          {inventory
            .filter((item) =>
              item.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((item) => (
              <div
                key={item.id}
                className="border p-3 rounded flex justify-between items-center"
              >

                {/* INFO */}
                <div>
                  <p className="font-semibold">{item.name}</p>

                  <p className="text-xs text-gray-500">
                    Expiry: {item.expiry}
                  </p>

                  <p className="text-xs text-gray-500">
                    Purchase: Rs {item.purchasePrice} | Sale: Rs {item.salePrice}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="text-right space-y-2">

                  <p className="text-sm font-medium">
                    Qty: {item.quantity}
                  </p>

                  <div className="flex gap-1 justify-end">

                    <button
                      onClick={() => handleEdit(item)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>
            ))}

        </div>
      </div>

    </div>
  );
}