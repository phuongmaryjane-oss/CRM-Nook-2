// ============================================
// PHẦN 4 — LỊCH NHẮC NHỞ (dạng lưới các ngày trong tháng)
// Gom toàn bộ Note có ReminderTime của mọi khách hàng, hiển thị theo ngày.
// ============================================
const CalendarModule = (() => {
  let customers = [];
  let viewYear = null;
  let viewMonth = null; // 0-indexed
  const WEEKDAY_LABELS = ['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN'];

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function fmtTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

  async function load() {
    App.setLoading(true);
    try {
      customers = await API.getCustomers();
    } catch (e) {
      App.toast('Lỗi tải dữ liệu: ' + e.message);
      customers = [];
    }
    App.setLoading(false);
    if (viewYear === null) {
      const today = new Date();
      viewYear = today.getFullYear();
      viewMonth = today.getMonth();
    }
    render();
  }

  function buildReminderMap() {
    const map = {};
    customers.forEach(c => {
      (c.notes || []).forEach(n => {
        if (!n.ReminderTime) return;
        const d = new Date(n.ReminderTime);
        if (isNaN(d.getTime())) return;
        const key = dateKey(d);
        (map[key] = map[key] || []).push({ customer: c, note: n, time: d });
      });
    });
    Object.values(map).forEach(list => list.sort((a, b) => a.time - b.time));
    return map;
  }

  function gridDates() {
    const first = new Date(viewYear, viewMonth, 1);
    const startWeekday = (first.getDay() + 6) % 7; // 0 = Thứ 2
    const start = new Date(viewYear, viewMonth, 1 - startWeekday);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push(d);
    }
    return cells;
  }

  function render() {
    const el = document.getElementById('view-content');
    const map = buildReminderMap();
    const cells = gridDates();
    const todayKey = dateKey(new Date());
    const monthTotal = Object.entries(map).filter(([k]) => {
      const [y, m] = k.split('-').map(Number);
      return y === viewYear && (m - 1) === viewMonth;
    }).reduce((sum, [, list]) => sum + list.length, 0);

    el.innerHTML = `
      <div class="topbar">
        <h2>Lịch nhắc nhở</h2>
        <div style="display:flex; gap:8px; align-items:center">
          <button class="btn btn-sm" onclick="CalendarModule.prevMonth()">← Trước</button>
          <strong style="min-width:130px; text-align:center; font-family:'Fraunces',serif">Tháng ${viewMonth + 1}/${viewYear}</strong>
          <button class="btn btn-sm" onclick="CalendarModule.nextMonth()">Sau →</button>
          <button class="btn btn-sm" onclick="CalendarModule.goToday()">Hôm nay</button>
        </div>
      </div>
      <div style="font-size:12px; color:var(--ink-soft); margin-bottom:8px">${monthTotal} nhắc nhở trong tháng này</div>
      <div class="cal-weekdays">${WEEKDAY_LABELS.map(l => `<div>${l}</div>`).join('')}</div>
      <div class="cal-grid">
        ${cells.map(d => cellHtml(d, map, todayKey)).join('')}
      </div>
    `;
  }

  function cellHtml(d, map, todayKey) {
    const key = dateKey(d);
    const inMonth = d.getMonth() === viewMonth;
    const items = map[key] || [];
    const isToday = key === todayKey;
    const shown = items.slice(0, 3);
    const rest = items.length - shown.length;

    return `
      <div class="cal-cell ${inMonth ? '' : 'cal-cell-out'} ${isToday ? 'cal-cell-today' : ''}">
        <div class="cal-cell-date">${d.getDate()}</div>
        <div class="cal-cell-items">
          ${shown.map(it => reminderChip(it)).join('')}
          ${rest > 0 ? `<div class="cal-more" onclick="CalendarModule.openDay('${key}')">+${rest} khác</div>` : ''}
        </div>
      </div>
    `;
  }

  function reminderChip(it) {
    const overdue = !it.note.Done && it.time.getTime() < Date.now();
    const cls = it.note.Done ? 'cal-chip cal-chip-done' : (overdue ? 'cal-chip cal-chip-overdue' : 'cal-chip');
    return `<div class="${cls}" title="${escapeHtml(it.note.NoteText || '')}" onclick="event.stopPropagation(); CalendarModule.openCustomer('${it.customer.ID}')">
      <span class="cal-chip-time">${fmtTime(it.time)}</span> ${escapeHtml(it.customer.Name || '')}
    </div>`;
  }

  function openDay(key) {
    const map = buildReminderMap();
    const items = map[key] || [];
    const [y, m, dd] = key.split('-');

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
      <div class="drawer" style="width:400px">
        <h2>Nhắc nhở ngày ${dd}/${m}/${y}</h2>
        <div class="drawer-section" style="margin-top:14px; border-top:none; padding-top:0">
          ${items.length ? items.map(it => `
            <div class="note-item" style="cursor:pointer" onclick="CalendarModule.openCustomer('${it.customer.ID}'); this.closest('.drawer-overlay').remove()">
              <strong>${escapeHtml(it.customer.Name || '')}</strong> — ${fmtTime(it.time)}
              <div style="margin-top:4px">${escapeHtml(it.note.NoteText || '')}</div>
              ${it.note.Done ? '<div class="note-time">✅ Đã xong</div>' : (it.time.getTime() < Date.now() ? '<div class="note-time" style="color:var(--danger)">⏰ Quá hạn</div>' : '')}
            </div>
          `).join('') : '<div style="font-size:12px;color:var(--ink-soft)">Không có nhắc nhở nào.</div>'}
        </div>
        <div style="margin-top:20px"><button class="btn" onclick="this.closest('.drawer-overlay').remove()">Đóng</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function prevMonth() {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    render();
  }
  function nextMonth() {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    render();
  }
  function goToday() {
    const t = new Date();
    viewYear = t.getFullYear();
    viewMonth = t.getMonth();
    render();
  }

  async function openCustomer(id) {
    await CustomersModule.openFromExternal(id);
  }

  return { load, render, prevMonth, nextMonth, goToday, openDay, openCustomer };
})();
