import { dbGet, dbRun, dbAll } from '../config/db.js';

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
    const saleItems = [];

    for (const item of items) {
      const product = dbGet('SELECT * FROM products WHERE id = ?', [item.id]);

      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.name}` });
      }

      if (product.quantity < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      dbRun('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.qty, item.id]);

      const itemTotal = product.sale_price * item.qty;
      subtotal += itemTotal;

      saleItems.push({
        product: product.id,
        productName: product.name,
        quantity: item.qty,
        unitPrice: product.sale_price,
        unitPurchasePrice: Number(product.purchase_price) || 0,
        returnedQty: 0,
        totalPrice: itemTotal
      });
    }

    const totalAmount = subtotal;
    const changeGiven = cashReceived ? cashReceived - totalAmount : 0;
    const invoiceNumber = generateInvoiceNumber();

    dbRun(`
      INSERT INTO sales (invoice_number, items, subtotal, total_amount, payment_method, cash_received, change_given, customer_name, cashier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [invoiceNumber, JSON.stringify(saleItems), subtotal, totalAmount, paymentMethod, cashReceived, changeGiven, customerName || 'Walk-in Customer', cashier || null]);

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
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT s.*, u.name as cashier_name FROM sales s LEFT JOIN users u ON s.cashier_id = u.id';
    let countQuery = 'SELECT COUNT(*) as total FROM sales';
    const dateParams = [];

    if (startDate && endDate) {
      query += ' WHERE s.created_at >= ? AND s.created_at <= ?';
      countQuery += ' WHERE created_at >= ? AND created_at <= ?';
      dateParams.push(startDate, `${endDate}T23:59:59.999`);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';

    const sales = dbAll(query, [...dateParams, parseInt(limit, 10), offset]).map(sale => ({
      ...sale,
      items: sale.items ? JSON.parse(sale.items) : []
    }));

    const { total } = dbGet(countQuery, dateParams);

    res.json({
      sales,
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      currentPage: parseInt(page),
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