import { dbAll } from '../config/db.js';
import { todayYmdLocal } from '../utils/dateHelpers.js';
import {
  parseSaleItems,
  missingPurchaseProductIds,
  fetchPurchasePriceMap,
  profitFromSaleRow,
  sumSalesProfit,
  itemNetQuantity,
  lineRevenue,
  lineCost,
  saleCalendarDay
} from '../utils/saleMetrics.js';

/** Last calendar day of month (month is 1–12). Local date, no UTC shift. */
function lastDayOfCalendarMonth(year, month) {
  const y = Number(year);
  const m = Number(month);
  const d = new Date(y, m, 0);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

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

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
    const totalProfit = sumSalesProfit(sales);

    const salesWithItems = sales.map(sale => {
      const items = parseSaleItems(sale);
      const { profit } = profitFromSaleRow({ ...sale, items }, purchaseMap);
      return {
        ...sale,
        items,
        profit: Number.isFinite(profit) ? profit : 0
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
    const now = new Date();
    let y = Number(req.query.year);
    let m = Number(req.query.month);
    if (!Number.isFinite(y) || y < 2000) y = now.getFullYear();
    if (!Number.isFinite(m) || m < 1 || m > 12) m = now.getMonth() + 1;

    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = lastDayOfCalendarMonth(y, m);

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
      const day = saleCalendarDay(sale.created_at);
      if (!day) return;
      const items = parseSaleItems(sale);
      const revenue = Number(sale.total_amount || 0);
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
      const margin =
        value.revenue > 0 && Number.isFinite(value.profit)
          ? ((value.profit / value.revenue) * 100).toFixed(1)
          : '0';
      dailyData.push({
        date: key,
        ...value,
        margin
      });
    });

    dailyData.sort((a, b) => a.date.localeCompare(b.date));

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
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
        margin: totalRevenue > 0 && Number.isFinite(totalRevenue - totalCost)
          ? (((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(1)
          : '0',
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
    const today = todayYmdLocal();

    const todaySales = dbAll(
      `
      SELECT * FROM sales
      WHERE date(created_at) = ? AND ${SALE_STATUSES_SQL}
    `,
      [today]
    );

    const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const todayProfit = sumSalesProfit(todaySales);
    const marginRaw = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;
    const todayMarginPct = Number.isFinite(marginRaw) ? marginRaw.toFixed(1) : '0';

    const lowStock = dbAll(`
      SELECT * FROM products
      WHERE status = 'active' AND quantity <= low_stock_threshold
      AND (expiry_date IS NULL OR substr(expiry_date, 1, 10) >= ?)
    `, [today]);

    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const expiringEnd = `${thirtyDays.getFullYear()}-${String(thirtyDays.getMonth() + 1).padStart(2, '0')}-${String(thirtyDays.getDate()).padStart(2, '0')}`;
    const expiring = dbAll(
      `
      SELECT * FROM products
      WHERE status = 'active' AND expiry_date IS NOT NULL
      AND substr(expiry_date, 1, 10) <= ? AND substr(expiry_date, 1, 10) >= ?
    `,
      [expiringEnd, today]
    );

    const expired = dbAll(
      `
      SELECT * FROM products
      WHERE status = 'active' AND expiry_date IS NOT NULL
      AND substr(expiry_date, 1, 10) < ?
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
