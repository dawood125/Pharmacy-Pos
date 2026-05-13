import { dbAll } from '../config/db.js';

/** Remaining sold quantity (original sold minus returned). */
export function itemNetQuantity(item) {
  const sold = Number(item.quantity) || 0;
  const ret = Number(item.returnedQty) || 0;
  return Math.max(0, sold - ret);
}

export function lineRevenue(item) {
  return (Number(item.unitPrice) || 0) * itemNetQuantity(item);
}

export function lineCost(item, purchaseFallback = 0) {
  const up =
    item.unitPurchasePrice != null && item.unitPurchasePrice !== ''
      ? Number(item.unitPurchasePrice)
      : Number(purchaseFallback) || 0;
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
    map[r.id] = r.purchase_price;
  }
  return map;
}

/** Net revenue, COGS, and gross profit for one sale row (uses DB sale.items JSON). */
export function profitFromSaleRow(sale, purchaseMap = {}) {
  const items = parseSaleItems(sale);
  let revenue = 0;
  let cost = 0;
  for (const it of items) {
    const fallback = purchaseMap[it.product] ?? 0;
    revenue += lineRevenue(it);
    cost += lineCost(it, fallback);
  }
  return { revenue, cost, profit: revenue - cost };
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
  return profit;
}
