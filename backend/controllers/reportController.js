import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Return from '../models/Return.js';

export const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const sales = await Sale.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        return itemSum + (item.unitPrice * item.quantity);
      }, 0);
    }, 0);

    res.json({
      sales,
      summary: {
        totalSales: sales.length,
        totalRevenue,
        totalProfit: totalProfit * 0.25 // Approximate profit margin
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    const dailyData = [];
    const dailyMap = new Map();

    sales.forEach(sale => {
      const day = sale.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(day) || { revenue: 0, cost: 0, profit: 0 };

      const revenue = sale.totalAmount;
      const cost = sale.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const profit = revenue - cost;

      dailyMap.set(day, {
        revenue: existing.revenue + revenue,
        cost: existing.cost + cost,
        profit: existing.profit + profit
      });
    });

    dailyMap.forEach((value, key) => {
      dailyData.push({
        date: key,
        ...value,
        margin: ((value.profit / value.revenue) * 100).toFixed(1)
      });
    });

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = sales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => itemSum + (item.unitPrice * item.quantity), 0);
    }, 0);

    res.json({
      dailyData,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit: totalRevenue - totalCost,
        margin: (((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(1),
        totalTransactions: sales.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBestSelling = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const query = { status: 'completed' };
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sales = await Sale.find(query);

    const productStats = new Map();

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productStats.get(item.productName) || { sold: 0, revenue: 0 };
        productStats.set(item.productName, {
          sold: existing.sold + item.quantity,
          revenue: existing.revenue + item.totalPrice
        });
      });
    });

    const bestSelling = Array.from(productStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, limit);

    res.json(bestSelling);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's sales
    const todaySales = await Sale.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'completed'
    });

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayProfit = todayRevenue * 0.25; // Approximate

    // Low stock items
    const lowStock = await Product.find({
      status: 'active',
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    });

    // Expiring soon (30 days)
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const expiring = await Product.find({
      status: 'active',
      expiryDate: { $lte: thirtyDays, $gte: new Date() }
    });

    res.json({
      todaySales: todaySales.length,
      todayRevenue,
      todayProfit,
      lowStockCount: lowStock.length,
      expiringCount: expiring.length,
      lowStockItems: lowStock.slice(0, 5),
      expiringItems: expiring.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};