# Hướng dẫn đưa website "Chạm" lên GitHub Pages

Website gồm các file HTML, CSS, JS tĩnh nên đăng được miễn phí trên GitHub Pages.
Phần **đăng nhập giáo viên, bài viết, tin nhắn** được lưu trên **Firebase** (dịch vụ miễn phí của Google).

Có 2 giai đoạn:

1. **Đưa lên GitHub** – làm xong là website chạy ngay ở *chế độ thử nghiệm*. Ở chế độ này, dữ liệu chỉ lưu trên trình duyệt của từng máy.
2. **Kết nối Firebase** – để học sinh và giáo viên ở các máy khác nhau nhắn tin được cho nhau. Phần này làm khoảng 15 phút.

---

## Phần 1. Đưa lên GitHub Pages

1. Đăng nhập https://github.com → bấm **New** để tạo kho (repository) mới, ví dụ tên `cham`. Chọn **Public** → **Create repository**.
2. Trong kho vừa tạo, bấm **uploading an existing file** (hoặc **Add file → Upload files**).
3. Giải nén file zip, **mở thư mục `cham-github`**, chọn **toàn bộ file và thư mục bên trong** (index.html, giao-vien.html, css, js, img…) rồi kéo thả vào trang GitHub.
   > Chú ý: `index.html` phải nằm ngay ngoài cùng của kho, không nằm trong thư mục con.
4. Bấm **Commit changes**.
5. Vào **Settings → Pages**. Ở mục *Branch* chọn `main` và `/ (root)` → **Save**.
6. Chờ 1–2 phút, GitHub hiện địa chỉ dạng `https://ten-tai-khoan.github.io/cham/`.

Trang giáo viên nằm ở: `https://ten-tai-khoan.github.io/cham/giao-vien.html`

Ở chế độ thử nghiệm, đăng nhập giáo viên bằng: **demo@cham.vn** / **cham2026**.

---

## Phần 2. Kết nối Firebase (để dùng thật)

### Bước 1 – Tạo dự án Firebase
1. Vào https://console.firebase.google.com → **Create a project** (Tạo dự án), đặt tên ví dụ `cham-mo-duc`. Có thể tắt Google Analytics.
2. Trong dự án, bấm biểu tượng **`</>`** (Web) để thêm ứng dụng web, đặt tên `cham-web` → **Register app**.
3. Firebase hiện một đoạn `const firebaseConfig = { apiKey: "...", ... }`. **Giữ trang này lại** để dùng ở Bước 4.

### Bước 2 – Bật đăng nhập bằng email
1. Menu trái: **Build → Authentication → Get started**.
2. Tab **Sign-in method** → chọn **Email/Password** → bật **Enable** → **Save**.
3. Tab **Users** → **Add user**: nhập **email và mật khẩu của quản trị viên chính** (ví dụ email của thầy/cô phụ trách).
4. Tab **Settings → Authorized domains** → **Add domain** → nhập `ten-tai-khoan.github.io`.

### Bước 3 – Tạo cơ sở dữ liệu
1. Menu trái: **Build → Firestore Database → Create database**.
2. Chọn vị trí `asia-southeast1 (Singapore)` → chọn **Start in production mode** → **Create**.
3. Vào tab **Rules**, xóa hết nội dung cũ, dán **toàn bộ nội dung file `firestore.rules`**.
4. Trong đoạn vừa dán, tìm `EMAIL_QUAN_TRI@gmail.com` và **thay bằng email quản trị viên** đã tạo ở Bước 2.
5. Bấm **Publish**.

### Bước 4 – Dán cấu hình vào website
Mở file `js/config.js` trên GitHub (bấm vào file → biểu tượng bút chì ✎ để sửa). Điền các giá trị lấy từ Bước 1:

```js
window.CHAM_CONFIG = {
  firebase: {
    apiKey: "AIza....",
    authDomain: "cham-mo-duc.firebaseapp.com",
    projectId: "cham-mo-duc",
    storageBucket: "cham-mo-duc.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef",
  },
  ownerEmail: "email-quan-tri@gmail.com",
};
```

`ownerEmail` phải **giống hệt** email đã thay trong phần Rules. Bấm **Commit changes**, chờ 1–2 phút rồi tải lại website.

> Các giá trị trong `firebaseConfig` không phải mật khẩu, để công khai trên GitHub là bình thường. Dữ liệu được bảo vệ bằng phần Rules ở Bước 3.

### Bước 5 – Bắt đầu sử dụng
1. Vào `giao-vien.html`, đăng nhập bằng email quản trị viên.
2. Tab **Bài viết** → bấm **Nạp bài viết mẫu** để có sẵn khoảng 25 bài soạn theo hồ sơ dự án. Bài "Tổ Tư vấn Học đường và lịch trực" là bài mẫu, cần sửa lại tên và lịch thật.
3. Tab **Cài đặt trang** → nhập đường dẫn Fanpage "Trạm Chạm", kênh TikTok "Chạm", phòng và lịch trực tư vấn.
4. Tab **Tài khoản** → thêm email các thầy cô khác. Website tạo mật khẩu tạm; thầy cô đổi mật khẩu khi đăng nhập lần đầu. Nếu quên mật khẩu, bấm **Quên mật khẩu?** ở trang đăng nhập để nhận email đặt lại.

---

## Học sinh nhắn tin không cần mật khẩu như thế nào

Lần đầu gửi tin, website cấp cho em một **mã tra cứu** dạng `CHAM-XXXXX-XXXXX`. Trình duyệt tự nhớ mã. Khi dùng máy khác, em nhập lại mã ở trang Nhắn tin để xem câu trả lời. Ai có mã mới đọc được cuộc trò chuyện, nên em không chia sẻ mã cho người khác.

## Giới hạn của gói miễn phí

Gói miễn phí (Spark) của Firebase cho phép khoảng 50.000 lượt đọc và 20.000 lượt ghi dữ liệu mỗi ngày, thường là đủ cho một trường THPT. Ảnh trong bài viết được thu nhỏ và lưu kèm bài, nên **mỗi bài nên dùng tối đa khoảng 4–5 ảnh**. Muốn nhiều ảnh hơn, có thể đăng ảnh lên Facebook hoặc Google Drive rồi dán liên kết.

## Cấu trúc thư mục

```
index.html          trang học sinh, phụ huynh
giao-vien.html      khu vực giáo viên
firestore.rules     quy tắc bảo mật (dán vào Firebase)
css/                giao diện
js/config.js        cấu hình Firebase  ← chỉ cần sửa file này
js/store.js         đọc/ghi dữ liệu (Firebase hoặc chế độ thử nghiệm)
js/site.js          trang công khai
js/teacher.js       khu vực giáo viên
js/seed.js          bài viết mẫu
img/                logo
```
