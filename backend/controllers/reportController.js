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
    const { date, startDate, endDate } = req.query;
    
    let salesQuery = `SELECT * FROM sales WHERE ${SALE_STATUSES_SQL}`;
    let returnsQuery = `SELECT * FROM returns WHERE 1=1`;
    const params = [];
    
    if (startDate && endDate) {
      salesQuery += ' AND date(created_at) >= ? AND date(created_at) <= ?';
      returnsQuery += ' AND date(created_at) >= ? AND date(created_at) <= ?';
      params.push(startDate, endDate);
    } else {
      const targetDate = date || new Date().toISOString().split('T')[0];
      salesQuery += ' AND date(created_at) = ?';
      returnsQuery += ' AND date(created_at) = ?';
      params.push(targetDate);
    }

    const sales = dbAll(salesQuery, params);
    const dayReturns = dbAll(returnsQuery, params);

    const purchaseMap = buildPurchaseMapForSales(sales);

    let totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
    let totalProfit = sumSalesProfit(sales);

    // Adjust revenue and profit for returns made on this day for PAST sales
    const returnsForPastSales = dayReturns.filter(r => {
      const sale = dbGet('SELECT created_at FROM sales WHERE invoice_number = ?', [r.original_invoice]);
      if (!sale || !sale.created_at) return false;
      const saleDate = sale.created_at.substring(0, 10);
      if (startDate && endDate) {
        return saleDate < startDate;
      } else {
        const targetDate = date || new Date().toISOString().split('T')[0];
        return saleDate !== targetDate;
      }
    });

    for (const r of returnsForPastSales) {
      const refund = Number(r.total_refund || 0);
      totalRevenue -= refund;

      let costRecovered = 0;
      const retItems = r.items ? (typeof r.items === 'string' ? JSON.parse(r.items) : r.items) : [];
      for (const item of retItems) {
        const prod = dbGet('SELECT purchase_price FROM products WHERE id = ?', [item.product]);
        if (prod) {
          costRecovered += (Number(prod.purchase_price) || 0) * (Number(item.quantity) || 0);
        }
      }
      totalProfit -= (refund - costRecovered);
    }

    const salesWithItems = sales.map(sale => {
      const items = parseSaleItems(sale);
      const { profit } = profitFromSaleRow({ ...sale, items }, purchaseMap);
      return {
        ...sale,
        items,
        profit: Number.isFinite(profit) ? profit : 0
      };
    });
    
    // Also parse items for returns so frontend can use them
    const returnsWithItems = dayReturns.map(r => ({
      ...r,
      items: r.items ? (typeof r.items === 'string' ? JSON.parse(r.items) : r.items) : []
    }));

    res.json({
      sales: salesWithItems,
      returns: returnsWithItems,
      summary: {
        totalSales: sales.filter(s => s.status !== 'fully_returned').length,
        totalRevenue,
        totalProfit,
        totalRefunds: dayReturns.reduce((sum, r) => sum + Number(r.total_refund || 0), 0)
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

    const monthReturns = dbAll(
      `
      SELECT * FROM returns
      WHERE date(created_at) >= ? AND date(created_at) <= ?
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

      const existing = dailyMap.get(day) || { revenue: 0, cost: 0, profit: 0, refunds: 0 };
      dailyMap.set(day, {
        ...existing,
        revenue: existing.revenue + revenue,
        cost: existing.cost + cost,
        profit: existing.profit + profit
      });
    });

    monthReturns.forEach(r => {
      const day = saleCalendarDay(r.created_at);
      if (!day) return;
      
      const sale = dbGet('SELECT created_at FROM sales WHERE invoice_number = ?', [r.original_invoice]);
      if (sale && sale.created_at && !sale.created_at.startsWith(day)) {
        const refund = Number(r.total_refund || 0);
        let costRecovered = 0;
        const retItems = r.items ? (typeof r.items === 'string' ? JSON.parse(r.items) : r.items) : [];
        for (const item of retItems) {
          const prod = dbGet('SELECT purchase_price FROM products WHERE id = ?', [item.product]);
          if (prod) {
            costRecovered += (Number(prod.purchase_price) || 0) * (Number(item.quantity) || 0);
          }
        }
        
        const existing = dailyMap.get(day) || { revenue: 0, cost: 0, profit: 0, refunds: 0 };
        dailyMap.set(day, {
          ...existing,
          revenue: existing.revenue - refund,
          profit: existing.profit - (refund - costRecovered),
          refunds: existing.refunds + refund
        });
      } else if (sale) {
         // Already netted out of today's sales total_amount, but let's record the refund amount
         const refund = Number(r.total_refund || 0);
         const existing = dailyMap.get(day) || { revenue: 0, cost: 0, profit: 0, refunds: 0 };
         dailyMap.set(day, {
           ...existing,
           refunds: existing.refunds + refund
         });
      }
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

    let totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    let totalCost = sales.reduce((sum, s) => {
      const items = parseSaleItems(s);
      return sum + items.reduce(
        (itemSum, item) => itemSum + lineCost(item, purchaseMap[item.product] ?? 0),
        0
      );
    }, 0);
    let totalProfit = totalRevenue - totalCost;
    
    // Adjust total for returns of past month sales
    const returnsForPastSales = monthReturns.filter(r => {
      const sale = dbGet('SELECT created_at FROM sales WHERE invoice_number = ?', [r.original_invoice]);
      return sale && sale.created_at && sale.created_at < startDate;
    });

    for (const r of returnsForPastSales) {
      const refund = Number(r.total_refund || 0);
      totalRevenue -= refund;

      let costRecovered = 0;
      const retItems = r.items ? (typeof r.items === 'string' ? JSON.parse(r.items) : r.items) : [];
      for (const item of retItems) {
        const prod = dbGet('SELECT purchase_price FROM products WHERE id = ?', [item.product]);
        if (prod) {
          costRecovered += (Number(prod.purchase_price) || 0) * (Number(item.quantity) || 0);
        }
      }
      totalProfit -= (refund - costRecovered);
    }

    res.json({
      dailyData,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        margin: totalRevenue > 0 && Number.isFinite(totalProfit)
          ? ((totalProfit / totalRevenue) * 100).toFixed(1)
          : '0',
        totalTransactions: sales.filter(s => s.status !== 'fully_returned').length,
        totalRefunds: monthReturns.reduce((sum, r) => sum + Number(r.total_refund || 0), 0)
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

    const todayReturns = dbAll(
      `
      SELECT * FROM returns
      WHERE date(created_at) = ?
    `,
      [today]
    );

    let todayRevenue = 0;
    let todayCost = 0;
    
    // Revenue and cost from sales created today (already net of any returns applied to them)
    // Wait, if a sale was created today and returned today, its total_amount is already reduced.
    // If a sale was created yesterday and returned today, its total_amount was reduced in the sales table, 
    // but the refund action happened today. So counting it properly requires looking at transactions.
    // To make it accurate: 
    // Revenue = (Sum of original sales created today) - (Sum of returns processed today)
    // Actually, since `total_amount` in sales is already net of returns, summing `total_amount` for today's sales 
    // ALREADY deducts returns made against today's sales.
    // BUT we also need to deduct returns made today against PAST sales.
    // This can get tricky. Let's just calculate:
    // Today's Revenue = (Today's Sales Gross) - (Today's Returns Total)
    
    // Instead of relying on the mutated sales table for daily revenue (which changes historical data),
    // we should compute daily cash flow: what was sold today - what was returned today.
    // But since the system currently mutates `total_amount` on returns, summing `total_amount` of today's sales 
    // is the Net Sales of today's invoices. 
    // If we subtract today's returns for PAST invoices, we get today's net cash flow.
    
    // Let's gather all original sales amount for today:
    // Wait, the sales table `total_amount` is ALREADY mutated.
    // Let's compute profit using `sumSalesProfit` for today's sales (which is net of returns on those sales).
    let netRevenue = todaySales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    let netProfit = sumSalesProfit(todaySales);
    
    // Now subtract returns made TODAY for sales that were NOT created today
    const returnsForPastSales = todayReturns.filter(r => {
      // Find the original sale date
      const sale = dbGet('SELECT created_at FROM sales WHERE invoice_number = ?', [r.original_invoice]);
      if (sale) {
        return sale.created_at && !sale.created_at.startsWith(today);
      }
      return false;
    });

    for (const r of returnsForPastSales) {
      const refund = Number(r.total_refund || 0);
      netRevenue -= refund;
      
      // Calculate cost of returned items to add back to profit
      // Profit = Revenue - Cost. If we refund revenue, we also recover cost.
      // So netProfit change = -Refund + Cost Recovered
      let costRecovered = 0;
      const retItems = r.items ? (typeof r.items === 'string' ? JSON.parse(r.items) : r.items) : [];
      for (const item of retItems) {
        const prod = dbGet('SELECT purchase_price FROM products WHERE id = ?', [item.product]);
        if (prod) {
          costRecovered += (Number(prod.purchase_price) || 0) * (Number(item.quantity) || 0);
        }
      }
      netProfit -= (refund - costRecovered);
    }

    const marginRaw = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
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
    
    // Count only non-fully-returned sales as active transactions
    const activeSalesCount = todaySales.filter(s => s.status !== 'fully_returned').length;

    res.json({
      todaySales: activeSalesCount,
      todayRevenue: netRevenue,
      todayProfit: netProfit,
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
