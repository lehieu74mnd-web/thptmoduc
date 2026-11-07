/*
 * CẤU HÌNH KẾT NỐI FIREBASE
 * ------------------------------------------------------------------
 * Khi còn để trống (apiKey: ""), website chạy ở CHẾ ĐỘ THỬ NGHIỆM:
 * dữ liệu chỉ lưu trong trình duyệt của từng máy.
 *
 * Để dùng thật: làm theo file HUONG_DAN.md, rồi dán đoạn firebaseConfig
 * lấy từ Firebase Console vào bên dưới.
 */
window.CHAM_CONFIG = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  },

  // Email của quản trị viên chính (phải giống email trong file firestore.rules)
  ownerEmail: "",
};
