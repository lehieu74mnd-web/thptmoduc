/* Khu vực giáo viên: đăng nhập, hộp thư, bài viết, cài đặt, tài khoản */
(function () {
  "use strict";
  const C = window.Cham, esc = C.esc, DB = window.ChamStore, META = window.CHAM_META;
  const main = document.getElementById("t-main");
  let ME = null;
  let cleanups = [];
  let inboxUnsub = null, inboxList = [];
  const inbox = { filter: "all", active: null };

  function cleanup() { cleanups.forEach(function (f) { try { f(); } catch (e) { /* trống */ } }); cleanups = []; }
  function busy(btn, on, text) {
    btn.disabled = on;
    if (on) { btn.dataset.t = btn.textContent; btn.textContent = text || "Đang lưu…"; }
    else if (btn.dataset.t) btn.textContent = btn.dataset.t;
  }
  function key(t) { return t.code + "/" + t.id; }
  function topicLabel(t) { return META.topics[t] || t; }

  // ------------------------------------------------------------ đăng nhập
  if (DB.mode === "demo") {
    const n = document.getElementById("demo-note");
    n.hidden = false;
    n.innerHTML = "<b>Chế độ thử nghiệm</b> (chưa kết nối Firebase). Đăng nhập bằng email <b>" + esc(DB.demoLogin.email) + "</b>, mật khẩu <b>" + esc(DB.demoLogin.password) + "</b>.";
  }
  function showLogin(msg) {
    cleanup();
    if (inboxUnsub) { inboxUnsub(); inboxUnsub = null; }
    ME = null;
    document.getElementById("app-view").hidden = true;
    document.getElementById("login-view").hidden = false;
    const err = document.getElementById("l-err");
    if (msg) { err.textContent = msg; err.hidden = false; }
  }
  document.getElementById("login-form").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    const err = document.getElementById("l-err"); err.hidden = true;
    const btn = document.getElementById("l-submit"); busy(btn, true, "Đang đăng nhập…");
    try {
      await DB.login(document.getElementById("l-user").value, document.getElementById("l-pass").value);
      document.getElementById("l-pass").value = "";
    } catch (e) { err.textContent = e.message; err.hidden = false; }
    busy(btn, false);
  });
  document.getElementById("forgot").addEventListener("click", async function () {
    const err = document.getElementById("l-err");
    const email = document.getElementById("l-user").value.trim();
    if (!email) { err.textContent = "Nhập email của thầy cô vào ô Email trước, rồi bấm Quên mật khẩu."; err.hidden = false; return; }
    try { await DB.resetPassword(email); err.hidden = true; C.toast("Đã gửi email đặt lại mật khẩu. Thầy cô kiểm tra hộp thư nhé."); }
    catch (e) { err.textContent = e.message; err.hidden = false; }
  });
  document.getElementById("logout").addEventListener("click", function () { DB.logout(); });

  DB.onAuth(function (me, msg) {
    if (!me) { showLogin(msg); return; }
    ME = me;
    document.getElementById("login-view").hidden = true;
    document.getElementById("app-view").hidden = false;
    document.getElementById("who").textContent = ME.name + (ME.role === "admin" ? " (quản trị)" : "");
    document.getElementById("tab-settings").hidden = ME.role !== "admin";
    document.getElementById("must-change").hidden = !ME.must_change;
    startInboxWatch();
    if (ME.must_change && location.hash !== "#tai-khoan") location.hash = "#tai-khoan";
    else route();
  });

  // Theo dõi hộp thư liên tục để cập nhật số tin chưa đọc
  function startInboxWatch() {
    if (inboxUnsub) return;
    inboxUnsub = DB.watchInbox(function (list) {
      inboxList = list;
      const n = list.filter(function (t) { return t.teacher_unread > 0; }).length;
      const b = document.getElementById("tab-badge");
      b.textContent = n; b.hidden = !n;
      document.title = (n ? "(" + n + ") " : "") + "Khu vực giáo viên – Chạm THPT Mộ Đức";
      if (document.getElementById("t-conv")) renderList();
    }, function (e) { C.toast(e.message); });
  }

  // ------------------------------------------------------------ định tuyến
  function route() {
    if (!ME) return;
    cleanup();
    let tab = (location.hash || "#hop-thu").slice(1).split("/")[0] || "hop-thu";
    if (ME.must_change) tab = "tai-khoan";
    if (tab === "cai-dat" && ME.role !== "admin") tab = "hop-thu";
    document.querySelectorAll("#tabs a").forEach(function (a) {
      if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    const sub = (location.hash || "").slice(1).split("/")[1];
    if (tab === "hop-thu") viewInbox();
    else if (tab === "bai-viet") { if (sub) viewEditor(sub === "moi" ? null : sub); else viewPosts(); }
    else if (tab === "cai-dat") viewSettings();
    else viewAccount();
  }
  window.addEventListener("hashchange", route);

  // ------------------------------------------------------------ HỘP THƯ
  const FILTERS = [["all", "Đang mở"], ["urgent", "Khẩn cấp"], ["unread", "Chưa đọc"], ["closed", "Đã kết thúc"]];
  const QUICK = [
    "Thầy cô đã đọc tin nhắn của em. Cảm ơn em đã tin tưởng chia sẻ.",
    "Em có thể đến Phòng Tư vấn vào giờ ra chơi để thầy cô trò chuyện trực tiếp nhé.",
    "Thầy cô xác nhận lịch hẹn của em vào: ",
    "Nhà trường đã tiếp nhận và đang xác minh. Danh tính của em được giữ kín tuyệt đối.",
    "Em hãy nhắn thêm cho thầy cô bất cứ khi nào em cần nhé.",
  ];

  function viewInbox() {
    main.innerHTML = '<div class="t-head"><h1>Hộp thư học sinh</h1><span class="muted" style="font-size:14px">Tin nhắn mới hiện ngay, không cần tải lại trang</span></div>' +
      '<div class="inbox"><div><div class="filters" id="filters"></div><ul class="conv-list t-conv" id="t-conv"><li><p class="loading" style="padding:12px 16px">Đang tải…</p></li></ul></div>' +
      '<section id="t-thread"><div class="empty">Chọn một cuộc trò chuyện để đọc và trả lời.</div></section></div>';
    renderList();
    if (inbox.active) {
      const t = inboxList.find(function (x) { return key(x) === inbox.active; });
      if (t) openThread(t.code, t.id);
    }
  }

  function renderList() {
    const open = inboxList.filter(function (t) { return t.status !== "closed"; });
    const counts = {
      all: open.length,
      urgent: open.filter(function (t) { return t.urgent; }).length,
      unread: inboxList.filter(function (t) { return t.teacher_unread > 0; }).length,
      closed: inboxList.length - open.length,
    };
    const fEl = document.getElementById("filters");
    if (!fEl) return;
    fEl.innerHTML = FILTERS.map(function (f) {
      return '<button type="button" data-f="' + f[0] + '" aria-pressed="' + (inbox.filter === f[0]) + '">' + f[1] + ' <span class="cnt">' + counts[f[0]] + "</span></button>";
    }).join("");
    fEl.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { inbox.filter = b.dataset.f; renderList(); }); });

    let list = inboxList.slice();
    if (inbox.filter === "urgent") list = open.filter(function (t) { return t.urgent; });
    else if (inbox.filter === "unread") list = list.filter(function (t) { return t.teacher_unread > 0; });
    else if (inbox.filter === "closed") list = list.filter(function (t) { return t.status === "closed"; });
    else list = open;
    list.sort(function (a, b) { return (b.urgent - a.urgent) || (b.updated_at - a.updated_at); });

    const ul = document.getElementById("t-conv");
    if (!list.length) { ul.innerHTML = '<li><p class="muted" style="padding:14px 16px;margin:0">Không có cuộc trò chuyện nào.</p></li>'; return; }
    ul.innerHTML = list.map(function (c) {
      const who = c.anonymous ? "Ẩn danh" : (c.display_name || "Không tên");
      const last = c.last ? (c.last.sender === "teacher" ? "Thầy cô: " : "HS: ") + c.last.body : "";
      const cls = [c.urgent ? "urgent" : "", c.teacher_unread ? "unread" : "", key(c) === inbox.active ? "active" : ""].join(" ");
      return '<li><a href="#hop-thu" data-k="' + esc(key(c)) + '" class="' + cls + '"><span class="t"><span>' + esc(topicLabel(c.topic)) + "</span>" +
        (c.teacher_unread ? '<span class="badge">' + c.teacher_unread + "</span>" : '<span class="muted" style="font-weight:400;font-size:12px">' + C.ago(c.updated_at) + "</span>") +
        '</span><span class="sub">' + esc(who) + (c.class_name ? " · " + esc(c.class_name) : "") + (c.urgent ? ' · <b style="color:var(--danger)">KHẨN</b>' : "") + '</span><span class="p">' + esc(last) + "</span></a></li>";
    }).join("");
    ul.querySelectorAll("a[data-k]").forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); const p = a.dataset.k.split("/"); openThread(p[0], p[1]); });
    });
  }

  let threadUnsub = null;
  function openThread(code, id) {
    inbox.active = code + "/" + id;
    if (threadUnsub) { threadUnsub(); threadUnsub = null; }
    renderList();
    const box = document.getElementById("t-thread");
    box.innerHTML = '<p class="loading">Đang tải…</p>';
    let built = false, shown = 0, cur = null;
    threadUnsub = DB.watchThread(code, id, function (data) {
      const c = data.thread; cur = c;
      if (!built) { built = true; build(c); }
      updateHead(c);
      const msgs = document.getElementById("t-msgs");
      if (data.messages.length !== shown) {
        msgs.innerHTML = data.messages.map(function (m) {
          const mine = m.sender === "teacher";
          return '<div class="msg ' + (mine ? "me" : "them") + '"><span class="who">' + (mine ? esc(m.teacher_name || "Thầy cô") : "Học sinh") + " · " + C.fmtTime(m.created_at) + '</span><div class="bubble">' + esc(m.body) + "</div></div>";
        }).join("");
        msgs.scrollTop = msgs.scrollHeight;
        shown = data.messages.length;
      }
      if (c.teacher_unread) DB.teacherRead(code, id);
    }, function (e) { box.innerHTML = '<div class="notice danger">' + esc(e.message || "Không tải được cuộc trò chuyện.") + "</div>"; });
    cleanups.push(function () { if (threadUnsub) { threadUnsub(); threadUnsub = null; } });

    function build(c) {
      box.innerHTML = '<div class="thread t-thread"><div class="thread-head"><div><h2>' + esc(topicLabel(c.topic)) + '</h2><span class="muted" style="font-size:13px">' +
        (c.anonymous ? "Học sinh ẩn danh" : esc(c.display_name || "Không tên")) + (c.class_name ? " · Lớp " + esc(c.class_name) : "") +
        " · Mã " + esc(code.slice(0, 10)) + "… · Bắt đầu " + C.fmtTime(c.created_at) + "</span></div>" +
        '<div class="row"><button class="btn small" id="th-urgent" type="button"></button><button class="btn small ghost" id="th-status" type="button"></button>' +
        (ME.role === "admin" ? '<span id="th-del-wrap"><button class="btn small ghost" id="th-del" type="button">Xóa</button></span>' : "") + "</div></div>" +
        '<div class="msgs" id="t-msgs" aria-live="polite"></div>' +
        '<div class="quick-replies" id="quick">' + QUICK.map(function (q, i) { return '<button type="button" data-i="' + i + '">' + esc(q.length > 42 ? q.slice(0, 40) + "…" : q) + "</button>"; }).join("") + "</div>" +
        '<form class="composer" id="t-composer"><label class="sr-only" for="t-reply">Trả lời</label><textarea class="input" id="t-reply" rows="3" maxlength="6000" placeholder="Nhập câu trả lời cho học sinh… (Ctrl + Enter để gửi)"></textarea><button class="btn" type="submit" id="t-send">Gửi</button></form></div>';
      const ta = document.getElementById("t-reply"), form = document.getElementById("t-composer");
      document.getElementById("quick").addEventListener("click", function (ev) {
        const b = ev.target.closest("button"); if (!b) return;
        ta.value = (ta.value ? ta.value + "\n" : "") + QUICK[Number(b.dataset.i)];
        ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
      });
      ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); form.requestSubmit(); } });
      form.addEventListener("submit", async function (ev) {
        ev.preventDefault();
        const body = ta.value.trim(); if (!body) return;
        const btn = document.getElementById("t-send"); busy(btn, true, "…");
        try { await DB.teacherSend(code, id, body, ME.name); ta.value = ""; } catch (e) { C.toast(e.message); }
        busy(btn, false); ta.focus();
      });
      document.getElementById("th-urgent").addEventListener("click", function () {
        DB.setState(code, id, { urgent: !cur.urgent }).catch(function (e) { C.toast(e.message); });
      });
      document.getElementById("th-status").addEventListener("click", function () {
        const closing = cur.status !== "closed";
        DB.setState(code, id, { status: closing ? "closed" : "open" }).then(function () {
          C.toast(closing ? "Đã kết thúc cuộc trò chuyện." : "Đã mở lại cuộc trò chuyện.");
        }, function (e) { C.toast(e.message); });
      });
      const del = document.getElementById("th-del");
      if (del) del.addEventListener("click", function () {
        const w = document.getElementById("th-del-wrap");
        w.innerHTML = '<span class="confirm-inline">Xóa vĩnh viễn? <button class="btn small danger" type="button" id="th-del-yes">Xóa</button><button class="btn small ghost" type="button" id="th-del-no">Hủy</button></span>';
        document.getElementById("th-del-no").onclick = function () { w.innerHTML = '<button class="btn small ghost" id="th-del" type="button">Xóa</button>'; openThread(code, id); };
        document.getElementById("th-del-yes").onclick = async function () {
          if (threadUnsub) { threadUnsub(); threadUnsub = null; }
          try {
            await DB.deleteThread(code, id);
            inbox.active = null;
            document.getElementById("t-thread").innerHTML = '<div class="empty">Đã xóa cuộc trò chuyện.</div>';
          } catch (e) { C.toast(e.message); }
        };
      });
    }
    function updateHead(c) {
      const u = document.getElementById("th-urgent"), s = document.getElementById("th-status");
      if (!u) return;
      u.className = "btn small " + (c.urgent ? "danger" : "ghost");
      u.textContent = c.urgent ? "Đang đánh dấu khẩn" : "Đánh dấu khẩn";
      s.textContent = c.status === "closed" ? "Mở lại" : "Kết thúc";
    }
  }

  // ------------------------------------------------------------ BÀI VIẾT
  const MENU_NAMES = { "trang-chu": "Trang chủ", "gioi-thieu": "Giới thiệu & Nội quy", "phong-chong-bao-luc": "Phòng, chống bạo lực học đường",
    "tu-van": "Phòng Tư vấn Học đường", "ky-nang-song": "Đạo đức – Kỹ năng sống", "hoc-tap-huong-nghiep": "Học tập & Hướng nghiệp", "gia-dinh": "Phối hợp Nhà trường – Gia đình" };
  function catOptions(selected, withAll) {
    const groups = {};
    META.categories.forEach(function (c) { (groups[c.menu] = groups[c.menu] || []).push(c); });
    return (withAll ? '<option value="">Tất cả chuyên mục</option>' : '<option value="">— Chọn chuyên mục —</option>') +
      Object.keys(MENU_NAMES).map(function (m) {
        return '<optgroup label="' + esc(MENU_NAMES[m]) + '">' + (groups[m] || []).map(function (c) {
          return '<option value="' + c.key + '"' + (c.key === selected ? " selected" : "") + ">" + esc(c.label) + "</option>";
        }).join("") + "</optgroup>";
      }).join("");
  }
  function catLabel(k) { const c = META.categories.find(function (x) { return x.key === k; }); return c ? c.label : k; }

  let postFilter = "";
  async function viewPosts() {
    main.innerHTML = '<div class="t-head"><h1>Bài viết</h1><div class="row"><select class="input" id="p-filter" style="width:auto;max-width:100%">' + catOptions(postFilter, true) + '</select><a class="btn" href="#bai-viet/moi">+ Viết bài mới</a></div></div>' +
      '<div id="p-list"><p class="loading">Đang tải…</p></div>';
    document.getElementById("p-filter").addEventListener("change", function () { postFilter = this.value; viewPosts(); });
    let posts;
    try { posts = await DB.allPosts(); }
    catch (e) { document.getElementById("p-list").innerHTML = '<div class="notice danger">' + esc(e.message) + "</div>"; return; }
    const el = document.getElementById("p-list");
    if (!el) return;
    if (!posts.length && ME.role === "admin" && DB.mode === "firebase") {
      el.innerHTML = '<div class="empty stack" style="align-items:center"><span>Website chưa có bài viết nào.</span><span>Thầy cô có thể nạp sẵn khoảng 25 bài viết mẫu được soạn theo hồ sơ dự án, rồi chỉnh sửa lại.</span><button class="btn" id="seed" type="button">Nạp bài viết mẫu</button></div>';
      document.getElementById("seed").addEventListener("click", async function () {
        busy(this, true, "Đang nạp…");
        try { const n = await DB.seed(); C.toast("Đã nạp " + n + " bài viết mẫu."); viewPosts(); } catch (e) { C.toast(e.message); busy(this, false); }
      });
      return;
    }
    const list = postFilter ? posts.filter(function (p) { return p.category === postFilter; }) : posts;
    if (!list.length) { el.innerHTML = '<div class="empty">Chưa có bài viết trong chuyên mục này. <a href="#bai-viet/moi">Viết bài đầu tiên</a></div>'; return; }
    el.innerHTML = '<div class="table-wrap"><table class="t-table"><thead><tr><th>Tiêu đề</th><th>Chuyên mục</th><th>Trạng thái</th><th>Người đăng</th><th>Ngày</th><th>Lượt xem</th></tr></thead><tbody>' +
      list.map(function (p) {
        return '<tr><td><a class="title" href="#bai-viet/' + esc(p.id) + '">' + esc(p.title) + "</a></td><td>" + esc(catLabel(p.category)) + "</td>" +
          "<td>" + (p.published ? '<span class="pill on">Đã đăng</span>' : '<span class="pill draft">Bản nháp</span>') + (p.pinned ? ' <span class="pill">Ghim</span>' : "") + "</td>" +
          "<td>" + esc(p.author_name) + '</td><td class="num">' + C.fmtDate(p.created_at) + '</td><td class="num">' + (p.views || 0) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  // Thu nhỏ ảnh ngay trên máy để lưu kèm bài viết (không cần dịch vụ lưu trữ ảnh riêng)
  function shrinkImage(file, maxW, quality) {
    return new Promise(function (res, rej) {
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) { rej(new Error("Chỉ nhận ảnh PNG, JPG, WEBP hoặc GIF.")); return; }
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        const scale = Math.min(1, maxW / img.naturalWidth);
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.naturalWidth * scale); cv.height = Math.round(img.naturalHeight * scale);
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        res(cv.toDataURL("image/jpeg", quality));
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("Không đọc được ảnh.")); };
      img.src = url;
    });
  }

  async function viewEditor(id) {
    let p = { category: postFilter || "", title: "", summary: "", body: "", cover: "", video_url: "", pinned: false, published: true };
    if (id) {
      main.innerHTML = '<p class="loading">Đang tải…</p>';
      try { p = await DB.getPost(id); if (!p) throw new Error("Không tìm thấy bài viết."); }
      catch (e) { main.innerHTML = '<div class="notice danger">' + esc(e.message) + "</div>"; return; }
    }
    main.innerHTML = '<div class="t-head"><div><a href="#bai-viet" class="muted" style="font-size:14px">← Danh sách bài viết</a><h1>' + (id ? "Sửa bài viết" : "Viết bài mới") + "</h1></div>" +
      (id ? '<div class="row"><a class="btn small ghost" href="index.html#/bai/' + esc(id) + '" target="_blank" rel="noopener">Xem trên website</a></div>' : "") + "</div>" +
      '<form class="editor" id="ed" novalidate><div class="card form">' +
        '<div class="field"><label for="e-title">Tiêu đề</label><input class="input" id="e-title" maxlength="200" value="' + esc(p.title) + '"></div>' +
        '<div class="field"><label for="e-summary">Tóm tắt <span class="hint">(hiện ở danh sách bài, 1–2 câu)</span></label><textarea class="input" id="e-summary" maxlength="500" style="min-height:70px">' + esc(p.summary) + "</textarea></div>" +
        '<div class="field"><div class="row" style="justify-content:space-between"><span class="label">Nội dung</span><div class="seg" role="group"><button type="button" id="m-write" aria-pressed="true">Soạn</button><button type="button" id="m-prev" aria-pressed="false">Xem trước</button></div></div>' +
          '<div id="write-pane"><div class="toolbar" id="tb">' +
            '<button type="button" data-a="h2" title="Tiêu đề mục">Tiêu đề</button><button type="button" data-a="b" title="Chữ đậm"><b>B</b></button><button type="button" data-a="i" title="Chữ nghiêng"><i>I</i></button><span class="sep"></span>' +
            '<button type="button" data-a="ul">• Danh sách</button><button type="button" data-a="ol">Danh sách đánh số</button><button type="button" data-a="q">Khung nhấn mạnh</button><span class="sep"></span>' +
            '<button type="button" data-a="link">Liên kết</button><button type="button" data-a="img">Chèn ảnh</button></div>' +
            '<textarea class="input" id="e-body">' + esc(p.body) + "</textarea>" +
            '<p class="help">Dòng trống để tách đoạn. <code>## </code> tiêu đề mục · <code>- </code> gạch đầu dòng · <code>**chữ đậm**</code> · <code>&gt; </code> khung nhấn mạnh. Ảnh chèn vào được thu nhỏ tự động; mỗi bài nên dùng tối đa khoảng 4–5 ảnh.</p></div>' +
          '<div id="prev-pane" class="preview-pane prose" hidden></div></div>' +
      "</div>" +
      '<aside class="stack"><div class="card form">' +
        '<div class="field"><label for="e-cat">Chuyên mục</label><select class="input" id="e-cat">' + catOptions(p.category) + "</select></div>" +
        '<label class="switch"><input type="checkbox" id="e-pub"' + (p.published ? " checked" : "") + '><span><b>Đăng công khai</b><br><span class="hint">Bỏ chọn để lưu bản nháp.</span></span></label>' +
        '<label class="switch"><input type="checkbox" id="e-pin"' + (p.pinned ? " checked" : "") + '><span><b>Ghim lên đầu</b></span></label>' +
        '<div class="field"><span class="label">Ảnh bìa</span><div class="cover-preview" id="cover-prev">' + (p.cover ? '<img src="' + esc(p.cover) + '" alt="">' : "Chưa có ảnh") + "</div>" +
          '<div class="row"><label class="btn small ghost" style="cursor:pointer">Chọn ảnh<input type="file" id="cover-file" accept="image/png,image/jpeg,image/webp,image/gif" hidden></label><button type="button" class="btn small ghost" id="cover-del"' + (p.cover ? "" : " hidden") + ">Bỏ ảnh</button></div></div>" +
        '<div class="field"><label for="e-video">Đường dẫn video <span class="hint">(TikTok, YouTube, Facebook)</span></label><input class="input" id="e-video" maxlength="500" placeholder="https://www.tiktok.com/@.../video/..." value="' + esc(p.video_url) + '"></div>' +
        '<div id="e-err" class="notice danger" hidden></div>' +
        '<div class="row"><button class="btn" type="submit" id="e-save">' + (id ? "Lưu thay đổi" : "Đăng bài") + "</button>" +
        (id ? '<span id="e-del-wrap"><button type="button" class="btn ghost" id="e-del">Xóa bài</button></span>' : "") + "</div>" +
      "</div></aside></form>" +
      '<input type="file" id="img-file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>';

    let cover = p.cover || "";
    const body = document.getElementById("e-body");
    const mw = document.getElementById("m-write"), mp = document.getElementById("m-prev");
    mw.onclick = function () { mw.setAttribute("aria-pressed", "true"); mp.setAttribute("aria-pressed", "false"); document.getElementById("write-pane").hidden = false; document.getElementById("prev-pane").hidden = true; };
    mp.onclick = function () {
      mp.setAttribute("aria-pressed", "true"); mw.setAttribute("aria-pressed", "false");
      const pane = document.getElementById("prev-pane");
      pane.innerHTML = C.videoEmbed(document.getElementById("e-video").value.trim()) + C.md(body.value);
      pane.hidden = false; document.getElementById("write-pane").hidden = true;
    };
    function wrapSel(before, after, placeholder) {
      const s = body.selectionStart, e = body.selectionEnd;
      body.setRangeText(before + (body.value.slice(s, e) || placeholder) + after, s, e, "end");
      body.focus();
    }
    function prefixLines(prefix, numbered) {
      const s = body.value.lastIndexOf("\n", body.selectionStart - 1) + 1;
      let e = body.value.indexOf("\n", body.selectionEnd); if (e < 0) e = body.value.length;
      const out = body.value.slice(s, e).split("\n").map(function (l, i) { return (numbered ? (i + 1) + ". " : prefix) + l.replace(/^(#{2,3}\s|[-*]\s|\d+[.)]\s|>\s?)/, ""); }).join("\n");
      body.setRangeText(out, s, e, "end"); body.focus();
    }
    document.getElementById("tb").addEventListener("click", function (ev) {
      const b = ev.target.closest("button"); if (!b) return;
      const a = b.dataset.a;
      if (a === "b") wrapSel("**", "**", "chữ đậm");
      else if (a === "i") wrapSel("*", "*", "chữ nghiêng");
      else if (a === "h2") prefixLines("## ");
      else if (a === "ul") prefixLines("- ");
      else if (a === "ol") prefixLines("", true);
      else if (a === "q") prefixLines("> ");
      else if (a === "link") wrapSel("[", "](https://)", "chữ hiển thị");
      else if (a === "img") document.getElementById("img-file").click();
    });
    document.getElementById("img-file").addEventListener("change", async function () {
      const f = this.files[0]; this.value = ""; if (!f) return;
      try { const url = await shrinkImage(f, 1000, 0.72); const pos = body.selectionStart; body.setRangeText("\n![Ảnh minh họa](" + url + ")\n", pos, pos, "end"); C.toast("Đã chèn ảnh."); }
      catch (e) { C.toast(e.message); }
    });
    document.getElementById("cover-file").addEventListener("change", async function () {
      const f = this.files[0]; this.value = ""; if (!f) return;
      try { cover = await shrinkImage(f, 1200, 0.75); document.getElementById("cover-prev").innerHTML = '<img src="' + cover + '" alt="">'; document.getElementById("cover-del").hidden = false; }
      catch (e) { C.toast(e.message); }
    });
    document.getElementById("cover-del").addEventListener("click", function () {
      cover = ""; document.getElementById("cover-prev").textContent = "Chưa có ảnh"; this.hidden = true;
    });
    document.getElementById("ed").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const err = document.getElementById("e-err"); err.hidden = true;
      const data = {
        title: document.getElementById("e-title").value, summary: document.getElementById("e-summary").value, body: body.value,
        category: document.getElementById("e-cat").value, cover: cover, video_url: document.getElementById("e-video").value.trim(),
        pinned: document.getElementById("e-pin").checked, published: document.getElementById("e-pub").checked,
      };
      const btn = document.getElementById("e-save"); busy(btn, true);
      try {
        const newId = await DB.savePost(id, data, ME);
        C.toast(id ? "Đã lưu bài viết." : (data.published ? "Đã đăng bài." : "Đã lưu bản nháp."));
        if (!id) location.hash = "#bai-viet/" + newId; else busy(btn, false);
      } catch (e) { err.textContent = e.message; err.hidden = false; busy(btn, false); }
    });
    const del = document.getElementById("e-del");
    if (del) del.addEventListener("click", function () {
      const w = document.getElementById("e-del-wrap");
      w.innerHTML = '<span class="confirm-inline">Xóa bài này? <button class="btn small danger" type="button" id="e-del-yes">Xóa</button><button class="btn small ghost" type="button" id="e-del-no">Hủy</button></span>';
      document.getElementById("e-del-no").onclick = function () { viewEditor(id); };
      document.getElementById("e-del-yes").onclick = async function () {
        try { await DB.deletePost(id); C.toast("Đã xóa bài viết."); location.hash = "#bai-viet"; } catch (e) { C.toast(e.message); }
      };
    });
  }

  // ------------------------------------------------------------ CÀI ĐẶT TRANG
  async function viewSettings() {
    main.innerHTML = '<div class="t-head"><h1>Cài đặt trang</h1></div><p class="loading">Đang tải…</p>';
    const s = await DB.settings();
    const F = [
      ["facebook_name", "Tên Fanpage Facebook"], ["facebook_url", "Đường dẫn Fanpage Facebook"],
      ["tiktok_name", "Tên kênh TikTok"], ["tiktok_url", "Đường dẫn kênh TikTok"],
      ["counsel_room", "Phòng Tư vấn (địa điểm)"], ["counsel_hours", "Lịch trực Phòng Tư vấn"],
      ["school_phone", "Số điện thoại liên hệ của trường (không bắt buộc)"],
    ];
    main.innerHTML = '<div class="t-head"><h1>Cài đặt trang</h1></div><form class="card form" id="sf" style="max-width:720px" novalidate>' +
      F.map(function (f) { return '<div class="field"><label for="s-' + f[0] + '">' + esc(f[1]) + '</label><input class="input" id="s-' + f[0] + '" maxlength="300" value="' + esc(s[f[0]] || "") + '"></div>'; }).join("") +
      '<div class="field"><label for="s-book">Câu hỏi cho mục "Lật trang"</label><span class="hint">Mỗi dòng một câu hỏi, viết theo dạng <b>Chủ đề | Câu hỏi</b>. Mỗi lần học sinh bấm "Lật trang", website chọn ngẫu nhiên một dòng.</span>' +
      '<textarea class="input" id="s-book" style="min-height:320px" maxlength="30000">' + esc(String(s.book_questions || "").trim() || (META.bookQuestions || []).map(function (q) { return q[0] + " | " + q[1]; }).join("\n")) + "</textarea></div>" +
      '<div id="s-err" class="notice danger" hidden></div><div class="row"><button class="btn" type="submit" id="s-save">Lưu cài đặt</button></div></form>';
    document.getElementById("sf").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const err = document.getElementById("s-err"); err.hidden = true;
      const payload = {};
      for (const f of F) {
        const v = document.getElementById("s-" + f[0]).value.trim();
        if (/_url$/.test(f[0]) && v && v.indexOf("https://") !== 0) { err.textContent = "Đường dẫn phải bắt đầu bằng https://"; err.hidden = false; return; }
        payload[f[0]] = v;
      }
      payload.book_questions = document.getElementById("s-book").value.trim();
      const btn = document.getElementById("s-save"); busy(btn, true);
      try { await DB.saveSettings(payload); C.toast("Đã lưu cài đặt."); } catch (e) { err.textContent = e.message; err.hidden = false; }
      busy(btn, false);
    });
  }

  // ------------------------------------------------------------ TÀI KHOẢN
  function viewAccount() {
    main.innerHTML = '<div class="t-head"><h1>Tài khoản</h1></div><div class="stack" style="max-width:860px">' +
      '<form class="card form" id="pw" novalidate><h2 style="font-size:19px">Đổi mật khẩu</h2><p class="muted" style="margin:0">Đang đăng nhập: <b>' + esc(ME.email) + "</b></p>" +
        (ME.must_change ? '<div class="notice warn">Thầy cô đang dùng mật khẩu tạm do quản trị viên cấp. Hãy đặt mật khẩu mới (ít nhất 8 ký tự).</div>' : "") +
        '<div class="grid-2"><div class="field"><label for="pw-old">Mật khẩu hiện tại</label><input class="input" type="password" id="pw-old" autocomplete="current-password"></div>' +
        '<div class="field"><label for="pw-new">Mật khẩu mới</label><input class="input" type="password" id="pw-new" autocomplete="new-password" minlength="8"></div></div>' +
        '<div id="pw-err" class="notice danger" hidden></div><div class="row"><button class="btn" type="submit" id="pw-save">Đổi mật khẩu</button></div></form>' +
      (ME.role === "admin" ? '<section class="card stack"><h2 style="font-size:19px">Tài khoản giáo viên</h2><div id="t-list"><p class="loading">Đang tải…</p></div>' +
        '<form class="form" id="add" novalidate style="border-top:1px solid var(--line);padding-top:16px"><h3 style="font-size:16px">Thêm giáo viên</h3>' +
        '<div class="grid-2"><div class="field"><label for="a-name">Họ tên</label><input class="input" id="a-name" maxlength="80" placeholder="VD: Cô Nguyễn Thị Hoa"></div>' +
        '<div class="field"><label for="a-email">Email đăng nhập</label><input class="input" id="a-email" type="email" maxlength="120" placeholder="VD: hoa.nt@gmail.com" autocapitalize="off"></div></div>' +
        '<label class="switch"><input type="checkbox" id="a-admin"><span>Cấp quyền quản trị (thêm tài khoản, sửa cài đặt trang, xóa tin nhắn)</span></label>' +
        '<div id="a-err" class="notice danger" hidden></div><div id="a-ok" hidden></div><div class="row"><button class="btn" type="submit" id="a-save">Tạo tài khoản</button></div></form></section>' : "") +
      "</div>";

    document.getElementById("pw").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const err = document.getElementById("pw-err"); err.hidden = true;
      const btn = document.getElementById("pw-save"); busy(btn, true);
      try {
        await DB.changePassword(document.getElementById("pw-old").value, document.getElementById("pw-new").value);
        C.toast("Đã đổi mật khẩu.");
        const was = ME.must_change;
        ME.must_change = false; document.getElementById("must-change").hidden = true;
        document.getElementById("pw-old").value = ""; document.getElementById("pw-new").value = "";
        if (was) { location.hash = "#hop-thu"; return; }
      } catch (e) { err.textContent = e.message; err.hidden = false; }
      busy(btn, false);
    });
    if (ME.role !== "admin") return;

    async function loadTeachers() {
      const list = await DB.teachers();
      const el = document.getElementById("t-list");
      if (!el) return;
      if (!list.length) { el.innerHTML = '<p class="muted" style="margin:0">Chưa có giáo viên nào khác. Thêm tài khoản ở bên dưới.</p>'; return; }
      el.innerHTML = '<div class="table-wrap"><table class="t-table"><thead><tr><th>Họ tên</th><th>Email</th><th>Quyền</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
        list.map(function (t) {
          const self = t.email === ME.email;
          return "<tr><td>" + esc(t.name) + (self ? ' <span class="pill">Bạn</span>' : "") + "</td><td>" + esc(t.email) + "</td><td>" + (t.role === "admin" ? "Quản trị" : "Giáo viên") + "</td>" +
            "<td>" + (t.active !== false ? '<span class="pill on">Hoạt động</span>' : '<span class="pill">Đã khóa</span>') + "</td>" +
            '<td style="white-space:nowrap">' + (self ? "" : (DB.mode === "firebase" ? '<button class="btn small ghost" data-reset="' + esc(t.email) + '" type="button">Gửi email đặt lại mật khẩu</button> ' : "") +
              '<button class="btn small ghost" data-active="' + esc(t.email) + '" data-v="' + (t.active !== false ? 0 : 1) + '" type="button">' + (t.active !== false ? "Khóa" : "Mở khóa") + "</button>") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
      el.querySelectorAll("[data-reset]").forEach(function (b) {
        b.addEventListener("click", async function () {
          try { await DB.resetPassword(b.dataset.reset); C.toast("Đã gửi email đặt lại mật khẩu tới " + b.dataset.reset); } catch (e) { C.toast(e.message); }
        });
      });
      el.querySelectorAll("[data-active]").forEach(function (b) {
        b.addEventListener("click", async function () {
          try { await DB.setTeacherActive(b.dataset.active, b.dataset.v === "1"); loadTeachers(); } catch (e) { C.toast(e.message); }
        });
      });
    }
    loadTeachers().catch(function (e) { const el = document.getElementById("t-list"); if (el) el.innerHTML = '<div class="notice danger">' + esc(e.message) + "</div>"; });

    document.getElementById("add").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const err = document.getElementById("a-err"); err.hidden = true;
      const ok = document.getElementById("a-ok"); ok.hidden = true;
      const btn = document.getElementById("a-save"); busy(btn, true);
      try {
        const r = await DB.addTeacher({ name: document.getElementById("a-name").value, email: document.getElementById("a-email").value, role: document.getElementById("a-admin").checked ? "admin" : "teacher" });
        document.getElementById("a-name").value = ""; document.getElementById("a-email").value = ""; document.getElementById("a-admin").checked = false;
        ok.hidden = false;
        ok.innerHTML = r.password
          ? '<div class="notice ok stack"><b>Đã tạo tài khoản</b><span>Email: <b>' + esc(r.email) + '</b></span><span>Mật khẩu tạm:</span><span class="pw-show">' + esc(r.password) + "</span><span>Hãy gửi mật khẩu này cho thầy cô. Họ sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu. Mật khẩu chỉ hiển thị một lần.</span></div>"
          : '<div class="notice ok"><b>Đã cấp quyền giáo viên cho ' + esc(r.email) + ".</b> Email này đã có tài khoản từ trước; thầy cô dùng mật khẩu cũ, hoặc bấm “Gửi email đặt lại mật khẩu”.</div>";
        loadTeachers();
      } catch (e) { err.textContent = e.message; err.hidden = false; }
      busy(btn, false);
    });
  }
})();
