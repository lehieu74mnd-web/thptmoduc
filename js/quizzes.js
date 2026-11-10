/* Dữ liệu và cách tính điểm cho 3 bài trắc nghiệm */
(function () {
  "use strict";

  // ---------------- DASS-21 (Lovibond & Lovibond, 1995) – thang đo dùng tự do
  const DASS_ITEMS = [
    ["Tôi thấy khó mà lắng xuống, bình tĩnh lại", "S"],
    ["Tôi bị khô miệng", "A"],
    ["Tôi dường như chẳng có chút cảm xúc tích cực nào", "D"],
    ["Tôi bị khó thở (thở gấp, hụt hơi dù không gắng sức)", "A"],
    ["Tôi thấy khó bắt tay vào làm việc gì đó", "D"],
    ["Tôi có xu hướng phản ứng thái quá với mọi chuyện", "S"],
    ["Tôi bị run (ví dụ: run tay)", "A"],
    ["Tôi thấy mình luôn căng thẳng, tiêu tốn nhiều năng lượng", "S"],
    ["Tôi lo sợ những tình huống có thể khiến tôi hoảng loạn và bị bẽ mặt", "A"],
    ["Tôi thấy mình chẳng có gì để mong đợi", "D"],
    ["Tôi thấy mình dễ bị kích động, bồn chồn", "S"],
    ["Tôi thấy khó mà thư giãn được", "S"],
    ["Tôi cảm thấy chán nản, buồn bã", "D"],
    ["Tôi khó chấp nhận khi có việc gì cản trở điều tôi đang làm", "S"],
    ["Tôi thấy mình gần như hoảng loạn", "A"],
    ["Tôi không còn thấy hứng thú với bất kỳ việc gì", "D"],
    ["Tôi cảm thấy mình là người không có giá trị", "D"],
    ["Tôi thấy mình khá dễ tự ái, phật ý", "S"],
    ["Tôi nghe rõ tim mình đập nhanh hoặc loạn nhịp dù không vận động", "A"],
    ["Tôi hay sợ hãi vô cớ", "A"],
    ["Tôi thấy cuộc sống vô nghĩa", "D"],
  ];
  const DASS_OPTIONS = [
    [0, "Không đúng chút nào"],
    [1, "Đúng phần nào / thỉnh thoảng"],
    [2, "Đúng phần nhiều / thường xuyên"],
    [3, "Hoàn toàn đúng / hầu như luôn luôn"],
  ];
  const DASS_LEVELS = ["Bình thường", "Nhẹ", "Vừa", "Nặng", "Rất nặng"];
  // Ngưỡng sau khi nhân 2 (chuẩn DASS-42)
  const DASS_CUT = {
    D: [9, 13, 20, 27],
    A: [7, 9, 14, 19],
    S: [14, 18, 25, 33],
  };
  const DASS_NAMES = { D: "Trầm cảm", A: "Lo âu", S: "Stress" };

  function scoreDass(answers) {
    const raw = { D: 0, A: 0, S: 0 };
    DASS_ITEMS.forEach(function (it, i) { raw[it[1]] += answers[i]; });
    const out = {};
    ["D", "A", "S"].forEach(function (k) {
      const score = raw[k] * 2;
      const cut = DASS_CUT[k];
      let lv = 4;
      for (let j = 0; j < cut.length; j++) { if (score <= cut[j]) { lv = j; break; } }
      out[k] = { name: DASS_NAMES[k], score: score, max: 42, level: lv, label: DASS_LEVELS[lv] };
    });
    // câu 17 và 21 liên quan tới cảm giác vô giá trị / vô nghĩa
    out.flag = answers[16] >= 2 || answers[20] >= 2;
    return out;
  }

  // ---------------- Holland (RIASEC)
  const HOLLAND_TYPES = {
    R: { name: "Kỹ thuật (Realistic)", desc: "Thích làm việc với đồ vật, máy móc, cây cối, con vật; thực tế, khéo tay, thích hoạt động ngoài trời.",
      jobs: "Kỹ sư cơ khí, điện, xây dựng; kỹ thuật viên ô tô; nông nghiệp công nghệ cao; cảnh sát, quân đội; vận động viên.",
      subjects: "Vật lí, Công nghệ, Toán, Giáo dục thể chất" },
    I: { name: "Nghiên cứu (Investigative)", desc: "Thích quan sát, tìm hiểu, phân tích, giải quyết vấn đề bằng tư duy; tò mò, chính xác.",
      jobs: "Bác sĩ, dược sĩ; nhà nghiên cứu khoa học; kỹ sư phần mềm; phân tích dữ liệu; kỹ sư môi trường.",
      subjects: "Toán, Vật lí, Hóa học, Sinh học, Tin học" },
    A: { name: "Nghệ thuật (Artistic)", desc: "Giàu trí tưởng tượng, thích sáng tạo, tự do thể hiện cảm xúc qua hình ảnh, âm nhạc, ngôn từ.",
      jobs: "Thiết kế đồ họa, thời trang; kiến trúc sư; truyền thông đa phương tiện; nhà báo, biên tập; âm nhạc, sân khấu.",
      subjects: "Ngữ văn, Mĩ thuật, Âm nhạc, Ngoại ngữ" },
    S: { name: "Xã hội (Social)", desc: "Thích giúp đỡ, chăm sóc, dạy dỗ người khác; thân thiện, biết lắng nghe, kiên nhẫn.",
      jobs: "Giáo viên; điều dưỡng; chuyên viên tâm lý, công tác xã hội; hướng dẫn viên du lịch; nhân sự.",
      subjects: "Ngữ văn, Lịch sử, Giáo dục kinh tế và pháp luật, Sinh học, Ngoại ngữ" },
    E: { name: "Quản lý (Enterprising)", desc: "Thích dẫn dắt, thuyết phục, kinh doanh; tự tin, năng động, dám chấp nhận rủi ro.",
      jobs: "Quản trị kinh doanh; marketing, quan hệ công chúng; luật sư; khởi nghiệp; quản lý nhà hàng – khách sạn.",
      subjects: "Toán, Giáo dục kinh tế và pháp luật, Ngoại ngữ, Ngữ văn" },
    C: { name: "Nghiệp vụ (Conventional)", desc: "Thích công việc có quy trình rõ ràng, làm việc với số liệu, giấy tờ; cẩn thận, ngăn nắp, đáng tin cậy.",
      jobs: "Kế toán, kiểm toán; ngân hàng, tài chính; hành chính văn phòng; logistics; thư viện, lưu trữ.",
      subjects: "Toán, Tin học, Giáo dục kinh tế và pháp luật" },
  };
  const HOLLAND_ITEMS = [
    ["Sửa chữa đồ dùng điện, xe đạp, đồ gia dụng", "R"],
    ["Lắp ráp mô hình, tìm hiểu cách máy móc hoạt động", "R"],
    ["Làm vườn, chăm sóc cây trồng hoặc vật nuôi", "R"],
    ["Chơi thể thao, hoạt động ngoài trời", "R"],
    ["Làm đồ thủ công, đồ gỗ, sử dụng dụng cụ", "R"],
    ["Giải những bài toán, câu đố khó", "I"],
    ["Làm thí nghiệm trong phòng thực hành", "I"],
    ["Tìm hiểu vì sao các hiện tượng tự nhiên xảy ra", "I"],
    ["Đọc sách, xem video về khoa học, công nghệ", "I"],
    ["Lập trình máy tính hoặc phân tích số liệu", "I"],
    ["Vẽ, thiết kế, chụp ảnh", "A"],
    ["Chơi nhạc cụ, hát hoặc sáng tác nhạc", "A"],
    ["Viết truyện, thơ, nhật ký, bài cảm nhận", "A"],
    ["Diễn kịch, quay và dựng video", "A"],
    ["Nghĩ ra ý tưởng mới lạ, khác người", "A"],
    ["Giảng lại bài cho bạn chưa hiểu", "S"],
    ["Lắng nghe, an ủi khi bạn bè gặp chuyện buồn", "S"],
    ["Tham gia hoạt động tình nguyện, thiện nguyện", "S"],
    ["Chăm sóc người già, em nhỏ, người bị ốm", "S"],
    ["Giúp hai bạn đang mâu thuẫn làm lành", "S"],
    ["Làm lớp trưởng, trưởng nhóm, dẫn dắt tập thể", "E"],
    ["Thuyết phục người khác đồng ý với ý kiến của mình", "E"],
    ["Bán hàng, kinh doanh nhỏ", "E"],
    ["Tổ chức sự kiện, chương trình văn nghệ", "E"],
    ["Tranh biện, tranh luận về một vấn đề", "E"],
    ["Sắp xếp sách vở, tài liệu gọn gàng, khoa học", "C"],
    ["Làm việc theo kế hoạch và quy trình rõ ràng", "C"],
    ["Nhập liệu, làm bảng tính, thống kê", "C"],
    ["Ghi chép và quản lý chi tiêu, quỹ lớp", "C"],
    ["Kiểm tra lỗi sai, rà soát chi tiết", "C"],
  ];
  const LIKE_OPTIONS = [[0, "Không thích"], [1, "Bình thường"], [2, "Rất thích"]];

  function scoreHolland(answers) {
    const s = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    HOLLAND_ITEMS.forEach(function (it, i) { s[it[1]] += answers[i]; });
    const order = Object.keys(s).sort(function (a, b) { return s[b] - s[a] || "RIASEC".indexOf(a) - "RIASEC".indexOf(b); });
    return { scores: s, order: order, code: order.slice(0, 3).join(""), max: 10 };
  }

  // ---------------- Đa trí tuệ (Howard Gardner)
  const MI_TYPES = {
    lin: { name: "Ngôn ngữ", tip: "Học bằng cách đọc to, ghi chép, tóm tắt bằng lời của mình, giảng lại cho bạn." },
    log: { name: "Logic – Toán học", tip: "Lập sơ đồ, tìm quy luật, chia bài học thành các bước lập luận." },
    spa: { name: "Không gian – Hình ảnh", tip: "Dùng sơ đồ tư duy, bút màu, hình vẽ, biểu đồ để ghi nhớ." },
    kin: { name: "Vận động – Cơ thể", tip: "Học qua thực hành, thí nghiệm, đi lại khi ôn bài, dùng thẻ ghi nhớ cầm tay." },
    mus: { name: "Âm nhạc", tip: "Ghép kiến thức thành vần, nhịp; nghe nhạc không lời khi tự học." },
    inter: { name: "Giao tiếp – Tương tác", tip: "Học nhóm, thảo luận, đóng vai, giảng bài cho bạn." },
    intra: { name: "Nội tâm – Tự nhận thức", tip: "Tự đặt mục tiêu, viết nhật ký học tập, tự đánh giá sau mỗi tuần." },
    nat: { name: "Thiên nhiên – Tự nhiên học", tip: "Phân loại, so sánh, liên hệ kiến thức với thế giới tự nhiên xung quanh." },
  };
  const MI_ITEMS = [
    ["Tôi thích đọc sách, viết bài", "lin"],
    ["Tôi dễ nhớ từ mới, câu nói hay, câu trích dẫn", "lin"],
    ["Tôi diễn đạt ý của mình bằng lời nói hoặc bài viết khá tốt", "lin"],
    ["Tôi thích giải câu đố, bài toán", "log"],
    ["Tôi hay tìm quy luật, mối liên hệ giữa các sự việc", "log"],
    ["Tôi luôn muốn biết nguyên nhân của mọi chuyện", "log"],
    ["Tôi dễ hình dung đồ vật trong không gian, đọc bản đồ tốt", "spa"],
    ["Tôi thích vẽ, vẽ sơ đồ, trang trí", "spa"],
    ["Tôi nhớ bài tốt hơn khi có hình ảnh, màu sắc", "spa"],
    ["Tôi học tốt hơn khi được làm, được thực hành", "kin"],
    ["Tôi chơi thể thao, nhảy múa hoặc làm đồ thủ công khá giỏi", "kin"],
    ["Tôi khó ngồi yên một chỗ quá lâu", "kin"],
    ["Tôi dễ nhớ giai điệu bài hát", "mus"],
    ["Tôi nhận ra ngay khi ai đó hát lệch tông, sai nhịp", "mus"],
    ["Tôi hay gõ nhịp, ngân nga khi làm việc", "mus"],
    ["Tôi dễ kết bạn và hòa đồng với mọi người", "inter"],
    ["Bạn bè hay tìm đến tôi để xin lời khuyên", "inter"],
    ["Tôi thích làm việc nhóm hơn làm một mình", "inter"],
    ["Tôi hiểu rõ cảm xúc và điểm mạnh, điểm yếu của mình", "intra"],
    ["Tôi thích dành thời gian suy ngẫm, viết nhật ký", "intra"],
    ["Tôi tự đặt mục tiêu và tự theo đuổi nó", "intra"],
    ["Tôi thích quan sát cây cối, con vật, thời tiết", "nat"],
    ["Tôi quan tâm đến các vấn đề môi trường", "nat"],
    ["Tôi dễ dàng phân loại, sắp xếp sự vật theo nhóm", "nat"],
  ];
  const ME_OPTIONS = [[0, "Không giống tôi"], [1, "Hơi giống tôi"], [2, "Rất giống tôi"]];

  function scoreMI(answers) {
    const s = {};
    Object.keys(MI_TYPES).forEach(function (k) { s[k] = 0; });
    MI_ITEMS.forEach(function (it, i) { s[it[1]] += answers[i]; });
    const order = Object.keys(s).sort(function (a, b) { return s[b] - s[a]; });
    return { scores: s, order: order, max: 6 };
  }

  window.ChamQuiz = {
    dass: { items: DASS_ITEMS, options: DASS_OPTIONS, score: scoreDass, levels: DASS_LEVELS },
    holland: { items: HOLLAND_ITEMS, options: LIKE_OPTIONS, score: scoreHolland, types: HOLLAND_TYPES },
    mi: { items: MI_ITEMS, options: ME_OPTIONS, score: scoreMI, types: MI_TYPES },
  };
})();
