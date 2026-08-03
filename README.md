# S Atelier CRM — Hướng dẫn setup

## ✅ Đã làm xong
- **Phần 1 — Quản lý khách hàng**: bảng table, sửa trực tiếp (inline edit), thêm mới,
  drawer chi tiết, note + nhắc nhở, phân công trạng thái bắt buộc chọn người phụ trách,
  tự động báo Telegram khi phân công.
- Backend Apps Script đầy đủ (Customers, Notes, StatusHistory, Staff, Finance).
- Khung điều hướng 6 module + PWA (thêm vào màn hình chính được).

## ⏳ Chờ thông tin để làm tiếp
- **Kanban (Phần 2)**: cần quy trình chính thức các bước.
- **Nhân sự (Phần 3)**, **Lịch (Phần 4)**, **Báo cáo (Phần 5)**, **Tài chính (Phần 6)**:
  sẽ build ngay sau khi có quy trình, vì logic lọc/trạng thái ở các phần này đều
  dùng chung danh sách trạng thái với Kanban.
- **Telegram**: cần Bot Token + Chat ID (chị gửi sau) — đã có sẵn hàm gửi tin, chỉ
  cần điền vào `backend/Code.gs`.
- **Push notification khi tắt app**: cần thêm Firebase Cloud Messaging (FCM) — service
  worker đã có chỗ nhận push, sẽ nối khi cần.

## 🔧 Setup Google Sheet + Apps Script

1. Tạo 1 Google Sheet mới, tạo các tab đúng tên: `Customers`, `Notes`, `StatusHistory`,
   `Staff`, `Config`, `Finance` — với các cột theo mô tả đầu file `backend/Code.gs`.
2. Vào **Extensions > Apps Script**, xoá code mặc định, dán nội dung `backend/Code.gs`.
3. Sửa 2 dòng đầu:
   - `SHEET_ID`: lấy từ URL của Google Sheet (đoạn giữa `/d/` và `/edit`).
   - `TELEGRAM_BOT_TOKEN`: token bot Telegram (chị gửi khi có).
4. **Deploy > New deployment > Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone with the link**
5. Copy URL `.../exec`, dán vào `js/config.js` ở `API_URL`.

## 🔧 Tạo bot Telegram (nếu chưa có)
1. Chat với **@BotFather** trên Telegram → `/newbot` → đặt tên → nhận Token.
2. Thêm bot vào group nhân sự (nếu báo theo group) hoặc lấy Chat ID cá nhân từng người
   qua **@userinfobot**.
3. Điền Chat ID từng nhân sự vào tab `Staff` trong Sheet.

## 🚀 Deploy frontend
- Đẩy toàn bộ thư mục này lên GitHub Pages hoặc Vercel (giống cách chị đang làm với
  TaskFlow) — không cần build step, chỉ là file tĩnh.

## Về tính khách quan của Kanban / quy trình
Chị có nhắc "đọc xem quy trình nào chưa khách quan" — hiện `js/config.js` đang để
6 bước mẫu (Mới nhắn → Hẹn đo đạc → Đã cọc → Đang thiết kế → Đang lắp đặt → Hoàn tất)
chỉ mang tính placeholder, **chưa phải là quy trình thật của S Atelier** — em cố tình
để dễ thấy và dễ sửa (1 chỗ duy nhất trong file) khi chị gửi quy trình chính thức.
