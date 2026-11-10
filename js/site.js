/* Trang công khai: học sinh, phụ huynh, giáo viên chủ nhiệm */
(function () {
  "use strict";
  const C = window.Cham, Q = window.ChamQuiz, DB = window.ChamStore;
  const esc = C.esc;
  const app = document.getElementById("app");
  let META = Object.assign({ settings: {} }, window.CHAM_META);
  let unwatch = null;
  let pollTimer = null;
  let routeToken = 0;

  // ------------------------------------------------------------ cấu trúc 7 menu (theo hồ sơ thiết kế)
  const MENUS = [
    { key: "trang-chu", n: 1, label: "Trang chủ" },
    {
      key: "gioi-thieu", n: 2, label: "Giới thiệu & Nội quy",
      title: "Giới thiệu & Nội quy",
      intro: "Tổ Tư vấn Học đường, đội ngũ vận hành dự án \"Chạm\" và những chuẩn mực ứng xử của học sinh Trường THPT Mộ Đức.",
      sections: [
        { id: "to-tu-van", title: "Cơ cấu Tổ Tư vấn Học đường", cat: "to-tu-van",
          desc: "Danh sách, chuyên môn và lịch trực của các thầy cô trong Ban Tư vấn tâm lý, cùng đội ngũ học sinh nòng cốt vận hành dự án." },
        { id: "quy-tac", title: "Bộ Quy tắc Ứng xử Văn hóa Học đường", cat: "quy-tac",
          desc: "Nề nếp, sự tôn trọng thầy cô, đoàn kết với bạn bè và quy tắc ứng xử văn minh, an toàn trên không gian mạng (Netiquette)." },
      ],
    },
    {
      key: "phong-chong-bao-luc", n: 3, label: "Phòng, chống bạo lực học đường",
      title: "Phòng, chống bạo lực học đường",
      intro: "Nhận diện, ứng phó và báo tin kịp thời. Em không phải đối mặt một mình.",
      sections: [
        { id: "canh-bao-xanh", title: "Hộp thư \"Cảnh báo Xanh\" – Báo cáo bạo lực ẩn danh 100%", widget: "report",
          desc: "Dành cho nạn nhân hoặc người chứng kiến đánh nhau, đe dọa, trấn lột, cô lập bạn bè hoặc bắt nạt trên mạng. Báo tin đến Ban Giám hiệu và Tổ Tư vấn mà không sợ lộ danh tính hay bị trả thù." },
        { id: "nhan-dien", title: "Nhận diện các hình thức Bạo lực học đường", cat: "nhan-dien-bao-luc",
          desc: "Bốn dạng bạo lực: thể chất, lời nói (body shaming, miệt thị), quan hệ (tẩy chay, cô lập tập thể) và bạo lực mạng (bóc phốt, chế ảnh xúc phạm)." },
        { id: "ung-pho", title: "Kỹ năng Ứng phó & Hòa giải mâu thuẫn", cat: "ung-pho-hoa-giai",
          desc: "Các bước tự bảo vệ khi bị bắt nạt hoặc công kích trên mạng; cách tháo gỡ xích mích nhóm bạn, hiểu lầm giữa các lớp, bất đồng khi làm việc nhóm." },
        { id: "video", title: "Video Tình huống Phòng chống Bạo lực (TikTok \"Chạm\")", cat: "video-tinh-huong", widget: "tiktok",
          desc: "Tiểu phẩm tình huống thực tế do chính học sinh trường đóng." },
      ],
    },
    {
      key: "tu-van", n: 6, label: "Phòng Tư vấn Học đường",
      title: "Phòng Tư vấn Học đường",
      intro: "Nơi tiếp nhận và hỗ trợ chuyên sâu của nhà trường. Mọi trao đổi đều được bảo mật.",
      sections: [
        { id: "dat-lich", title: "Đặt lịch hẹn Tư vấn 1-1", widget: "booking",
          desc: "Đăng ký gặp trực tiếp thầy cô tại Phòng Tư vấn tâm lý hoặc hẹn giờ tư vấn trực tuyến bảo mật." },
        { id: "tram-lang-nghe", title: "Hộp thư Tâm sự Ẩn danh – Trạm Lắng Nghe", cat: "giai-dap", widget: "confide",
          desc: "Gửi những trăn trở về áp lực điểm số, chuyện gia đình, tình cảm tuổi học trò để nhận lời khuyên từ Ban cố vấn." },
        { id: "dass21", title: "Tự kiểm tra Sức khỏe Tinh thần (Thang đo DASS-21)", widget: "dass",
          desc: "Bài trắc nghiệm chuẩn hóa quốc tế giúp em tự sàng lọc mức độ Stress – Lo âu – Trầm cảm để chủ động tìm sự hỗ trợ." },
      ],
    },
    {
      key: "ky-nang-song", n: 4, label: "Đạo đức – Kỹ năng sống",
      title: "Giáo dục Đạo đức – Kỹ năng sống",
      intro: "Giáo dục nhân cách và lối sống tích cực: làm chủ cảm xúc, sống biết ơn và có trách nhiệm.",
      sections: [
        { id: "cam-xuc", title: "Kỹ năng Quản lý Cảm xúc & Giao tiếp tích cực", cat: "cam-xuc-giao-tiep",
          desc: "Làm chủ cảm xúc, vượt qua áp lực đồng trang lứa, xây dựng tình bạn đẹp và ứng xử lễ phép với thầy cô." },
        { id: "gia-tri-song", title: "Giá trị sống & Năng lượng tích cực", widget: "book", cat: "gia-tri-song",
          desc: "Mỗi ngày cuốn sổ Chạm mở ra một trang mới: một biểu tượng truyền năng lượng và một câu nói tích cực tiếp sức cho em trước giờ học. Bên dưới là các bài viết về lòng biết ơn, sự sẻ chia và tinh thần trách nhiệm." },
        { id: "thu-gian", title: "Góc thư giãn – Trò chơi bấm bong bóng", widget: "bubbles",
          desc: "Mệt mỏi sau giờ học? Dành một phút bấm bong bóng để thả lỏng. Mỗi bong bóng vàng mang theo một lời chúc tích cực." },
      ],
    },
    {
      key: "hoc-tap-huong-nghiep", n: 5, label: "Học tập & Hướng nghiệp",
      title: "Phương pháp Học tập & Hướng nghiệp",
      intro: "Hỗ trợ trực tiếp việc học cấp THPT: học hiệu quả hơn, bớt lo âu thi cử, hiểu thế mạnh để chọn hướng đi.",
      sections: [
        { id: "phuong-phap-hoc", title: "Phương pháp Học tập & Vượt qua áp lực thi cử", cat: "phuong-phap-hoc",
          desc: "Cẩm nang tự học các môn Tự nhiên và Xã hội; Pomodoro, ma trận Eisenhower, ghi chép Cornell giúp giảm lo âu trước kỳ kiểm tra." },
        { id: "huong-nghiep", title: "Trắc nghiệm Khám phá Bản thân & Định hướng Nghề nghiệp", cat: "huong-nghiep", widget: "career",
          desc: "Trắc nghiệm Đa trí tuệ và Trắc nghiệm sở thích nghề nghiệp Holland tự động tính điểm, giúp em chọn tổ hợp môn và định hướng ngành nghề." },
      ],
    },
    {
      key: "gia-dinh", n: 7, label: "Cẩm nang đồng hành cùng con",
      title: "Cẩm nang đồng hành cùng con",
      intro: "Dành cho cha mẹ: thấu hiểu tâm lý tuổi THPT, nhận biết sớm dấu hiệu con gặp khó khăn và cùng nhà trường đồng hành với con.",
      sections: [
        { id: "cam-nang", title: "Cẩm nang đồng hành cùng con", cat: "cam-nang-phu-huynh",
          desc: "Thấu hiểu tâm lý tuổi THPT, nhận biết sớm dấu hiệu con bị áp lực học tập hoặc bị bắt nạt để phối hợp cùng nhà trường." },
      ],
    },
  ];
  const ROUTE_MENU = { "bao-cao": "phong-chong-bao-luc", "dat-lich": "tu-van", "tam-su": "tu-van", "dass21": "tu-van",
    "holland": "hoc-tap-huong-nghiep", "da-tri-tue": "hoc-tap-huong-nghiep", "nhan-tin": "tu-van" };

  function catLabel(key) {
    const c = META.categories.find(function (x) { return x.key === key; });
    return c ? c.label : "";
  }
  function catMenu(key) {
    const c = META.categories.find(function (x) { return x.key === key; });
    return c ? MENUS.find(function (m) { return m.key === c.menu; }) : null;
  }

  // ------------------------------------------------------------ menu
  const CARET = '<svg class="caret" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 3.5L5 7l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  function renderNav(active) {
    document.getElementById("nav-list").innerHTML = MENUS.map(function (m) {
      const href = m.key === "trang-chu" ? "#/" : "#/" + m.key;
      const drop = m.sections && m.sections.length > 1 ? '<ul class="dropdown">' + m.sections.map(function (s) {
        return '<li><a href="#/' + m.key + "/" + s.id + '">' + esc(s.title.replace(/\s*\(.*\)$/, "")) + "</a></li>";
      }).join("") + "</ul>" : "";
      return '<li><a href="' + href + '"' + (m.key === active ? ' aria-current="page"' : "") + ">" + esc(m.label) + (drop ? CARET : "") + "</a>" + drop + "</li>";
    }).join("");
  }
  // băng tiêu đề trang với đường dẫn điều hướng
  function head(menuKey, title, intro, extra) {
    const m = MENUS.find(function (x) { return x.key === menuKey; });
    const crumbs = ['<a href="#/">Trang chủ</a>'];
    if (m && m.key !== "trang-chu") crumbs.push(extra ? '<a href="#/' + m.key + '">' + esc(m.label) + "</a>" : "<span>" + esc(m.label) + "</span>");
    if (extra) crumbs.push("<span>" + esc(extra) + "</span>");
    return '<header class="page-head"><nav class="crumbs" aria-label="Đường dẫn">' + crumbs.join('<span class="sep">›</span>') + "</nav><h1>" + esc(title) + "</h1>" + (intro ? "<p>" + intro + "</p>" : "") + "</header>";
  }
  const navEl = document.getElementById("mainnav");
  const toggle = document.getElementById("menu-toggle");
  toggle.addEventListener("click", function () {
    const open = !navEl.classList.contains("open");
    navEl.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // ------------------------------------------------------------ mã tra cứu học sinh
  function getCode() { return C.store("cham_code"); }
  async function ensureCode() {
    const code = getCode();
    if (code) return code;
    const c = await DB.startCode();
    C.store("cham_code", c);
    return c;
  }
  function topicLabel(t) { return META.topics[t] || t; }
  async function createConversation(payload) {
    let code = await ensureCode();
    try { return await DB.createThread(code, payload); }
    catch (e) {
      // mã cũ không còn hợp lệ -> cấp mã mới rồi gửi lại
      if (!(await DB.codeExists(code))) { C.store("cham_code", null); code = await ensureCode(); return DB.createThread(code, payload); }
      throw e;
    }
  }
  async function refreshBadge() {
    const badge = document.getElementById("fab-badge");
    if (!getCode()) { badge.hidden = true; return; }
    try {
      const list = await DB.threads(getCode());
      const n = list.reduce(function (a, c) { return a + (c.student_unread || 0); }, 0);
      badge.textContent = n; badge.hidden = n === 0;
    } catch (e) { badge.hidden = true; }
  }
  setInterval(refreshBadge, 30000);

  // ------------------------------------------------------------ thành phần dùng lại
  function postCard(p) {
    const cover = p.cover ? '<img class="cover" src="' + esc(p.cover) + '" alt="" loading="lazy">' : "";
    return '<a class="post-card" href="#/bai/' + p.id + '">' + cover + '<div class="body">' +
      '<span class="cat">' + esc(catLabel(p.category)) + "</span>" +
      "<h3>" + (p.pinned ? '<span class="pin">GHIM</span>' : "") + esc(p.title) + "</h3>" +
      (p.summary ? "<p>" + esc(p.summary) + "</p>" : "") +
      '<span class="meta">' + (p.video_url ? '<span class="video-tag">VIDEO</span> ' : "") + esc(p.author_name) + " · " + C.fmtDate(p.created_at) + "</span>" +
      "</div></a>";
  }
  async function postsGrid(cat, limit, emptyText) {
    const r = { posts: await DB.posts({ category: cat, limit: limit || 50 }) };
    // Chuyên mục video: phát video ngay trong danh sách
    if (cat === "video-tinh-huong" && r.posts.some(function (p) { return p.video_url; })) {
      return '<div class="video-grid">' + r.posts.map(function (p) {
        return '<article class="video-card">' + (p.video_url ? C.videoEmbed(p.video_url) : "") + '<div class="vc-body"><h3>' + esc(p.title) + "</h3>" +
          (p.summary ? "<p>" + esc(p.summary) + "</p>" : "") + '<a class="more" href="#/bai/' + esc(p.id) + '">Đọc bài viết đầy đủ →</a></div></article>';
      }).join("") + "</div>";
    }
    if (!r.posts.length) return '<div class="empty">' + esc(emptyText || "Chưa có bài viết. Thầy cô sẽ cập nhật sớm.") + "</div>";
    return '<div class="posts">' + r.posts.map(postCard).join("") + "</div>";
  }
  function fill(id, promise) {
    const el = document.getElementById(id);
    if (!el) return;
    promise.then(function (html) { el.innerHTML = html; })
      .catch(function (e) { el.innerHTML = '<div class="notice danger">' + esc(e.message) + "</div>"; });
  }
  const ICON = {
    bubble: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="14" r="6"/><circle cx="17.5" cy="6.5" r="3.5"/><path d="M6.5 12.5a3 3 0 0 1 2.5-1.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/></svg>',
    pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v8h4v-8H17l.5-4h-4V9c0-.6.4-1 1-1z"/></svg>',
    tt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.4 2.3 1.9 3.8 4 4v3.3c-1.5 0-2.9-.5-4-1.2V15a6 6 0 1 1-6-6c.3 0 .6 0 .9.1v3.4a2.7 2.7 0 1 0 1.8 2.5V3z"/></svg>',
  };
  function hotlinesHtml() {
    return '<div class="hotlines">' +
      '<div class="hotline"><b>111</b><span>Tổng đài quốc gia bảo vệ trẻ em (miễn phí, 24/7)</span></div>' +
      '<div class="hotline"><b>113</b><span>Công an – khi có nguy hiểm ngay lập tức</span></div>' +
      '<div class="hotline"><b>115</b><span>Cấp cứu y tế</span></div></div>';
  }
  function identityFields(defaultAnon) {
    return '<div class="field"><label class="switch"><input type="checkbox" id="f-anon"' + (defaultAnon ? " checked" : "") + '>' +
      '<span><b>Gửi ẩn danh</b><br><span class="hint">Thầy cô sẽ không biết tên em. Em vẫn nhận được câu trả lời qua mã tra cứu.</span></span></label></div>' +
      '<div class="grid-2"><div class="field" id="f-name-wrap"' + (defaultAnon ? " hidden" : "") + '><label for="f-name">Họ tên</label><input class="input" id="f-name" maxlength="60" autocomplete="name"></div>' +
      '<div class="field"><label for="f-class">Lớp <span class="hint">(không bắt buộc)</span></label><input class="input" id="f-class" maxlength="20" placeholder="VD: 11A3"></div></div>';
  }
  function bindIdentity() {
    const a = document.getElementById("f-anon");
    a.addEventListener("change", function () { document.getElementById("f-name-wrap").hidden = a.checked; });
  }
  function identityValues() {
    const anon = document.getElementById("f-anon").checked;
    return { anonymous: anon, display_name: anon ? "" : document.getElementById("f-name").value.trim(), class_name: document.getElementById("f-class").value.trim() };
  }
  function checkedValues(name) {
    return Array.prototype.map.call(document.querySelectorAll('input[name="' + name + '"]:checked'), function (x) { return x.value; });
  }
  function chips(name, list, type) {
    return '<div class="chips">' + list.map(function (v, i) {
      return '<label class="chip"><input type="' + (type || "checkbox") + '" name="' + name + '" value="' + esc(v) + '" id="' + name + "-" + i + '"><span>' + esc(v) + "</span></label>";
    }).join("") + "</div>";
  }
  function codeBox(code) {
    return '<div class="code-box"><span>Mã tra cứu của em:</span><code id="my-code">' + esc(code) + '</code>' +
      '<button class="btn small ghost" type="button" id="copy-code">Sao chép</button>' +
      '<p class="code-help">Trình duyệt này đã tự nhớ mã, nên em mở lại trang là thấy ngay câu trả lời. Em chỉ cần nhập mã khi xem trên <b>máy khác</b> (điện thoại, máy ở nhà), <b>trình duyệt khác</b>, hoặc sau khi <b>xóa lịch sử duyệt web</b>. Hãy chép mã ra giấy hoặc chụp màn hình và không đưa mã cho người khác.</p></div>';
  }
  function bindCopy() {
    const b = document.getElementById("copy-code");
    if (b) b.addEventListener("click", function () { C.copyText(getCode() || "", b); });
  }
  function busy(btn, on, text) {
    btn.disabled = on;
    if (on) { btn.dataset.t = btn.textContent; btn.textContent = text || "Đang gửi…"; }
    else if (btn.dataset.t) btn.textContent = btn.dataset.t;
  }

  // ------------------------------------------------------------ LẬT TRANG – MỖI LẦN MỘT CÂU HỎI
  function dailyQuotes() {
    const raw = String(META.settings.daily_quotes || "").trim();
    const list = raw ? raw.split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean) : (META.dailyQuotes || []);
    return list.length ? list : ["Chúc em một ngày thật vui!"];
  }
  function dayInfo(offset) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offset);
    const dayNo = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    const list = dailyQuotes();
    const label = d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
    return { key: d.toISOString().slice(0, 10), label: label.charAt(0).toUpperCase() + label.slice(1), quote: list[dayNo % list.length], energy: energyFor(dayNo) };
  }
  // Biểu tượng truyền năng lượng (mỗi ngày một biểu tượng)
  const ENERGY = [
    { word: "Tỏa nắng", bg: "#fff3cf", svg: '<circle cx="60" cy="60" r="22" fill="#f2be3a"/><g stroke="#f2a93a" stroke-width="6" stroke-linecap="round"><path d="M60 14v12M60 94v12M14 60h12M94 60h12M27 27l9 9M84 84l9 9M93 27l-9 9M36 84l-9 9"/></g><path d="M51 62q9 9 18 0" stroke="#8a5a00" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="52" cy="54" r="3" fill="#8a5a00"/><circle cx="68" cy="54" r="3" fill="#8a5a00"/>' },
    { word: "Yêu thương", bg: "#fde3df", svg: '<path d="M60 96C26 74 18 56 22 42c4-15 22-21 38-6 16-15 34-9 38 6 4 14-4 32-38 54z" fill="#ef6f63"/><path d="M38 44c3-6 9-8 14-6" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>' },
    { word: "Tỏa sáng", bg: "#fff3cf", svg: '<path d="M60 16l12 27 29 3-22 20 7 29-26-15-26 15 7-29-22-20 29-3z" fill="#f2be3a" stroke="#e0a21d" stroke-width="3" stroke-linejoin="round"/><circle cx="96" cy="22" r="4" fill="#f2be3a"/><circle cx="22" cy="96" r="3" fill="#f2be3a"/>' },
    { word: "Lớn lên", bg: "#dff0e8", svg: '<path d="M60 100V58" stroke="#11684f" stroke-width="6" stroke-linecap="round"/><path d="M60 66C60 44 44 34 26 36c0 20 14 30 34 30z" fill="#4fb38f"/><path d="M60 58c0-22 16-34 36-32 0 22-16 32-36 32z" fill="#7fc3a6"/><path d="M38 100h44" stroke="#8a5a00" stroke-width="6" stroke-linecap="round"/>' },
    { word: "Hy vọng", bg: "#e1edf5", svg: '<g fill="none" stroke-width="8" stroke-linecap="round"><path d="M18 86a42 42 0 0 1 84 0" stroke="#ef6f63"/><path d="M28 86a32 32 0 0 1 64 0" stroke="#f2be3a"/><path d="M38 86a22 22 0 0 1 44 0" stroke="#4fb38f"/><path d="M48 86a12 12 0 0 1 24 0" stroke="#5aa7d6"/></g><ellipse cx="24" cy="90" rx="14" ry="8" fill="#fff"/><ellipse cx="96" cy="90" rx="14" ry="8" fill="#fff"/>' },
    { word: "Bứt phá", bg: "#e1edf5", svg: '<path d="M60 14c18 12 24 34 18 56H42c-6-22 0-44 18-56z" fill="#5aa7d6"/><circle cx="60" cy="44" r="8" fill="#fff"/><path d="M42 70l-12 14 16-2M78 70l12 14-16-2" fill="#ef6f63"/><path d="M50 74c0 12 10 24 10 24s10-12 10-24z" fill="#f2be3a"/>' },
    { word: "Mỉm cười", bg: "#fff3cf", svg: '<circle cx="60" cy="60" r="40" fill="#f2be3a"/><circle cx="46" cy="52" r="5" fill="#5a3c00"/><circle cx="74" cy="52" r="5" fill="#5a3c00"/><path d="M40 68q20 22 40 0" stroke="#5a3c00" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="36" cy="66" r="6" fill="#ef8a7a" opacity=".6"/><circle cx="84" cy="66" r="6" fill="#ef8a7a" opacity=".6"/>' },
    { word: "Nở hoa", bg: "#fde3df", svg: '<g fill="#ef8a7a"><circle cx="60" cy="36" r="16"/><circle cx="82" cy="52" r="16"/><circle cx="74" cy="78" r="16"/><circle cx="46" cy="78" r="16"/><circle cx="38" cy="52" r="16"/></g><circle cx="60" cy="60" r="12" fill="#f2be3a"/>' },
    { word: "Bay cao", bg: "#e1edf5", svg: '<ellipse cx="60" cy="46" rx="26" ry="31" fill="#ef6f63"/><path d="M54 76h12l-6 7z" fill="#ef6f63"/><path d="M60 83c-6 8 6 14 0 24" stroke="#4b5e56" stroke-width="2.5" fill="none"/><path d="M46 34c3-7 9-10 15-10" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>' },
    { word: "Năng lượng", bg: "#fff3cf", svg: '<path d="M68 12L30 66h26l-6 42 40-56H62z" fill="#f2be3a" stroke="#e0a21d" stroke-width="3" stroke-linejoin="round"/>' },
  ];
  function energyFor(dayNo) { return ENERGY[(dayNo * 7) % ENERGY.length]; }
  function energyHtml(e) {
    return '<div class="energy" style="--energy-bg:' + e.bg + '"><svg viewBox="0 0 120 120" aria-hidden="true">' + e.svg + '</svg></div><b class="energy-word">' + esc(e.word) + "</b>";
  }
  function bookHtml() {
    const today = dayInfo(0);
    return '<div class="book-wrap"><div class="book" id="book">' +
      '<div class="book-page left"><span class="book-label" id="book-label">Sổ tay Chạm</span><span class="book-date" id="book-topic">' + esc(today.label) + "</span>" +
        '<div class="energy-box" id="book-energy"><div class="energy closed"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="14" fill="#f2be3a"/><g fill="none" stroke="#7fc3a6" stroke-width="3"><circle cx="60" cy="60" r="28"/><circle cx="60" cy="60" r="44" opacity=".6"/></g></svg></div><b class="energy-word">Sẵn sàng chưa?</b></div></div>' +
      '<div class="book-page right"><div class="book-q" id="book-q"><span class="book-wait">Trang hôm nay đang chờ em.<br>Bấm <b>Lật trang hôm nay</b> để nhận năng lượng.</span></div></div>' +
      '<div class="book-turn" id="book-turn" aria-hidden="true"><div class="face front" id="book-front"></div><div class="face back"></div></div>' +
      '</div></div>' +
      '<div class="book-actions" id="book-actions"><button class="btn sun" type="button" id="book-flip">Lật trang hôm nay</button></div>';
  }
  function bindBook() {
    const btn = document.getElementById("book-flip");
    if (!btn) return;
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let offset = 0, busyFlip = false;
    function render(info) {
      document.getElementById("book-label").textContent = offset === 0 ? "Năng lượng hôm nay" : "Trang ngày trước";
      document.getElementById("book-topic").textContent = info.label;
      document.getElementById("book-energy").innerHTML = energyHtml(info.energy);
    }
    function quoteHtml(info) { return '<span class="book-mark" aria-hidden="true">“</span>' + esc(info.quote); }
    function turn(newOffset) {
      if (busyFlip) return;
      offset = newOffset;
      const info = dayInfo(offset);
      const right = document.getElementById("book-q");
      if (reduce) { right.innerHTML = quoteHtml(info); render(info); controls(); return; }
      busyFlip = true;
      document.getElementById("book-front").innerHTML = '<div class="book-q">' + right.innerHTML + "</div>";
      right.innerHTML = quoteHtml(info);
      const t = document.getElementById("book-turn");
      t.classList.remove("go"); void t.offsetWidth; t.classList.add("go");
      setTimeout(function () { render(info); }, 420);
      setTimeout(function () { t.classList.remove("go"); busyFlip = false; controls(); }, 820);
    }
    function controls() {
      const box = document.getElementById("book-actions");
      if (!box) return;
      box.innerHTML = '<button class="btn ghost" type="button" id="book-prev"' + (offset <= -6 ? " disabled" : "") + '>‹ Trang hôm trước</button>' +
        '<button class="btn" type="button" id="book-today"' + (offset === 0 ? " disabled" : "") + ">Hôm nay ›</button>";
      document.getElementById("book-prev").onclick = function () { turn(offset - 1); };
      document.getElementById("book-today").onclick = function () { turn(0); };
    }
    // Đã mở trang hôm nay trên máy này rồi thì hiện luôn
    let opened = null;
    try { opened = localStorage.getItem("cham_book_opened"); } catch (e) { /* trống */ }
    if (opened === dayInfo(0).key) {
      document.getElementById("book-q").innerHTML = quoteHtml(dayInfo(0));
      render(dayInfo(0)); controls(); return;
    }
    btn.addEventListener("click", function () {
      try { localStorage.setItem("cham_book_opened", dayInfo(0).key); } catch (e) { /* trống */ }
      turn(0);
    });
  }

  // ------------------------------------------------------------ TRANG CHỦ
  function viewHome() {
    const s = META.settings;
    app.innerHTML =
      '<section class="hero"><canvas id="ripple" aria-hidden="true"></canvas>' +
        '<div class="hero-copy">' +
          '<span class="hero-kicker">Tổ Tư vấn Học đường · Trường THPT Mộ Đức</span>' +
          "<h1>Có chuyện gì, <em>cứ chạm</em> vào đây.</h1>" +
          "<p>Thầy cô luôn sẵn sàng lắng nghe. Em không cần tài khoản, không cần mật khẩu và có thể nhắn tin ẩn danh.</p>" +
          '<div class="row"><a class="btn sun" href="#/nhan-tin">Nhắn tin cho thầy cô</a><a class="btn ghost" href="#/phong-chong-bao-luc">Phòng, chống bạo lực học đường</a></div>' +
          '<div class="hero-facts"><span><b>Ẩn danh</b>Không cần ghi tên</span><span><b>Bảo mật</b>Chỉ Tổ Tư vấn đọc tin</span><span><b>Website · Facebook · TikTok</b>Fanpage "' + esc(s.facebook_name) + '" · Kênh "' + esc(s.tiktok_name) + '"</span></div>' +
        "</div>" +
        '<div class="quick">' +
          '<a class="report" href="#/bao-cao"><span class="q-icon">' + ICON.shield + '</span><span><b>Báo cáo bạo lực ẩn danh</b><span>Hộp thư Cảnh báo Xanh · không ai biết em là người gửi</span></span><span class="q-arrow">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' + "</span></a>" +
          '<a class="book" href="#/dat-lich"><span class="q-icon">' + ICON.calendar + '</span><span><b>Đặt lịch tư vấn tâm lý</b><span>Gặp trực tiếp hoặc trò chuyện trực tuyến bảo mật</span></span><span class="q-arrow">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' + "</span></a>" +
          '<a class="chat" href="#/tam-su"><span class="q-icon">' + ICON.heart + '</span><span><b>Trạm Lắng Nghe</b><span>Gửi tâm sự về học tập, gia đình, tình bạn</span></span><span class="q-arrow">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' + "</span></a>" +
        "</div>" +
      "</section>" +
      '<div class="two-col section">' +
        '<section><div class="section-head"><h2>Thông báo từ Ban Giám hiệu / Đoàn trường</h2></div><div id="home-notices"><p class="loading">Đang tải…</p></div></section>' +
        '<section><div class="section-head"><h2>Góc Truyền thông Đa nền tảng</h2></div><div class="media">' +
          '<a class="social fb" href="' + esc(s.facebook_url) + '" target="_blank" rel="noopener">' + ICON.fb + '<span><b>Fanpage "' + esc(s.facebook_name) + '"</b><span>Bản tin, infographic, giải đáp tâm sự</span></span><span class="go">Nhắn tin</span></a>' +
          '<a class="social tt" href="' + esc(s.tiktok_url) + '" target="_blank" rel="noopener">' + ICON.tt + '<span><b>Kênh TikTok "' + esc(s.tiktok_name) + '"</b><span>Video tình huống do học sinh trường đóng</span></span><span class="go">Xem</span></a>' +
          '<div id="home-videos"></div>' +
        "</div></section>" +
      "</div>" +
      '<section class="section"><div class="section-head"><h2>Công cụ dành cho em</h2><a href="#/tu-van">Phòng Tư vấn Học đường →</a></div><div class="tools">' +
        '<a class="tool" href="#/dass21"><span class="t-icon">' + ICON.pulse + '</span><b>Kiểm tra sức khỏe tinh thần</b><span>Thang đo DASS-21, khoảng 5 phút. Kết quả chỉ hiện trên máy của em.</span><span class="more">Bắt đầu</span></a>' +
        '<a class="tool" href="#/holland"><span class="t-icon">' + ICON.compass + '</span><b>Trắc nghiệm Holland</b><span>Tìm nhóm sở thích nghề nghiệp và ngành học phù hợp.</span><span class="more">Bắt đầu</span></a>' +
        '<a class="tool" href="#/da-tri-tue"><span class="t-icon">' + ICON.bulb + '</span><b>Trắc nghiệm Đa trí tuệ</b><span>Biết thế mạnh của mình để chọn cách học hiệu quả.</span><span class="more">Bắt đầu</span></a>' +
        '<a class="tool" href="#/ky-nang-song/thu-gian"><span class="t-icon">' + ICON.bubble + '</span><b>Góc thư giãn</b><span>Trò chơi bấm bong bóng giúp em thả lỏng sau giờ học căng thẳng.</span><span class="more">Chơi ngay</span></a>' +
      "</div></section>" +
      '<section class="section"><div class="section-head"><h2>Năng lượng tích cực mỗi ngày</h2><a href="#/ky-nang-song/gia-tri-song">Giá trị sống & Năng lượng tích cực →</a></div>' + bookHtml() + "</section>" +
      '<section class="section"><div class="section-head"><h2>Bài viết mới</h2><a href="#/tim-kiem">Xem tất cả →</a></div><div id="home-latest"><p class="loading">Đang tải…</p></div></section>';

    fill("home-notices", DB.posts({ category: "thong-bao", limit: 6 }).then(function (posts) { const r = { posts: posts };
      if (!r.posts.length) return '<div class="empty">Chưa có thông báo.</div>';
      return '<ul class="notices">' + r.posts.map(function (p) {
        const d = new Date(p.created_at * 1000);
        return '<li><a href="#/bai/' + p.id + '"><span class="date-chip"><b>' + String(d.getDate()).padStart(2, "0") + "</b><small>Th " + (d.getMonth() + 1) + "/" + d.getFullYear() + "</small></span>" +
          "<span><h3>" + (p.pinned ? '<span class="pin">GHIM</span>' : "") + esc(p.title) + "</h3><p>" + esc(p.summary) + "</p></span></a></li>";
      }).join("") + "</ul>";
    }));
    fill("home-videos", DB.posts({ category: "video-tinh-huong", limit: 3 }).then(function (posts) { const r = { posts: posts };
      const v = r.posts.filter(function (p) { return p.video_url; });
      if (!v.length) return "";
      return '<div class="stack">' + v.map(postCard).join("") + "</div>";
    }));
    fill("home-latest", DB.posts({ limit: 7 }).then(function (posts) { const r = { posts: posts };
      const list = r.posts.filter(function (p) { return p.category !== "thong-bao"; }).slice(0, 6);
      return list.length ? '<div class="posts">' + list.map(postCard).join("") + "</div>" : '<div class="empty">Chưa có bài viết.</div>';
    }));
    startRipple();
    bindBook();
  }

  function startRipple() {
    const cv = document.getElementById("ripple");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, dpr;
    function size() {
      dpr = window.devicePixelRatio || 1;
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);
    const t0 = performance.now();
    function draw(now) {
      if (!document.body.contains(cv)) return;
      const t = reduce ? 1800 : now - t0;
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.7, cy = h * 0.5, maxR = Math.max(w, h) * 0.85;
      for (let i = 0; i < 6; i++) {
        const p = ((t / 5200) + i / 6) % 1;
        const r = 10 + p * maxR;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(223,240,232," + (0.22 * (1 - p)).toFixed(3) + ")";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (!reduce) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ------------------------------------------------------------ TRANG CHUYÊN MỤC
  function widgetHtml(w) {
    if (w === "report") return '<div class="cta-band"><div><h3>Em đang bị bắt nạt hoặc vừa chứng kiến bạo lực?</h3><p>Báo tin ngay cho Ban Giám hiệu và Tổ Tư vấn. Không cần ghi tên. Thầy cô sẽ hồi âm qua mã tra cứu của em.</p></div><a class="btn sun" href="#/bao-cao">Gửi báo cáo ẩn danh</a></div>';
    if (w === "booking") return '<div class="cta-band sun"><div><h3>Đặt lịch gặp thầy cô</h3><p>Phòng: ' + esc(META.settings.counsel_room) + ". Lịch trực: " + esc(META.settings.counsel_hours) + '.</p></div><a class="btn" href="#/dat-lich">Đặt lịch tư vấn 1-1</a></div>';
    if (w === "confide") return '<div class="cta-band"><div><h3>Trạm Lắng Nghe</h3><p>Viết ra điều em đang trăn trở. Thầy cô đọc và hồi âm riêng cho em. Các câu trả lời hay có thể được đăng ẩn danh bên dưới nếu em đồng ý.</p></div><a class="btn sun" href="#/tam-su">Gửi tâm sự</a></div>';
    if (w === "dass") return '<div class="cta-band sun"><div><h3>DASS-21: 21 câu, khoảng 5 phút</h3><p>Kết quả chỉ hiển thị trên máy của em. Em có thể chọn gửi cho thầy cô nếu muốn được hỗ trợ.</p></div><a class="btn" href="#/dass21">Bắt đầu tự kiểm tra</a></div>';
    if (w === "career") return '<div class="tools" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))"><a class="tool" href="#/holland"><span class="tag">30 câu</span><b>Trắc nghiệm sở thích nghề nghiệp Holland</b><span>Tìm mã Holland 3 chữ cái và nhóm ngành phù hợp.</span></a><a class="tool" href="#/da-tri-tue"><span class="tag">24 câu</span><b>Trắc nghiệm Đa trí tuệ</b><span>8 loại trí thông minh theo Howard Gardner và cách học phù hợp.</span></a></div>';
    if (w === "book") return bookHtml();
    if (w === "bubbles") return '<div class="bubble-game" id="bubble-game"></div>';
    if (w === "tiktok") return '<a class="social tt" href="' + esc(META.settings.tiktok_url) + '" target="_blank" rel="noopener">' + ICON.tt + '<span><b>Kênh TikTok "' + esc(META.settings.tiktok_name) + '"</b><span>Xem toàn bộ video tình huống</span></span><span class="go">Mở kênh</span></a>';
    return "";
  }

  function viewMenu(m) {
    if (m.sections.length === 1) {
      const s0 = m.sections[0];
      app.innerHTML = head(m.key, m.title, esc(m.intro)) +
        '<div id="sec-posts-0"><p class="loading">Đang tải…</p></div>' +
        '<div class="section cta-band sun"><div><h3>Cha mẹ muốn trao đổi với nhà trường?</h3><p>Cha mẹ có thể nhắn tin cho Tổ Tư vấn Học đường, không cần tài khoản, hoặc đặt lịch gặp trực tiếp thầy cô tại Phòng Tư vấn.</p></div><div class="row"><a class="btn" href="#/nhan-tin/moi">Nhắn tin cho nhà trường</a><a class="btn ghost" href="#/dat-lich">Đặt lịch gặp</a></div></div>';
      fill("sec-posts-0", postsGrid(s0.cat, 50));
      return;
    }
    app.innerHTML = head(m.key, m.title, esc(m.intro)) +
      '<div class="menu-layout"><aside class="toc"><h2>Trong chuyên mục</h2><ul>' + m.sections.map(function (s) {
        return '<li><a href="#/' + m.key + "/" + s.id + '">' + esc(s.title.replace(/\s*\(.*\)$/, "")) + "</a></li>";
      }).join("") + '</ul><div class="toc-help"><span>Cần nói chuyện với thầy cô?</span><a class="btn small" href="#/nhan-tin/moi">Nhắn tin ngay</a></div></aside><div>' +
      m.sections.map(function (s, i) {
        return '<section class="section sub" id="sec-' + s.id + '"><div class="section-head"><h2>' + esc(s.title) + "</h2></div>" +
          '<p class="section-desc">' + esc(s.desc) + "</p>" +
          (s.widget ? '<div style="margin-bottom:18px">' + widgetHtml(s.widget) + "</div>" : "") +
          (s.cat ? '<div id="sec-posts-' + i + '"><p class="loading">Đang tải…</p></div>' : "") + "</section>";
      }).join("") + "</div></div>";
    bindBook();
    if (window.ChamBubbles) window.ChamBubbles.mount(document.getElementById("bubble-game"));
    m.sections.forEach(function (s, i) { if (s.cat) fill("sec-posts-" + i, postsGrid(s.cat, 50, s.widget ? "Thầy cô sẽ sớm cập nhật nội dung." : null)); });
  }

  // ------------------------------------------------------------ BÀI VIẾT
  async function viewPost(id) {
    app.innerHTML = '<p class="loading">Đang tải bài viết…</p>';
    let p;
    try { p = await DB.post(id); if (!p) throw new Error("Không tìm thấy bài viết."); }
    catch (e) { app.innerHTML = '<div class="article"><div class="notice danger">' + esc(e.message) + '</div><p><a href="#/">← Về trang chủ</a></p></div>'; return; }
    const m = catMenu(p.category);
    document.title = p.title + " – Chạm THPT Mộ Đức";
    if (m) renderNav(m.key);
    const crumbs = ['<a href="#/">Trang chủ</a>'];
    if (m && m.key !== "trang-chu") crumbs.push('<a href="#/' + m.key + '">' + esc(m.label) + "</a>");
    crumbs.push("<span>" + esc(catLabel(p.category)) + "</span>");
    app.innerHTML = '<header class="page-head article-head"><nav class="crumbs" aria-label="Đường dẫn">' + crumbs.join('<span class="sep">›</span>') + "</nav>" +
      "<h1>" + esc(p.title) + "</h1>" + (p.summary ? "<p>" + esc(p.summary) + "</p>" : "") +
      '<div class="byline">' + esc(p.author_name) + '<span class="sep">·</span>Đăng ngày ' + C.fmtDate(p.created_at) + (p.updated_at - p.created_at > 600 ? '<span class="sep">·</span>Cập nhật ' + C.fmtDate(p.updated_at) : "") + "</div></header>" +
      '<div class="article-layout"><article class="article">' +
        (p.cover ? '<img class="cover" src="' + esc(p.cover) + '" alt="">' : "") +
        C.videoEmbed(p.video_url) +
        '<div class="prose">' + C.md(p.body) + "</div>" +
      "</article>" +
      '<aside class="article-side"><div class="cta-band sun stack"><div><h3>Em có điều muốn hỏi thêm?</h3><p>Nhắn tin cho thầy cô, không cần tài khoản, có thể ẩn danh.</p></div><a class="btn" href="#/nhan-tin/moi">Nhắn thầy cô</a></div>' +
        '<div class="related"><h2>Cùng chuyên mục</h2><div id="related"><p class="loading">Đang tải…</p></div></div></aside></div>';
    fill("related", DB.posts({ category: p.category, limit: 6 }).then(function (posts) { const r = { posts: posts };
      const list = r.posts.filter(function (x) { return x.id !== p.id; }).slice(0, 5);
      if (!list.length) return '<p class="muted" style="font-size:14px">Chưa có bài khác.</p>';
      return '<ul class="related-list">' + list.map(function (x) { return '<li><a href="#/bai/' + x.id + '">' + esc(x.title) + "</a><span>" + C.fmtDate(x.created_at) + "</span></li>"; }).join("") + "</ul>";
    }));
  }

  // ------------------------------------------------------------ TÌM KIẾM
  async function viewSearch(q) {
    app.innerHTML = head("", q ? "Kết quả tìm kiếm" : "Tất cả bài viết", q ? "Từ khóa: <b>" + esc(q) + "</b>" : "Toàn bộ bài viết trên cổng thông tin, mới nhất trước.") +
      '<form class="search page-search" role="search" data-search><label class="sr-only" for="q-page">Tìm bài viết</label><input id="q-page" name="q" type="search" placeholder="Nhập từ khóa, ví dụ: bắt nạt, Pomodoro, phụ huynh…" value="' + esc(q) + '"><button class="btn small" type="submit">Tìm</button></form>' +
      '<div id="search-res" class="section"><p class="loading">Đang tìm…</p></div>';
    bindSearch();
    fill("search-res", DB.posts({ q: q }).then(function (posts) { const r = { posts: posts };
      if (!r.posts.length) return '<div class="empty">Không tìm thấy bài viết phù hợp. Em thử từ khóa khác, hoặc <a href="#/nhan-tin/moi">hỏi trực tiếp thầy cô</a>.</div>';
      return '<p class="muted" style="margin:0 0 14px">' + r.posts.length + ' bài viết</p><div class="posts">' + r.posts.map(postCard).join("") + "</div>";
    }));
  }
  function bindSearch() {
    document.querySelectorAll("form[data-search]").forEach(function (f) {
      if (f.dataset.bound) return;
      f.dataset.bound = "1";
      f.addEventListener("submit", function (ev) {
        ev.preventDefault();
        const q = f.querySelector("input").value.trim();
        location.hash = "#/tim-kiem" + (q ? "/" + encodeURIComponent(q) : "");
      });
    });
  }

  // ------------------------------------------------------------ 3.1 CẢNH BÁO XANH
  function viewReport() {
    app.innerHTML =
      head("phong-chong-bao-luc", "Hộp thư Cảnh báo Xanh", "Báo cáo bạo lực học đường, ẩn danh 100%. Em là nạn nhân hay người chứng kiến đều có thể báo tin. Thông tin chỉ được gửi đến Ban Giám hiệu và Tổ Tư vấn.", "Hộp thư Cảnh báo Xanh") +
      '<div class="form-wrap"><form class="card form" id="f" novalidate>' +
        '<div class="field"><span class="label">Em là</span>' + chips("role", ["Người bị bắt nạt", "Người chứng kiến", "Người thân / bạn của nạn nhân"], "radio") + "</div>" +
        '<div class="field"><span class="label">Hình thức <span class="hint">(chọn một hoặc nhiều)</span></span>' + chips("kind", ["Đánh nhau, xô đẩy", "Đe dọa", "Trấn lột", "Chửi bới, miệt thị, chê ngoại hình", "Cô lập, tẩy chay", "Bắt nạt trên mạng (bóc phốt, chế ảnh...)", "Khác"]) + "</div>" +
        '<div class="field"><span class="label">Mức độ</span>' + chips("urgency", ["Đang diễn ra / sắp xảy ra", "Đã xảy ra, kéo dài nhiều lần", "Đã xảy ra một lần"], "radio") + "</div>" +
        '<div class="grid-2"><div class="field"><label for="f-where">Ở đâu?</label><input class="input" id="f-where" maxlength="150" placeholder="VD: nhà xe, cổng sau, nhóm chat lớp..."></div>' +
        '<div class="field"><label for="f-when">Khi nào?</label><input class="input" id="f-when" maxlength="100" placeholder="VD: giờ ra chơi sáng thứ Ba"></div></div>' +
        '<div class="field"><label for="f-body">Chuyện gì đã xảy ra?</label><span class="hint">Kể những gì em biết: ai liên quan (có thể ghi lớp), đã xảy ra bao lâu, có ai bị thương không.</span><textarea class="input" id="f-body" maxlength="3000" required></textarea></div>' +
        identityFields(true) +
        '<div id="f-err" class="notice danger" hidden></div>' +
        '<div class="row"><button class="btn" type="submit" id="f-submit">Gửi báo cáo</button><span class="muted" style="font-size:14px">Thầy cô sẽ hồi âm tại mục Nhắn tin.</span></div>' +
      "</form>" +
      '<aside class="side-note"><div class="card stack"><h3>Nếu đang có nguy hiểm</h3><p class="muted" style="margin:0;font-size:14px">Hãy rời đến nơi đông người và báo ngay cho thầy cô, bảo vệ gần nhất, hoặc gọi:</p>' + hotlinesHtml() + "</div>" +
      '<div class="card"><h3>Thầy cô xử lý báo cáo thế nào?</h3><ul><li>Báo cáo được đánh dấu <b>KHẨN</b> và đưa lên đầu hộp thư của Tổ Tư vấn và Ban Giám hiệu.</li><li>Nhà trường xác minh và can thiệp trực tiếp (giám thị, GVCN, gặp các bên liên quan), không chỉ trả lời bằng lời khuyên.</li><li>Thầy cô có thể nhắn hỏi thêm chi tiết. Em xem và trả lời trong <a href="#/nhan-tin">Hộp thư của em</a>.</li><li>Báo cáo <b>không bao giờ</b> được đăng công khai.</li></ul></div>' +
      '<div class="card"><h3>Danh tính của em được bảo vệ</h3><ul><li>Không cần đăng nhập, không lưu tên nếu em chọn ẩn danh.</li><li>Chỉ thầy cô Tổ Tư vấn đọc được báo cáo.</li><li>Nhà trường nghiêm cấm mọi hành vi trả thù người báo tin.</li></ul></div></aside></div>';
    bindIdentity();
    document.getElementById("f").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const err = document.getElementById("f-err"); err.hidden = true;
      const body = document.getElementById("f-body").value.trim();
      const kinds = checkedValues("kind");
      if (!body) { err.textContent = "Em hãy kể ngắn gọn chuyện gì đã xảy ra."; err.hidden = false; return; }
      const lines = [
        "[CẢNH BÁO XANH]",
        "Người báo: " + (checkedValues("role")[0] || "Không nêu"),
        "Hình thức: " + (kinds.join(", ") || "Không nêu"),
        "Mức độ: " + (checkedValues("urgency")[0] || "Không nêu"),
        "Địa điểm: " + (document.getElementById("f-where").value.trim() || "Không nêu"),
        "Thời gian: " + (document.getElementById("f-when").value.trim() || "Không nêu"),
        "",
        body,
      ];
      const btn = document.getElementById("f-submit"); busy(btn, true);
      try {
        const id = await createConversation(Object.assign({ topic: "bao-luc", body: lines.join("\n") }, identityValues()));
        sessionStorage.setItem("cham_new", "1");
        location.hash = "#/nhan-tin/" + id;
      } catch (e) { err.textContent = e.message; err.hidden = false; busy(btn, false); }
    });
  }

  // ------------------------------------------------------------ 6.1 ĐẶT LỊCH
  function viewBooking() {
    const s = META.settings;
    const today = new Date(); const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    app.innerHTML =
      head("tu-van", "Đặt lịch hẹn tư vấn 1-1", "Chọn gặp trực tiếp tại Phòng Tư vấn hoặc trò chuyện trực tuyến bảo mật. Thầy cô sẽ xác nhận lịch qua tin nhắn.", "Đặt lịch tư vấn") +
      '<div class="form-wrap"><form class="card form" id="f" novalidate>' +
        '<div class="field"><span class="label">Hình thức</span>' + chips("mode", ["Gặp trực tiếp tại Phòng Tư vấn", "Trực tuyến qua tin nhắn bảo mật"], "radio") + "</div>" +
        '<div class="field"><span class="label">Em muốn trao đổi về</span>' + chips("issue", ["Học tập, thi cử", "Cảm xúc, căng thẳng", "Bạn bè, mâu thuẫn", "Gia đình", "Tình cảm tuổi học trò", "Hướng nghiệp", "Khác"]) + "</div>" +
        '<div class="grid-2"><div class="field"><label for="f-date">Ngày mong muốn</label><input class="input" type="date" id="f-date" min="' + iso + '"></div>' +
        '<div class="field"><label for="f-slot">Khung giờ</label><select class="input" id="f-slot"><option value="">Chọn khung giờ</option><option>Giờ ra chơi buổi sáng</option><option>Giờ ra chơi buổi chiều</option><option>Sau giờ học (16h30 – 17h30)</option><option>Buổi tối (trực tuyến)</option></select></div></div>' +
        '<div class="field"><label for="f-body">Mô tả ngắn <span class="hint">(không bắt buộc)</span></label><textarea class="input" id="f-body" maxlength="2000" placeholder="Em có thể kể trước một chút để thầy cô chuẩn bị."></textarea></div>' +
        identityFields(false) +
        '<div id="f-err" class="notice danger" hidden></div>' +
        '<div class="row"><button class="btn" type="submit" id="f-submit">Gửi yêu cầu đặt lịch</button></div>' +
      "</form>" +
      '<aside class="side-note"><div class="card stack"><h3>Phòng Tư vấn</h3><p style="margin:0">' + esc(s.counsel_room) + '</p><p class="muted" style="margin:0;font-size:14px">Lịch trực: ' + esc(s.counsel_hours) + "</p>" +
      (s.school_phone ? '<p style="margin:0">Điện thoại: <b>' + esc(s.school_phone) + "</b></p>" : "") + "</div>" +
      '<div class="card"><h3>Gợi ý</h3><ul><li>Nếu muốn gặp trực tiếp, em nên ghi họ tên và lớp để thầy cô dễ xác nhận.</li><li>Nếu chọn trực tuyến, em có thể giữ ẩn danh.</li></ul></div></aside></div>';
    bindIdentity();
    document.getElementById("f").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const err = document.getElementById("f-err"); err.hidden = true;
      const mode = checkedValues("mode")[0];
      if (!mode) { err.textContent = "Em chọn hình thức tư vấn giúp thầy cô nhé."; err.hidden = false; return; }
      const d = document.getElementById("f-date").value;
      const lines = [
        "[ĐẶT LỊCH TƯ VẤN]",
        "Hình thức: " + mode,
        "Vấn đề: " + (checkedValues("issue").join(", ") || "Không nêu"),
        "Ngày mong muốn: " + (d ? d.split("-").reverse().join("/") : "Linh hoạt"),
        "Khung giờ: " + (document.getElementById("f-slot").value || "Linh hoạt"),
      ];
      const note = document.getElementById("f-body").value.trim();
      if (note) lines.push("", note);
      const btn = document.getElementById("f-submit"); busy(btn, true);
      try {
        const id = await createConversation(Object.assign({ topic: "dat-lich", body: lines.join("\n") }, identityValues()));
        sessionStorage.setItem("cham_new", "1");
        location.hash = "#/nhan-tin/" + id;
      } catch (e) { err.textContent = e.message; err.hidden = false; busy(btn, false); }
    });
  }

  // ------------------------------------------------------------ 6.2 TRẠM LẮNG NGHE
  function viewConfide() {
    app.innerHTML =
      head("tu-van", "Trạm Lắng Nghe", "Áp lực điểm số, chuyện gia đình, tình cảm tuổi học trò... Viết ra để nhẹ lòng hơn. Thầy cô Ban cố vấn sẽ đọc và hồi âm riêng cho em.", "Trạm Lắng Nghe") +
      '<div class="form-wrap"><form class="card form" id="f" novalidate>' +
        '<div class="field"><span class="label">Lúc này em thấy</span>' + chips("mood", ["Buồn", "Lo lắng", "Áp lực", "Cô đơn", "Tức giận", "Rối bời", "Chỉ muốn được nghe"]) + "</div>" +
        '<div class="field"><label for="f-body">Em muốn chia sẻ điều gì?</label><textarea class="input" id="f-body" maxlength="4000" style="min-height:200px" placeholder="Viết như em đang kể cho một người bạn tin tưởng..."></textarea></div>' +
        '<div class="field"><label class="switch"><input type="checkbox" id="f-publish"><span>Em đồng ý để thầy cô <b>viết lại ẩn danh</b> tâm sự này kèm lời khuyên, đăng lên chuyên mục giải đáp và Fanpage "Trạm Chạm" để giúp các bạn khác.</span></label></div>' +
        identityFields(true) +
        '<div id="f-err" class="notice danger" hidden></div>' +
        '<div class="row"><button class="btn" type="submit" id="f-submit">Gửi đến Trạm Lắng Nghe</button></div>' +
      "</form>" +
      '<aside class="side-note"><div class="card"><h3>Thầy cô trả lời tâm sự thế nào?</h3><ul><li>Thầy cô Ban cố vấn đọc, <b>hồi âm riêng</b> cho em bằng lời khuyên và sự động viên, thường trong 1–2 ngày học.</li><li>Em xem và trò chuyện tiếp trong <a href="#/nhan-tin">Hộp thư của em</a>.</li><li>Chỉ khi em đồng ý, tâm sự mới được viết lại ẩn danh và đăng ở mục Giải đáp để giúp các bạn khác.</li><li>Nếu em đang bị bắt nạt hoặc gặp nguy hiểm, hãy dùng <a href="#/bao-cao">Cảnh báo Xanh</a> để nhà trường can thiệp ngay.</li></ul></div>' +
      '<div class="card stack"><h3>Nếu em đang nghĩ đến việc làm hại bản thân</h3><p class="muted" style="margin:0;font-size:14px">Hãy nói ngay với một người lớn em tin tưởng hoặc gọi:</p>' + hotlinesHtml() + "</div></aside></div>";
    bindIdentity();
    document.getElementById("f").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const err = document.getElementById("f-err"); err.hidden = true;
      const body = document.getElementById("f-body").value.trim();
      if (!body) { err.textContent = "Em hãy viết vài dòng điều em muốn chia sẻ nhé."; err.hidden = false; return; }
      const moods = checkedValues("mood");
      const lines = ["[TRẠM LẮNG NGHE]"];
      if (moods.length) lines.push("Cảm xúc: " + moods.join(", "));
      lines.push("Đồng ý đăng ẩn danh: " + (document.getElementById("f-publish").checked ? "Có" : "Không"), "", body);
      const btn = document.getElementById("f-submit"); busy(btn, true);
      try {
        const id = await createConversation(Object.assign({ topic: "tam-su", body: lines.join("\n") }, identityValues()));
        sessionStorage.setItem("cham_new", "1");
        location.hash = "#/nhan-tin/" + id;
      } catch (e) { err.textContent = e.message; err.hidden = false; busy(btn, false); }
    });
  }

  // ------------------------------------------------------------ NHẮN TIN
  async function viewChat(sub) {
    const code = getCode();
    app.innerHTML = head("tu-van", "Hộp thư của em", "Mọi tin em gửi cho thầy cô (báo cáo Cảnh báo Xanh, tâm sự, đặt lịch, câu hỏi khác) và câu trả lời đều nằm ở đây. Không cần tài khoản, không cần mật khẩu.", "Hộp thư của em") +
      '<div class="chat-layout"><aside class="stack" id="chat-side"></aside><section id="chat-main"></section></div>';
    const side = document.getElementById("chat-side");
    if (code) {
      side.innerHTML = codeBox(code) +
        '<a class="btn" href="#/nhan-tin/moi">+ Gửi tin mới</a><ul class="conv-list" id="conv-list"><li><p class="loading" style="padding:12px 16px">Đang tải…</p></li></ul>' +
        '<details class="card" style="padding:14px 16px"><summary style="cursor:pointer;font-weight:600">Dùng mã tra cứu khác</summary>' + restoreForm() + "</details>";
      bindCopy();
    } else {
      side.innerHTML = '<div class="card stack"><h3 style="font-size:16px">Đã có mã tra cứu?</h3><p class="muted" style="margin:0;font-size:14px">Nhập mã để xem lại các cuộc trò chuyện từ máy khác.</p>' + restoreForm() + "</div>" +
        '<div class="card stack"><h3 style="font-size:16px">Cần giúp ngay?</h3>' + hotlinesHtml() + "</div>";
    }
    bindRestore();
    let convs = [];
    if (code) {
      try { convs = await DB.threads(code); }
      catch (e) {
        if (!(await DB.codeExists(code).catch(function () { return code; }))) { C.store("cham_code", null); route(); return; }
      }
      renderConvList(convs, sub);
    }
    if (sub && sub !== "moi") return viewThread(sub);
    if (!sub && convs.length) { location.replace("#/nhan-tin/" + convs[0].id); return; }
    renderNewForm();
  }

  function restoreForm() {
    return '<form id="restore" class="row" style="margin-top:10px" novalidate><input class="input" id="restore-code" placeholder="CHAM-XXXXX-XXXXX" autocomplete="off" style="flex:1;min-width:0;text-transform:uppercase"><button class="btn small" type="submit">Mở</button></form><div id="restore-err" class="notice danger" style="margin-top:8px" hidden></div>';
  }
  function bindRestore() {
    const f = document.getElementById("restore");
    if (!f) return;
    f.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const err = document.getElementById("restore-err"); err.hidden = true;
      try {
        const found = await DB.codeExists(document.getElementById("restore-code").value);
        if (!found) throw new Error("Không tìm thấy mã tra cứu này. Em kiểm tra lại giúp nhé.");
        C.store("cham_code", found);
        C.toast("Đã mở mã tra cứu.");
        if (location.hash === "#/nhan-tin") route(); else location.hash = "#/nhan-tin";
      } catch (e) { err.textContent = e.message; err.hidden = false; }
    });
  }
  function renderConvList(convs, activeId) {
    const ul = document.getElementById("conv-list");
    if (!ul) return;
    if (!convs.length) { ul.innerHTML = '<li><p class="muted" style="padding:12px 16px;margin:0;font-size:14px">Chưa có cuộc trò chuyện nào.</p></li>'; return; }
    ul.innerHTML = convs.map(function (c) {
      const last = c.last ? (c.last.sender === "teacher" ? "Thầy cô: " : "Em: ") + c.last.body : "";
      return '<li><a href="#/nhan-tin/' + c.id + '"' + (String(c.id) === String(activeId) ? ' class="active"' : "") + '><span class="t"><span>' + esc(topicLabel(c.topic)) + "</span>" +
        (c.student_unread ? '<span class="badge">' + c.student_unread + "</span>" : '<span class="muted" style="font-weight:400;font-size:12px">' + C.ago(c.updated_at) + "</span>") + '</span><span class="p">' + esc(last) + "</span></a></li>";
    }).join("");
  }

  function renderNewForm() {
    const main = document.getElementById("chat-main");
    const topics = META.topics;
    main.innerHTML = '<div class="stack"><div class="card stack"><h2 style="font-size:19px">Em muốn gửi gì cho thầy cô?</h2>' +
      '<p class="muted" style="margin:0">Chọn đúng loại tin để thầy cô xử lý nhanh và phù hợp nhất. Tất cả đều có thể gửi ẩn danh và nhận trả lời tại Hộp thư này.</p>' +
      '<div class="pick">' +
        '<a class="pick-card danger" href="#/bao-cao"><b>Cảnh báo Xanh</b><span>Em bị bắt nạt, hoặc thấy bạn bị đánh, đe dọa, trấn lột, cô lập, bắt nạt trên mạng.</span><em>Được đánh dấu KHẨN, nhà trường can thiệp</em></a>' +
        '<a class="pick-card" href="#/tam-su"><b>Trạm Lắng Nghe</b><span>Em có chuyện buồn, áp lực điểm số, chuyện gia đình, tình cảm, muốn được lắng nghe.</span><em>Thầy cô hồi âm, khuyên riêng cho em</em></a>' +
        '<a class="pick-card" href="#/dat-lich"><b>Đặt lịch tư vấn</b><span>Em muốn gặp trực tiếp thầy cô hoặc trò chuyện trực tuyến vào một giờ hẹn.</span><em>Thầy cô xác nhận giờ hẹn</em></a>' +
      "</div></div>" +
      '<form class="card form" id="f" novalidate><h2 style="font-size:19px">Hỏi thầy cô điều khác</h2>' +
      '<p class="muted" style="margin:0">Câu hỏi về học tập, hướng nghiệp, nội quy, hoạt động của trường…</p>' +
      '<div class="field"><label for="f-topic">Chủ đề</label><select class="input" id="f-topic">' +
      ["hoc-tap", "khac"].map(function (k) { return '<option value="' + k + '">' + esc(topics[k] || k) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label for="f-body">Nội dung</label><textarea class="input" id="f-body" maxlength="4000" placeholder="Em muốn hỏi thầy cô điều gì?"></textarea></div>' +
      identityFields(true) +
      '<div id="f-err" class="notice danger" hidden></div>' +
      '<div class="row"><button class="btn" type="submit" id="f-submit">Gửi câu hỏi</button></div></form></div>';
    bindIdentity();
    document.getElementById("f").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const err = document.getElementById("f-err"); err.hidden = true;
      const body = document.getElementById("f-body").value.trim();
      if (!body) { err.textContent = "Em hãy nhập nội dung câu hỏi."; err.hidden = false; return; }
      const btn = document.getElementById("f-submit"); busy(btn, true);
      try {
        const id = await createConversation(Object.assign({ topic: document.getElementById("f-topic").value, body: body }, identityValues()));
        sessionStorage.setItem("cham_new", "1");
        location.hash = "#/nhan-tin/" + id;
      } catch (e) { err.textContent = e.message; err.hidden = false; busy(btn, false); }
    });
  }

  function msgHtml(m) {
    if (m.sender === "system") return '<div class="msg sys"><div class="bubble">' + esc(m.body) + "</div></div>";
    const me = m.sender === "student";
    return '<div class="msg ' + (me ? "me" : "them") + '"><span class="who">' + (me ? "Em" : esc(m.teacher_name || "Thầy cô")) + " · " + C.fmtTime(m.created_at) + '</span><div class="bubble">' + esc(m.body) + "</div></div>";
  }

  const AUTO_REPLY = {
    "bao-luc": "Thầy cô sẽ nhận được báo cáo của em. Danh tính của em được giữ kín. Nếu em hoặc bạn đang gặp nguy hiểm ngay lúc này, hãy báo ngay cho thầy cô gần nhất hoặc gọi 111 (Tổng đài quốc gia bảo vệ trẻ em) / 113.",
    "dat-lich": "Thầy cô sẽ xác nhận thời gian hẹn với em ngay tại đây.",
  };
  function viewThread(id) {
    const main = document.getElementById("chat-main");
    const code = getCode();
    main.innerHTML = '<p class="loading">Đang tải…</p>';
    const isNew = sessionStorage.getItem("cham_new") === "1";
    sessionStorage.removeItem("cham_new");
    let built = false, shown = 0;
    unwatch = DB.watchThread(code, id, function (data) {
      const c = data.thread;
      if (!built) {
        built = true;
        main.innerHTML = (isNew ? '<div class="notice ok" style="margin-bottom:14px"><b>Đã gửi.</b> Trên máy này em chỉ cần mở lại mục <b>Hộp thư của em</b> để xem câu trả lời. Muốn xem trên máy khác, hãy lưu mã tra cứu <b>' + esc(code) + "</b>.</div>" : "") +
          '<div class="thread"><div class="thread-head"><div><h2>' + esc(topicLabel(c.topic)) + '</h2><span class="muted" style="font-size:13px">' +
          (c.anonymous ? "Gửi ẩn danh" : "Người gửi: " + esc(c.display_name || "—")) + (c.class_name ? " · Lớp " + esc(c.class_name) : "") + "</span></div>" +
          '<span class="status-pill" id="th-status"></span></div>' +
          '<div class="msgs" id="msgs" aria-live="polite"></div><div id="th-closed"></div>' +
          '<form class="composer" id="composer"><label class="sr-only" for="reply">Tin nhắn</label><textarea class="input" id="reply" rows="2" maxlength="4000" placeholder="Nhập tin nhắn… (Ctrl + Enter để gửi)"></textarea><button class="btn" id="send" type="submit">Gửi</button></form></div>';
        bindComposer();
      }
      const st = document.getElementById("th-status");
      st.className = "status-pill" + (c.status === "closed" ? " closed" : "");
      st.textContent = c.status === "closed" ? "Đã kết thúc" : "Đang trao đổi";
      document.getElementById("th-closed").innerHTML = c.status === "closed" ? '<div class="msg sys" style="margin:0 auto 12px"><div class="bubble">Thầy cô đã kết thúc cuộc trò chuyện này. Em vẫn có thể nhắn tiếp nếu cần.</div></div>' : "";
      const box = document.getElementById("msgs");
      const msgs = data.messages;
      if (msgs.length !== shown) {
        let html = "";
        msgs.forEach(function (m, i) {
          html += msgHtml(m);
          if (i === 0) html += '<div class="msg sys"><div class="bubble">' + esc(AUTO_REPLY[c.topic] || "Thầy cô sẽ trả lời em tại đây sớm nhất có thể.") + "</div></div>";
        });
        box.innerHTML = html;
        box.scrollTop = box.scrollHeight;
        shown = msgs.length;
      }
      if (c.student_unread) { DB.studentRead(code, id).then(refreshBadge); }
    }, function (e) {
      main.innerHTML = '<div class="notice danger">' + esc(e.message || "Không tải được cuộc trò chuyện.") + "</div>";
    });

    function bindComposer() {
      const form = document.getElementById("composer"), ta = document.getElementById("reply");
      ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); form.requestSubmit(); } });
      form.addEventListener("submit", async function (ev) {
        ev.preventDefault();
        const body = ta.value.trim();
        if (!body) return;
        const btn = document.getElementById("send"); busy(btn, true, "…");
        try { await DB.studentSend(code, id, body); ta.value = ""; }
        catch (e) { C.toast(e.message); }
        busy(btn, false); ta.focus();
      });
    }
  }

  // ------------------------------------------------------------ TRẮC NGHIỆM (dùng chung)
  function quizForm(items, options, name) {
    return '<div class="progress"><div class="bar"><i id="qbar"></i></div><span id="qcount" class="muted" style="font-size:14px;font-variant-numeric:tabular-nums">0/' + items.length + "</span></div>" +
      '<form class="quiz" id="quiz">' + items.map(function (it, i) {
        return '<fieldset class="q" id="q' + i + '" style="margin:0"><legend class="q-title" style="padding:0"><span class="n">' + (i + 1) + ".</span><span>" + esc(it[0]) + "</span></legend>" +
          '<div class="chips">' + options.map(function (o) {
            return '<label class="chip"><input type="radio" name="' + name + i + '" value="' + o[0] + '"><span>' + esc(o[1]) + "</span></label>";
          }).join("") + "</div></fieldset>";
      }).join("") +
      '<div id="q-err" class="notice warn" hidden></div><div class="row"><button class="btn" type="submit">Xem kết quả</button></div></form>' +
      '<div id="q-result" class="section" hidden></div>';
  }
  function bindQuiz(items, name, onDone) {
    const form = document.getElementById("quiz");
    function count() {
      let n = 0;
      items.forEach(function (_, i) {
        const on = !!form.querySelector('input[name="' + name + i + '"]:checked');
        document.getElementById("q" + i).classList.toggle("done", on);
        if (on) n++;
      });
      document.getElementById("qbar").style.width = (100 * n / items.length) + "%";
      document.getElementById("qcount").textContent = n + "/" + items.length;
      return n;
    }
    form.addEventListener("change", count);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const err = document.getElementById("q-err");
      const answers = items.map(function (_, i) {
        const x = form.querySelector('input[name="' + name + i + '"]:checked');
        return x ? parseInt(x.value, 10) : null;
      });
      const miss = answers.indexOf(null);
      if (miss >= 0) {
        err.textContent = "Em còn " + answers.filter(function (a) { return a === null; }).length + " câu chưa trả lời (bắt đầu từ câu " + (miss + 1) + ").";
        err.hidden = false;
        document.getElementById("q" + miss).scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      err.hidden = true;
      const res = document.getElementById("q-result");
      res.hidden = false;
      onDone(answers, res);
      res.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function viewDass() {
    app.innerHTML = head("tu-van", "Tự kiểm tra sức khỏe tinh thần (DASS-21)", "Đọc từng câu và chọn mức độ phù hợp nhất với em <b>trong tuần vừa qua</b>. Không có câu trả lời đúng hay sai. Kết quả chỉ hiển thị trên máy của em.", "Thang đo DASS-21") +
      '<div class="notice warn" style="margin-bottom:16px">DASS-21 là công cụ sàng lọc, <b>không phải chẩn đoán</b>. Kết quả giúp em hiểu mình hơn và biết khi nào nên tìm sự hỗ trợ.</div>' +
      quizForm(Q.dass.items, Q.dass.options, "d");
    bindQuiz(Q.dass.items, "d", function (answers, el) {
      const r = Q.dass.score(answers);
      const maxLv = Math.max(r.D.level, r.A.level, r.S.level);
      let advice;
      if (maxLv >= 3 || r.flag) advice = '<div class="notice danger"><b>Em đang mang nhiều căng thẳng hơn mức bình thường.</b> Em không cần tự mình chịu đựng. Hãy nói chuyện với thầy cô Tổ Tư vấn sớm nhất có thể. Nếu em có ý nghĩ làm hại bản thân, hãy nói ngay với một người lớn em tin tưởng hoặc gọi 111.</div>';
      else if (maxLv === 2) advice = '<div class="notice warn"><b>Một số dấu hiệu ở mức vừa.</b> Em nên trò chuyện với thầy cô hoặc người thân để được hỗ trợ, đồng thời chú ý giấc ngủ, vận động và nghỉ ngơi.</div>';
      else if (maxLv === 1) advice = '<div class="notice warn">Có vài dấu hiệu ở mức nhẹ. Hãy dành thời gian nghỉ ngơi, chia sẻ với bạn bè, người thân. Thầy cô luôn sẵn sàng nếu em muốn trò chuyện.</div>';
      else advice = '<div class="notice ok">Các chỉ số đều ở mức bình thường. Hãy tiếp tục giữ thói quen tốt: ngủ đủ, vận động, chia sẻ với người em tin tưởng.</div>';
      el.innerHTML = '<div class="card stack"><h2 style="font-size:22px">Kết quả của em</h2><div class="result-rows">' +
        ["S", "A", "D"].map(function (k) {
          const x = r[k];
          return '<div class="result-row"><b>' + x.name + ' <span class="muted" style="font-weight:400;font-variant-numeric:tabular-nums">' + x.score + "/42</span></b>" +
            '<div class="bar lv-' + x.level + '"><i style="width:' + Math.round(100 * x.score / 42) + '%"></i></div><span class="lv lv-' + x.level + '">' + x.label + "</span></div>";
        }).join("") + "</div>" + advice +
        '<div class="row"><button class="btn" id="send-dass" type="button">Gửi kết quả cho thầy cô</button><a class="btn ghost" href="#/dat-lich">Đặt lịch tư vấn</a><a class="btn ghost" href="#/nhan-tin/moi">Nhắn tin cho thầy cô</a></div>' +
        '<p class="muted" style="margin:0;font-size:13px">Ngưỡng phân loại theo Lovibond &amp; Lovibond (1995); điểm mỗi thang = tổng 7 câu × 2.</p></div>';
      document.getElementById("send-dass").addEventListener("click", async function () {
        const btn = this; busy(btn, true);
        const body = ["[KẾT QUẢ DASS-21 – em tự nguyện gửi]",
          "Stress: " + r.S.score + "/42 (" + r.S.label + ")",
          "Lo âu: " + r.A.score + "/42 (" + r.A.label + ")",
          "Trầm cảm: " + r.D.score + "/42 (" + r.D.label + ")",
          r.flag ? "Lưu ý: em chọn mức cao ở câu về cảm giác vô giá trị / cuộc sống vô nghĩa." : "",
          "", "Em mong được thầy cô hỗ trợ."].filter(function (x, i, a) { return x !== "" || (i > 0 && a[i - 1] !== ""); }).join("\n");
        try {
          const id = await createConversation({ topic: "suc-khoe-tinh-than", body: body, anonymous: true, urgent: maxLv >= 3 || r.flag });
          sessionStorage.setItem("cham_new", "1");
          location.hash = "#/nhan-tin/" + id;
        } catch (e) { C.toast(e.message); busy(btn, false); }
      });
    });
  }

  function viewHolland() {
    app.innerHTML = head("hoc-tap-huong-nghiep", "Trắc nghiệm sở thích nghề nghiệp Holland", "Theo lý thuyết của nhà tâm lý học John Holland, mỗi người có thiên hướng thuộc 6 nhóm: Kỹ thuật, Nghiên cứu, Nghệ thuật, Xã hội, Quản lý, Nghiệp vụ. Em cho biết mức độ thích với từng hoạt động dưới đây.", "Trắc nghiệm Holland") +
      quizForm(Q.holland.items, Q.holland.options, "h");
    bindQuiz(Q.holland.items, "h", function (answers, el) {
      const r = Q.holland.score(answers), T = Q.holland.types;
      el.innerHTML = '<div class="card stack"><span class="eyebrow">Mã Holland của em</span><div class="holland-code">' + r.code + "</div>" +
        "<p style='margin:0'>" + r.order.slice(0, 3).map(function (k) { return "<b>" + k + "</b> – " + esc(T[k].name); }).join(" · ") + "</p>" +
        '<div class="result-rows">' + r.order.map(function (k) {
          return '<div class="result-row"><b>' + k + " · " + esc(T[k].name.split(" (")[0]) + '</b><div class="bar"><i style="width:' + Math.round(100 * r.scores[k] / r.max) + '%"></i></div><span class="muted" style="font-variant-numeric:tabular-nums">' + r.scores[k] + "/" + r.max + "</span></div>";
        }).join("") + "</div></div>" +
        '<div class="type-cards section">' + r.order.slice(0, 3).map(function (k) {
          return '<div class="card stack"><span class="eyebrow">' + k + "</span><h3>" + esc(T[k].name) + '</h3><p style="margin:0">' + esc(T[k].desc) + '</p><p style="margin:0;font-size:14px"><b>Nghề gợi ý:</b> ' + esc(T[k].jobs) + '</p><p style="margin:0;font-size:14px"><b>Môn học nên chú trọng:</b> ' + esc(T[k].subjects) + "</p></div>";
        }).join("") + "</div>" +
        '<div class="section cta-band sun"><div><h3>Muốn trao đổi kỹ hơn về hướng đi?</h3><p>Kết quả trắc nghiệm chỉ là gợi ý. Thầy cô có thể cùng em xem xét thêm học lực, hoàn cảnh và mong muốn của gia đình.</p></div><a class="btn" href="#/dat-lich">Đặt lịch tư vấn hướng nghiệp</a></div>';
    });
  }

  function viewMI() {
    app.innerHTML = head("hoc-tap-huong-nghiep", "Trắc nghiệm Đa trí tuệ", "Theo thuyết Đa trí tuệ của Howard Gardner, mỗi người có 8 dạng trí thông minh với mức độ khác nhau. Biết thế mạnh giúp em chọn cách học hiệu quả và tổ hợp môn phù hợp.", "Trắc nghiệm Đa trí tuệ") +
      quizForm(Q.mi.items, Q.mi.options, "m");
    bindQuiz(Q.mi.items, "m", function (answers, el) {
      const r = Q.mi.score(answers), T = Q.mi.types;
      el.innerHTML = '<div class="card stack"><h2 style="font-size:22px">Hồ sơ trí tuệ của em</h2><div class="result-rows">' + r.order.map(function (k) {
        return '<div class="result-row"><b>' + esc(T[k].name) + '</b><div class="bar"><i style="width:' + Math.round(100 * r.scores[k] / r.max) + '%"></i></div><span class="muted" style="font-variant-numeric:tabular-nums">' + r.scores[k] + "/" + r.max + "</span></div>";
      }).join("") + "</div></div>" +
        '<div class="type-cards section">' + r.order.slice(0, 3).map(function (k, i) {
          return '<div class="card stack"><span class="eyebrow">' + ["Thế mạnh nổi bật nhất", "Thế mạnh thứ hai", "Thế mạnh thứ ba"][i] + "</span><h3>" + esc(T[k].name) + '</h3><p style="margin:0"><b>Cách học phù hợp:</b> ' + esc(T[k].tip) + "</p></div>";
        }).join("") + "</div>" +
        '<p class="section"><a class="btn ghost" href="#/holland">Làm tiếp trắc nghiệm Holland →</a></p>';
    });
  }

  // ------------------------------------------------------------ định tuyến
  function route() {
    routeToken++;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (unwatch) { try { unwatch(); } catch (e) { /* trống */ } unwatch = null; }
    navEl.classList.remove("open"); toggle.setAttribute("aria-expanded", "false");
    const parts = (location.hash || "#/").replace(/^#\/?/, "").split("/").filter(Boolean);
    const p0 = parts[0] || "trang-chu";
    document.title = "Chạm – Tư vấn học đường THPT Mộ Đức";
    const menu = MENUS.find(function (m) { return m.key === p0; });
    renderNav(menu ? menu.key : ROUTE_MENU[p0] || "");
    window.scrollTo(0, 0);
    if (p0 === "trang-chu") viewHome();
    else if (menu) {
      viewMenu(menu);
      if (parts[1]) {
        const el = document.getElementById("sec-" + parts[1]);
        if (el) setTimeout(function () { el.scrollIntoView({ block: "start" }); }, 30);
      }
    }
    else if (p0 === "bai" && parts[1]) viewPost(parts[1]);
    else if (p0 === "tim-kiem") viewSearch(parts[1] ? decodeURIComponent(parts.slice(1).join("/")) : "");
    else if (p0 === "bao-cao") viewReport();
    else if (p0 === "dat-lich") viewBooking();
    else if (p0 === "tam-su") viewConfide();
    else if (p0 === "nhan-tin") viewChat(parts[1]);
    else if (p0 === "dass21") viewDass();
    else if (p0 === "holland") viewHolland();
    else if (p0 === "da-tri-tue") viewMI();
    else app.innerHTML = '<div class="empty">Không tìm thấy trang. <a href="#/">Về trang chủ</a></div>';
  }

  async function boot() {
    try { await DB.init(); META.settings = await DB.settings(); }
    catch (e) { app.innerHTML = '<div class="notice danger">' + esc(e.message) + "</div>"; return; }
    if (DB.mode === "demo") {
      const bar = document.createElement("div");
      bar.className = "demo-bar";
      bar.innerHTML = "<b>Chế độ thử nghiệm:</b> website chưa kết nối Firebase nên bài viết và tin nhắn chỉ lưu trên trình duyệt của máy này. Xem file HUONG_DAN.md để kết nối.";
      document.body.insertBefore(bar, document.body.firstChild);
    }
    const fr = document.getElementById("foot-room");
    if (fr) fr.textContent = META.settings.counsel_room + " · " + META.settings.counsel_hours;
    window.addEventListener("hashchange", route);
    bindSearch();
    const td = document.getElementById("today");
    if (td) td.textContent = "Trường THPT Mộ Đức · " + new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
    route();
    refreshBadge();
  }
  boot();
})();
