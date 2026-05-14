import { dbAll } from '../config/db.js';

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Remaining sold quantity (original sold minus returned). */
export function itemNetQuantity(item) {
  const sold = safeNum(item.quantity, 0);
  const ret = safeNum(item.returnedQty, 0);
  return Math.max(0, sold - ret);
}

export function lineRevenue(item) {
  return safeNum(item.unitPrice, 0) * itemNetQuantity(item);
}

export function lineCost(item, purchaseFallback = 0) {
  const up =
    item.unitPurchasePrice != null && item.unitPurchasePrice !== ''
      ? safeNum(item.unitPurchasePrice, 0)
      : safeNum(purchaseFallback, 0);
  return up * itemNetQuantity(item);
}

export function parseSaleItems(sale) {
  if (!sale?.items) return [];
  try {
    return typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
  } catch {
    return [];
  }
}

/** Collect product ids missing unitPurchasePrice for fallback COGS. */
export function missingPurchaseProductIds(items) {
  const ids = new Set();
  for (const it of items) {
    if ((it.unitPurchasePrice == null || it.unitPurchasePrice === '') && it.product) {
      ids.add(it.product);
    }
  }
  return [...ids];
}

export function fetchPurchasePriceMap(productIds) {
  if (!productIds.length) return {};
  const placeholders = productIds.map(() => '?').join(',');
  const rows = dbAll(`SELECT id, purchase_price FROM products WHERE id IN (${placeholders})`, productIds);
  const map = {};
  for (const r of rows) {
    map[r.id] = safeNum(r.purchase_price, 0);
  }
  return map;
}

/**
 * Net revenue, COGS, and gross profit for one sale.
 * Revenue uses stored total_amount (net of returns) when valid so it stays aligned with POS totals.
 */
export function profitFromSaleRow(sale, purchaseMap = {}) {
  const items = parseSaleItems(sale);
  let cost = 0;
  let lineRevenueSum = 0;
  for (const it of items) {
    lineRevenueSum += lineRevenue(it);
    cost += lineCost(it, purchaseMap[it.product] ?? 0);
  }
  const storedTotal = safeNum(sale.total_amount, NaN);
  const revenue = Number.isFinite(storedTotal) ? storedTotal : lineRevenueSum;
  const profit = revenue - cost;
  return {
    revenue,
    cost,
    profit: Number.isFinite(profit) ? profit : 0
  };
}

export function sumSalesProfit(sales) {
  const allIds = new Set();
  for (const s of sales) {
    for (const id of missingPurchaseProductIds(parseSaleItems(s))) {
      allIds.add(id);
    }
  }
  const purchaseMap = fetchPurchasePriceMap([...allIds]);
  let profit = 0;
  for (const s of sales) {
    profit += profitFromSaleRow(s, purchaseMap).profit;
  }
  return Number.isFinite(profit) ? profit : 0;
}

/** Calendar YYYY-MM-DD from SQLite created_at (handles "..." or "...T..."). */
export function saleCalendarDay(createdAt) {
  if (createdAt == null) return '';
  const s = String(createdAt);
  return s.length >= 10 ? s.slice(0, 10) : s;
}
