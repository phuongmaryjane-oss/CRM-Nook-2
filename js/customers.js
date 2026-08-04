// ============================================
// PHẦN 1 — QUẢN LÝ KHÁCH HÀNG
// ============================================
const CustomersModule = (() => {
  let customers = [];
  let staff = [];
  let sortByUrgency = false;

  function statusMeta(name) {
    return CONFIG.STATUSES.find(s => s.name === name)
      || (name === CONFIG.SPECIAL_STATUS.name ? CONFIG.SPECIAL_STATUS : { color: '#999', requireAssignee: false });
  }

  function fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  }

  // AssignedTo được lưu dạng JSON: { "Tên bước": "Tên nhân sự", ... }
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

  function render() {
    const el = document.getElementById('view-content');
    el.innerHTML = `
      <div class="topbar">
        <h2>Quản lý khách hàng</h2>
        <div style="display:flex; gap:8px">
          <button class="btn ${sortByUrgency ? 'btn-primary' : ''}" onclick="CustomersModule.toggleSort()">
            🔴 Khẩn cấp nhất trước
          </button>
          <button class="btn btn-primary" onclick="CustomersModule.openNew()">+ Thêm khách hàng</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>SĐT</th>
              <th>Nguồn</th>
              <th>Trạng thái</th>
              <th>Phụ trách</th>
              <th>Độ khẩn cấp</th>
              <th>Nhắc nhở / Note</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody id="cust-tbody"></tbody>
        </table>
      </div>
    `;
    const tbody = document.getElementById('cust-tbody');
    if (!customers.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--ink-soft)">Chưa có khách hàng nào — bấm "+ Thêm khách hàng" để bắt đầu.</td></tr>`;
      return;
    }
    let list = [...customers];
    if (sortByUrgency) {
      const score = c => { const u = Urgency.compute(c); return u.frozen ? -1 : (u.paused ? 0 : u.score); };
      list.sort((a, b) => score(b) - score(a));
    }
    tbody.innerHTML = list.map(c => rowHtml(c)).join('');
  }

  function toggleSort() {
    sortByUrgency = !sortByUrgency;
    render();
  }

  function statusBadges(c) {
    const names = Urgency.parseStatuses(c.Status);
    if (!names.length) return `<span class="badge" style="background:#999">Chưa có</span>`;
    return names.map(n => {
      const st = statusMeta(n);
      return `<span class="badge" style="background:${st.color}; margin-right:4px">${escapeHtml(n)}</span>`;
    }).join('');
  }

  function assigneeDisplay(c) {
    const map = parseAssignees(c.AssignedTo);
    const entries = Object.entries(map).filter(([, v]) => v);
    if (!entries.length) return '—';
    return entries.map(([step, name]) => `${escapeHtml(name)} <span style="color:var(--ink-soft); font-size:11px">(${escapeHtml(step)})</span>`).join('<br>');
  }

  function rowHtml(c) {
    const upcomingNote = (c.notes || [])
      .filter(n => n.ReminderTime)
      .sort((a, b) => new Date(a.ReminderTime) - new Date(b.ReminderTime))[0];

    return `
      <tr class="customer-row" data-id="${c.ID}">
        <td onclick="CustomersModule.openDetail('${c.ID}')"><strong>${escapeHtml(c.Name || '(chưa có tên)')}</strong></td>
        <td class="editable-cell" contenteditable="true"
            onblur="CustomersModule.inlineSave('${c.ID}','Phone',this.innerText)">${escapeHtml(c.Phone || '')}</td>
        <td class="editable-cell" contenteditable="true"
            onblur="CustomersModule.inlineSave('${c.ID}','Source',this.innerText)">${escapeHtml(c.Source || '')}</td>
        <td onclick="CustomersModule.openDetail('${c.ID}')">${statusBadges(c)}</td>
        <td onclick="CustomersModule.openDetail('${c.ID}')" style="font-size:12px">${assigneeDisplay(c)}</td>
        <td>
          ${Urgency.barHtml(c)}
          ${!Urgency.compute(c).frozen ? `
            <div style="display:flex; gap:4px; margin-top:4px">
              <button class="btn btn-sm" onclick="event.stopPropagation(); CustomersModule.handleWaitingReply('${c.ID}')">Chờ rep</button>
              <button class="btn btn-sm" onclick="event.stopPropagation(); CustomersModule.handleResponded('${c.ID}')">Đã rep</button>
            </div>` : ''}
        </td>
        <td onclick="CustomersModule.openDetail('${c.ID}')">
          ${upcomingNote ? `<div class="reminder-chip">⏰ ${fmtDate(upcomingNote.ReminderTime)}</div>` : ''}
          ${(c.notes && c.notes[0]) ? `<div style="font-size:12px;color:var(--ink-soft);margin-top:3px">${escapeHtml((c.notes[0].NoteText||'').slice(0,40))}${(c.notes[0].NoteText||'').length>40?'…':''}</div>` : ''}
        </td>
        <td onclick="CustomersModule.openDetail('${c.ID}')" style="font-size:12px;color:var(--ink-soft)">${fmtDate(c.UpdatedAt)}</td>
      </tr>
    `;
  }

  async function inlineSave(id, field, value) {
    try {
      await API.saveCustomer({ ID: id, [field]: value });
      const c = customers.find(x => x.ID === id);
      if (c) c[field] = value;
      App.toast('Đã lưu');
    } catch (e) {
      App.toast('Lỗi lưu: ' + e.message);
    }
  }

  async function handleWaitingReply(id) {
    const c = customers.find(x => x.ID === id);
    if (!c) return;
    const suggest = await Urgency.markWaitingReply(c);
    render();
    if (suggest) offerPause(c);
  }

  async function handleResponded(id) {
    const c = customers.find(x => x.ID === id);
    if (!c) return;
    await Urgency.markResponded(c);
    App.toast('Đã ghi nhận khách phản hồi — reset về an toàn');
    render();
  }

  function offerPause(c) {
    if (!confirm(`Khách "${c.Name}" đã ${c.UrgencyContactAttempts} lần liên hệ không phản hồi.\n\nChuyển sang trạng thái "Không phản hồi/Tạm ngưng"?`)) return;
    API.saveCustomer({ ID: c.ID, Status: CONFIG.SPECIAL_STATUS.name })
      .then(() => {
        c.Status = CONFIG.SPECIAL_STATUS.name;
        App.toast('Đã chuyển sang Không phản hồi/Tạm ngưng');
        render();
      })
      .catch(e => App.toast('Lỗi: ' + e.message));
  }

  function openNew() {
    openDetail(null);
  }

  function openDetail(id) {
    const c = id ? customers.find(x => x.ID === id) : {
      ID: '', Name: '', Phone: '', Address: '', Source: '',
      Status: CONFIG.STATUSES[0].name, AssignedTo: '{}', ProjectValue: '', GhiChu: '', notes: []
    };

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const currentStatuses = Urgency.parseStatuses(c.Status);
    const currentAssignees = parseAssignees(c.AssignedTo);
    const u = Urgency.compute(c);

    overlay.innerHTML = `
      <div class="drawer">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <h2>${c.ID ? 'Chi tiết khách hàng' : 'Thêm khách hàng mới'}</h2>
          <button class="btn btn-sm" onclick="this.closest('.drawer-overlay').remove()">✕</button>
        </div>

        <div class="field-row"><label>Họ tên</label><input id="f-name" value="${escapeHtml(c.Name)}"></div>
        <div class="field-row"><label>Số điện thoại</label><input id="f-phone" value="${escapeHtml(c.Phone)}"></div>
        <div class="field-row"><label>Địa chỉ</label><input id="f-address" value="${escapeHtml(c.Address||'')}"></div>
        <div class="field-row"><label>Nguồn khách</label><input id="f-source" value="${escapeHtml(c.Source||'')}" placeholder="Facebook, Zalo, giới thiệu..."></div>
        <div class="field-row"><label>Giá trị dự kiến (VNĐ)</label><input id="f-value" value="${escapeHtml(c.ProjectValue||'')}"></div>

        <div class="drawer-section">
          <h3>Trạng thái & phân công</h3>
          <div id="status-slots">
            ${statusSlotHtml(0, currentStatuses[0], currentAssignees)}
          </div>
          <div id="status-slot-2-wrap">
            ${currentStatuses[1] ? statusSlotHtml(1, currentStatuses[1], currentAssignees) : ''}
          </div>
          <button class="btn btn-sm" id="btn-add-second-status" type="button"
            onclick="CustomersModule.addSecondStatusSlot()"
            style="${currentStatuses[1] ? 'display:none' : ''}">+ Thêm bước thứ 2 (tình huống đặc biệt)</button>

          ${!u.frozen ? `
          <div class="field-row" style="margin-top:14px">
            <label>Độ khẩn cấp chăm sóc</label>
            ${Urgency.barHtml(c)}
            <div style="display:flex; gap:6px; margin-top:6px">
              <button class="btn btn-sm" onclick="CustomersModule.handleWaitingReply('${c.ID}')">Đã liên hệ – chờ khách rep</button>
              <button class="btn btn-sm" onclick="CustomersModule.handleResponded('${c.ID}')">Khách đã phản hồi</button>
            </div>
          </div>` : `<div style="font-size:12px; color:var(--ink-soft); margin-top:10px">Đã qua giai đoạn cọc phí thiết kế — không còn tính điểm khẩn cấp.</div>`}
        </div>

        <div class="drawer-section">
          <h3>Ghi chú</h3>
          <div style="font-size:11px; color:var(--ink-soft); margin-bottom:6px">Thông tin lưu ý riêng cho team hoặc để tự nhớ — không có nhắc hẹn</div>
          <textarea id="f-ghichu" rows="4" placeholder="VD: khách thích tông màu ấm, nhà có trẻ nhỏ cần lưu ý an toàn...">${escapeHtml(c.GhiChu || '')}</textarea>
        </div>

        <div class="drawer-section">
          <h3>Note & nhắc nhở</h3>
          <div id="notes-list">${(c.notes||[]).map(n => `
            <div class="note-item">
              ${escapeHtml(n.NoteText)}
              ${n.ReminderTime ? `<div class="note-time">⏰ Nhắc lại: ${fmtDate(n.ReminderTime)}</div>` : ''}
            </div>`).join('') || '<div style="font-size:12px;color:var(--ink-soft)">Chưa có note nào</div>'}
          </div>
          <div class="field-row" style="margin-top:10px"><label>Thêm note mới</label><textarea id="f-newnote" rows="2"></textarea></div>
          <div class="field-row"><label>Nhắc lại lúc (tuỳ chọn)</label><input type="datetime-local" id="f-remindtime"></div>
          <button class="btn btn-sm" onclick="CustomersModule.addNoteFromDrawer('${c.ID}')">+ Thêm note</button>
        </div>

        <div style="display:flex; gap:10px; margin-top:24px">
          <button class="btn btn-primary" style="flex:1" onclick="CustomersModule.saveFromDrawer('${c.ID}')">Lưu</button>
          <button class="btn" onclick="this.closest('.drawer-overlay').remove()">Đóng</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    bindStatusSlotEvents(overlay);
  }

  function staffOptionsHtml(selectedName) {
    return `<option value="">— chọn người phụ trách —</option>` + staff.map(s =>
      `<option value="${s.Name}" ${selectedName === s.Name ? 'selected' : ''}>${s.Name} (${s.Department || ''})</option>`
    ).join('');
  }

  function statusSlotHtml(slotIndex, selectedStatusName, assigneeMap) {
    const options = CONFIG.STATUSES.map(s =>
      `<option value="${s.name}" ${selectedStatusName === s.name ? 'selected' : ''}>${s.name}</option>`
    ).join('');
    const assignedName = selectedStatusName ? (assigneeMap[selectedStatusName] || '') : '';
    const removeBtn = slotIndex === 1 ? `<button class="btn btn-sm" type="button" onclick="CustomersModule.removeSecondStatusSlot()" style="margin-left:6px">✕</button>` : '';
    return `
      <div class="field-row status-slot" data-slot="${slotIndex}" style="border:1px solid var(--border); border-radius:8px; padding:10px; margin-bottom:8px">
        <div style="display:flex; align-items:center; gap:6px">
          <select class="f-status-select" style="flex:1">${options}</select>${removeBtn}
        </div>
        <div style="margin-top:8px">
          <label>Người phụ trách <span class="required-mark" style="color:var(--danger)"></span></label>
          <select class="f-assignee-select">${staffOptionsHtml(assignedName)}</select>
        </div>
      </div>
    `;
  }

  function addSecondStatusSlot() {
    const overlay = document.querySelector('.drawer-overlay');
    const wrap = overlay.querySelector('#status-slot-2-wrap');
    wrap.innerHTML = statusSlotHtml(1, '', {});
    overlay.querySelector('#btn-add-second-status').style.display = 'none';
    bindStatusSlotEvents(overlay);
  }

  function removeSecondStatusSlot() {
    const overlay = document.querySelector('.drawer-overlay');
    overlay.querySelector('#status-slot-2-wrap').innerHTML = '';
    overlay.querySelector('#btn-add-second-status').style.display = '';
  }

  function bindStatusSlotEvents(overlay) {
    overlay.querySelectorAll('.status-slot').forEach(slot => {
      const select = slot.querySelector('.f-status-select');
      const toggle = () => {
        const meta = statusMeta(select.value);
        slot.querySelector('.required-mark').textContent = meta.requireAssignee ? '(bắt buộc)' : '';
      };
      select.onchange = toggle;
      toggle();
    });
  }

  async function addNoteFromDrawer(id) {
    const overlay = document.querySelector('.drawer-overlay');
    const text = overlay.querySelector('#f-newnote').value.trim();
    const remind = overlay.querySelector('#f-remindtime').value;
    if (!text) return;
    if (!id) { App.toast('Hãy lưu khách hàng trước khi thêm note'); return; }
    try {
      await API.addNote({ CustomerID: id, NoteText: text, ReminderTime: remind, CreatedBy: CONFIG.CURRENT_USER });
      App.toast('Đã thêm note');
      overlay.remove();
      await load();
      openDetail(id);
    } catch (e) {
      App.toast('Lỗi: ' + e.message);
    }
  }

  async function saveFromDrawer(id) {
    const overlay = document.querySelector('.drawer-overlay');
    const get = (sel) => overlay.querySelector(sel).value;

    const slots = [...overlay.querySelectorAll('.status-slot')];
    const statusNames = [];
    const assigneeMap = {};
    let blocked = false;

    slots.forEach(slot => {
      const statusName = slot.querySelector('.f-status-select').value;
      const assignee = slot.querySelector('.f-assignee-select').value;
      const meta = statusMeta(statusName);
      if (meta.requireAssignee && !assignee) blocked = true;
      statusNames.push(statusName);
      if (assignee) assigneeMap[statusName] = assignee;
    });

    if (blocked) {
      App.toast('Có bước bắt buộc phải chọn người phụ trách trước khi lưu');
      return;
    }

    const payload = {
      ID: id || undefined,
      Name: get('#f-name'),
      Phone: get('#f-phone'),
      Address: get('#f-address'),
      Source: get('#f-source'),
      ProjectValue: get('#f-value'),
      GhiChu: get('#f-ghichu'),
      Status: statusNames.join('|'),
      AssignedTo: JSON.stringify(assigneeMap),
      CreatedBy: CONFIG.CURRENT_USER,
    };

    try {
      const oldCustomer = id ? customers.find(x => x.ID === id) : null;
      const isNew = !id;
      const res = await API.saveCustomer(payload);
      const finalId = id || res.id;

      const oldStatusStr = oldCustomer ? oldCustomer.Status : '';
      const statusChanged = !oldCustomer || oldStatusStr !== payload.Status;

      if (isNew) {
        await API.notifyNewCustomer({ CustomerID: finalId, Name: payload.Name });
      } else if (statusChanged) {
        await API.assignStatus({
          CustomerID: finalId,
          FromStatus: oldStatusStr,
          ToStatus: payload.Status,
          AssignedTo: payload.AssignedTo,
          ChangedBy: CONFIG.CURRENT_USER,
        });
      }

      App.toast('Đã lưu khách hàng');
      overlay.remove();
      load();
    } catch (e) {
      App.toast('Lỗi lưu: ' + e.message);
    }
  }

  async function openFromExternal(id) {
    if (!customers.length) await load();
    openDetail(id);
  }

  return {
    load, render, openNew, openDetail, inlineSave, addNoteFromDrawer, saveFromDrawer,
    toggleSort, handleWaitingReply, handleResponded, addSecondStatusSlot, removeSecondStatusSlot,
    openFromExternal, getCustomers: () => customers, getStaff: () => staff,
  };
})();
