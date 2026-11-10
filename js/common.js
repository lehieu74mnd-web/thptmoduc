/* Tiện ích dùng chung cho trang học sinh và trang giáo viên */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  async function api(path, opts) {
    opts = opts || {};
    const headers = Object.assign({ "X-Requested-With": "cham" }, opts.headers || {});
    let body = opts.body;
    if (body && typeof body !== "string") {
      body = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }
    let res;
    try {
      res = await fetch(path, { method: opts.method || "GET", headers, body, credentials: "same-origin" });
    } catch (e) {
      const err = new Error("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
      err.status = 0;
      throw err;
    }
    let data = {};
    try { data = await res.json(); } catch (e) { /* trống */ }
    if (!res.ok) {
      const err = new Error(data.error || "Có lỗi xảy ra (" + res.status + ").");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // Định dạng nội dung đơn giản -> HTML an toàn (luôn thoát ký tự trước)
  function inline(s) {
    s = esc(s);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, "$1<em>$2</em>");
    s = s.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+|\/[^)\s]*|#[^)\s]*)\)/g, function (_, t, u) {
      const ext = u.indexOf("https://") === 0;
      return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + t + "</a>";
    });
    return s;
  }

  function md(text) {
    const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      let m;
      if ((m = line.match(/^(#{2,3})\s+(.*)$/))) {
        const lv = m[1].length;
        out.push("<h" + lv + ">" + inline(m[2]) + "</h" + lv + ">");
        i++; continue;
      }
      if ((m = line.match(/^!\[([^\]]*)\]\((data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+|https:\/\/[^)\s]+)\)\s*$/))) {
        out.push('<p><img src="' + esc(m[2]) + '" alt="' + esc(m[1]) + '" loading="lazy"></p>');
        i++; continue;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push("<li>" + inline(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>"); i++; }
        out.push("<ul>" + items.join("") + "</ul>"); continue;
      }
      if (/^\s*\d+[.)]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push("<li>" + inline(lines[i].replace(/^\s*\d+[.)]\s+/, "")) + "</li>"); i++; }
        out.push("<ol>" + items.join("") + "</ol>"); continue;
      }
      if (/^>\s?/.test(line)) {
        const q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(inline(lines[i].replace(/^>\s?/, ""))); i++; }
        out.push("<blockquote>" + q.join("<br>") + "</blockquote>"); continue;
      }
      const para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|\s*[-*]\s+|\s*\d+[.)]\s+|>\s?|!\[)/.test(lines[i])) { para.push(inline(lines[i])); i++; }
      if (para.length) out.push("<p>" + para.join("<br>") + "</p>");
      else { out.push("<p>" + inline(line) + "</p>"); i++; }
    }
    return out.join("\n");
  }

  function fmtDate(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function fmtTime(ts) {
    const d = new Date(ts * 1000);
    const today = new Date();
    const t = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === today.toDateString()) return t;
    return t + " · " + d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  }
  function ago(ts) {
    const s = Math.floor(Date.now() / 1000) - ts;
    if (s < 60) return "vừa xong";
    if (s < 3600) return Math.floor(s / 60) + " phút trước";
    if (s < 86400) return Math.floor(s / 3600) + " giờ trước";
    if (s < 86400 * 7) return Math.floor(s / 86400) + " ngày trước";
    return fmtDate(ts);
  }

  let toastTimer;
  function toast(msg) {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3200);
  }

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  async function copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); toast("Đã sao chép."); }
    catch (e) {
      const r = document.createRange();
      const node = btn && btn.parentNode && btn.parentNode.querySelector("code");
      if (node) { r.selectNodeContents(node); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      toast("Hãy nhấn giữ để sao chép mã.");
    }
  }

  function videoEmbed(url) {
    if (!url) return "";
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/);
    if (m) return '<div class="video-box"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(m[1]) + '" title="Video" allowfullscreen loading="lazy"></iframe></div>';
    m = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
    if (m) return '<div class="video-box" style="aspect-ratio:9/16;max-width:340px"><iframe src="https://www.tiktok.com/embed/v2/' + esc(m[1]) + '" title="Video TikTok" allowfullscreen loading="lazy"></iframe></div>';
    return '<a class="video-link" href="' + esc(url) + '" target="_blank" rel="noopener"><b>▶</b><span>Xem video tình huống</span></a>';
  }

  window.Cham = { esc, api, md, fmtDate, fmtTime, ago, toast, store, copyText, videoEmbed };
})();
