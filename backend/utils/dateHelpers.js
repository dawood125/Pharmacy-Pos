/** Local calendar YYYY-MM-DD (matches browser inventory expiry logic). */
export function todayYmdLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ymdFromDb(value) {
  if (value == null || value === '') return null;
  return String(value).slice(0, 10);
}

export function isProductExpired(expiryDate) {
  const y = ymdFromDb(expiryDate);
  if (!y) return false;
  return y < todayYmdLocal();
}
