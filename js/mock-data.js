// ============================================
// PHẦN 2 — DASHBOARD KANBAN
// ============================================
const KanbanModule = (() => {
  let customers = [];
  let staff = [];

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  }

  function parseAssignees(assignedToField) {
    if (!assignedToField) return {};
    try { return JSON.parse(assignedToField); } catch (e) { return {}; }
  }

  async function load() {
    App.setLoading(true);
    try {
      [customers, staff] = await Promise.all([API.getCustomers(), API.getStaff()]);
    } catch (e) {
      App.toast('Lỗi tải dữ liệu: ' + e.message);
      customers = []; staff = [];
    }
    App.setLoading(false);
    render();
  }

  function columnsList() {
    return [...CONFIG.STATUSES, CONFIG.SPECIAL_STATUS];
  }

  function render() {
    const el = document.getElementById('view-content');
    const cols = columnsList();

    el.innerHTML = `
      <div class="topbar"><h2>Kanban — Quy trình chăm sóc khách hàng</h2></div>
      <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:12px">
        ${cols.map(col => columnHtml(col)).join('')}
      </div>
    `;
  }

  function columnHtml(col) {
    const inColumn = customers.filter(c => Urgency.parseStatuses(c.Status).includes(col.name));
    return `
      <div style="min-width:260px; max-width:260px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); display:flex; flex-direction:column; max-height:calc(100vh - 130px)">
        <div style="padding:10px 12px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center">
          <strong style="font-size:12px; color:${col.color}">${escapeHtml(col.name)}</strong>
          <span class="badge" style="background:${col.color}">${inColumn.length}</span>
        </div>
        <div style="padding:10px; overflow-y:auto; display:flex; flex-direction:column; gap:8px">
          ${inColumn.length ? inColumn.map(c => cardHtml(c, col)).join('') : `<div style="font-size:12px; color:var(--ink-soft); text-align:center; padding:12px 0">Trống</div>`}
        </div>
      </div>
    `;
  }

  function cardHtml(c, col) {
    const assigneeMap = parseAssignees(c.AssignedTo);
    const assignee = assigneeMap[col.name];
    const u = Urgency.compute(c);
    const otherStatuses = Urgency.parseStatuses(c.Status).filter(s => s !== col.name);

    return `
      <div onclick="KanbanModule.openCard('${c.ID}')" style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px; cursor:pointer">
        <div style="font-weight:600; font-size:13px">${escapeHtml(c.Name || '(chưa có tên)')}</div>
        ${assignee ? `<div style="font-size:11px; color:var(--ink-soft); margin-top:2px">👤 ${escapeHtml(assignee)}</div>` : (statusMetaRequire(col.name) ? `<div style="font-size:11px; color:var(--danger); margin-top:2px">⚠ Chưa có người phụ trách</div>` : '')}
        ${otherStatuses.length ? `<div style="font-size:10px; color:var(--ink-soft); margin-top:4px">Đồng thời: ${otherStatuses.map(escapeHtml).join(', ')}</div>` : ''}
        ${!u.frozen && !u.paused ? `<div style="margin-top:6px">${Urgency.barHtml(c)}</div>` : ''}
      </div>
    `;
  }

  function statusMetaRequire(name) {
    const meta = CONFIG.STATUSES.find(s => s.name === name);
    return meta ? meta.requireAssignee : false;
  }

  async function openCard(id) {
    await CustomersModule.openFromExternal(id);
  }

  return { load, render, openCard };
})();
