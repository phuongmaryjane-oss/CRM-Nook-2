// ============================================
// CẤU HÌNH — sửa các giá trị bên dưới sau khi deploy Apps Script
// ============================================
const CONFIG = {
  // DEMO_MODE = true: dùng dữ liệu ảo trong js/mock-data.js, không cần Apps Script.
  // Khi Sheet + Apps Script đã deploy và điền API_URL bên dưới, đổi thành false.
  DEMO_MODE: true,

  // URL /exec sau khi Deploy Web App trong Apps Script
  API_URL: 'https://script.google.com/macros/s/DÁN_DEPLOYMENT_ID/exec',

  // Người dùng hiện tại (tạm thời chọn thủ công, sau có thể làm login)
  CURRENT_USER: localStorage.getItem('crm_current_user') || '',

  // ============================================
  // QUY TRÌNH CHÍNH THỨC — 9 bước (đã bỏ 3 bước xử lý ngoài CRM)
  // requireAssignee: true = bắt buộc chọn người phụ trách khi chuyển sang bước này
  // role: vai trò/phòng ban phụ trách mặc định (dùng để lọc dropdown chọn người)
  // ============================================
  STATUSES: [
    { name: 'Tiếp nhận Lead, khảo sát nhu cầu, lên 2D', role: 'IC',          requireAssignee: false, color: '#8A9A87' },
    { name: 'Báo giá',                                  role: 'IC',          requireAssignee: false, color: '#7FA3B0' },
    { name: 'Trao đổi & cọc phí thiết kế',              role: 'IC',          requireAssignee: false, color: '#6B8CAE' },
    { name: 'Thiết kế 3D',                              role: 'NV Thiết kế', requireAssignee: true,  color: '#A67C52' },
    { name: 'Khảo sát, trình mẫu vật liệu',             role: 'Kỹ thuật',    requireAssignee: true,  color: '#B08968' },
    { name: 'Báo giá thi công & cọc 50% hợp đồng',      role: 'IC',          requireAssignee: false, color: '#C9A15A' },
    { name: 'Gia công, lắp đặt tại xưởng',              role: 'Kỹ thuật',    requireAssignee: false, color: '#C08552' },
    { name: 'Lắp đặt, bàn giao',                        role: 'Kỹ thuật',    requireAssignee: false, color: '#9C7A4E' },
    { name: 'Quyết toán với khách hàng',                role: 'IC',          requireAssignee: false, color: '#6B9080' },
  ],

  // Trạng thái đặc biệt — nằm ngoài 9 bước Kanban chính, không bắt buộc gán người
  SPECIAL_STATUS: { name: 'Không phản hồi/Tạm ngưng', color: '#A0A0A0' },

  // Điểm khẩn cấp chỉ tính đến (và bao gồm) bước này — ngay khi khách được
  // chuyển VÀO bước này, điểm khẩn cấp đóng băng vĩnh viễn
  URGENCY_FREEZE_STATUS: 'Trao đổi & cọc phí thiết kế',

  // Số lần liên hệ không phản hồi để gợi ý chuyển sang trạng thái đặc biệt
  URGENCY_SUGGEST_PAUSE_ATTEMPTS: 5,

  // Thời gian đóng băng (snooze) sau khi bấm "Đã liên hệ - chờ khách rep", tính bằng giờ
  URGENCY_SNOOZE_HOURS: 24,
};

function statusIndex(name) {
  return CONFIG.STATUSES.findIndex(s => s.name === name);
}

// Ghi chú: bảng "Config" trong Google Sheet có thể dùng để nạp STATUSES động
// thay vì hard-code ở đây — có thể nối vào sau nếu cần chỉnh sửa quy trình
// thường xuyên mà không muốn sửa code.
