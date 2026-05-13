import { dbGet, dbRun, dbAll } from '../config/db.js';

const generateReturnInvoice = () => {
  return `RET-${Date.now().toString().slice(-6)}`;
};

export const getReturns = async (req, res) => {
  try {
    const returns = dbAll(`
      SELECT r.*, u.name as processed_by_name
      FROM returns r
      LEFT JOIN users u ON r.processed_by = u.id
      ORDER BY r.created_at DESC
    `).map(r => ({
      ...r,
      items: r.items ? JSON.parse(r.items) : []
    }));

    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReturn = async (req, res) => {
  try {
    const returnItem = dbGet(`
      SELECT r.*, u.name as processed_by_name
      FROM returns r
      LEFT JOIN users u ON r.processed_by = u.id
      WHERE r.id = ?
    `, [req.params.id]);

    if (!returnItem) {
      return res.status(404).json({ message: 'Return not found' });
    }

    returnItem.items = returnItem.items ? JSON.parse(returnItem.items) : [];
    res.json(returnItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Return history for an invoice + current sale snapshot (for audit / UI). */
export const getReturnByInvoice = async (req, res) => {
  try {
    const sale = dbGet('SELECT * FROM sales WHERE invoice_number = ?', [req.params.invoice]);

    if (!sale) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    sale.items = sale.items ? JSON.parse(sale.items) : [];

    const returnHistory = dbAll(
      'SELECT * FROM returns WHERE original_invoice = ? ORDER BY created_at DESC',
      [req.params.invoice]
    ).map(r => ({
      ...r,
      items: r.items ? JSON.parse(r.items) : []
    }));

    res.json({ sale, returnHistory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function recomputeSaleFromItems(saleItems) {
  let subtotal = 0;
  for (const line of saleItems) {
    const net = Math.max(0, (Number(line.quantity) || 0) - (Number(line.returnedQty) || 0));
    line.totalPrice = (Number(line.unitPrice) || 0) * net;
    subtotal += line.totalPrice;
  }

  const allFullyReturned = saleItems.length > 0 && saleItems.every((line) => {
    const sold = Number(line.quantity) || 0;
    const ret = Number(line.returnedQty) || 0;
    return sold > 0 && ret >= sold;
  });

  const anyReturned = saleItems.some((line) => (Number(line.returnedQty) || 0) > 0);

  let status = 'completed';
  if (allFullyReturned) {
    status = 'fully_returned';
  } else if (anyReturned) {
    status = 'partially_returned';
  }

  return { subtotal, totalAmount: subtotal, status, saleItems };
}

export const createReturn = async (req, res) => {
  try {
    const { originalInvoice, items, reason, processedBy } = req.body;

    const sale = dbGet('SELECT * FROM sales WHERE invoice_number = ?', [originalInvoice]);
    if (!sale) {
      return res.status(400).json({ message: 'Original invoice not found' });
    }

    if (sale.status === 'fully_returned') {
      return res.status(400).json({ message: 'This invoice has already been fully returned' });
    }

    let saleItems;
    try {
      saleItems = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
    } catch {
      return res.status(400).json({ message: 'Invalid sale data' });
    }

    let totalRefund = 0;
    const returnItems = [];

    for (const item of items) {
      if (!item.returnQty || item.returnQty <= 0) continue;

      const line = saleItems.find((l) => Number(l.product) === Number(item.productId));
      if (!line) {
        return res.status(400).json({ message: `Line not on invoice: ${item.productName}` });
      }

      const soldQty = Number(line.quantity) || 0;
      const prevReturned = Number(line.returnedQty) || 0;
      const returnable = soldQty - prevReturned;

      if (item.returnQty > returnable) {
        return res.status(400).json({
          message: `Return qty too high for ${item.productName} (max ${returnable})`
        });
      }

      const product = dbGet('SELECT * FROM products WHERE id = ?', [item.productId]);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.productName}` });
      }

      dbRun('UPDATE products SET quantity = quantity + ? WHERE id = ?', [item.returnQty, item.productId]);

      const refundAmount = item.unitPrice * item.returnQty;
      totalRefund += refundAmount;

      line.returnedQty = prevReturned + item.returnQty;

      returnItems.push({
        product: product.id,
        productName: item.productName,
        quantity: item.returnQty,
        unitPrice: item.unitPrice,
        refundAmount
      });
    }

    if (returnItems.length === 0) {
      return res.status(400).json({ message: 'No return quantities provided' });
    }

    const { subtotal, totalAmount, status, saleItems: updatedItems } = recomputeSaleFromItems(saleItems);

    const returnInvoiceNumber = generateReturnInvoice();

    dbRun(`
      INSERT INTO returns (original_invoice, return_invoice_number, items, total_refund, reason, processed_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [originalInvoice, returnInvoiceNumber, JSON.stringify(returnItems), totalRefund, reason, processedBy || null]);

    dbRun(
      `UPDATE sales SET items = ?, subtotal = ?, total_amount = ?, status = ? WHERE invoice_number = ?`,
      [JSON.stringify(updatedItems), subtotal, totalAmount, status, originalInvoice]
    );

    const returnDoc = dbGet('SELECT * FROM returns WHERE return_invoice_number = ?', [returnInvoiceNumber]);
    if (returnDoc) {
      returnDoc.items = JSON.parse(returnDoc.items);
    }

    res.status(201).json(returnDoc || {});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
