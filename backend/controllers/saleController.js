import { dbGet, dbRun, dbAll } from '../config/db.js';
import { isProductExpired } from '../utils/dateHelpers.js';

const generateInvoiceNumber = () => {
  return `INV-${Date.now().toString().slice(-6)}`;
};

export const createSale = async (req, res) => {
  try {
    const { items, paymentMethod, cashReceived, customerName, cashier } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    let subtotal = 0;
    let totalDiscountAmount = 0;
    const saleItems = [];

    for (const item of items) {
      const product = dbGet('SELECT * FROM products WHERE id = ?', [item.id]);

      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.name}` });
      }

      if (product.status !== 'active') {
        return res.status(400).json({ message: `Product is not available for sale: ${product.name}` });
      }

      if (product.quantity < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      if (isProductExpired(product.expiry_date)) {
        return res.status(400).json({ message: `Cannot sell expired product: ${product.name}` });
      }

      dbRun('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.qty, item.id]);

      const baseItemTotal = product.sale_price * item.qty;
      const discountPct = Number(item.discount) || 0;
      const discountAmount = baseItemTotal * (discountPct / 100);
      const itemTotal = baseItemTotal - discountAmount;
      
      subtotal += baseItemTotal;
      totalDiscountAmount += discountAmount;

      saleItems.push({
        product: product.id,
        productName: product.name,
        quantity: item.qty,
        unitPrice: product.sale_price,
        unitPurchasePrice: Number(product.purchase_price) || 0,
        discountPct: discountPct,
        discountAmount: discountAmount,
        returnedQty: 0,
        totalPrice: itemTotal
      });
    }

    const totalAmount = subtotal - totalDiscountAmount;
    const changeGiven = cashReceived ? cashReceived - totalAmount : 0;
    const invoiceNumber = generateInvoiceNumber();

    dbRun(`
      INSERT INTO sales (invoice_number, items, subtotal, discount, total_amount, payment_method, cash_received, change_given, customer_name, cashier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [invoiceNumber, JSON.stringify(saleItems), subtotal, totalDiscountAmount, totalAmount, paymentMethod, cashReceived, changeGiven, customerName || 'Walk-in Customer', cashier || null]);

    const sale = dbGet('SELECT * FROM sales WHERE invoice_number = ?', [invoiceNumber]);
    if (sale) {
      sale.items = JSON.parse(sale.items);
    }

    res.status(201).json(sale || {});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const lim = parseInt(limit, 10);

    let query = 'SELECT s.*, u.name as cashier_name FROM sales s LEFT JOIN users u ON s.cashier_id = u.id WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM sales WHERE 1=1';
    const params = [];

    if (startDate && endDate) {
      query += ' AND s.created_at >= ? AND s.created_at <= ?';
      countQuery += ' AND created_at >= ? AND created_at <= ?';
      params.push(startDate, `${endDate}T23:59:59.999`);
    }

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      query += ' AND (s.invoice_number LIKE ? OR IFNULL(s.customer_name, "") LIKE ?)';
      countQuery += ' AND (invoice_number LIKE ? OR IFNULL(customer_name, "") LIKE ?)';
      params.push(term, term);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';

    const sales = dbAll(query, [...params, lim, offset]).map(sale => ({
      ...sale,
      items: sale.items ? JSON.parse(sale.items) : []
    }));

    const { total } = dbGet(countQuery, params);

    res.json({
      sales,
      totalPages: Math.ceil(total / lim) || 1,
      currentPage: parseInt(page, 10),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSale = async (req, res) => {
  try {
    const sale = dbGet('SELECT s.*, u.name as cashier_name FROM sales s LEFT JOIN users u ON s.cashier_id = u.id WHERE s.id = ?', [req.params.id]);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    sale.items = sale.items ? JSON.parse(sale.items) : [];
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSaleByInvoice = async (req, res) => {
  try {
    const sale = dbGet('SELECT s.*, u.name as cashier_name FROM sales s LEFT JOIN users u ON s.cashier_id = u.id WHERE s.invoice_number = ?', [req.params.invoice]);

    if (!sale) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    sale.items = sale.items ? JSON.parse(sale.items) : [];
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};