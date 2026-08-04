S Atelier CRM — Hướng dẫn setup
✅ Đã làm xong
Phần 1 — Quản lý khách hàng: bảng table, sửa trực tiếp (inline edit), thêm mới,
drawer chi tiết, note + nhắc nhở, phân công trạng thái bắt buộc chọn người phụ trách,
tự động báo Telegram khi phân công.
Phần 2 — Kanban: 9 cột theo quy trình chính thức + cột đặc biệt "Không phản hồi/Tạm ngưng".
Phần 4 — Lịch: lưới các ngày trong tháng (dạng lịch tháng, tự tính số hàng),
gom toàn bộ nhắc nhở (Note có ReminderTime) của mọi khách hàng theo ngày, có nút
Trước/Sau/Hôm nay, mỗi ô hiện tối đa 3 nhắc nhở + "+N khác" mở danh sách đầy đủ,
nhắc nhở quá hạn tô đỏ, đã xong thì gạch mờ. Bấm vào 1 nhắc nhở mở thẳng drawer
chi tiết khách hàng đó (dùng chung dữ liệu Note với Phần 1, không cần thêm cột nào
trong Sheet).
Phần 5 — Báo cáo: thống kê tổng quan + top khách cần chăm gấp.
Backend Apps Script đầy đủ (Customers, Notes, StatusHistory, Staff, Finance).
Khung điều hướng 6 module + PWA (thêm vào màn hình chính được).
Chế độ Demo (`js/mock-data.js`): bật `DEMO_MODE: true` trong `js/config.js` để
chạy toàn bộ app với dữ liệu ảo (9 nhân sự, 18 khách hàng trải đều các bước quy
trình + nhiều tình huống: quá hạn liên hệ, tạm ngưng, đa trạng thái song song,
thiếu người phụ trách...) mà không cần deploy Google Sheet — tiện để xem trước
giao diện/luồng hoạt động. Dữ liệu demo chỉ tồn tại trong phiên trình duyệt (F5 lại
sẽ về ban đầu) và các thao tác lưu/thêm đều được `MockAPI` mô phỏng y hệt hành vi
của `Code.gs` thật, nên khi tắt demo (`DEMO_MODE: false`) + điền `API_URL` thật,
không cần sửa gì thêm ở các file khác.
⏳ Chờ thông tin để làm tiếp
Nhân sự (Phần 3), Tài chính (Phần 6): sẽ build ngay sau khi có quy trình/nghiệp
vụ cụ thể (ví dụ Phần 3 cần rõ: xem KPI theo ai, theo tiêu chí nào; Phần 6 cần rõ
luồng công nợ/đối soát muốn hiển thị ra sao).
Telegram: cần Bot Token + Chat ID (chị gửi sau) — đã có sẵn hàm gửi tin, chỉ
cần điền vào `backend/Code.gs`.
Push notification khi tắt app: cần thêm Firebase Cloud Messaging (FCM) — service
worker đã có chỗ nhận push, sẽ nối khi cần.
🔧 Setup Google Sheet + Apps Script
Tạo 1 Google Sheet mới, tạo các tab đúng tên: `Customers`, `Notes`, `StatusHistory`,
`Staff`, `Config`, `Finance` — với các cột theo mô tả đầu file `backend/Code.gs`.
Vào Extensions > Apps Script, xoá code mặc định, dán nội dung `backend/Code.gs`.
Sửa 3 dòng đầu:
`SHEET_ID`: lấy từ URL của Google Sheet (đoạn giữa `/d/` và `/edit`).
`TELEGRAM_BOT_TOKEN`: token bot Telegram (chị gửi khi có).
`TELEGRAM_GENERAL_CHAT_ID`: chat ID group chung.
Deploy > New deployment > Web app:
Execute as: Me
Who has access: Anyone with the link
Copy URL `.../exec`, dán vào `js/config.js` ở `API_URL`, và đổi `DEMO_MODE: false`.
🎭 Chạy thử với dữ liệu ảo (không cần Sheet)
Mở `js/config.js`, giữ `DEMO_MODE: true` (mặc định).
Mở `index.html` trực tiếp trên trình duyệt hoặc deploy như bình thường.
Dữ liệu 9 nhân sự + 18 khách hàng nằm sẵn trong `js/mock-data.js` — có thể sửa
trực tiếp trong file này để thêm/bớt tình huống demo.
🔧 Tạo bot Telegram (nếu chưa có)
Chat với @BotFather trên Telegram → `/newbot` → đặt tên → nhận Token.
Thêm bot vào group nhân sự (nếu báo theo group) hoặc lấy Chat ID cá nhân từng người
qua @userinfobot.
Điền Chat ID từng nhân sự vào tab `Staff` trong Sheet.
🚀 Deploy frontend
Đẩy toàn bộ thư mục này lên GitHub Pages hoặc Vercel (giống cách chị đang làm với
TaskFlow) — không cần build step, chỉ là file tĩnh.
Về tính khách quan của Kanban / quy trình
`js/config.js` hiện đã dùng 9 bước quy trình chính thức (không còn placeholder
mẫu cũ). Nếu quy trình thay đổi, chỉ cần sửa mảng `STATUSES` trong file này — mọi
module (Kanban, Khách hàng, Lịch, Báo cáo) đều đọc chung từ đây.
