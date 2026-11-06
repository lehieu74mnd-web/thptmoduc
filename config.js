// ===== CẤU HÌNH – chỉ cần sửa file này (xem HUONG-DAN.md) =====
window.CFG = {
  // Google Sheet "bài đăng" đã Xuất bản lên web dạng CSV (cột: muc, tieu_de, noi_dung, lien_ket, ngay)
  sheetCsv: "",
  // Google Sheet "phản hồi" CSV (cột: ma, phan_hoi, ngay) để học sinh tra cứu bằng mã bí mật
  replyCsv: "",

  // Biểu mẫu gửi bằng Google Form (action = link formResponse; fields = mã entry của từng câu hỏi)
  forms: {
    tamsu:   { action: "", fields: { khoi: "", van_de: "", noi_dung: "", ma: "" } },
    report:  { action: "", fields: { loai: "", lop: "", noi_dung: "" } },
    booking: { action: "", fields: { ho_ten: "", lien_he: "", hinh_thuc: "", noi_dung: "" } }
  },

  // Hoặc nhúng biểu mẫu Tally / Typeform / Jotform / Google Form / Padlet (nếu điền thì dùng thay cho mẫu ở trên)
  embeds: { tamsu: "", report: "", booking: "", padlet: "" },

  // Thầy cô Tổ Tư vấn (anh: đường dẫn ảnh, ví dụ "img/co-a.jpg")
  tutors: [
    // { ten: "Cô Nguyễn Thị A", vai: "Tư vấn tâm lý", anh: "" }
  ],

  // Ảnh Infographic từ Fanpage (đường dẫn ảnh)
  infographics: [],

  // Video TikTok kênh “Chạm” hiện ở trang chủ (dán link video)
  tiktokVideos: [],

  // Nhạc chữa lành (link video YouTube, không bắt buộc)
  music: "",

  // Chat Firebase (xem HUONG-DAN-FIREBASE.md). Để trống thì dùng hộp thư Google Form như cũ.
  firebase: { apiKey: "", authDomain: "", projectId: "", appId: "" },

  // Báo email cho giáo viên khi có tin mới (qua Google Form, KHÔNG gửi nội dung tâm sự).
  // fields: mã entry.xxxx của 3 câu hỏi trong form báo tin. 'urgent' (tùy chọn) = form riêng cho tin KHẨN.
  notify: {
    action: "", fields: { loai: "", ma: "", khan: "" },
    urgent: { action: "", fields: { loai: "", ma: "", khan: "" } }
  },

  facebook: "",
  tiktok: ""
};
