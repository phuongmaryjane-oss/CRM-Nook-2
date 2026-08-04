// ============================================
// API — giao tiếp với Google Apps Script backend
// (DEMO_MODE = true trong config.js sẽ chuyển toàn bộ qua MockAPI - js/mock-data.js)
// ============================================
const API = {
  async get(action, params = {}) {
    if (CONFIG.DEMO_MODE) return MockAPI.get(action, params);
    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${CONFIG.API_URL}?${qs}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json;
  },

  async post(action, data = {}) {
    if (CONFIG.DEMO_MODE) return MockAPI.post(action, data);
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // tránh CORS preflight với Apps Script
      body: JSON.stringify({ action, data }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json;
  },

  getCustomers: () => API.get('getCustomers'),
  getStaff: () => API.get('getStaff'),
  getFinance: () => API.get('getFinance'),
  getStatusHistory: () => API.get('getStatusHistory'),

  saveCustomer: (data) => API.post('saveCustomer', data),
  addNote: (data) => API.post('addNote', data),
  assignStatus: (data) => API.post('assignStatus', data),
  confirmAssignment: (data) => API.post('confirmAssignment', data),
  saveFinance: (data) => API.post('saveFinance', data),
  notifyNewCustomer: (data) => API.post('notifyNewCustomer', data),
};
