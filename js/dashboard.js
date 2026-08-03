// ============================================
// PHẦN 5 — DASHBOARD BÁO CÁO TỔNG QUAN
// ============================================
const DashboardModule = (() => {
  let customers = [];
  let dateFrom = null;
  let dateTo = null;

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  }

  function defaultRange() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }

  async function load() {
    App.setLoading(true);
    try {
      customers = await API.getCustomers();
    } catch (e) {
      App.toast('Lỗi tải dữ liệu: ' + e.message);
      customers = [];
    }
    App.setLoading(false);
    const range = defaultRange();
    dateFrom = dateFrom || range.from;
    dateTo = dateTo || range.to;
    render();
  }

  function inRange(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr).getTime();
    const from = new Date(dateFrom).getTime();
    const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
    return d >= from && d <= to;
  }

  function hasStatus(c, name) {
    return Urgency.parseStatuses(c.Status).includes(name);
  }

  function render() {
    const el = document.getElementById('view-content');

    const newContacts = customers.filter(c => inRange(c.CreatedAt)).length;
    const deposited = customers.filter(c => hasStatus(c, 'Trao đổi & cọc phí thiết kế') || hasStatus(c, 'Báo giá thi công & cọc 50% hợp đồng')).length;
    const waitingDesign = customers.filter(c => hasStatus(c, 'Thiết kế 3D')).length;
    const installing = customers.filter(c => hasStatus(c, 'Lắp đặt, bàn giao')).length;

    const urgentList = customers
      .map(c => ({ c, u: Urgency.compute(c) }))
      .filter(({ u }) => !u.frozen && !u.paused && u.score >= 34)
      .sort((a, b) => b.u.score - a.u.score)
      .slice(0, 10);

    el.innerHTML = `
      <div class="topbar">
        <h2>Báo cáo tổng quan</h2>
        <div style="display:flex; gap:8px; align-items:center">
          <input type="date" id="f-date-from" value="${dateFrom}">
          <span style="color:var(--ink-soft)">→</span>
          <input type="date" id="f-date-to" value="${dateTo}">
          <button class="btn btn-primary" onclick="DashboardModule.applyRange()">Lọc</button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:20px">
        ${statCard('Khách liên hệ mới', newContacts, 'var(--sage-deep)')}
        ${statCard('Khách đã cọc', deposited, 'var(--sky)')}
        ${statCard('Đang chờ thiết kế', waitingDesign, 'var(--wood)')}
        ${statCard('Đang lắp đặt', installing, 'var(--amber)')}
      </div>

      <div class="table-wrap">
        <div style="padding:12px 14px; border-bottom:1px solid var(--border)"><strong>🔴 Top khách cần chăm gấp</strong></div>
        <table>
          <thead><tr><th>Khách hàng</th><th>SĐT</th><th>Điểm khẩn cấp</th><th></th></tr></thead>
          <tbody>
            ${urgentList.length ? urgentList.map(({ c, u }) => `
              <tr class="customer-row" onclick="DashboardModule.openCustomer('${c.ID}')">
                <td><strong>${escapeHtml(c.Name)}</strong></td>
                <td>${escapeHtml(c.Phone || '')}</td>
                <td>${Urgency.barHtml(c)}</td>
                <td></td>
              </tr>
            `).join('') : `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--ink-soft)">Không có khách nào đang cần chăm gấp 🎉</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  function statCard(label, value, color) {
    return `
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:16px">
        <div style="font-size:12px; color:var(--ink-soft)">${label}</div>
        <div style="font-family:'Fraunces',serif; font-size:28px; font-weight:600; color:${color}; margin-top:4px">${value}</div>
      </div>
    `;
  }

  function applyRange() {
    dateFrom = document.getElementById('f-date-from').value;
    dateTo = document.getElementById('f-date-to').value;
    render();
  }

  async function openCustomer(id) {
    await CustomersModule.openFromExternal(id);
  }

  return { load, render, applyRange, openCustomer };
})();
