import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { initializeDatabase, dbRun, dbGet } from './config/db.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await initializeDatabase();
    console.log('Connected to SQLite database');

    // Clear existing data
    dbRun('DELETE FROM returns');
    dbRun('DELETE FROM sales');
    dbRun('DELETE FROM products');
    dbRun('DELETE FROM users');
    dbRun('DELETE FROM settings');
    console.log('Cleared existing data');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    dbRun('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)', ['Admin User', 'admin@pharmacy.com', adminPassword, 'admin', 'active']);
    console.log('Created admin user: admin@pharmacy.com / admin123');

    // Create Sample Cashier
    const cashierPassword = await bcrypt.hash('cashier123', 10);
    dbRun('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)', ['Cashier User', 'cashier@pharmacy.com', cashierPassword, 'cashier', 'active']);
    console.log('Created cashier user: cashier@pharmacy.com / cashier123');

    // Create Sample Products
    const products = [
      { name: 'Paracetamol 500mg', barcode: '1001', batchNumber: 'BATCH-001', category: 'Painkiller', purchasePrice: 40, salePrice: 50, quantity: 120, expiryDate: '2026-12-31' },
      { name: 'Amoxicillin 250mg', barcode: '1002', batchNumber: 'BATCH-002', category: 'Antibiotic', purchasePrice: 100, salePrice: 120, quantity: 50, expiryDate: '2025-06-30' },
      { name: 'Cough Syrup (Sugar Free)', barcode: '1003', batchNumber: 'BATCH-003', category: 'Syrup', purchasePrice: 150, salePrice: 180, quantity: 45, expiryDate: '2026-08-15' },
      { name: 'Vitamin C Chewable', barcode: '1004', batchNumber: 'BATCH-004', category: 'Vitamins', purchasePrice: 70, salePrice: 90, quantity: 200, expiryDate: '2027-03-20' },
      { name: 'Ibuprofen 400mg', barcode: '1005', batchNumber: 'BATCH-005', category: 'Painkiller', purchasePrice: 55, salePrice: 65, quantity: 80, expiryDate: '2026-11-10' },
      { name: 'Omeprazole 20mg', barcode: '1006', batchNumber: 'BATCH-006', category: 'Antacid', purchasePrice: 120, salePrice: 150, quantity: 30, expiryDate: '2025-09-30' },
      { name: 'Panadol Extra', barcode: '1007', batchNumber: 'BATCH-007', category: 'Painkiller', purchasePrice: 25, salePrice: 35, quantity: 150, expiryDate: '2027-01-15' },
      { name: 'Brufen 200mg', barcode: '1008', batchNumber: 'BATCH-008', category: 'Painkiller', purchasePrice: 45, salePrice: 55, quantity: 90, expiryDate: '2026-10-20' }
    ];

    products.forEach(p => {
      dbRun(`
        INSERT INTO products (name, barcode, batch_number, category, purchase_price, sale_price, quantity, expiry_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [p.name, p.barcode, p.batchNumber, p.category, p.purchasePrice, p.salePrice, p.quantity, p.expiryDate]);
    });
    console.log('Created sample products');

    // Create Default Settings
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