import initSqlJs from 'sql.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', process.env.DB_PATH || 'pharmacy.db');

let db = null;

export const initializeDatabase = async () => {
  const SQL = await initSqlJs();

  // Try to load existing database
  let data = null;
  if (fs.existsSync(dbPath)) {
    data = fs.readFileSync(dbPath);
  }

  db = new SQL.Database(data);

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'cashier',
      status TEXT DEFAULT 'active',
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      barcode TEXT UNIQUE,
      batch_number TEXT,
      category TEXT,
      purchase_price REAL NOT NULL,
      sale_price REAL NOT NULL,
      quantity INTEGER DEFAULT 0,
      expiry_date DATE,
      low_stock_threshold INTEGER DEFAULT 10,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      cash_received REAL,
      change_given REAL,
      customer_name TEXT DEFAULT 'Walk-in Customer',
      cashier_id INTEGER,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cashier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_invoice TEXT NOT NULL,
      return_invoice_number TEXT UNIQUE NOT NULL,
      items TEXT NOT NULL,
      total_refund REAL NOT NULL,
      return_method TEXT DEFAULT 'cash',
      reason TEXT,
      processed_by INTEGER,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (processed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number)`);

  // Save to file
  saveDatabase();

  console.log('SQLite database initialized');
  return db;
};

export const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

export const getDb = () => db;

// Helper functions for sql.js
export const dbRun = (sql, params = []) => {
  db.run(sql, params);
  saveDatabase();
  return { changes: db.getRowsModified() };
};

export const dbGet = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
};

export const dbAll = (sql, params = []) => {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
};

export const dbExec = (sql) => {
  db.run(sql);
  saveDatabase();
};