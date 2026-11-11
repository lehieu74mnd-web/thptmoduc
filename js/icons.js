/* Bộ biểu tượng của website Chạm (nét vẽ 24×24, màu theo chữ) */
(function () {
  "use strict";
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    school: '<path d="M3 21h18"/><path d="M5 21V10l7-4 7 4v11"/><path d="M12 6V2.5l4 1.5-4 1.5"/><path d="M10 21v-5h4v5"/><path d="M8.5 12.5h.01M15.5 12.5h.01"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    chatHeart: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M12 15.3s-3.3-1.9-3.3-4a1.7 1.7 0 0 1 3.3-.7 1.7 1.7 0 0 1 3.3.7c0 2.1-3.3 4-3.3 4z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7z"/><path d="M12 14c0-4 3-7 8-7 0 4-3 7-8 7z"/>',
    graduation: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 9v6"/>',
    family: '<circle cx="7.5" cy="6" r="2.5"/><circle cx="16.5" cy="6" r="2.5"/><circle cx="12" cy="12.5" r="2"/><path d="M3 20v-4a3.5 3.5 0 0 1 3.5-3.5H9"/><path d="M21 20v-4a3.5 3.5 0 0 0-3.5-3.5H15"/><path d="M9 21v-1.5a3 3 0 0 1 6 0V21"/>',
    megaphone: '<path d="M3 11v3a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 9a4 4 0 0 1 0 6"/><path d="M20 6.5a8 8 0 0 1 0 11"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="m9 11 1.5 1.5L13 10"/><path d="M9 16h6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    alert: '<path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    play: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    book: '<path d="M2 5c3-1.5 7-1.5 10 1 3-2.5 7-2.5 10-1v14c-3-1.5-7-1.5-10 1-3-2.5-7-2.5-10-1z"/><path d="M12 6v14"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/>',
    pulse: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    run: '<circle cx="14.5" cy="4.5" r="2"/><path d="M7 21l3.5-6 3 2.5V21"/><path d="M5 11.5 8.5 8l4.5 1 2 3h3.5"/><path d="M10.5 15l1-6"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0z"/><path d="M19 7l-3 6a3 3 0 0 0 6 0z"/>',
    phoneScreen: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    sparkles: '<path d="M11 3l1.8 4.7L17.5 9.5l-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8z"/><path d="M19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2-2.2-.8 2.2-.8z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-1.2-1-1.6-1-2.6 0-.9.7-1.4 1.6-1.4H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
    rocket: '<path d="M12 2c3.5 2.5 5 6.5 4 11H8c-1-4.5.5-8.5 4-11z"/><circle cx="12" cy="8.5" r="1.5"/><path d="M8 13l-3 3 3.5.5M16 13l3 3-3.5.5"/><path d="M10 17c0 2 2 4 2 4s2-2 2-4"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    leaf: '<path d="M5 21c0-9 5-15 16-16-1 11-7 16-16 16z"/><path d="M5 21 14 12"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
    calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h.01M12 18.5h4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    bubble: '<circle cx="9" cy="14" r="6"/><circle cx="17.5" cy="6.5" r="3.5"/><path d="M6.5 12.5a3 3 0 0 1 2.5-1.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mapPin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  };
  function icon(name, cls) {
    const p = P[name] || P.sparkles;
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  }
  // Màu và biểu tượng cho từng chuyên mục
  const CAT = {
    "thong-bao": { icon: "megaphone", c: "#b7791f", bg: "#fdf1d8" },
    "to-tu-van": { icon: "users", c: "#0f766e", bg: "#d9f2ee" },
    "quy-tac": { icon: "clipboard", c: "#2b6cb0", bg: "#e0ecf8" },
    "nhan-dien-bao-luc": { icon: "eye", c: "#c0392b", bg: "#fbe3df" },
    "ung-pho-hoa-giai": { icon: "shield", c: "#11684f", bg: "#dff0e8" },
    "video-tinh-huong": { icon: "play", c: "#1f2937", bg: "#e5e7eb" },
    "cam-xuc-giao-tiep": { icon: "smile", c: "#c2417a", bg: "#fbe2ee" },
    "gia-tri-song": { icon: "sprout", c: "#3f7d20", bg: "#e5f3da" },
    "phuong-phap-hoc": { icon: "book", c: "#4f46e5", bg: "#e6e5fb" },
    "huong-nghiep": { icon: "compass", c: "#7c3aed", bg: "#efe5fc" },
    "giai-dap": { icon: "chatHeart", c: "#0e7490", bg: "#dbf1f6" },
    "cam-nang-phu-huynh": { icon: "family", c: "#c2570c", bg: "#fde8d6" },
  };
  const MENU = { "trang-chu": "home", "gioi-thieu": "school", "phong-chong-bao-luc": "shield", "tu-van": "chatHeart",
    "ky-nang-song": "sprout", "hoc-tap-huong-nghiep": "graduation", "gia-dinh": "family" };
  const TOPIC = { "bao-luc": "shield", "dat-lich": "calendar", "tam-su": "chatHeart", "hoc-tap": "graduation", "suc-khoe-tinh-than": "pulse", "khac": "chat" };
  window.ChamIcons = { icon: icon, CAT: CAT, MENU: MENU, TOPIC: TOPIC, has: function (n) { return !!P[n]; } };
})();
