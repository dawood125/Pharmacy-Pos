import { dbAll } from '../config/db.js';
import {
  parseSaleItems,
  missingPurchaseProductIds,
  fetchPurchasePriceMap,
  profitFromSaleRow,
  sumSalesProfit,
  itemNetQuantity,
  lineRevenue,
  lineCost
} from '../utils/saleMetrics.js';

const SALE_STATUSES_SQL = `status IN ('completed', 'partially_returned', 'fully_returned')`;

function buildPurchaseMapForSales(salesRows) {
  const ids = new Set();
  for (const s of salesRows) {
    for (const id of missingPurchaseProductIds(parseSaleItems(s))) {
      ids.add(id);
    }
  }
  return fetchPurchasePriceMap([...ids]);
}

export const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const sales = dbAll(
      `
      SELECT * FROM sales
      WHERE date(created_at) = ? AND ${SALE_STATUSES_SQL}
    `,
      [targetDate]
    );

    const purchaseMap = buildPurchaseMapForSales(sales);

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalProfit = sumSalesProfit(sales);

    const salesWithItems = sales.map(sale => {
      const items = sale.items ? JSON.parse(sale.items) : [];
      const { profit } = profitFromSaleRow({ ...sale, items }, purchaseMap);
      return {
        ...sale,
        items,
        profit
      };
    });

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

    const sales = dbAll(
      `
      SELECT * FROM sales
      WHERE date(created_at) >= ? AND date(created_at) <= ? AND ${SALE_STATUSES_SQL}
    `,
      [startDate, endDate]
    );

    const purchaseMap = buildPurchaseMapForSales(sales);

    const dailyMap = new Map();

    sales.forEach(sale => {
      const day = sale.created_at.split('T')[0];
      const items = parseSaleItems(sale);
      const revenue = sale.total_amount;
      const cost = items.reduce(
        (sum, item) => sum + lineCost(item, purchaseMap[item.product] ?? 0),
        0
      );
      const profit = revenue - cost;

      const existing = dailyMap.get(day) || { revenue: 0, cost: 0, profit: 0 };
      dailyMap.set(day, {
        revenue: existing.revenue + revenue,
        cost: existing.cost + cost,
        profit: existing.profit + profit
      });
    });

    const dailyData = [];
    dailyMap.forEach((value, key) => {
      dailyData.push({
        date: key,
        ...value,
        margin: value.revenue > 0 ? ((value.profit / value.revenue) * 100).toFixed(1) : 0
      });
    });

    dailyData.sort((a, b) => a.date.localeCompare(b.date));

    const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalCost = sales.reduce((sum, s) => {
      const items = parseSaleItems(s);
      return sum + items.reduce(
        (itemSum, item) => itemSum + lineCost(item, purchaseMap[item.product] ?? 0),
        0
      );
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

    const params = [];
    let query = `SELECT * FROM sales WHERE ${SALE_STATUSES_SQL}`;

    if (startDate && endDate) {
      query += ' AND date(created_at) >= ? AND date(created_at) <= ?';
      params.push(startDate, endDate);
    }

    const sales = dbAll(query, params);

    const productStats = new Map();

    sales.forEach(sale => {
      const items = parseSaleItems(sale);
      items.forEach(item => {
        const net = itemNetQuantity(item);
        if (net <= 0) return;
        const rev = lineRevenue(item);
        const existing = productStats.get(item.productName) || { sold: 0, revenue: 0 };
        productStats.set(item.productName, {
          sold: existing.sold + net,
          revenue: existing.revenue + rev
        });
      });
    });

    const bestSelling = Array.from(productStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, parseInt(limit, 10));

    res.json(bestSelling);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todaySales = dbAll(
      `
      SELECT * FROM sales
      WHERE date(created_at) = ? AND ${SALE_STATUSES_SQL}
    `,
      [today]
    );

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
    const todayProfit = sumSalesProfit(todaySales);
    const todayMarginPct =
      todayRevenue > 0 ? ((todayProfit / todayRevenue) * 100).toFixed(1) : '0';

    const lowStock = dbAll(`
      SELECT * FROM products
      WHERE status = 'active' AND quantity <= low_stock_threshold
    `);

    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const expiring = dbAll(
      `
      SELECT * FROM products
      WHERE status = 'active' AND expiry_date IS NOT NULL
      AND expiry_date <= ? AND expiry_date >= ?
    `,
      [thirtyDays.toISOString().split('T')[0], today]
    );

    const expired = dbAll(
      `
      SELECT * FROM products
      WHERE status = 'active' AND expiry_date IS NOT NULL
      AND expiry_date < ? AND quantity > 0
      ORDER BY expiry_date ASC
    `,
      [today]
    );

    res.json({
      todaySales: todaySales.length,
      todayRevenue,
      todayProfit,
      todayMarginPct,
      lowStockCount: lowStock.length,
      expiringCount: expiring.length,
      expiredCount: expired.length,
      lowStockItems: lowStock.slice(0, 5),
      expiringItems: expiring.slice(0, 5),
      expiredItems: expired.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
