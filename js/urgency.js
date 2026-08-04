// ============================================
// ĐIỂM KHẨN CẤP CHĂM SÓC (Urgency Score)
// Chỉ áp dụng từ bước 1 đến bước "URGENCY_FREEZE_STATUS" (bao gồm cả bước đó).
// Ngay khi khách được chuyển VÀO bước đóng băng, điểm dừng vĩnh viễn.
// ============================================
const Urgency = (() => {
  const THRESHOLDS = [
    { maxDays: 1,  score: 5 },
    { maxDays: 3,  score: 25 },
    { maxDays: 7,  score: 55 },
    { maxDays: 14, score: 80 },
    { maxDays: Infinity, score: 100 },
  ];
  const OVERDUE_REMINDER_BONUS = 30;

  function parseStatuses(statusField) {
    if (!statusField) return [];
    // Lưu ý: KHÔNG tách bằng dấu phẩy — nhiều tên bước trong CONFIG.STATUSES tự nó
    // chứa dấu phẩy (VD "Tiếp nhận Lead, khảo sát nhu cầu, lên 2D"), nên dùng dấu
    // '|' làm ký tự phân cách nhiều bước đồng thời trong 1 khách hàng.
    return String(statusField).split('|').map(s => s.trim()).filter(Boolean);
  }

  function daysSince(dateStr) {
    if (!dateStr) return 999;
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff / (1000 * 60 * 60 * 24);
  }

  function isFrozen(customer) {
    const freezeIdx = statusIndex(CONFIG.URGENCY_FREEZE_STATUS);
    const statuses = parseStatuses(customer.Status);
    return statuses.some(s => statusIndex(s) >= freezeIdx && statusIndex(s) !== -1);
  }

  function compute(customer) {
    if (isFrozen(customer)) {
      return { frozen: true };
    }

    const now = Date.now();
    const snoozeUntil = customer.UrgencySnoozeUntil ? new Date(customer.UrgencySnoozeUntil).getTime() : null;
    const attempts = Number(customer.UrgencyContactAttempts || 0);
    const suggestPause = attempts >= CONFIG.URGENCY_SUGGEST_PAUSE_ATTEMPTS;

    if (snoozeUntil && now < snoozeUntil) {
      return { paused: true, label: 'Đang chờ khách', attempts, suggestPause, snoozeUntil };
    }

    const lastActivity = customer.UrgencyLastActivityAt || customer.CreatedAt;
    const d = daysSince(lastActivity);
    let score = THRESHOLDS.find(t => d <= t.maxDays).score;

    const overdue = (customer.notes || []).some(n =>
      n.ReminderTime && !n.Done && new Date(n.ReminderTime).getTime() < now
    );
    if (overdue) score = Math.min(100, score + OVERDUE_REMINDER_BONUS);

    let label, color;
    if (score >= 67)      { label = 'Khẩn cấp';   color = 'var(--danger)'; }
    else if (score >= 34) { label = 'Cần chú ý';  color = 'var(--amber)'; }
    else                  { label = 'An toàn';    color = 'var(--sage-deep)'; }

    return { score: Math.round(score), label, color, overdue, attempts, suggestPause };
  }

  function barHtml(customer) {
    const u = compute(customer);

    if (u.frozen) {
      return `<span style="font-size:11px; color:var(--ink-soft)">— (đã qua giai đoạn cọc)</span>`;
    }
    if (u.paused) {
      return `
        <div style="display:flex; flex-direction:column; gap:2px">
          <span style="font-size:11px; font-weight:700; color:var(--ink-soft)">⏸️ Đang chờ khách</span>
          ${u.suggestPause ? `<span style="font-size:10px; color:var(--danger)">Đã ${u.attempts} lần không rep — cân nhắc tạm ngưng</span>` : ''}
        </div>`;
    }
    return `
      <div style="display:flex; align-items:center; gap:6px; min-width:120px">
        <div style="flex:1; height:6px; background:var(--border); border-radius:4px; overflow:hidden">
          <div style="width:${u.score}%; height:100%; background:${u.color}"></div>
        </div>
        <span style="font-size:11px; font-weight:700; color:${u.color}; white-space:nowrap">${u.score} · ${u.label}</span>
      </div>
      ${u.suggestPause ? `<div style="font-size:10px; color:var(--danger); margin-top:2px">Đã ${u.attempts} lần không rep — cân nhắc tạm ngưng</div>` : ''}
    `;
  }

  // Sale bấm "Đã liên hệ - chờ khách rep"
  async function markWaitingReply(customer) {
    const snoozeUntil = new Date(Date.now() + CONFIG.URGENCY_SNOOZE_HOURS * 60 * 60 * 1000).toISOString();
    const attempts = Number(customer.UrgencyContactAttempts || 0) + 1;
    await API.saveCustomer({
      ID: customer.ID,
      UrgencySnoozeUntil: snoozeUntil,
      UrgencyContactAttempts: attempts,
    });
    customer.UrgencySnoozeUntil = snoozeUntil;
    customer.UrgencyContactAttempts = attempts;
    return attempts >= CONFIG.URGENCY_SUGGEST_PAUSE_ATTEMPTS;
  }

  // Sale/khách xác nhận "Khách đã phản hồi"
  async function markResponded(customer) {
    const now = new Date().toISOString();
    await API.saveCustomer({
      ID: customer.ID,
      UrgencySnoozeUntil: '',
      UrgencyContactAttempts: 0,
      UrgencyLastActivityAt: now,
    });
    customer.UrgencySnoozeUntil = '';
    customer.UrgencyContactAttempts = 0;
    customer.UrgencyLastActivityAt = now;
  }

  return { compute, barHtml, parseStatuses, isFrozen, markWaitingReply, markResponded };
})();
