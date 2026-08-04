/**
 * S ATELIER CRM — BACKEND (Google Apps Script)
 * ------------------------------------------------
 * Deploy: Extensions > Apps Script trong Google Sheet gốc > dán file này
 * (và Config.gs) > Deploy > New deployment > Web app
 *   - Execute as: Me
 *   - Who has access: Anyone with the link
 * Copy URL /exec dán vào js/config.js (API_URL)
 *
 * SHEET SCHEMA (tự tạo các sheet sau trong 1 Google Sheet, đúng tên):
 *
 * 1) "Customers"
 *    ID | Name | Phone | Address | Source | Status | AssignedTo |
 *    ProjectValue | GhiChu |
 *    UrgencySnoozeUntil | UrgencyContactAttempts | UrgencyLastActivityAt |
 *    CreatedAt | UpdatedAt | CreatedBy
 *
 *    Ghi chú cột:
 *    - Status: có thể chứa NHIỀU bước, phân cách bởi ký tự '|' (VD: "Thiết kế 3D|Báo giá thi công & cọc 50% hợp đồng").
 *      LƯU Ý: không dùng dấu phẩy để phân cách vì một số tên bước trong quy trình
 *      (VD "Tiếp nhận Lead, khảo sát nhu cầu, lên 2D") tự nó đã chứa dấu phẩy.
 *    - AssignedTo: lưu dạng JSON, map {"Tên bước": "Tên nhân sự"} — VD: {"Thiết kế 3D":"Lan"}
 *    - GhiChu: ghi chú dài, không có nhắc hẹn (khác với tab Notes)
 *    - UrgencySnoozeUntil: thời điểm hết hạn tạm hoãn điểm khẩn cấp (ISO string), rỗng nếu không snooze
 *    - UrgencyContactAttempts: số lần đã liên hệ mà khách chưa phản hồi
 *    - UrgencyLastActivityAt: mốc thời gian dùng để tính điểm khẩn cấp (reset khi khách phản hồi)
 *
 * 2) "Notes"
 *    ID | CustomerID | NoteText | ReminderTime | Done | CreatedBy | CreatedAt
 *
 * 3) "StatusHistory"
 *    ID | CustomerID | FromStatus | ToStatus | AssignedTo |
 *    AssignedAt | ConfirmedAt | ChangedBy
 *
 * 4) "Staff"
 *    ID | Name | Department | TelegramChatID | Role | Active
 *    (Department: IC / Kỹ thuật / NV Thiết kế / Mua hàng — dùng để hiện gợi ý dropdown)
 *
 * 5) "Config"
 *    StatusName | Order | RequireAssignee | Color
 *
 * 6) "Finance"
 *    ID | CustomerID | ContractNo | ContractValue | DepositAmount |
 *    DepositDate | RemainingAmount | PaymentNote | UpdatedBy | UpdatedAt
 */

const SHEET_ID = 'DÁN_ID_GOOGLE_SHEET_VÀO_ĐÂY'; // lấy từ URL sheet
const TELEGRAM_BOT_TOKEN = 'DÁN_BOT_TOKEN_VÀO_ĐÂY';
// Chat ID của group chung (nhận thông báo khách mới + đổi trạng thái không kèm phân công cụ thể)
const TELEGRAM_GENERAL_CHAT_ID = 'DÁN_CHAT_ID_GROUP_CHUNG_VÀO_ĐÂY';

function ss_() { return SpreadsheetApp.openById(SHEET_ID); }
function sheet_(name) { return ss_().getSheetByName(name); }

function doGet(e) {
  const action = e.parameter.action;
  let result;
  try {
    switch (action) {
      case 'getCustomers': result = getCustomers(); break;
      case 'getStaff': result = getAll_('Staff'); break;
      case 'getConfig': result = getAll_('Config'); break;
      case 'getNotes': result = getNotesByCustomer(e.parameter.customerId); break;
      case 'getFinance': result = getAll_('Finance'); break;
      case 'getStatusHistory': result = getAll_('StatusHistory'); break;
      default: result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  let result;
  try {
    switch (action) {
      case 'saveCustomer': result = saveCustomer(body.data); break;
      case 'addNote': result = addNote(body.data); break;
      case 'assignStatus': result = assignStatus(body.data); break;
      case 'confirmAssignment': result = confirmAssignment(body.data); break;
      case 'saveFinance': result = saveFinance(body.data); break;
      case 'notifyNewCustomer': result = notifyNewCustomer(body.data); break;
      default: result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Helpers dùng chung ---------- */

function getAll_(sheetName) {
  const sh = sheet_(sheetName);
  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function findRowById_(sh, id) {
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // 1-indexed row number
  }
  return -1;
}

function newId_() {
  return Utilities.getUuid().split('-')[0];
}

function nowStr_() {
  return new Date().toISOString();
}

/* ---------- Customers ---------- */

function getCustomers() {
  const customers = getAll_('Customers');
  const notes = getAll_('Notes');
  return customers.map(c => {
    c.notes = notes.filter(n => String(n.CustomerID) === String(c.ID));
    return c;
  });
}

function saveCustomer(data) {
  const sh = sheet_('Customers');
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

  if (data.ID) {
    // update
    const row = findRowById_(sh, data.ID);
    if (row === -1) throw new Error('Không tìm thấy khách hàng ID ' + data.ID);
    headers.forEach((h, i) => {
      if (h in data) sh.getRange(row, i + 1).setValue(data[h]);
    });
    sh.getRange(row, headers.indexOf('UpdatedAt') + 1).setValue(nowStr_());
    return { success: true, id: data.ID };
  } else {
    // insert
    const id = newId_();
    const rowValues = headers.map(h => {
      if (h === 'ID') return id;
      if (h === 'CreatedAt' || h === 'UpdatedAt') return nowStr_();
      return data[h] || '';
    });
    sh.appendRow(rowValues);
    return { success: true, id: id };
  }
}

/* ---------- Notes / nhắc nhở ---------- */

function getNotesByCustomer(customerId) {
  return getAll_('Notes').filter(n => String(n.CustomerID) === String(customerId));
}

function addNote(data) {
  const sh = sheet_('Notes');
  const id = newId_();
  sh.appendRow([id, data.CustomerID, data.NoteText, data.ReminderTime || '', false, data.CreatedBy || '', nowStr_()]);
  return { success: true, id: id };
}

/* ---------- Phân công trạng thái + Telegram ---------- */

function assignStatus(data) {
  // data: { CustomerID, FromStatus, ToStatus (chuỗi phân cách dấu phẩy), AssignedTo (JSON string), ChangedBy }
  const custSh = sheet_('Customers');
  const row = findRowById_(custSh, data.CustomerID);
  if (row === -1) throw new Error('Không tìm thấy khách hàng');

  const headers = custSh.getRange(1, 1, 1, custSh.getLastColumn()).getValues()[0];
  const set_ = (col, val) => { if (headers.indexOf(col) > -1) custSh.getRange(row, headers.indexOf(col) + 1).setValue(val); };

  set_('Status', data.ToStatus);
  set_('AssignedTo', data.AssignedTo || '{}');
  set_('UpdatedAt', nowStr_());

  const assigneeMap = JSON.parse(data.AssignedTo || '{}');
  const toStatuses = String(data.ToStatus || '').split('|').map(s => s.trim()).filter(Boolean);

  // ghi lịch sử — 1 dòng cho mỗi bước trong danh sách trạng thái mới
  const histSh = sheet_('StatusHistory');
  toStatuses.forEach(statusName => {
    const assignee = assigneeMap[statusName] || '';
    const histId = newId_();
    histSh.appendRow([histId, data.CustomerID, data.FromStatus, statusName, assignee, assignee ? nowStr_() : '', '', data.ChangedBy || '']);
  });

  // Gộp thông báo: mỗi nhân sự được phân công nhận đúng 1 tin nhắn duy nhất
  // liệt kê tất cả các bước họ được giao trong lần cập nhật này.
  const byStaff = {};
  toStatuses.forEach(statusName => {
    const staffName = assigneeMap[statusName];
    if (!staffName) return;
    if (!byStaff[staffName]) byStaff[staffName] = [];
    byStaff[staffName].push(statusName);
  });

  const customer = getAll_('Customers').find(c => String(c.ID) === String(data.CustomerID));
  const custName = customer ? customer.Name : data.CustomerID;

  Object.keys(byStaff).forEach(staffName => {
    notifyStaffTelegram_(staffName, custName, byStaff[staffName]);
  });

  // Thông báo chung về việc đổi trạng thái (luôn gửi, kể cả khi không có phân công)
  notifyGeneralTelegram_(`🔄 *Cập nhật trạng thái*\nKhách hàng: *${custName}*\nTrạng thái mới: ${toStatuses.join(', ')}\nNgười cập nhật: ${data.ChangedBy || ''}`);

  return { success: true };
}

function confirmAssignment(data) {
  // data: { HistoryID, ConfirmedBy }
  const histSh = sheet_('StatusHistory');
  const row = findRowById_(histSh, data.HistoryID);
  if (row === -1) throw new Error('Không tìm thấy lịch sử phân công');
  const headers = histSh.getRange(1, 1, 1, histSh.getLastColumn()).getValues()[0];
  histSh.getRange(row, headers.indexOf('ConfirmedAt') + 1).setValue(nowStr_());
  return { success: true };
}

function notifyNewCustomer(data) {
  // data: { CustomerID, Name }
  notifyGeneralTelegram_(`🆕 *Khách hàng mới*\nTên: *${data.Name || data.CustomerID}*`);
  return { success: true };
}

function notifyStaffTelegram_(staffName, custName, statusList) {
  const staff = getAll_('Staff').find(s => s.Name === staffName);
  if (!staff || !staff.TelegramChatID) return;

  const stepsText = statusList.map(s => `• ${s}`).join('\n');
  const text = `🔔 *Bạn được phân công*\n` +
    `Khách hàng: *${custName}*\n` +
    `Bước phụ trách:\n${stepsText}\n` +
    `Vui lòng xác nhận đã nhận trên hệ thống CRM.`;

  sendTelegram_(staff.TelegramChatID, text);
}

function notifyGeneralTelegram_(text) {
  if (!TELEGRAM_GENERAL_CHAT_ID || TELEGRAM_GENERAL_CHAT_ID.indexOf('DÁN_') === 0) return;
  sendTelegram_(TELEGRAM_GENERAL_CHAT_ID, text);
}

function sendTelegram_(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' }),
    muteHttpExceptions: true,
  });
}

/* ---------- Finance ---------- */

function saveFinance(data) {
  const sh = sheet_('Finance');
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

  if (data.ID) {
    const row = findRowById_(sh, data.ID);
    if (row === -1) throw new Error('Không tìm thấy bản ghi tài chính');
    headers.forEach((h, i) => {
      if (h in data) sh.getRange(row, i + 1).setValue(data[h]);
    });
    sh.getRange(row, headers.indexOf('UpdatedAt') + 1).setValue(nowStr_());
    return { success: true, id: data.ID };
  } else {
    const id = newId_();
    const rowValues = headers.map(h => {
      if (h === 'ID') return id;
      if (h === 'UpdatedAt') return nowStr_();
      return data[h] || '';
    });
    sh.appendRow(rowValues);
    return { success: true, id: id };
  }
}

/**
 * (Tuỳ chọn) Chạy hàm này qua Triggers > Time-driven, mỗi giờ 1 lần,
 * để tự động báo Telegram khi tới giờ nhắc nhở (ReminderTime) trong Notes.
 */
function checkReminders() {
  const notes = getAll_('Notes');
  const now = new Date();
  notes.forEach(n => {
    if (!n.ReminderTime || n.Done) return;
    const remindAt = new Date(n.ReminderTime);
    if (remindAt <= now && remindAt > new Date(now.getTime() - 60 * 60 * 1000)) {
      const customer = getAll_('Customers').find(c => String(c.ID) === String(n.CustomerID));
      if (!customer || !customer.AssignedTo) return;
      let assigneeMap = {};
      try { assigneeMap = JSON.parse(customer.AssignedTo); } catch (e) { return; }
      const staffNames = [...new Set(Object.values(assigneeMap).filter(Boolean))];
      staffNames.forEach(staffName => {
        const staff = getAll_('Staff').find(s => s.Name === staffName);
        if (staff && staff.TelegramChatID) {
          sendTelegram_(staff.TelegramChatID, `⏰ Nhắc nhở khách hàng *${customer.Name}*:\n${n.NoteText}`);
        }
      });
    }
  });
}
