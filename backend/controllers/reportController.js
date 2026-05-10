import { dbGet, dbAll } from '../config/db.js';

export const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const sales = dbAll(`
      SELECT * FROM sales
      WHERE date(created_at) = ? AND status = 'completed'
    `, [targetDate]);

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);

    const salesWithItems = sales.map(sale => ({
      ...sale,
      items: sale.items ? JSON.parse(sale.items) : []
    }));

    const totalProfit = totalRevenue * 0.25;

    res.json({
      sales: salesWithItems,
      summary: {
        totalSales: sales.length,
        totalRevenue,
        totalProfit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const sales = dbAll(`
      SELECT * FROM sales
      WHERE date(created_at) >= ? AND date(created_at) <= ? AND status = 'completed'
    `, [startDate, endDate]);

    const dailyData = [];
    const dailyMap = new Map();

    sales.forEach(sale => {
      const day = sale.created_at.split('T')[0];
      const existing = dailyMap.get(day) || { revenue: 0, cost: 0, profit: 0 };

      const items = sale.items ? JSON.parse(sale.items) : [];
      const revenue = sale.total_amount;
      const cost = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
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
        margin: value.revenue > 0 ? ((value.profit / value.revenue) * 100).toFixed(1) : 0
      });
    });

    const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalCost = sales.reduce((sum, s) => {
      const items = s.items ? JSON.parse(s.items) : [];
      return sum + items.reduce((itemSum, item) => itemSum + (item.unitPrice * item.quantity), 0);
    }, 0);

    res.json({
      dailyData,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit: totalRevenue - totalCost,
        margin: totalRevenue > 0 ? (((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(1) : 0,
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

    let query = "SELECT * FROM sales WHERE status = 'completed'";
    if (startDate && endDate) {
      query += ` AND date(created_at) >= '${startDate}' AND date(created_at) <= '${endDate}'`;
    }

    const sales = dbAll(query);

    const productStats = new Map();

    sales.forEach(sale => {
      const items = sale.items ? JSON.parse(sale.items) : [];
      items.forEach(item => {
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
      .slice(0, parseInt(limit));

    res.json(bestSelling);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todaySales = dbAll(`
      SELECT * FROM sales
      WHERE date(created_at) = ? AND status = 'completed'
    `, [today]);

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
    const todayProfit = todayRevenue * 0.25;

    const lowStock = dbAll(`
      SELECT * FROM products
      WHERE status = 'active' AND quantity <= low_stock_threshold
    `);

    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const expiring = dbAll(`
      SELECT * FROM products
      WHERE status = 'active' AND expiry_date IS NOT NULL
      AND expiry_date <= ? AND expiry_date >= ?
    `, [thirtyDays.toISOString().split('T')[0], today]);

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