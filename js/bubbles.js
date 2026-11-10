/* Góc thư giãn – trò chơi bấm bong bóng */
(function () {
  "use strict";
  const WORDS = ["Tự tin", "Vui vẻ", "Bình tĩnh", "Dũng cảm", "Tử tế", "Kiên trì", "Biết ơn", "Lạc quan", "Mạnh mẽ", "Yêu thương", "Tỏa sáng", "Sẻ chia"];
  const COLORS = ["#4fb38f", "#5aa7d6", "#f2be3a", "#ef8a7a", "#9b8fe0", "#6cc4c0"];
  const END_MSG = [
    "Tuyệt vời! Em vừa thả lỏng được một chút rồi đấy.",
    "Giỏi quá! Hít một hơi thật sâu rồi quay lại bài học nhé.",
    "Năng lượng đã nạp đầy. Chúc em học thật tốt!",
    "Mỗi bong bóng nổ là một nỗi lo bay đi. Em làm tốt lắm!",
  ];

  function mount(root) {
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";
    root.innerHTML =
      '<div class="bb-bar">' +
        '<div class="bb-stats"><span>Điểm <b id="bb-score">0</b></span><span id="bb-time-wrap">Thời gian <b id="bb-time">60</b>s</span><span>Kỷ lục <b id="bb-best">0</b></span></div>' +
        '<div class="bb-controls"><button class="btn small ghost" type="button" id="bb-sound" aria-pressed="true">Âm thanh: bật</button></div>' +
      "</div>" +
      '<div class="bb-stage" id="bb-stage"><canvas id="bb-canvas" aria-label="Khung trò chơi bấm bong bóng"></canvas>' +
        '<div class="bb-overlay" id="bb-overlay"><b class="bb-title">Bấm bong bóng</b>' +
          '<p>Chạm vào bong bóng để làm chúng nổ. Bong bóng <span class="bb-gold">vàng</span> được 3 điểm và mang theo một lời chúc tích cực.</p>' +
          '<div class="bb-start"><button class="btn sun" type="button" id="bb-play">Chơi 60 giây</button><button class="btn ghost bb-light" type="button" id="bb-relax">Thư giãn, không tính giờ</button></div></div>' +
      "</div>";

    const stage = root.querySelector("#bb-stage"), cv = root.querySelector("#bb-canvas"), ctx = cv.getContext("2d");
    const overlay = root.querySelector("#bb-overlay");
    const elScore = root.querySelector("#bb-score"), elTime = root.querySelector("#bb-time"), elBest = root.querySelector("#bb-best"), elTimeWrap = root.querySelector("#bb-time-wrap");
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1;
    let bubbles = [], effects = [], score = 0, timeLeft = 60, mode = null, running = false, lastT = 0, spawnAcc = 0, elapsed = 0, sound = true;
    let best = 0;
    try { best = parseInt(localStorage.getItem("cham_bubble_best") || "0", 10) || 0; } catch (e) { /* trống */ }
    elBest.textContent = best;

    function size() {
      dpr = window.devicePixelRatio || 1;
      W = stage.clientWidth; H = stage.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);

    // âm thanh "bụp" nhỏ, tạo bằng Web Audio (chỉ phát sau khi người chơi bấm)
    let audio = null;
    function pop(golden) {
      if (!sound) return;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
        o.type = "sine";
        o.frequency.setValueAtTime(golden ? 880 : 520 + Math.random() * 200, t);
        o.frequency.exponentialRampToValueAtTime(golden ? 1320 : 180, t + 0.12);
        g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.16);
      } catch (e) { /* bỏ qua */ }
    }
    root.querySelector("#bb-sound").addEventListener("click", function () {
      sound = !sound; this.setAttribute("aria-pressed", sound); this.textContent = "Âm thanh: " + (sound ? "bật" : "tắt");
    });

    function spawn() {
      const r = (W < 500 ? 20 : 24) + Math.random() * (W < 500 ? 20 : 26);
      const golden = Math.random() < 0.12;
      bubbles.push({
        x: r + Math.random() * (W - 2 * r), y: H + r, r: r,
        vy: (38 + Math.random() * 46) * (1 + Math.min(elapsed, 60) / 90),
        wob: Math.random() * Math.PI * 2, wobS: 1 + Math.random() * 1.5,
        color: golden ? "#f2be3a" : COLORS[Math.floor(Math.random() * COLORS.length)], golden: golden,
      });
    }
    function drawBubble(b) {
      const x = b.x + Math.sin(b.wob) * 6;
      const g = ctx.createRadialGradient(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, x, b.y, b.r);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.35, hexA(b.color, 0.35));
      g.addColorStop(1, hexA(b.color, b.golden ? 0.85 : 0.6));
      ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = hexA(b.color, 0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(x - b.r * 0.38, b.y - b.r * 0.38, b.r * 0.16, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fill();
      if (b.golden) { ctx.fillStyle = "#7a5200"; ctx.font = "700 " + Math.round(b.r * 0.7) + "px 'Be Vietnam Pro', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("★", x, b.y + 1); }
      b.drawX = x;
    }
    function hexA(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    }

    function frame(t) {
      if (!document.body.contains(cv)) { running = false; return; }
      const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
      ctx.clearRect(0, 0, W, H);
      if (running) {
        elapsed += dt;
        if (mode === "timed") {
          timeLeft -= dt;
          elTime.textContent = Math.max(0, Math.ceil(timeLeft));
          if (timeLeft <= 0) { finish(); }
        }
        spawnAcc += dt;
        const every = mode === "relax" ? 0.7 : Math.max(0.28, 0.75 - elapsed / 120);
        while (spawnAcc > every) { spawnAcc -= every; spawn(); }
      }
      bubbles.forEach(function (b) { b.y -= b.vy * dt; b.wob += b.wobS * dt; drawBubble(b); });
      bubbles = bubbles.filter(function (b) { return b.y > -b.r - 10; });
      effects.forEach(function (e) {
        e.t += dt;
        const k = Math.min(1, e.t / e.life);
        if (e.kind === "ring") {
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1 + k * 0.8), 0, Math.PI * 2);
          ctx.strokeStyle = hexA(e.color, 1 - k); ctx.lineWidth = 3 * (1 - k); ctx.stroke();
          e.parts.forEach(function (p) {
            ctx.beginPath(); ctx.arc(e.x + p.dx * k * e.r * 1.6, e.y + p.dy * k * e.r * 1.6, 3 * (1 - k), 0, Math.PI * 2);
            ctx.fillStyle = hexA(e.color, 1 - k); ctx.fill();
          });
        } else {
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = "#0b4a38"; ctx.font = "700 " + (e.big ? 20 : 16) + "px 'Be Vietnam Pro', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(e.text, e.x, e.y - k * 40);
          ctx.globalAlpha = 1;
        }
      });
      effects = effects.filter(function (e) { return e.t < e.life; });
      requestAnimationFrame(frame);
    }

    function hit(px, py) {
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i], dx = px - (b.drawX || b.x), dy = py - b.y;
        if (dx * dx + dy * dy <= (b.r + 6) * (b.r + 6)) {
          bubbles.splice(i, 1);
          const pts = b.golden ? 3 : 1;
          score += pts; elScore.textContent = score;
          pop(b.golden);
          const parts = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; parts.push({ dx: Math.cos(a), dy: Math.sin(a) }); }
          effects.push({ kind: "ring", x: b.drawX || b.x, y: b.y, r: b.r, color: b.color, t: 0, life: reduce ? 0.15 : 0.45, parts: parts });
          effects.push({ kind: "text", x: b.drawX || b.x, y: b.y, text: b.golden ? "+3 " + WORDS[Math.floor(Math.random() * WORDS.length)] + "!" : "+1", big: b.golden, t: 0, life: b.golden ? 1.1 : 0.6 });
          return;
        }
      }
    }
    cv.addEventListener("pointerdown", function (ev) {
      if (!running) return;
      const r = cv.getBoundingClientRect();
      hit(ev.clientX - r.left, ev.clientY - r.top);
    });

    function start(m) {
      const sb = root.querySelector("#bb-stop"); if (sb && m === "timed") sb.remove();
      mode = m; running = true; score = 0; timeLeft = 60; elapsed = 0; spawnAcc = 0; bubbles = []; effects = [];
      elScore.textContent = "0"; elTime.textContent = "60";
      elTimeWrap.hidden = m !== "timed";
      overlay.hidden = true;
      size();
      for (let i = 0; i < 4; i++) { spawn(); bubbles[bubbles.length - 1].y = H * (0.5 + i * 0.15); }
    }
    function finish() {
      running = false;
      const isBest = score > best;
      if (isBest) { best = score; elBest.textContent = best; try { localStorage.setItem("cham_bubble_best", String(best)); } catch (e) { /* trống */ } }
      overlay.hidden = false;
      overlay.innerHTML = '<b class="bb-title">' + (isBest ? "Kỷ lục mới: " : "Em được ") + score + " điểm</b>" +
        "<p>" + END_MSG[Math.floor(Math.random() * END_MSG.length)] + "</p>" +
        '<div class="bb-start"><button class="btn sun" type="button" id="bb-play">Chơi lại</button><button class="btn ghost bb-light" type="button" id="bb-relax">Thư giãn, không tính giờ</button></div>';
      bind();
    }
    function bind() {
      root.querySelector("#bb-play").onclick = function () { start("timed"); };
      root.querySelector("#bb-relax").onclick = function () { start("relax"); stopBtn(); };
    }
    function stopBtn() {
      const c = root.querySelector(".bb-controls");
      if (c.querySelector("#bb-stop")) return;
      const b = document.createElement("button");
      b.className = "btn small ghost"; b.type = "button"; b.id = "bb-stop"; b.textContent = "Dừng";
      b.onclick = function () { b.remove(); finish(); };
      c.insertBefore(b, c.firstChild);
    }
    bind();
    // vài bong bóng trôi nhẹ phía sau màn hình chờ
    for (let i = 0; i < 6; i++) { spawn(); bubbles[i].y = H * Math.random(); bubbles[i].vy *= 0.4; }
    requestAnimationFrame(function (t) { lastT = t; frame(t); });
  }

  window.ChamBubbles = { mount: mount };
})();
