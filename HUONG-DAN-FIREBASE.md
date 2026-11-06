# Bật chat Firebase cho app Chạm (miễn phí gói Spark)

## 1. Tạo dự án
1. Vào https://console.firebase.google.com (đăng nhập Google của nhà trường/thầy cô quản trị) → **Tạo dự án** → đặt tên (vd `cham-moduc`) → tắt Google Analytics → Tạo.

## 2. Lấy cấu hình web
1. Trang tổng quan dự án → biểu tượng **</>** (Web) → đặt tên app → **Đăng ký ứng dụng** (không cần Hosting).
2. Copy 4 giá trị `apiKey`, `authDomain`, `projectId`, `appId` dán vào mục `firebase` trong `config.js`.
   (apiKey của Firebase web không phải bí mật; việc bảo vệ dữ liệu dựa vào quy tắc ở bước 5.)

## 3. Bật đăng nhập
**Build → Authentication → Bắt đầu → Sign-in method**:
- Bật **Ẩn danh (Anonymous)** – cho học sinh (không cần tài khoản).
- Bật **Google** – cho giáo viên (chọn email hỗ trợ dự án).
**Authentication → Settings → Authorized domains** → thêm `lehieu74mnd-web.github.io`.

## 4. Tạo cơ sở dữ liệu
**Build → Firestore Database → Tạo cơ sở dữ liệu** → vị trí gần Việt Nam (vd `asia-southeast1`) → chế độ **Production**.

## 5. Dán quy tắc bảo mật (quan trọng nhất)
Tab **Rules** → xóa nội dung cũ → dán toàn bộ file `firestore.rules` → **sửa danh sách email giáo viên** (đúng email Google, viết thường) → **Publish**.
Chỉ email trong danh sách mới xem danh sách tin nhắn và trả lời được.

## 5b. Tài khoản quản trị đăng bài
Trong `firestore.rules` có 2 danh sách email: `admin()` (quản trị: **đăng/sửa/xóa bài** và trả lời tin nhắn) và `staff()` (thầy cô Tổ Tư vấn: chỉ trả lời tin nhắn). Điền đúng email Google rồi Publish lại.
Đăng nhập: link “🔐 Quản trị / Giáo viên” → Đăng nhập Google → tab **📝 Đăng bài**: chọn chuyên mục, viết tiêu đề, nội dung, dán link TikTok/YouTube → Đăng bài. Có thể **Sửa** hoặc **Xóa** bài đã đăng. Học sinh xem bài mà không cần đăng nhập.
Chuyên mục **Video tình huống**: dán link video, phần nội dung ghi 4 dòng (Biết trước / Nhận diện sớm / Xử lý đúng / Tìm kiếm hỗ trợ).

## 6. Cách dùng
- **Học sinh:** mục Tư vấn → gõ tâm sự → nhận mã dạng `NCT-AB3D-7KQ2` → quay lại nhập mã để đọc/nhắn tiếp.
- **Giáo viên:** vào `…/#gv` (link “🔐 Dành cho giáo viên” cuối mục Tư vấn) → Đăng nhập Google → xem danh sách (🔴 chờ trả lời, ⚠️ KHẨN) → bấm vào để trả lời, bấm “Đánh dấu đã xử lý”.

## Lưu ý
- **Chưa có thông báo đẩy:** giáo viên cần mở trang “Dành cho giáo viên” để thấy tin mới (cập nhật tự động khi đang mở). Gửi thông báo email/điện thoại cần thêm Cloud Functions (phải bật gói trả phí).
- **Ai biết mã bí mật thì đọc được cuộc trò chuyện** → dặn học sinh không chia sẻ mã.
- Tin “KHẨN” chỉ phát hiện theo từ khóa, không thay thế việc theo dõi thường xuyên. Việc nguy cấp phải gọi điện / gặp trực tiếp; app luôn hiện số 111.
- Dữ liệu học sinh được lưu trên máy chủ Google. Hãy báo cáo Ban Giám hiệu và cân nhắc quy định bảo vệ dữ liệu cá nhân của trẻ em; không nên khuyến khích học sinh ghi họ tên, số điện thoại.
- Gói miễn phí Spark có hạn mức đọc/ghi mỗi ngày, thường đủ cho một trường; bạn nên xem trang giá Firebase để chắc chắn.
- Nếu muốn tin nhắn hết hạn/xóa định kỳ, thầy cô xóa trong Firestore Console.

## Báo email cho giáo viên khi có tin mới (miễn phí, qua Google Form)
App chỉ gửi: loại (Tin mới / Nhắn thêm), **4 ký tự cuối của mã**, và cờ Khẩn. **Không gửi nội dung tâm sự.**
1. Tạo Google Form “Chạm – Báo tin mới”, 3 câu **Trả lời ngắn**: `Loại`, `Mã (4 ký tự cuối)`, `Khẩn`. Cài đặt: không thu thập email, không yêu cầu đăng nhập.
2. ⋮ → **Nhận đường liên kết điền sẵn** → điền thử → Lấy liên kết → ghi lại 3 mã `entry.xxxx`. `action` = link form đổi `viewform` thành `formResponse`. Dán vào `notify` trong `config.js`.
3. Tab **Câu trả lời** → ⋮ → **Nhận thông báo qua email về các phản hồi mới**. Thêm các thầy cô làm **người chỉnh sửa** của Form để mỗi người tự bật thông báo cho mình. Nếu không thấy, nối với Google Trang tính rồi dùng **Công cụ → Quy tắc thông báo**.
4. (Khuyên dùng) Tạo thêm **form thứ hai tên “⚠️ KHẨN – Chạm”** giống hệt, điền vào `notify.urgent`: email từ form này mang tên KHẨN nên dễ nhận ra.
5. Thử: gửi một tin từ app, kiểm tra email có tới không và có thấy 4 ký tự cuối mã để tìm tin trong trang giáo viên.
Giới hạn: Google không cam kết thời gian gửi email; app chặn gửi trùng (tối đa 1 email/10 phút cho mỗi cuộc trò chuyện, trừ tin khẩn).
