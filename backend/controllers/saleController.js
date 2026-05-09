import Sale from '../models/Sale.js';
import Product from '../models/Product.js';

const generateInvoiceNumber = () => {
  return `INV-${Date.now().toString().slice(-6)}`;
};

export const createSale = async (req, res) => {
  const session = await Product.startSession();
  session.startTransaction();

  try {
    const { items, paymentMethod, cashReceived, customerName, cashier } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    // Calculate totals
    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.id).session(session);
      if (!product) {
        throw new Error(`Product not found: ${item.name}`);
      }
      if (product.quantity < item.qty) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      // Deduct stock
      product.quantity -= item.qty;
      await product.save({ session });

      const itemTotal = product.salePrice * item.qty;
      subtotal += itemTotal;

      saleItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.qty,
        unitPrice: product.salePrice,
        totalPrice: itemTotal
      });
    }

    const totalAmount = subtotal;
    const changeGiven = cashReceived ? cashReceived - totalAmount : 0;

    const sale = await Sale.create([{
      invoiceNumber: generateInvoiceNumber(),
      items: saleItems,
      subtotal,
      totalAmount,
      paymentMethod,
      cashReceived,
      changeGiven,
      customerName: customerName || 'Walk-in Customer',
      cashier
    }], { session });

    await session.commitTransaction();

    res.status(201).json(sale[0]);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const getSales = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('cashier', 'name');

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('cashier', 'name');
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSaleByInvoice = async (req, res) => {
  try {
    const sale = await Sale.findOne({ invoiceNumber: req.params.invoice })
      .populate('cashier', 'name');
    if (!sale) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};