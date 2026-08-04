// ============================================
// APP SHELL — điều hướng giữa 6 module
// ============================================
const NAV_ITEMS = [
  { id: 'customers', label: 'Khách hàng', icon: '👤', ready: true },
  { id: 'kanban',    label: 'Kanban',     icon: '📋', ready: true },
  { id: 'staff',     label: 'Nhân sự',    icon: '🧑‍💼', ready: false },
  { id: 'calendar',  label: 'Lịch',       icon: '📅', ready: true },
  { id: 'dashboard', label: 'Báo cáo',    icon: '📊', ready: true },
  { id: 'finance',   label: 'Tài chính',  icon: '💰', ready: false },
];

const App = (() => {
  let current = 'customers';

  function init() {
    if (!CONFIG.CURRENT_USER) {
      const name = prompt('Nhập tên của bạn để bắt đầu (dùng để ghi nhận người thao tác):');
      if (name) {
        CONFIG.CURRENT_USER = name;
        localStorage.setItem('crm_current_user', name);
      }
    }
    renderNav();
    navigate('customers');
    registerServiceWorker();
  }

  function renderNav() {
    const nav = document.getElementById('nav-items');
    nav.innerHTML = NAV_ITEMS.map(item => `
      <div class="nav-item ${item.id === current ? 'active' : ''}" onclick="App.navigate('${item.id}')">
        <span>${item.icon}</span><span>${item.label}</span>
      </div>
    `).join('');
  }

  function navigate(id) {
    current = id;
    renderNav();
    const item = NAV_ITEMS.find(x => x.id === id);
    if (!item.ready) {
      document.getElementById('view-content').innerHTML = `
        <div class="placeholder-view">
          <h2>${item.icon} ${item.label}</h2>
          <p>Phần này đang chờ chị xác nhận quy trình / thông tin chi tiết để xây dựng đúng nghiệp vụ.</p>
        </div>`;
      return;
    }
    if (id === 'customers') CustomersModule.load();
    if (id === 'kanban') KanbanModule.load();
    if (id === 'calendar') CalendarModule.load();
    if (id === 'dashboard') DashboardModule.load();
  }

  function setLoading(isLoading) {
    let el = document.getElementById('loading-bar');
    if (!el) return;
    el.style.display = isLoading ? 'block' : 'none';
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  return { init, navigate, setLoading, toast };
})();

document.addEventListener('DOMContentLoaded', App.init);
