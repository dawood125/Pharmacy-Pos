import Return from '../models/Return.js';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';

const generateReturnInvoice = () => {
  return `RET-${Date.now().toString().slice(-6)}`;
};

export const getReturns = async (req, res) => {
  try {
    const returns = await Return.find()
      .sort({ createdAt: -1 })
      .populate('processedBy', 'name');

    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReturn = async (req, res) => {
  try {
    const returnItem = await Return.findById(req.params.id)
      .populate('processedBy', 'name');

    if (!returnItem) {
      return res.status(404).json({ message: 'Return not found' });
    }

    res.json(returnItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReturnByInvoice = async (req, res) => {
  try {
    const sale = await Sale.findOne({ invoiceNumber: req.params.invoice });

    if (!sale) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createReturn = async (req, res) => {
  const session = await Product.startSession();
  session.startTransaction();

  try {
    const { originalInvoice, items, reason, processedBy } = req.body;

    const sale = await Sale.findOne({ invoiceNumber: originalInvoice }).session(session);
    if (!sale) {
      throw new Error('Original invoice not found');
    }

    let totalRefund = 0;
    const returnItems = [];

    for (const item of items) {
      if (item.returnQty > 0) {
        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          throw new Error(`Product not found: ${item.productName}`);
        }

        // Restock the product
        product.quantity += item.returnQty;
        await product.save({ session });

        const refundAmount = item.unitPrice * item.returnQty;
        totalRefund += refundAmount;

        returnItems.push({
          product: product._id,
          productName: item.productName,
          quantity: item.returnQty,
          unitPrice: item.unitPrice,
          refundAmount
        });
      }
    }

    const returnDoc = await Return.create([{
      originalInvoice,
      returnInvoiceNumber: generateReturnInvoice(),
      items: returnItems,
      totalRefund,
      reason,
      processedBy
    }], { session });

    await session.commitTransaction();

    res.status(201).json(returnDoc[0]);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};