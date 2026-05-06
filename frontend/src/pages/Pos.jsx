import { useEffect, useState } from "react";

export default function POS() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);

  // Demo products (NOW WITH STOCK)
  const products = [
    { id: 1, name: "Paracetamol", price: 50, stock: 120 },
    { id: 2, name: "Amoxicillin", price: 120, stock: 80 },
    { id: 3, name: "Cough Syrup", price: 180, stock: 45 },
    { id: 4, name: "Vitamin C", price: 90, stock: 200 },
  ];

  // Add to cart
  const addToCart = (product) => {
    const exist = cart.find((item) => item.id === product.id);

    if (exist) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  // Update quantity
  const updateQty = (id, qty) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, qty: Number(qty) } : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Total
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  // F1 focus search
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "F1") {
        e.preventDefault();
        document.getElementById("search").focus();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">

      {/* LEFT SIDE */}
      <div className="lg:col-span-2 space-y-3">

        {/* SEARCH */}
        <input
          id="search"
          type="text"
          placeholder="Search product by Name "
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-400"
        />

        {/* PRODUCT LIST */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

          {products
            .filter((p) =>
              p.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-3 bg-white rounded-lg shadow cursor-pointer hover:bg-green-50 transition"
              >
                {/* NAME */}
                <h3 className="font-semibold">{product.name}</h3>

                {/* STOCK + PRICE */}
                <p className="text-sm text-gray-600">
                  Stock: {product.stock} | Rs {product.price}
                </p>
              </div>
            ))}

        </div>
      </div>

      {/* RIGHT SIDE - CART */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">

        <h2 className="font-bold text-lg">Cart</h2>

        {/* CART ITEMS */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">

          {cart.length === 0 && (
            <p className="text-sm text-gray-500">
              Cart is empty
            </p>
          )}

          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b pb-2"
            >
              {/* INFO */}
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.qty} × Rs {item.price}
                </p>
              </div>

              {/* QTY */}
              <input
                type="number"
                value={item.qty}
                onChange={(e) =>
                  updateQty(item.id, e.target.value)
                }
                className="w-14 border p-1 rounded text-center"
              />

              {/* REMOVE */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div className="border-t pt-3 flex justify-between font-bold">
          <span>Total:</span>
          <span>Rs {total}</span>
        </div>

        {/* PAYMENT */}
        <select className="w-full border p-2 rounded">
          <option>Cash</option>
          <option>Easypaisa</option>
          <option>JazzCash</option>
          <option>Bank Transfer</option>
        </select>

        {/* CHECKOUT */}
        <button
          onClick={() => window.print()}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Checkout & Print (Ctrl + P)
        </button>

      </div>
    </div>
  );
}