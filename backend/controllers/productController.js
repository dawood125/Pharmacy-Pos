import { dbAll, dbGet, dbRun } from '../config/db.js';
import { todayYmdLocal } from '../utils/dateHelpers.js';

function normName(n) {
  return String(n || '').trim().toLowerCase();
}
function normBarcode(b) {
  if (b == null || String(b).trim() === '') return '';
  return String(b).trim();
}
function normBatch(b) {
  if (b == null || String(b).trim() === '') return '';
  return String(b).trim();
}
function normExpiry(e) {
  return e ? String(e).slice(0, 10) : '';
}

/** Same name, barcode, batch and expiry as an existing active row (prevents duplicate lines). */
function findActiveDuplicate({ name, barcode, batchNumber, expiryDate, excludeId }) {
  const nm = normName(name);
  const bc = normBarcode(barcode);
  const bn = normBatch(batchNumber);
  const ex = normExpiry(expiryDate);

  if (excludeId != null) {
    return dbGet(
      `SELECT id FROM products
       WHERE status = 'active' AND id != ?
       AND lower(trim(name)) = ?
       AND trim(ifnull(barcode, '')) = ?
       AND trim(ifnull(batch_number, '')) = ?
       AND ifnull(substr(expiry_date, 1, 10), '') = ?`,
      [excludeId, nm, bc, bn, ex]
    );
  }
  return dbGet(
    `SELECT id FROM products
     WHERE status = 'active'
     AND lower(trim(name)) = ?
     AND trim(ifnull(barcode, '')) = ?
     AND trim(ifnull(batch_number, '')) = ?
     AND ifnull(substr(expiry_date, 1, 10), '') = ?`,
    [nm, bc, bn, ex]
  );
}

export const getProducts = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const lim = parseInt(limit, 10);
    const off = Math.max(0, parseInt(offset, 10));

    const today = todayYmdLocal();
    const params = [today];
    let query = "SELECT * FROM products WHERE status = 'active' AND (expiry_date IS NULL OR substr(expiry_date, 1, 10) >= ?)";
    let countQuery = "SELECT COUNT(*) as total FROM products WHERE status = 'active' AND (expiry_date IS NULL OR substr(expiry_date, 1, 10) >= ?)";

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      query += ' AND (name LIKE ? OR barcode LIKE ? OR manufacturer LIKE ?)';
      countQuery += ' AND (name LIKE ? OR barcode LIKE ? OR manufacturer LIKE ?)';
      params.push(term, term, term);
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

function assertSaleAboveCost(purchasePrice, salePrice) {
  const cost = Number(purchasePrice);
  const sale = Number(salePrice);
  if (!Number.isFinite(cost) || !Number.isFinite(sale)) {
    return 'Invalid purchase or sale price';
  }
  if (sale <= cost) {
    return 'Sale price must be higher than cost (purchase) price';
  }
  return null;
}

export const createProduct = async (req, res) => {
  try {
    const { 
      name, barcode, batchNumber, category, purchasePrice, salePrice, quantity, expiryDate, lowStockThreshold,
      piecesPerPack, manufacturer, rackNumber, minDiscount, maxDiscount, isPrintable
    } = req.body;

    const priceErr = assertSaleAboveCost(purchasePrice, salePrice);
    if (priceErr) {
      return res.status(400).json({ message: priceErr });
    }

    const dup = findActiveDuplicate({ name, barcode, batchNumber, expiryDate });
    if (dup) {
      return res.status(400).json({
        message: 'This medicine is already in inventory with the same name, barcode, batch number and expiry date. Edit the existing line or change one of these fields.'
      });
    }

    dbRun(`
      INSERT INTO products (
        name, barcode, batch_number, category, purchase_price, sale_price, quantity, expiry_date, low_stock_threshold,
        pieces_per_pack, manufacturer, rack_number, min_discount, max_discount, is_printable
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, 
      barcode || null, 
      batchNumber || null, 
      category || null, 
      purchasePrice, 
      salePrice, 
      quantity || 0, 
      expiryDate || null, 
      lowStockThreshold || 10,
      piecesPerPack !== undefined ? piecesPerPack : 1,
      manufacturer || null,
      rackNumber || null,
      minDiscount !== undefined ? minDiscount : 0,
      maxDiscount !== undefined ? maxDiscount : 100,
      isPrintable !== undefined ? isPrintable : 1
    ]);

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
    const { 
      name, barcode, batchNumber, category, purchasePrice, salePrice, quantity, expiryDate, lowStockThreshold, status,
      piecesPerPack, manufacturer, rackNumber, minDiscount, maxDiscount, isPrintable
    } = req.body;
    const id = req.params.id;

    // Get existing product
    const existing = dbGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const nextPurchase = purchasePrice !== undefined ? purchasePrice : existing.purchase_price;
    const nextSale = salePrice !== undefined ? salePrice : existing.sale_price;
    const priceErr = assertSaleAboveCost(nextPurchase, nextSale);
    if (priceErr) {
      return res.status(400).json({ message: priceErr });
    }

    const nextName = name || existing.name;
    const nextBarcode = barcode !== undefined ? barcode : existing.barcode;
    const nextBatch = batchNumber !== undefined ? batchNumber : existing.batch_number;
    const nextExpiry = expiryDate !== undefined ? expiryDate : existing.expiry_date;

    const dup = findActiveDuplicate({
      name: nextName,
      barcode: nextBarcode,
      batchNumber: nextBatch,
      expiryDate: nextExpiry,
      excludeId: Number(id)
    });
    if (dup) {
      return res.status(400).json({
        message: 'Another active product already uses this name, barcode, batch number and expiry date.'
      });
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
        pieces_per_pack = ?,
        manufacturer = ?,
        rack_number = ?,
        min_discount = ?,
        max_discount = ?,
        is_printable = ?,
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
      piecesPerPack !== undefined ? piecesPerPack : (existing.pieces_per_pack ?? 1),
      manufacturer !== undefined ? manufacturer : existing.manufacturer,
      rackNumber !== undefined ? rackNumber : existing.rack_number,
      minDiscount !== undefined ? minDiscount : (existing.min_discount ?? 0),
      maxDiscount !== undefined ? maxDiscount : (existing.max_discount ?? 100),
      isPrintable !== undefined ? isPrintable : (existing.is_printable ?? 1),
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
    const today = todayYmdLocal();
    const products = dbAll(`
      SELECT * FROM products
      WHERE status = 'active' AND quantity <= low_stock_threshold
      AND (expiry_date IS NULL OR substr(expiry_date, 1, 10) >= ?)
      ORDER BY quantity ASC
    `, [today]);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpiringSoon = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const end = `${thirtyDaysFromNow.getFullYear()}-${String(thirtyDaysFromNow.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysFromNow.getDate()).padStart(2, '0')}`;
    const today = todayYmdLocal();

    const products = dbAll(`
      SELECT * FROM products
      WHERE status = 'active' AND expiry_date IS NOT NULL
      AND substr(expiry_date, 1, 10) <= ? AND substr(expiry_date, 1, 10) >= ?
      ORDER BY expiry_date ASC
    `, [end, today]);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpiredProducts = async (req, res) => {
  try {
    const today = todayYmdLocal();
    const { page = 1, limit = 50 } = req.query;
    const lim = parseInt(limit, 10);
    const off = Math.max(0, (parseInt(page, 10) - 1) * lim);

    const whereClause = "status = 'active' AND expiry_date IS NOT NULL AND substr(expiry_date, 1, 10) < ?";
    const params = [today];

    const products = dbAll(
      `SELECT * FROM products WHERE ${whereClause} ORDER BY expiry_date ASC LIMIT ? OFFSET ?`,
      [...params, lim, off]
    );
    const { total } = dbGet(`SELECT COUNT(*) as total FROM products WHERE ${whereClause}`, params);

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