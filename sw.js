// Service worker cơ bản — cho phép "Thêm vào màn hình chính" hoạt động như app thật.
// LƯU Ý: để nhận thông báo đẩy (push) ngay cả khi đã tắt app, cần thêm Firebase
// Cloud Messaging (FCM) + VAPID key — bước này làm ở giai đoạn sau khi các phần
// chính đã ổn định (tương tự cách chị đã tìm hiểu FCM cho CRM Sheets trước đây).

const CACHE_NAME = 'satelier-crm-v2';
const CORE_ASSETS = [
  './', './index.html', './css/style.css',
  './js/config.js', './js/mock-data.js', './js/api.js', './js/urgency.js',
  './js/customers.js', './js/kanban.js', './js/calendar.js', './js/dashboard.js', './js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // network-first cho dữ liệu API, cache-first cho asset tĩnh
  if (e.request.url.includes('script.google.com')) return; // luôn gọi mạng cho API
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Nhận push notification (khi đã cấu hình FCM ở bước sau)
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'S Atelier CRM', body: 'Có cập nhật mới' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'icon-192.png',
    })
  );
});
