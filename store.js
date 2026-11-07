/*
 * Lớp dữ liệu của website Chạm.
 * - Có cấu hình Firebase  -> lưu trên Cloud Firestore, giáo viên đăng nhập bằng Firebase Authentication.
 * - Chưa có cấu hình      -> CHẾ ĐỘ THỬ NGHIỆM, lưu trong localStorage của trình duyệt.
 * Mọi mốc thời gian dùng đơn vị giây.
 */
(function () {
  "use strict";
  const CFG = window.CHAM_CONFIG || { firebase: {} };
  const META = window.CHAM_META;
  const now = function () { return Math.floor(Date.now() / 1000); };
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function rand(n) {
    const a = new Uint32Array(n); crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (x) { return ALPHA[x % ALPHA.length]; }).join("");
  }
  function newCode() { return "CHAM-" + rand(5) + "-" + rand(5); }
  function normCode(c) {
    c = String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.indexOf("CHAM") === 0) c = c.slice(4);
    return c.length === 10 ? "CHAM-" + c.slice(0, 5) + "-" + c.slice(5) : null;
  }
  function sortPosts(list) {
    return list.sort(function (a, b) { return (b.pinned - a.pinned) || (b.created_at - a.created_at); });
  }
  function filterPosts(list, opt) {
    opt = opt || {};
    let out = list;
    if (opt.category) {
      const cats = opt.category.split(",");
      out = out.filter(function (p) { return cats.indexOf(p.category) >= 0; });
    }
    if (opt.q) {
      const q = opt.q.toLowerCase();
      out = out.filter(function (p) { return (p.title + " " + p.summary + " " + p.body).toLowerCase().indexOf(q) >= 0; });
    }
    return sortPosts(out.slice()).slice(0, opt.limit || 500);
  }
  function err(msg) { return new Error(msg); }
  function clean(s, n) { return String(s == null ? "" : s).replace(/\r\n/g, "\n").trim().slice(0, n); }
  function checkPost(d) {
    if (!META.categories.some(function (c) { return c.key === d.category; })) throw err("Vui lòng chọn chuyên mục.");
    const p = {
      category: d.category, title: clean(d.title, 200), summary: clean(d.summary, 500), body: clean(d.body, 400000),
      cover: clean(d.cover, 900000), video_url: clean(d.video_url, 500), pinned: !!d.pinned, published: d.published !== false,
    };
    if (!p.title) throw err("Vui lòng nhập tiêu đề.");
    if (!p.body) throw err("Vui lòng nhập nội dung.");
    if (p.video_url && p.video_url.indexOf("https://") !== 0) throw err("Đường dẫn video phải bắt đầu bằng https://");
    if (JSON.stringify(p).length > 950000) throw err("Bài viết quá lớn (thường do quá nhiều ảnh). Hãy bớt ảnh hoặc dùng ảnh nhỏ hơn.");
    return p;
  }
  function threadFields(d) {
    const anon = d.anonymous !== false;
    return {
      topic: META.topics[d.topic] ? d.topic : "khac",
      display_name: anon ? "" : clean(d.display_name, 60),
      class_name: clean(d.class_name, 20),
      anonymous: anon,
      urgent: d.topic === "bao-luc" || !!d.urgent,
      status: "open",
      teacher_unread: 1,
      student_unread: 0,
    };
  }
  function lastOf(sender, body) { return { sender: sender, body: body.slice(0, 140), at: now() }; }

  // ================================================================ FIREBASE
  function FirebaseStore() {
    const app = firebase.initializeApp(CFG.firebase);
    const db = firebase.firestore();
    const auth = firebase.auth();
    const inc = firebase.firestore.FieldValue.increment;
    const owner = String(CFG.ownerEmail || "").trim().toLowerCase();
    let postCache = null, postCacheAt = 0;

    const FB_ERR = {
      "auth/invalid-credential": "Sai email hoặc mật khẩu.",
      "auth/wrong-password": "Sai email hoặc mật khẩu.",
      "auth/user-not-found": "Sai email hoặc mật khẩu.",
      "auth/invalid-email": "Email không hợp lệ.",
      "auth/too-many-requests": "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.",
      "auth/weak-password": "Mật khẩu mới cần ít nhất 8 ký tự.",
      "auth/network-request-failed": "Không kết nối được mạng. Kiểm tra mạng rồi thử lại.",
      "permission-denied": "Thầy cô không có quyền thực hiện thao tác này.",
      "unavailable": "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
    };
    function wrap(p) {
      return p.catch(function (e) {
        console.error(e);
        throw err(FB_ERR[e && e.code] || (e && e.message) || "Có lỗi xảy ra.");
      });
    }
    function withId(d) { const x = d.data(); x.id = d.id; return x; }
    const S = function (code) { return db.collection("students").doc(code); };
    const T = function (code, id) { return S(code).collection("threads").doc(id); };

    const api = {
      mode: "firebase",
      init: function () { return Promise.resolve(); },
      normCode: normCode,

      // ----- công khai
      settings: function () {
        return wrap(db.collection("settings").doc("site").get()).then(function (d) {
          return Object.assign({}, META.defaultSettings, d.exists ? d.data() : {});
        }).catch(function () { return Object.assign({}, META.defaultSettings); });
      },
      posts: function (opt) {
        const fresh = postCache && Date.now() - postCacheAt < 20000;
        const p = fresh ? Promise.resolve(postCache) : wrap(db.collection("posts").where("published", "==", true).get()).then(function (s) {
          postCache = s.docs.map(withId); postCacheAt = Date.now(); return postCache;
        });
        return p.then(function (list) { return filterPosts(list, opt); });
      },
      post: function (id) {
        return wrap(db.collection("posts").doc(id).get()).then(function (d) {
          if (!d.exists) return null;
          const p = withId(d);
          if (p.published) db.collection("posts").doc(id).update({ views: inc(1) }).catch(function () {});
          return p;
        }).catch(function () { return null; });
      },

      // ----- học sinh
      startCode: function () {
        const code = newCode();
        return wrap(S(code).set({ created_at: now() })).then(function () { return code; });
      },
      codeExists: function (code) {
        code = normCode(code);
        if (!code) return Promise.resolve(null);
        return wrap(S(code).get()).then(function (d) { return d.exists ? code : null; });
      },
      threads: function (code) {
        return wrap(S(code).collection("threads").get()).then(function (s) {
          return s.docs.map(withId).sort(function (a, b) { return b.updated_at - a.updated_at; });
        });
      },
      createThread: function (code, d) {
        const body = clean(d.body, 4000);
        if (!body) return Promise.reject(err("Vui lòng nhập nội dung."));
        const t = threadFields(d), ts = now();
        t.created_at = ts; t.updated_at = ts; t.last = lastOf("student", body);
        const ref = S(code).collection("threads").doc();
        const b = db.batch();
        b.set(ref, t);
        b.set(ref.collection("messages").doc(), { sender: "student", teacher_name: "", body: body, created_at: ts });
        return wrap(b.commit()).then(function () { return ref.id; });
      },
      watchThread: function (code, id, cb, onErr) {
        let thread = null, msgs = null;
        function emit() { if (thread && msgs) cb({ thread: thread, messages: msgs }); }
        const u1 = T(code, id).onSnapshot(function (d) {
          if (!d.exists) { onErr && onErr(err("Không tìm thấy cuộc trò chuyện.")); return; }
          thread = withId(d); thread.code = code; emit();
        }, function (e) { onErr && onErr(e); });
        const u2 = T(code, id).collection("messages").orderBy("created_at").onSnapshot(function (s) {
          msgs = s.docs.map(withId); emit();
        }, function (e) { onErr && onErr(e); });
        return function () { u1(); u2(); };
      },
      studentSend: function (code, id, body) {
        body = clean(body, 4000);
        if (!body) return Promise.resolve();
        const ts = now(), b = db.batch();
        b.set(T(code, id).collection("messages").doc(), { sender: "student", teacher_name: "", body: body, created_at: ts });
        b.update(T(code, id), { teacher_unread: inc(1), updated_at: ts, last: lastOf("student", body), status: "open" });
        return wrap(b.commit());
      },
      studentRead: function (code, id) { return T(code, id).update({ student_unread: 0 }).catch(function () {}); },

      // ----- giáo viên
      onAuth: function (cb) {
        auth.onAuthStateChanged(function (u) {
          if (!u) { cb(null); return; }
          const email = String(u.email || "").toLowerCase();
          db.collection("teachers").doc(email).get().then(function (d) {
            const t = d.exists ? d.data() : null;
            if (email === owner) { cb({ email: email, name: (t && t.name) || "Quản trị viên", role: "admin", owner: true, must_change: false }); return; }
            if (!t || t.active === false) { auth.signOut(); cb(null, "Tài khoản này chưa được cấp quyền giáo viên. Vui lòng liên hệ quản trị viên."); return; }
            cb({ email: email, name: t.name || email, role: t.role || "teacher", must_change: !!t.must_change });
          }).catch(function () {
            if (email === owner) cb({ email: email, name: "Quản trị viên", role: "admin", owner: true, must_change: false });
            else { auth.signOut(); cb(null, "Tài khoản này chưa được cấp quyền giáo viên. Vui lòng liên hệ quản trị viên."); }
          });
        });
      },
      login: function (email, pw) { return wrap(auth.signInWithEmailAndPassword(String(email).trim(), pw)); },
      logout: function () { return auth.signOut(); },
      resetPassword: function (email) { return wrap(auth.sendPasswordResetEmail(String(email).trim())); },
      changePassword: function (oldPw, newPw) {
        if (String(newPw).length < 8) return Promise.reject(err("Mật khẩu mới cần ít nhất 8 ký tự."));
        const u = auth.currentUser;
        const cred = firebase.auth.EmailAuthProvider.credential(u.email, oldPw);
        return wrap(u.reauthenticateWithCredential(cred).catch(function (e) {
          if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password") throw { code: "x", message: "Mật khẩu hiện tại không đúng." };
          throw e;
        }).then(function () { return u.updatePassword(newPw); }).then(function () {
          return db.collection("teachers").doc(u.email.toLowerCase()).update({ must_change: false }).catch(function () {});
        }));
      },
      watchInbox: function (cb, onErr) {
        return db.collectionGroup("threads").onSnapshot(function (s) {
          cb(s.docs.map(function (d) { const x = withId(d); x.code = d.ref.parent.parent.id; return x; }));
        }, function (e) { onErr && onErr(err(FB_ERR[e.code] || e.message)); });
      },
      teacherSend: function (code, id, body, name) {
        body = clean(body, 6000);
        if (!body) return Promise.resolve();
        const ts = now(), b = db.batch();
        b.set(T(code, id).collection("messages").doc(), { sender: "teacher", teacher_name: name, body: body, created_at: ts });
        b.update(T(code, id), { student_unread: inc(1), updated_at: ts, last: lastOf("teacher", body) });
        return wrap(b.commit());
      },
      teacherRead: function (code, id) { return T(code, id).update({ teacher_unread: 0 }).catch(function () {}); },
      setState: function (code, id, patch) { return wrap(T(code, id).update(patch)); },
      deleteThread: function (code, id) {
        return wrap(T(code, id).collection("messages").get().then(function (s) {
          const b = db.batch();
          s.docs.forEach(function (d) { b.delete(d.ref); });
          b.delete(T(code, id));
          return b.commit();
        }));
      },
      allPosts: function () {
        return wrap(db.collection("posts").get()).then(function (s) {
          return s.docs.map(withId).sort(function (a, b) { return b.created_at - a.created_at; });
        });
      },
      getPost: function (id) { return wrap(db.collection("posts").doc(id).get()).then(function (d) { return d.exists ? withId(d) : null; }); },
      savePost: function (id, data, me) {
        let p;
        try { p = checkPost(data); } catch (e) { return Promise.reject(e); }
        p.updated_at = now();
        postCache = null;
        if (id) return wrap(db.collection("posts").doc(id).update(p)).then(function () { return id; });
        p.created_at = p.updated_at; p.views = 0; p.author_name = me.name;
        return wrap(db.collection("posts").add(p)).then(function (r) { return r.id; });
      },
      deletePost: function (id) { postCache = null; return wrap(db.collection("posts").doc(id).delete()); },
      saveSettings: function (s) { return wrap(db.collection("settings").doc("site").set(s, { merge: true })); },
      teachers: function () {
        return wrap(db.collection("teachers").get()).then(function (s) {
          return s.docs.map(function (d) { const x = d.data(); x.email = d.id; return x; });
        });
      },
      addTeacher: function (t) {
        const email = String(t.email || "").trim().toLowerCase();
        const name = clean(t.name, 80);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Promise.reject(err("Email không hợp lệ."));
        if (!name) return Promise.reject(err("Vui lòng nhập họ tên."));
        const pw = rand(4).toLowerCase() + "-" + rand(4).toLowerCase() + "-" + rand(2);
        const sec = firebase.apps.find(function (a) { return a.name === "secondary"; }) || firebase.initializeApp(CFG.firebase, "secondary");
        return sec.auth().createUserWithEmailAndPassword(email, pw).then(function () { sec.auth().signOut(); return pw; }, function (e) {
          if (e.code === "auth/email-already-in-use") return null;
          throw e;
        }).then(function (created) {
          return wrap(db.collection("teachers").doc(email).set({ name: name, role: t.role === "admin" ? "admin" : "teacher", active: true, must_change: !!created, created_at: now() }))
            .then(function () { return { email: email, password: created }; });
        }).catch(function (e) { throw err(FB_ERR[e.code] || e.message); });
      },
      setTeacherActive: function (email, active) { return wrap(db.collection("teachers").doc(email).update({ active: !!active })); },
      seed: function () {
        const list = window.CHAM_SEED || [];
        const t0 = now() - list.length * 3600;
        const b = db.batch();
        list.forEach(function (p, i) {
          b.set(db.collection("posts").doc(), {
            category: p.category, title: p.title, summary: p.summary || "", body: p.body, cover: "", video_url: p.video_url || "",
            author_name: p.author || "Tổ Tư vấn Học đường", pinned: !!p.pinned, published: true, views: 0,
            created_at: t0 + i * 3600, updated_at: t0 + i * 3600,
          });
        });
        postCache = null;
        return wrap(b.commit()).then(function () { return list.length; });
      },
    };
    return api;
  }

  // ================================================================ CHẾ ĐỘ THỬ NGHIỆM
  function DemoStore() {
    const KEY = "cham_demo_db_v1", SESS = "cham_demo_session";
    const DEMO_EMAIL = "demo@cham.vn", DEMO_PW = "cham2026";
    function load() {
      try { const x = JSON.parse(localStorage.getItem(KEY)); if (x) return x; } catch (e) { /* trống */ }
      return null;
    }
    let mem = load();
    function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* bộ nhớ đầy */ } }
    function id() { return rand(12).toLowerCase(); }
    if (!mem) {
      mem = { posts: {}, settings: {}, students: {}, teachers: {} };
      mem.teachers[DEMO_EMAIL] = { name: "Giáo viên dùng thử", role: "admin", active: true, must_change: false, pw: DEMO_PW, created_at: now() };
      const list = window.CHAM_SEED || [], t0 = now() - list.length * 3600;
      list.forEach(function (p, i) {
        mem.posts[id()] = { category: p.category, title: p.title, summary: p.summary || "", body: p.body, cover: "", video_url: p.video_url || "",
          author_name: p.author || "Tổ Tư vấn Học đường", pinned: !!p.pinned, published: true, views: 0, created_at: t0 + i * 3600, updated_at: t0 + i * 3600 };
      });
      save();
    }
    window.addEventListener("storage", function (e) { if (e.key === KEY) mem = load() || mem; });
    function reload() { mem = load() || mem; }
    function postsArr(all) {
      reload();
      return Object.keys(mem.posts).map(function (k) { const p = Object.assign({}, mem.posts[k]); p.id = k; return p; })
        .filter(function (p) { return all || p.published; });
    }
    function student(code) { reload(); return mem.students[code]; }
    function thr(code, tid) { const s = student(code); if (!s || !s.threads[tid]) throw err("Không tìm thấy cuộc trò chuyện."); return s.threads[tid]; }
    function threadOut(code, tid) { const t = Object.assign({}, mem.students[code].threads[tid]); delete t.messages; t.id = tid; t.code = code; return t; }
    function msgsOut(code, tid) { return mem.students[code].threads[tid].messages.map(function (m, i) { return Object.assign({ id: String(i) }, m); }); }
    function watch(fn, cb) {
      let last = "";
      function tick() { reload(); let v; try { v = fn(); } catch (e) { return; } const s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } }
      tick();
      const h = setInterval(tick, 1200);
      return function () { clearInterval(h); };
    }
    let authCb = null;
    function me() {
      let email = null; try { email = localStorage.getItem(SESS); } catch (e) { /* trống */ }
      reload();
      const t = email && mem.teachers[email];
      if (!t || !t.active) return null;
      return { email: email, name: t.name, role: t.role, must_change: !!t.must_change, owner: email === DEMO_EMAIL };
    }
    const P = function (v) { return Promise.resolve(v); };

    return {
      mode: "demo",
      demoLogin: { email: DEMO_EMAIL, password: DEMO_PW },
      init: function () { return P(); },
      normCode: normCode,
      settings: function () { reload(); return P(Object.assign({}, META.defaultSettings, mem.settings)); },
      posts: function (opt) { return P(filterPosts(postsArr(false), opt)); },
      post: function (pid) {
        reload();
        const p = mem.posts[pid];
        if (!p || (!p.published && !me())) return P(null);
        if (p.published) { p.views = (p.views || 0) + 1; save(); }
        return P(Object.assign({ id: pid }, p));
      },
      startCode: function () { reload(); const c = newCode(); mem.students[c] = { created_at: now(), threads: {} }; save(); return P(c); },
      codeExists: function (code) { code = normCode(code); return P(code && student(code) ? code : null); },
      threads: function (code) {
        const s = student(code);
        if (!s) return Promise.reject(err("Không tìm thấy mã tra cứu này."));
        return P(Object.keys(s.threads).map(function (k) { return threadOut(code, k); }).sort(function (a, b) { return b.updated_at - a.updated_at; }));
      },
      createThread: function (code, d) {
        const body = clean(d.body, 4000);
        if (!body) return Promise.reject(err("Vui lòng nhập nội dung."));
        const s = student(code);
        if (!s) return Promise.reject(err("Không tìm thấy mã tra cứu này."));
        const t = threadFields(d), ts = now(), k = id();
        t.created_at = ts; t.updated_at = ts; t.last = lastOf("student", body);
        t.messages = [{ sender: "student", teacher_name: "", body: body, created_at: ts }];
        s.threads[k] = t; save();
        return P(k);
      },
      watchThread: function (code, tid, cb, onErr) {
        try { thr(code, tid); } catch (e) { onErr && onErr(e); return function () {}; }
        return watch(function () { return { thread: threadOut(code, tid), messages: msgsOut(code, tid) }; }, cb);
      },
      studentSend: function (code, tid, body) {
        body = clean(body, 4000); if (!body) return P();
        const t = thr(code, tid), ts = now();
        t.messages.push({ sender: "student", teacher_name: "", body: body, created_at: ts });
        t.teacher_unread = (t.teacher_unread || 0) + 1; t.updated_at = ts; t.last = lastOf("student", body); t.status = "open";
        save(); return P();
      },
      studentRead: function (code, tid) { try { thr(code, tid).student_unread = 0; save(); } catch (e) { /* trống */ } return P(); },

      onAuth: function (cb) { authCb = cb; cb(me()); },
      login: function (email, pw) {
        reload();
        email = String(email).trim().toLowerCase();
        const t = mem.teachers[email];
        if (!t || t.pw !== pw) return Promise.reject(err("Sai email hoặc mật khẩu."));
        if (!t.active) return Promise.reject(err("Tài khoản này đã bị khóa."));
        try { localStorage.setItem(SESS, email); } catch (e) { /* trống */ }
        if (authCb) authCb(me());
        return P();
      },
      logout: function () { try { localStorage.removeItem(SESS); } catch (e) { /* trống */ } if (authCb) authCb(null); return P(); },
      resetPassword: function () { return Promise.reject(err("Chế độ thử nghiệm không gửi được email. Tài khoản dùng thử: " + DEMO_EMAIL + " / " + DEMO_PW)); },
      changePassword: function (oldPw, newPw) {
        const m = me(); reload();
        const t = mem.teachers[m.email];
        if (t.pw !== oldPw) return Promise.reject(err("Mật khẩu hiện tại không đúng."));
        if (String(newPw).length < 8) return Promise.reject(err("Mật khẩu mới cần ít nhất 8 ký tự."));
        t.pw = newPw; t.must_change = false; save(); return P();
      },
      watchInbox: function (cb) {
        return watch(function () {
          const out = [];
          Object.keys(mem.students).forEach(function (c) { Object.keys(mem.students[c].threads).forEach(function (k) { out.push(threadOut(c, k)); }); });
          return out;
        }, cb);
      },
      teacherSend: function (code, tid, body, name) {
        body = clean(body, 6000); if (!body) return P();
        const t = thr(code, tid), ts = now();
        t.messages.push({ sender: "teacher", teacher_name: name, body: body, created_at: ts });
        t.student_unread = (t.student_unread || 0) + 1; t.updated_at = ts; t.last = lastOf("teacher", body);
        save(); return P();
      },
      teacherRead: function (code, tid) { try { thr(code, tid).teacher_unread = 0; save(); } catch (e) { /* trống */ } return P(); },
      setState: function (code, tid, patch) { Object.assign(thr(code, tid), patch); save(); return P(); },
      deleteThread: function (code, tid) { reload(); delete mem.students[code].threads[tid]; save(); return P(); },
      allPosts: function () { return P(postsArr(true).sort(function (a, b) { return b.created_at - a.created_at; })); },
      getPost: function (pid) { reload(); return P(mem.posts[pid] ? Object.assign({ id: pid }, mem.posts[pid]) : null); },
      savePost: function (pid, data, m) {
        let p;
        try { p = checkPost(data); } catch (e) { return Promise.reject(e); }
        reload(); p.updated_at = now();
        if (pid) { Object.assign(mem.posts[pid], p); save(); return P(pid); }
        p.created_at = p.updated_at; p.views = 0; p.author_name = m.name;
        const k = id(); mem.posts[k] = p;
        try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { delete mem.posts[k]; return Promise.reject(err("Bộ nhớ trình duyệt đã đầy. Hãy dùng ảnh nhỏ hơn.")); }
        return P(k);
      },
      deletePost: function (pid) { reload(); delete mem.posts[pid]; save(); return P(); },
      saveSettings: function (s) { reload(); Object.assign(mem.settings, s); save(); return P(); },
      teachers: function () { reload(); return P(Object.keys(mem.teachers).map(function (e) { const t = Object.assign({}, mem.teachers[e]); delete t.pw; t.email = e; return t; })); },
      addTeacher: function (t) {
        reload();
        const email = String(t.email || "").trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Promise.reject(err("Email không hợp lệ."));
        if (!clean(t.name, 80)) return Promise.reject(err("Vui lòng nhập họ tên."));
        if (mem.teachers[email]) return Promise.reject(err("Email này đã có tài khoản."));
        const pw = rand(4).toLowerCase() + "-" + rand(4).toLowerCase() + "-" + rand(2);
        mem.teachers[email] = { name: clean(t.name, 80), role: t.role === "admin" ? "admin" : "teacher", active: true, must_change: true, pw: pw, created_at: now() };
        save(); return P({ email: email, password: pw });
      },
      setTeacherActive: function (email, active) { reload(); mem.teachers[email].active = !!active; save(); return P(); },
      seed: function () { return P(0); },
    };
  }

  const configured = !!(CFG.firebase && CFG.firebase.apiKey && CFG.firebase.projectId && window.firebase);
  window.ChamStore = configured ? FirebaseStore() : DemoStore();
})();
