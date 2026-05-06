import { useState } from "react";

export default function CustomerReturn() {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnQty, setReturnQty] = useState({});

  // Demo sales data (replace with API later)
  const salesData = [
    {
      invoice: "INV-1001",
      items: [
        { id: 1, name: "Paracetamol", qty: 2, price: 50 },
        { id: 2, name: "Cough Syrup", qty: 1, price: 180 },
      ],
    },
    {
      invoice: "INV-1002",
      items: [
        { id: 3, name: "Vitamin C", qty: 3, price: 90 },
      ],
    },
  ];

  // Search invoice
  const searchInvoice = () => {
    const found = salesData.find(
      (s) => s.invoice.toLowerCase() === invoiceNo.toLowerCase()
    );

    setSelectedInvoice(found || null);
  };

  // Handle return stock logic (UI only for now)
  const handleReturn = (item) => {
    const qty = returnQty[item.id] || 0;

    if (qty <= 0) return;

    alert(
      `${qty} ${item.name} returned successfully (Stock will be increased)`
    );

    // 🔥 HERE YOU WILL CONNECT BACKEND LOGIC:
    // increaseStock(item.id, qty)
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <h1 className="text-xl font-bold">
        Customer Return System
      </h1>

      {/* SEARCH INVOICE */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter Invoice No (e.g. INV-1001)"
          value={invoiceNo}
          onChange={(e) => setInvoiceNo(e.target.value)}
          className="border p-2 rounded w-80"
        />

        <button
          onClick={searchInvoice}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>

      {/* RESULT */}
      {selectedInvoice ? (
        <div className="bg-white p-4 rounded shadow space-y-4">

          <h2 className="font-semibold">
            Invoice: {selectedInvoice.invoice}
          </h2>

          {/* ITEMS */}
          {selectedInvoice.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b py-2"
            >

              {/* INFO */}
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">
                  Purchased Qty: {item.qty} | Rs {item.price}
                </p>
              </div>

              {/* RETURN INPUT */}
              <input
                type="number"
                min="0"
                max={item.qty}
                placeholder="Return Qty"
                value={returnQty[item.id] || ""}
                onChange={(e) =>
                  setReturnQty({
                    ...returnQty,
                    [item.id]: Number(e.target.value),
                  })
                }
                className="w-20 border p-1 rounded text-center"
              />

              {/* RETURN BUTTON */}
              <button
                onClick={() => handleReturn(item)}
                className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
              >
                Return
              </button>

            </div>
          ))}

        </div>
      ) : (
        invoiceNo && (
          <p className="text-red-500">
            No invoice found
          </p>
        )
      )}
    </div>
  );
}
