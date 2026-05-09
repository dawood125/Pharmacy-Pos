import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Setting from './models/Setting.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Setting.deleteMany({});
    console.log('Cleared existing data');

    // Create Admin User
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@pharmacy.com',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    });
    console.log('Created admin user: admin@pharmacy.com / admin123');

    // Create Sample Cashier
    await User.create({
      name: 'Cashier User',
      email: 'cashier@pharmacy.com',
      password: 'cashier123',
      role: 'cashier',
      status: 'active'
    });
    console.log('Created cashier user: cashier@pharmacy.com / cashier123');

    // Create Sample Products
    const products = [
      { name: 'Paracetamol 500mg', barcode: '1001', batchNumber: 'BATCH-001', category: 'Painkiller', purchasePrice: 40, salePrice: 50, quantity: 120, expiryDate: new Date('2026-12-31') },
      { name: 'Amoxicillin 250mg', barcode: '1002', batchNumber: 'BATCH-002', category: 'Antibiotic', purchasePrice: 100, salePrice: 120, quantity: 50, expiryDate: new Date('2025-06-30') },
      { name: 'Cough Syrup (Sugar Free)', barcode: '1003', batchNumber: 'BATCH-003', category: 'Syrup', purchasePrice: 150, salePrice: 180, quantity: 45, expiryDate: new Date('2026-08-15') },
      { name: 'Vitamin C Chewable', barcode: '1004', batchNumber: 'BATCH-004', category: 'Vitamins', purchasePrice: 70, salePrice: 90, quantity: 200, expiryDate: new Date('2027-03-20') },
      { name: 'Ibuprofen 400mg', barcode: '1005', batchNumber: 'BATCH-005', category: 'Painkiller', purchasePrice: 55, salePrice: 65, quantity: 80, expiryDate: new Date('2026-11-10') },
      { name: 'Omeprazole 20mg', barcode: '1006', batchNumber: 'BATCH-006', category: 'Antacid', purchasePrice: 120, salePrice: 150, quantity: 30, expiryDate: new Date('2025-09-30') },
      { name: 'Panadol Extra', barcode: '1007', batchNumber: 'BATCH-007', category: 'Painkiller', purchasePrice: 25, salePrice: 35, quantity: 150, expiryDate: new Date('2027-01-15') },
      { name: 'Brufen 200mg', barcode: '1008', batchNumber: 'BATCH-008', category: 'Painkiller', purchasePrice: 45, salePrice: 55, quantity: 90, expiryDate: new Date('2026-10-20') }
    ];

    await Product.insertMany(products);
    console.log('Created sample products');

    // Create Default Settings
    await Setting.insertMany([
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
    ]);
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