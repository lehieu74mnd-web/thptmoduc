# Hướng dẫn cấu hình app “Chạm”

Mọi thiết lập nằm trong **config.js**. Để trống phần nào thì phần đó hiện thông báo “chưa cấu hình”.

## A. Bài đăng của thầy cô (Google Sheet)
Tạo Sheet, dòng 1: `muc | tieu_de | noi_dung | lien_ket | ngay`. Mỗi dòng là một bài.
Mã `muc`: `tb` (thông báo trang chủ) · `2` (thông báo phòng tư vấn) · `3.2` (cẩm nang an toàn) · `3.3` (**video tình huống**).
- Video tình huống `3.3`: `lien_ket` = link TikTok/YouTube; `noi_dung` ghi **4 dòng** theo thứ tự: Biết trước / Nhận diện sớm / Xử lý đúng / Tìm kiếm hỗ trợ.
Tệp → Chia sẻ → **Xuất bản lên web** → định dạng **CSV** → dán link vào `sheetCsv`. Chỉ cấp quyền chỉnh sửa Sheet cho thầy cô quản trị (đăng nhập Google = tài khoản quản trị).

## B. Hộp thư (tâm sự, Cảnh báo Xanh, đặt lịch)
Cách 1 – Mẫu có sẵn trong app (khuyên dùng, có mã bí mật):
1. Tạo Google Form có đúng các câu hỏi dạng “Đoạn”/“Trả lời ngắn”/“Trắc nghiệm” tương ứng (với tâm sự: Khối, Vấn đề, Nội dung, **Mã**). Không bật thu thập email, không yêu cầu đăng nhập.
2. `action`: lấy link form dạng `https://docs.google.com/forms/d/e/XXXX/viewform`, đổi `viewform` thành `formResponse`.
3. Mã `entry.xxxx` mỗi câu: ⋮ → **Nhận đường liên kết điền sẵn** → điền thử → Lấy liên kết → trong link có `entry.123456=...`. Dán vào `fields`.
Cách 2 – Nhúng Tally/Typeform/Jotform/Padlet: dán link nhúng vào `embeds`.

## C. Tra cứu phản hồi bằng mã bí mật
Trong Google Sheet nhận phản hồi, thầy cô tạo thêm một sheet “phản hồi” có 3 cột `ma | phan_hoi | ngay` (mã học sinh nhận được, ví dụ NCT-8392AB). Xuất bản sheet đó dạng CSV, dán vào `replyCsv`.
⚠️ Sheet phản hồi công khai với người có link: **không ghi tên, lớp hay thông tin cá nhân** trong thư trả lời.

## D. Đưa lên GitHub Pages
Upload tất cả file lên kho GitHub → Settings → Pages → main, / (root). Sau khi sửa `config.js`, học sinh tải lại trang để thấy thay đổi.
