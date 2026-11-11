/* Góc thư giãn – chạm vào bong bóng: bong bóng tan biến thành giọt nước, kèm tiếng "bụp",
   và một khuôn mặt cười vui vẻ hiện ra. Không tính điểm. */
(function () {
  "use strict";
  const WORDS = ["Em làm được!", "Cười lên nào!", "Tuyệt vời!", "Em thật tuyệt!", "Cố lên nhé!", "Tự tin lên!", "Hạnh phúc", "Vui vẻ", "Bình yên", "Thư giãn nào", "Lạc quan", "Tỏa sáng", "Yêu thương", "Biết ơn", "Mạnh mẽ", "Dũng cảm", "Tử tế", "Kiên trì", "Sẻ chia", "Ổn cả thôi", "Em xứng đáng", "Hít thở sâu", "Mỉm cười", "Ngày mới vui", "Năng lượng!", "Giỏi lắm!", "Bình tĩnh", "Can đảm lên", "Thật đáng yêu", "Hãy là chính mình"];
  const WORD_COLORS = ["#0b6b4f", "#c2417a", "#2b6cb0", "#b7621f", "#7c3aed", "#0e7490", "#c0392b"];
  const COLORS = ["#4fb38f", "#5aa7d6", "#f2a3c0", "#ef8a7a", "#9b8fe0", "#6cc4c0", "#f2be3a"];
  // ---------------- âm thanh (Web Audio, chỉ phát sau khi người chơi chạm)
  let audio = null, noiseBuf = null;
  function ctxAudio() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
      noiseBuf = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.12), audio.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    }
    if (audio.state === "suspended") audio.resume();
    return audio;
  }
  function popSound(size, golden) {
    const a = ctxAudio(); if (!a) return;
    const t = a.currentTime;
    // tiếng "bụp": cao độ rơi nhanh, bong bóng càng nhỏ tiếng càng cao
    const base = 300 + (60 - Math.min(60, size)) * 9 + Math.random() * 80;
    const o = a.createOscillator(), g = a.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(base * 1.8, t);
    o.frequency.exponentialRampToValueAtTime(base * 0.5, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.13);
    // tiếng "xì" rất ngắn của màng xà phòng vỡ
    const n = a.createBufferSource(), f = a.createBiquadFilter(), ng = a.createGain();
    n.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = 2500;
    ng.gain.setValueAtTime(0.12, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    n.connect(f); f.connect(ng); ng.connect(a.destination); n.start(t); n.stop(t + 0.08);
    if (golden) {
      [0, 0.08, 0.16].forEach(function (dt, i) {
        const c = a.createOscillator(), cg = a.createGain();
        c.type = "triangle"; c.frequency.value = [1047, 1319, 1568][i];
        cg.gain.setValueAtTime(0.0001, t + dt); cg.gain.exponentialRampToValueAtTime(0.16, t + dt + 0.01); cg.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.35);
        c.connect(cg); cg.connect(a.destination); c.start(t + dt); c.stop(t + dt + 0.4);
      });
    }
  }
  function mount(root) {
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";
    root.innerHTML =
      '<div class="bb-bar">' +
        '<p class="bb-note">Chạm nhẹ vào bong bóng. Mỗi bong bóng mang theo một lời nhắn vui tươi gửi tới em.</p>' +
        '<div class="bb-controls"><button class="btn small ghost" type="button" id="bb-sound" aria-pressed="true">Âm thanh: bật</button></div>' +
      "</div>" +
      '<div class="bb-stage" id="bb-stage"><canvas id="bb-canvas" aria-label="Khung thư giãn: chạm vào bong bóng để bong bóng tan biến"></canvas>' +
        '<div class="bb-hint" id="bb-hint">Chạm vào bong bóng để làm chúng tan biến ✨</div>' +
      "</div>";

    const stage = root.querySelector("#bb-stage"), cv = root.querySelector("#bb-canvas"), ctx = cv.getContext("2d");
    const hint = root.querySelector("#bb-hint");
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1;
    let bubbles = [], dying = [], drops = [], held = [], notes = [];
    let lastT = 0, spawnAcc = 0, elapsed = 0, sound = true;

    function size() {
      dpr = window.devicePixelRatio || 1;
      W = stage.clientWidth; H = stage.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);

    root.querySelector("#bb-sound").addEventListener("click", function () {
      sound = !sound; this.setAttribute("aria-pressed", sound); this.textContent = "Âm thanh: " + (sound ? "bật" : "tắt");
    });

    function spawn(y) {
      const small = W < 500;
      const r = (small ? 20 : 24) + Math.random() * (small ? 22 : 30);
      const golden = Math.random() < 0.12;
      const speed = 24 + Math.random() * 32;
      bubbles.push({
        x: r + Math.random() * Math.max(1, W - 2 * r), y: y == null ? H + r : y, r: r, vy: speed,
        wob: Math.random() * Math.PI * 2, wobS: 0.8 + Math.random() * 1.4, hue: Math.random() * 360,
        color: golden ? "#f2be3a" : COLORS[Math.floor(Math.random() * COLORS.length)], golden: golden,
      });
    }
    function rgba(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    }
    function drawBubble(b, x, y, r, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.45, rgba(b.color, 0.18));
      g.addColorStop(0.85, rgba(b.color, b.golden ? 0.55 : 0.35));
      g.addColorStop(1, rgba(b.color, b.golden ? 0.9 : 0.7));
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      // ánh cầu vồng của màng xà phòng
      ctx.lineWidth = 2;
      ctx.strokeStyle = "hsla(" + ((b.hue + elapsed * 40) % 360) + ",80%,70%,0.55)";
      ctx.beginPath(); ctx.arc(x, y, r - 1, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.strokeStyle = rgba(b.color, 0.9); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      // đốm sáng
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.17, r * 0.1, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + r * 0.42, y + r * 0.35, r * 0.05, 0, Math.PI * 2); ctx.fill();
      if (b.golden) {
        ctx.fillStyle = "#8a5a00"; ctx.font = "700 " + Math.round(r * 0.7) + "px 'Be Vietnam Pro', sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("★", x, y + 1);
      }
      ctx.restore();
    }

    // Chữ vui tươi: hiện trong bong bóng, rồi bay lên và mờ dần sau khi bong bóng tan
    function drawWord(text, x, y, size, color, alpha, scale) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(scale, scale);
      ctx.font = "800 " + size + "px 'Be Vietnam Pro', 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineJoin = "round"; ctx.lineWidth = Math.max(4, size * 0.32); ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.strokeText(text, 0, 0);
      ctx.fillStyle = color; ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    function frame(t) {
      if (!document.body.contains(cv)) return;
      const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
      elapsed += dt;
      spawnAcc += dt;
      while (spawnAcc > 0.85) { spawnAcc -= 0.85; if (bubbles.length < 14) spawn(); }
      ctx.clearRect(0, 0, W, H);
      bubbles.forEach(function (b) {
        b.y -= b.vy * dt; b.wob += b.wobS * dt;
        b.dx = b.x + Math.sin(b.wob) * 7;
        drawBubble(b, b.dx, b.y, b.r, 1);
      });
      bubbles = bubbles.filter(function (b) { return b.y > -b.r - 10; });
      // bong bóng đang tan: phình nhẹ rồi mờ dần
      dying.forEach(function (d) {
        d.t += dt;
        const k = Math.min(1, d.t / d.life);
        drawBubble(d.b, d.x, d.y, d.b.r * (1 + 0.35 * k), (1 - k) * (1 - k));
      });
      dying = dying.filter(function (d) { return d.t < d.life; });
      // giọt nước bắn ra
      drops.forEach(function (p) {
        p.t += dt; p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const k = Math.min(1, p.t / p.life);
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.r * (1 - k)), 0, Math.PI * 2);
        ctx.fillStyle = rgba(p.color, 0.85 * (1 - k)); ctx.fill();
      });
      drops = drops.filter(function (p) { return p.t < p.life; });
      // bong bóng vừa được chạm: dừng lại, phồng nhẹ, hiện chữ bên trong
      held.forEach(function (h) {
        h.t += dt;
        const k = Math.min(1, h.t / h.hold);
        const ease = 1 - Math.pow(1 - k, 3);
        drawBubble(h.b, h.x, h.y, h.b.r * (1 + 0.15 * ease), 1);
        drawWord(h.word, h.x, h.y, h.size, h.color, Math.min(1, k * 2), 0.6 + 0.4 * ease);
        if (h.t >= h.hold) burst(h);
      });
      held = held.filter(function (h) { return h.t < h.hold; });
      // chữ bay lên sau khi bong bóng tan
      notes.forEach(function (n) {
        n.t += dt;
        const k = Math.min(1, n.t / n.life);
        drawWord(n.word, n.x + Math.sin(k * 5 + n.seed) * 3, n.y - k * 50, n.size, n.color, k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1, 1 + 0.06 * Math.sin(k * Math.PI));
      });
      notes = notes.filter(function (n) { return n.t < n.life; });
      requestAnimationFrame(frame);
    }

    function pop(b) {
      const small = W < 500;
      held.push({
        b: b, x: b.dx, y: b.y, t: 0, hold: reduce ? 0.2 : 0.55,
        word: WORDS[Math.floor(Math.random() * WORDS.length)],
        size: (b.golden ? 20 : 16) + (small ? 0 : 2),
        color: b.golden ? "#a86b00" : WORD_COLORS[Math.floor(Math.random() * WORD_COLORS.length)],
      });
      if (!hint.hidden) { hint.classList.add("out"); setTimeout(function () { hint.hidden = true; }, 400); }
    }
    function burst(h) {
      const b = h.b;
      if (sound) popSound(b.r, b.golden);
      dying.push({ b: b, x: h.x, y: h.y, t: 0, life: reduce ? 0.12 : 0.3 });
      const n = reduce ? 0 : 12 + Math.floor(b.r / 4);
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 150;
        drops.push({ x: h.x + Math.cos(a) * b.r * 0.9, y: h.y + Math.sin(a) * b.r * 0.9, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
          r: 1.5 + Math.random() * 2.5, color: b.color, t: 0, life: 0.45 + Math.random() * 0.3 });
      }
      notes.push({ word: h.word, x: h.x, y: h.y, size: h.size, color: h.color, t: 0, life: reduce ? 0.8 : 1.4, seed: Math.random() * 6 });
    }
    cv.addEventListener("pointerdown", function (ev) {
      const r = cv.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i], dx = px - b.dx, dy = py - b.y;
        if (dx * dx + dy * dy <= (b.r + 8) * (b.r + 8)) { bubbles.splice(i, 1); pop(b); return; }
      }
    });

    for (let i = 0; i < 8; i++) spawn(H * (0.15 + Math.random() * 0.85));
    requestAnimationFrame(function (t) { lastT = t; frame(t); });
  }

  window.ChamBubbles = { mount: mount };
})();
