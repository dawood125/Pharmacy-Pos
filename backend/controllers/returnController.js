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

export const getReturnByInvoice = async (req, res) => {
  try {
    const sale = dbGet('SELECT * FROM sales WHERE invoice_number = ?', [req.params.invoice]);

    if (!sale) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    sale.items = sale.items ? JSON.parse(sale.items) : [];
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createReturn = async (req, res) => {
  try {
    const { originalInvoice, items, reason, processedBy } = req.body;

    const sale = dbGet('SELECT * FROM sales WHERE invoice_number = ?', [originalInvoice]);
    if (!sale) {
      return res.status(400).json({ message: 'Original invoice not found' });
    }

    let totalRefund = 0;
    const returnItems = [];

    for (const item of items) {
      if (item.returnQty > 0) {
        const product = dbGet('SELECT * FROM products WHERE id = ?', [item.productId]);

        if (!product) {
          return res.status(400).json({ message: `Product not found: ${item.productName}` });
        }

        dbRun('UPDATE products SET quantity = quantity + ? WHERE id = ?', [item.returnQty, item.productId]);

        const refundAmount = item.unitPrice * item.returnQty;
        totalRefund += refundAmount;

        returnItems.push({
          product: product.id,
          productName: item.productName,
          quantity: item.returnQty,
          unitPrice: item.unitPrice,
          refundAmount
        });
      }
    }

    const returnInvoiceNumber = generateReturnInvoice();

    dbRun(`
      INSERT INTO returns (original_invoice, return_invoice_number, items, total_refund, reason, processed_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [originalInvoice, returnInvoiceNumber, JSON.stringify(returnItems), totalRefund, reason, processedBy || null]);

    const returnDoc = dbGet('SELECT * FROM returns WHERE return_invoice_number = ?', [returnInvoiceNumber]);
    if (returnDoc) {
      returnDoc.items = JSON.parse(returnDoc.items);
    }

    res.status(201).json(returnDoc || {});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};