const API_BASE = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() && { Authorization: `Bearer ${getToken()}` })
});

const handleResponse = async (res) => {
  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { message: text };
  }
  
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP Error ${res.status}`);
  }
  return data;
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  // Products
  getProducts: async (search = '', page = 1, limit = 50) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) q.set('search', search);
    const res = await fetch(`${API_BASE}/products?${q}`, { headers: headers() });
    return handleResponse(res);
  },

  getProduct: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`, { headers: headers() });
    return handleResponse(res);
  },

  createProduct: async (product) => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(product)
    });
    return handleResponse(res);
  },

  updateProduct: async (id, product) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(product)
    });
    return handleResponse(res);
  },

  deleteProduct: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: headers() });
    return handleResponse(res);
  },

  getLowStock: async () => {
    const res = await fetch(`${API_BASE}/products/low-stock`, { headers: headers() });
    return handleResponse(res);
  },

  getExpiringSoon: async () => {
    const res = await fetch(`${API_BASE}/products/expiring`, { headers: headers() });
    return handleResponse(res);
  },

  getExpiredProducts: async (page = 1, limit = 50) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${API_BASE}/products/expired?${q}`, { headers: headers() });
    return handleResponse(res);
  },

  // Sales
  createSale: async (sale) => {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(sale)
    });
    return handleResponse(res);
  },

  getSales: async (page = 1, startDate, endDate, limit = 50, search = '') => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (startDate && endDate) {
      q.set('startDate', startDate);
      q.set('endDate', endDate);
    }
    if (search) q.set('search', search);
    const res = await fetch(`${API_BASE}/sales?${q}`, { headers: headers() });
    return handleResponse(res);
  },

  getSaleByInvoice: async (invoice) => {
    const res = await fetch(`${API_BASE}/sales/invoice/${invoice}`, { headers: headers() });
    return handleResponse(res);
  },

  // Returns
  getReturns: async () => {
    const res = await fetch(`${API_BASE}/returns`, { headers: headers() });
    return handleResponse(res);
  },

  getReturnByInvoice: async (invoice) => {
    const res = await fetch(`${API_BASE}/returns/invoice/${invoice}`, { headers: headers() });
    return handleResponse(res);
  },

  createReturn: async (returnData) => {
    const res = await fetch(`${API_BASE}/returns`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(returnData)
    });
    return handleResponse(res);
  },

  // Reports
  getDailySales: async (date) => {
    const res = await fetch(`${API_BASE}/reports/daily?date=${date}`, { headers: headers() });
    return handleResponse(res);
  },

  getMonthlyReport: async (year, month) => {
    const res = await fetch(`${API_BASE}/reports/monthly?year=${year}&month=${month}`, { headers: headers() });
    return handleResponse(res);
  },

  getBestSelling: async (limit = 10) => {
    const res = await fetch(`${API_BASE}/reports/best-selling?limit=${limit}`, { headers: headers() });
    return handleResponse(res);
  },

  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/reports/dashboard`, { headers: headers() });
    return handleResponse(res);
  },

  // Users
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`, { headers: headers() });
    return handleResponse(res);
  },

  getUserStats: async () => {
    const res = await fetch(`${API_BASE}/users/stats`, { headers: headers() });
    return handleResponse(res);
  },

  createUser: async (user) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(user)
    });
    return handleResponse(res);
  },

  updateUser: async (id, user) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(user)
    });
    return handleResponse(res);
  },

  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE', headers: headers() });
    return handleResponse(res);
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`, { headers: headers() });
    return handleResponse(res);
  },

  getStoreConfig: async () => {
    const res = await fetch(`${API_BASE}/settings/store`, { headers: headers() });
    return handleResponse(res);
  },

  getTaxConfig: async () => {
    const res = await fetch(`${API_BASE}/settings/tax`, { headers: headers() });
    return handleResponse(res);
  },

  updateSettings: async (settings) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  }
};