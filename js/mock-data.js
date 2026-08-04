// ============================================
// DỮ LIỆU ẢO ĐỂ DEMO — bật/tắt bằng CONFIG.DEMO_MODE trong config.js
// Khi DEMO_MODE = true, mọi lời gọi API sẽ được MockAPI xử lý ngay
// trên trình duyệt (không cần Google Apps Script), dữ liệu chỉ tồn tại
// trong phiên làm việc hiện tại (F5 lại trang sẽ về trạng thái ban đầu).
//
// Khi Sheet + Apps Script đã deploy xong, chỉ cần đổi DEMO_MODE: false
// và điền API_URL — không cần sửa gì ở các file khác.
// ============================================
const MockData = (() => {
  function pad(n) { return String(n).padStart(2, '0'); }

  function iso(daysOffset, hour = 9, minute = 0) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString();
  }

  let seq = 1000;
  function genId() { return 'demo' + (seq++); }

  // ---------- Nhân sự ----------
  const staff = [
    { ID: genId(), Name: 'Lê Thị Hồng',   Department: 'IC',          TelegramChatID: '', Role: 'IC lead',        Active: true },
    { ID: genId(), Name: 'Hoàng Văn Nam', Department: 'IC',          TelegramChatID: '', Role: 'IC',             Active: true },
    { ID: genId(), Name: 'Ngô Thị Hạnh',  Department: 'IC',          TelegramChatID: '', Role: 'IC',             Active: true },
    { ID: genId(), Name: 'Nguyễn Thị Lan',Department: 'NV Thiết kế', TelegramChatID: '', Role: 'Thiết kế 3D',    Active: true },
    { ID: genId(), Name: 'Vũ Thị Mai',    Department: 'NV Thiết kế', TelegramChatID: '', Role: 'Thiết kế 3D',    Active: true },
    { ID: genId(), Name: 'Trần Văn Minh', Department: 'Kỹ thuật',    TelegramChatID: '', Role: 'Giám sát xưởng', Active: true },
    { ID: genId(), Name: 'Phạm Văn Đức',  Department: 'Kỹ thuật',    TelegramChatID: '', Role: 'Thi công',       Active: true },
    { ID: genId(), Name: 'Bùi Văn Tùng',  Department: 'Kỹ thuật',    TelegramChatID: '', Role: 'Lắp đặt',        Active: true },
    { ID: genId(), Name: 'Đặng Thị Thu',  Department: 'Mua hàng',    TelegramChatID: '', Role: 'Mua vật tư',     Active: true },
  ];
  const staffByName = (name) => staff.find(s => s.Name === name);

  // ---------- Khách hàng (mỗi item có notesSeed riêng, sẽ tách ra sau) ----------
  const S = {
    LEAD_2D: 'Tiếp nhận Lead, khảo sát nhu cầu, lên 2D',
    BAOGIA: 'Báo giá',
    COC_TK: 'Trao đổi & cọc phí thiết kế',
    TK3D: 'Thiết kế 3D',
    KS_VATLIEU: 'Khảo sát, trình mẫu vật liệu',
    COC_TC: 'Báo giá thi công & cọc 50% hợp đồng',
    GIACONG: 'Gia công, lắp đặt tại xưởng',
    LAPDAT: 'Lắp đặt, bàn giao',
    QUYETTOAN: 'Quyết toán với khách hàng',
    TAMNGUNG: 'Không phản hồi/Tạm ngưng',
  };

  const customersSeed = [
    {
      Name: 'Nguyễn Văn An', Phone: '0901234501', Address: 'Q.7, TP.HCM', Source: 'Facebook Ads',
      Status: [S.LEAD_2D], Assigned: { [S.LEAD_2D]: 'Hoàng Văn Nam' },
      ProjectValue: 180000000, GhiChu: 'Thích tông màu gỗ sáng, căn hộ 2PN.',
      CreatedAt: iso(-2), UpdatedAt: iso(-1), UrgencyLastActivityAt: iso(-1),
      notesSeed: [],
    },
    {
      Name: 'Trần Thị Bích', Phone: '0901234502', Address: 'Q.Bình Thạnh, TP.HCM', Source: 'Zalo',
      Status: [S.LEAD_2D], Assigned: { [S.LEAD_2D]: 'Lê Thị Hồng' },
      ProjectValue: 220000000, GhiChu: 'Đã gửi 2D lần 1, đang chờ khách chọn phương án.',
      CreatedAt: iso(-10), UpdatedAt: iso(-10), UrgencyLastActivityAt: iso(-10),
      notesSeed: [{ text: 'Gọi lại hỏi ý kiến về phương án 2D', offset: -2, done: false }],
    },
    {
      Name: 'Lê Văn Cường', Phone: '0901234503', Address: 'Q.3, TP.HCM', Source: 'Website',
      Status: [S.BAOGIA], Assigned: { [S.BAOGIA]: 'Lê Thị Hồng' },
      ProjectValue: 310000000, GhiChu: '',
      CreatedAt: iso(-14), UpdatedAt: iso(-4), UrgencyLastActivityAt: iso(-4),
      notesSeed: [{ text: 'Gửi lại báo giá bản chi tiết theo hạng mục', offset: 5, done: false }],
    },
    {
      Name: 'Phạm Thị Dung', Phone: '0901234504', Address: 'Q.2, TP.HCM', Source: 'Giới thiệu',
      Status: [S.BAOGIA], Assigned: { [S.BAOGIA]: 'Hoàng Văn Nam' },
      ProjectValue: 260000000, GhiChu: 'Khách bận công tác, hẹn liên hệ lại sau.',
      CreatedAt: iso(-8), UpdatedAt: iso(-3), UrgencyLastActivityAt: iso(-3),
      snoozeHours: 48, attempts: 2,
      notesSeed: [],
    },
    {
      Name: 'Hoàng Văn Em', Phone: '0901234505', Address: 'Q.Tân Bình, TP.HCM', Source: 'TikTok Ads',
      Status: [S.LEAD_2D], Assigned: { [S.LEAD_2D]: 'Ngô Thị Hạnh' },
      ProjectValue: 150000000, GhiChu: 'Nhắn tin 5 lần chưa thấy rep, cân nhắc tạm ngưng.',
      CreatedAt: iso(-20), UpdatedAt: iso(-9), UrgencyLastActivityAt: iso(-9),
      attempts: 5,
      notesSeed: [{ text: 'Lần liên hệ cuối — thử gọi điện trực tiếp', offset: -1, done: false }],
    },
    {
      Name: 'Vũ Thị Giang', Phone: '0901234506', Address: 'Q.1, TP.HCM', Source: 'Facebook Ads',
      Status: [S.COC_TK], Assigned: { [S.COC_TK]: 'Lê Thị Hồng' },
      ProjectValue: 340000000, GhiChu: 'Đã cọc phí thiết kế 5tr, hẹn 3 ngày nhận bản vẽ 2D.',
      CreatedAt: iso(-6), UpdatedAt: iso(-1), UrgencyLastActivityAt: iso(-1),
      notesSeed: [{ text: 'Hẹn khách xem lại mặt bằng trước khi thiết kế 3D', offset: 0, done: false }],
    },
    {
      Name: 'Đặng Văn Hùng', Phone: '0901234507', Address: 'Q.Phú Nhuận, TP.HCM', Source: 'Website',
      Status: [S.TK3D], Assigned: { [S.TK3D]: 'Nguyễn Thị Lan' },
      ProjectValue: 410000000, GhiChu: 'Yêu cầu bản 3D phòng khách + bếp trước.',
      CreatedAt: iso(-12), UpdatedAt: iso(-2), UrgencyLastActivityAt: iso(-2),
      notesSeed: [{ text: 'Gửi bản 3D lần 2 sau khi khách góp ý', offset: 2, done: false }],
    },
    {
      Name: 'Ngô Thị Kim', Phone: '0901234508', Address: 'Q.10, TP.HCM', Source: 'Zalo',
      Status: [S.TK3D], Assigned: {},
      ProjectValue: 275000000, GhiChu: 'Chưa chốt được nhân sự thiết kế phụ trách.',
      CreatedAt: iso(-9), UpdatedAt: iso(-5), UrgencyLastActivityAt: iso(-5),
      notesSeed: [],
    },
    {
      Name: 'Bùi Thị Lan Anh', Phone: '0901234509', Address: 'Q.9, TP.Thủ Đức', Source: 'Giới thiệu',
      Status: [S.KS_VATLIEU], Assigned: { [S.KS_VATLIEU]: 'Trần Văn Minh' },
      ProjectValue: 390000000, GhiChu: 'Khách muốn xem mẫu gỗ sồi thực tế tại xưởng.',
      CreatedAt: iso(-18), UpdatedAt: iso(-3), UrgencyLastActivityAt: iso(-3),
      notesSeed: [{ text: 'Hẹn khách lên xưởng xem mẫu vật liệu', offset: 4, done: false }],
    },
    {
      Name: 'Đỗ Văn Minh', Phone: '0901234510', Address: 'Q.4, TP.HCM', Source: 'Website',
      Status: [S.COC_TC], Assigned: { [S.COC_TC]: 'Lê Thị Hồng' },
      ProjectValue: 520000000, GhiChu: 'Đã báo giá thi công, chờ khách chuyển cọc 50%.',
      CreatedAt: iso(-25), UpdatedAt: iso(-6), UrgencyLastActivityAt: iso(-6),
      notesSeed: [{ text: 'Nhắc khách xác nhận chuyển khoản cọc 50%', offset: 7, done: false }],
    },
    {
      Name: 'Trịnh Thị Ngọc', Phone: '0901234511', Address: 'Q.Bình Tân, TP.HCM', Source: 'Facebook Ads',
      Status: [S.GIACONG, S.TAMNGUNG], Assigned: { [S.GIACONG]: 'Phạm Văn Đức' },
      ProjectValue: 300000000, GhiChu: 'Đang gia công nhưng khách tạm ngưng thanh toán đợt 2, cần theo dõi riêng.',
      CreatedAt: iso(-40), UpdatedAt: iso(-7), UrgencyLastActivityAt: iso(-7),
      notesSeed: [{ text: 'Theo dõi tiến độ thanh toán đợt 2 trước khi giao hàng', offset: 9, done: false }],
    },
    {
      Name: 'Lý Văn Phúc', Phone: '0901234512', Address: 'Q.Gò Vấp, TP.HCM', Source: 'Giới thiệu',
      Status: [S.GIACONG], Assigned: { [S.GIACONG]: 'Bùi Văn Tùng' },
      ProjectValue: 280000000, GhiChu: '',
      CreatedAt: iso(-30), UpdatedAt: iso(-4), UrgencyLastActivityAt: iso(-4),
      notesSeed: [{ text: 'Kiểm tra tiến độ đóng đồ tại xưởng', offset: 12, done: false }],
    },
    {
      Name: 'Trương Thị Quỳnh', Phone: '0901234513', Address: 'Q.Thủ Đức, TP.HCM', Source: 'Website',
      Status: [S.LAPDAT], Assigned: { [S.LAPDAT]: 'Bùi Văn Tùng' },
      ProjectValue: 355000000, GhiChu: 'Hẹn lắp đặt buổi sáng, khách đi làm giờ hành chính.',
      CreatedAt: iso(-35), UpdatedAt: iso(-2), UrgencyLastActivityAt: iso(-2),
      notesSeed: [{ text: 'Lắp đặt bàn giao đợt cuối cho khách', offset: 15, done: false }],
    },
    {
      Name: 'Đinh Văn Sơn', Phone: '0901234514', Address: 'Q.1, TP.HCM', Source: 'Giới thiệu',
      Status: [S.QUYETTOAN], Assigned: { [S.QUYETTOAN]: 'Lê Thị Hồng' },
      ProjectValue: 610000000, GhiChu: 'Dự án lớn, cần xuất hoá đơn VAT.',
      CreatedAt: iso(-50), UpdatedAt: iso(-1), UrgencyLastActivityAt: iso(-1),
      notesSeed: [{ text: 'Chốt quyết toán và xuất hoá đơn cuối', offset: 17, done: false }],
    },
    {
      Name: 'Mai Thị Tuyết', Phone: '0901234515', Address: 'Q.11, TP.HCM', Source: 'Facebook Ads',
      Status: [S.TAMNGUNG], Assigned: {},
      ProjectValue: 120000000, GhiChu: 'Khách báo tạm dừng vì thay đổi kế hoạch tài chính.',
      CreatedAt: iso(-45), UpdatedAt: iso(-15), UrgencyLastActivityAt: iso(-15),
      notesSeed: [],
    },
    {
      Name: 'Phan Văn Vinh', Phone: '0901234516', Address: 'Q.6, TP.HCM', Source: 'TikTok Ads',
      Status: [S.LEAD_2D], Assigned: { [S.LEAD_2D]: 'Ngô Thị Hạnh' },
      ProjectValue: 165000000, GhiChu: 'Lead mới hôm nay, chưa tư vấn.',
      CreatedAt: iso(0), UpdatedAt: iso(0), UrgencyLastActivityAt: iso(0),
      notesSeed: [{ text: 'Gọi tư vấn lần đầu cho khách mới', offset: 3, done: true }],
    },
    {
      Name: 'Hồ Thị Xuân', Phone: '0901234517', Address: 'Q.Bình Thạnh, TP.HCM', Source: 'Zalo',
      Status: [S.BAOGIA], Assigned: { [S.BAOGIA]: 'Hoàng Văn Nam' },
      ProjectValue: 240000000, GhiChu: 'Im lặng khá lâu, cần liên hệ gấp.',
      CreatedAt: iso(-22), UpdatedAt: iso(-15), UrgencyLastActivityAt: iso(-15),
      notesSeed: [{ text: 'Liên hệ lại trước khi khách chuyển sang đối thủ', offset: 30, done: false }],
    },
    {
      Name: 'Lâm Văn Yên', Phone: '0901234518', Address: 'Q.7, TP.HCM', Source: 'Website',
      Status: [S.COC_TK], Assigned: { [S.COC_TK]: 'Lê Thị Hồng' },
      ProjectValue: 330000000, GhiChu: '',
      CreatedAt: iso(-5), UpdatedAt: iso(-1), UrgencyLastActivityAt: iso(-1),
      notesSeed: [{ text: 'Xác nhận lịch bàn giao bản vẽ 2D cuối', offset: 22, done: false }],
    },
    {
      Name: 'Châu Thị Ánh', Phone: '0901234519', Address: 'Q.3, TP.HCM', Source: 'Giới thiệu',
      Status: [S.LEAD_2D], Assigned: { [S.LEAD_2D]: 'Hoàng Văn Nam' },
      ProjectValue: 195000000, GhiChu: 'Khách hỏi thêm về chính sách bảo hành.',
      CreatedAt: iso(-4), UpdatedAt: iso(-2), UrgencyLastActivityAt: iso(-2), attempts: 1,
      notesSeed: [
        { text: 'Trả lời câu hỏi về bảo hành cho khách', offset: -1, done: false },
        { text: 'Gửi thêm ảnh thực tế công trình đã làm', offset: 25, done: false },
      ],
    },
  ];

  const customers = [];
  const notes = [];

  customersSeed.forEach(seed => {
    const id = genId();
    const c = {
      ID: id,
      Name: seed.Name,
      Phone: seed.Phone,
      Address: seed.Address,
      Source: seed.Source,
      Status: seed.Status.join('|'),
      AssignedTo: JSON.stringify(seed.Assigned || {}),
      ProjectValue: seed.ProjectValue,
      GhiChu: seed.GhiChu || '',
      UrgencySnoozeUntil: seed.snoozeHours ? iso(seed.snoozeHours / 24) : '',
      UrgencyContactAttempts: seed.attempts || 0,
      UrgencyLastActivityAt: seed.UrgencyLastActivityAt,
      CreatedAt: seed.CreatedAt,
      UpdatedAt: seed.UpdatedAt,
      CreatedBy: staffByName(Object.values(seed.Assigned || {})[0] || '') ? Object.values(seed.Assigned)[0] : 'Hệ thống',
    };
    customers.push(c);
    (seed.notesSeed || []).forEach(n => {
      notes.push({
        ID: genId(),
        CustomerID: id,
        NoteText: n.text,
        ReminderTime: iso(n.offset, 9 + (notes.length % 6)),
        Done: !!n.done,
        CreatedBy: c.CreatedBy,
        CreatedAt: seed.UpdatedAt,
      });
    });
  });

  const statusHistory = [];
  const finance = [];

  return { staff, customers, notes, statusHistory, finance, genId, iso };
})();

// ============================================
// MOCK API — mô phỏng hành vi của Code.gs (doGet/doPost) ngay trên trình duyệt
// ============================================
const MockAPI = (() => {
  const delay = (ms = 220) => new Promise(res => setTimeout(res, ms));

  function withNotes(customer) {
    return { ...customer, notes: MockData.notes.filter(n => String(n.CustomerID) === String(customer.ID)) };
  }

  async function get(action, params) {
    await delay();
    switch (action) {
      case 'getCustomers': return MockData.customers.map(withNotes);
      case 'getStaff': return MockData.staff;
      case 'getConfig': return [];
      case 'getNotes': return MockData.notes.filter(n => String(n.CustomerID) === String(params.customerId));
      case 'getFinance': return MockData.finance;
      case 'getStatusHistory': return MockData.statusHistory;
      default: return { error: 'Unknown action (demo): ' + action };
    }
  }

  async function post(action, data) {
    await delay();
    switch (action) {
      case 'saveCustomer': return saveCustomer(data);
      case 'addNote': return addNote(data);
      case 'assignStatus': return assignStatus(data);
      case 'confirmAssignment': return confirmAssignment(data);
      case 'saveFinance': return saveFinance(data);
      case 'notifyNewCustomer': return { success: true }; // demo: không gửi Telegram
      default: return { error: 'Unknown action (demo): ' + action };
    }
  }

  function saveCustomer(data) {
    if (data.ID) {
      const c = MockData.customers.find(x => String(x.ID) === String(data.ID));
      if (!c) throw new Error('Không tìm thấy khách hàng ID ' + data.ID);
      Object.keys(data).forEach(k => { if (k !== 'ID') c[k] = data[k]; });
      c.UpdatedAt = new Date().toISOString();
      return { success: true, id: data.ID };
    }
    const id = MockData.genId();
    const c = {
      ID: id, Name: '', Phone: '', Address: '', Source: '', Status: '', AssignedTo: '{}',
      ProjectValue: '', GhiChu: '', UrgencySnoozeUntil: '', UrgencyContactAttempts: 0,
      UrgencyLastActivityAt: new Date().toISOString(),
      CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString(), CreatedBy: data.CreatedBy || '',
      ...data,
    };
    MockData.customers.push(c);
    return { success: true, id };
  }

  function addNote(data) {
    const id = MockData.genId();
    MockData.notes.push({
      ID: id, CustomerID: data.CustomerID, NoteText: data.NoteText,
      ReminderTime: data.ReminderTime || '', Done: false, CreatedBy: data.CreatedBy || '',
      CreatedAt: new Date().toISOString(),
    });
    return { success: true, id };
  }

  function assignStatus(data) {
    const c = MockData.customers.find(x => String(x.ID) === String(data.CustomerID));
    if (!c) throw new Error('Không tìm thấy khách hàng');
    c.Status = data.ToStatus;
    c.AssignedTo = data.AssignedTo || '{}';
    c.UpdatedAt = new Date().toISOString();

    const assigneeMap = JSON.parse(data.AssignedTo || '{}');
    String(data.ToStatus || '').split('|').map(s => s.trim()).filter(Boolean).forEach(statusName => {
      MockData.statusHistory.push({
        ID: MockData.genId(), CustomerID: data.CustomerID, FromStatus: data.FromStatus, ToStatus: statusName,
        AssignedTo: assigneeMap[statusName] || '', AssignedAt: assigneeMap[statusName] ? new Date().toISOString() : '',
        ConfirmedAt: '', ChangedBy: data.ChangedBy || '',
      });
    });
    return { success: true };
  }

  function confirmAssignment(data) {
    const h = MockData.statusHistory.find(x => String(x.ID) === String(data.HistoryID));
    if (!h) throw new Error('Không tìm thấy lịch sử phân công');
    h.ConfirmedAt = new Date().toISOString();
    return { success: true };
  }

  function saveFinance(data) {
    if (data.ID) {
      const f = MockData.finance.find(x => String(x.ID) === String(data.ID));
      if (!f) throw new Error('Không tìm thấy bản ghi tài chính');
      Object.assign(f, data);
      return { success: true, id: data.ID };
    }
    const id = MockData.genId();
    MockData.finance.push({ ID: id, ...data });
    return { success: true, id };
  }

  return { get, post };
})();
