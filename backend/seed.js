import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { initializeDatabase, dbRun } from './config/db.js';

dotenv.config();

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const seedDatabase = async () => {
  try {
    await initializeDatabase();
    console.log('Connected to SQLite database');

    dbRun('DELETE FROM returns');
    dbRun('DELETE FROM sales');
    dbRun('DELETE FROM products');
    dbRun('DELETE FROM users');
    dbRun('DELETE FROM settings');
    console.log('Cleared existing data');

    const adminPassword = await bcrypt.hash('admin123', 10);
    dbRun('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)', ['Admin User', 'admin@pharmacy.com', adminPassword, 'admin', 'active']);
    console.log('Created admin user: admin@pharmacy.com / admin123');

    const cashierPassword = await bcrypt.hash('cashier123', 10);
    dbRun('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)', ['Cashier User', 'cashier@pharmacy.com', cashierPassword, 'cashier', 'active']);
    console.log('Created cashier user: cashier@pharmacy.com / cashier123');

    const today = new Date();
    const expired = new Date(today);
    expired.setDate(expired.getDate() - 14);
    const expiringSoon = new Date(today);
    expiringSoon.setDate(expiringSoon.getDate() + 20);
    const future = new Date(today);
    future.setDate(future.getDate() + 120);

    const products = [
      { name: 'Paracetamol 500mg', barcode: '1001', batchNumber: 'BATCH-001', category: 'Painkiller', purchasePrice: 40, salePrice: 50, quantity: 120, expiryDate: ymd(future) },
      { name: 'Amoxicillin 250mg', barcode: '1002', batchNumber: 'BATCH-002', category: 'Antibiotic', purchasePrice: 100, salePrice: 120, quantity: 50, expiryDate: ymd(expiringSoon) },
      { name: 'Cough Syrup (Sugar Free)', barcode: '1003', batchNumber: 'BATCH-003', category: 'Syrup', purchasePrice: 150, salePrice: 180, quantity: 45, expiryDate: ymd(future) },
      { name: 'Vitamin C Chewable', barcode: '1004', batchNumber: 'BATCH-004', category: 'Vitamins', purchasePrice: 70, salePrice: 90, quantity: 200, expiryDate: ymd(future) },
      { name: 'Ibuprofen 400mg', barcode: '1005', batchNumber: 'BATCH-005', category: 'Painkiller', purchasePrice: 55, salePrice: 65, quantity: 8, expiryDate: ymd(future) },
      { name: 'Expired Sample Batch', barcode: '1006', batchNumber: 'EXP-BATCH', category: 'Demo', purchasePrice: 10, salePrice: 15, quantity: 5, expiryDate: ymd(expired) }
    ];

    products.forEach(p => {
      dbRun(`
        INSERT INTO products (name, barcode, batch_number, category, purchase_price, sale_price, quantity, expiry_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [p.name, p.barcode, p.batchNumber, p.category, p.purchasePrice, p.salePrice, p.quantity, p.expiryDate]);
    });
    console.log('Created sample products (fresh dates relative to today)');

    const settings = [
      { key: 'storeName', value: 'MedFlow Pharmacy' },
      { key: 'storeAddress', value: '123 Health Avenue, Medical City' },
      { key: 'storePhone', value: '+92 300 1234567' },
      { key: 'currency', value: 'PKR' },
      { key: 'timezone', value: 'Asia/Karachi' },
      { key: 'taxRate', value: 17 },
      { key: 'taxNumber', value: '1234567-8' },
      { key: 'gstNumber', value: 'PK1234567890123' },
      { key: 'taxInclusive', value: 'exclusive' },
      { key: 'lowStockAlerts', value: true },
      { key: 'requireLogin', value: true },
      { key: 'allowNegative', value: false }
    ];

    settings.forEach(s => {
      dbRun(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [s.key, JSON.stringify(s.value)]);
    });
    console.log('Created default settings');

    console.log('\n--- Seed Complete ---');
    console.log('Admin Login: admin@pharmacy.com / admin123');
    console.log('Cashier Login: cashier@pharmacy.com / cashier123');
    console.log('----------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
