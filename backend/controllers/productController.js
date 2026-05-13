import { dbAll, dbGet, dbRun } from '../config/db.js';

export const getProducts = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const lim = parseInt(limit, 10);
    const off = Math.max(0, parseInt(offset, 10));

    const params = [];
    let query = "SELECT * FROM products WHERE status = 'active'";
    let countQuery = "SELECT COUNT(*) as total FROM products WHERE status = 'active'";

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      query += ' AND (name LIKE ? OR barcode LIKE ?)';
      countQuery += ' AND (name LIKE ? OR barcode LIKE ?)';
      params.push(term, term);
    }

    query += search && String(search).trim()
      ? ' ORDER BY name ASC LIMIT ? OFFSET ?'
      : ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const products = dbAll(query, [...params, lim, off]);
    const { total } = dbGet(countQuery, params);

    res.json({
      products,
      totalPages: Math.ceil(total / lim) || 1,
      currentPage: parseInt(page, 10),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, barcode, batchNumber, category, purchasePrice, salePrice, quantity, expiryDate, lowStockThreshold } = req.body;

    dbRun(`
      INSERT INTO products (name, barcode, batch_number, category, purchase_price, sale_price, quantity, expiry_date, low_stock_threshold)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, barcode || null, batchNumber || null, category || null, purchasePrice, salePrice, quantity || 0, expiryDate || null, lowStockThreshold || 10]);

    const { id } = dbGet('SELECT last_insert_rowid() as id');
    const newId = typeof id === 'bigint' ? Number(id) : id;
    const product = dbGet('SELECT * FROM products WHERE id = ?', [newId]);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, barcode, batchNumber, category, purchasePrice, salePrice, quantity, expiryDate, lowStockThreshold, status } = req.body;
    const id = req.params.id;

    // Get existing product
    const existing = dbGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    dbRun(`
      UPDATE products SET
        name = ?,
        barcode = ?,
        batch_number = ?,
        category = ?,
        purchase_price = ?,
        sale_price = ?,
        quantity = ?,
        expiry_date = ?,
        low_stock_threshold = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name || existing.name,
      barcode !== undefined ? barcode : existing.barcode,
      batchNumber !== undefined ? batchNumber : existing.batch_number,
      category !== undefined ? category : existing.category,
      purchasePrice !== undefined ? purchasePrice : existing.purchase_price,
      salePrice !== undefined ? salePrice : existing.sale_price,
      quantity !== undefined ? quantity : existing.quantity,
      expiryDate !== undefined ? expiryDate : existing.expiry_date,
      lowStockThreshold !== undefined ? lowStockThreshold : existing.low_stock_threshold,
      status !== undefined ? status : existing.status,
      id
    ]);

    const product = dbGet('SELECT * FROM products WHERE id = ?', [id]);
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const result = dbRun("UPDATE products SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLowStock = async (req, res) => {
  try {
    const products = dbAll(`
      SELECT * FROM products
      WHERE status = 'active' AND quantity <= low_stock_threshold
      ORDER BY quantity ASC
    `);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpiringSoon = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date().toISOString().split('T')[0];

    const products = dbAll(`
      SELECT * FROM products
      WHERE status = 'active' AND expiry_date IS NOT NULL
      AND expiry_date <= ? AND expiry_date >= ?
      ORDER BY expiry_date ASC
    `, [thirtyDaysFromNow.toISOString().split('T')[0], today]);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};