/* TaskGenX admin: Broadcast */
(function () {
  "use strict";
  const { esc, icon } = UI;
  const Pages = (window.AdminPages = window.AdminPages || {});

  I18n.extend(
    {
      "ad.b.title": "Broadcast",
      "ad.b.sub": "Send a message to your users through the bot.",
      "ad.b.audience": "Audience",
      "ad.b.level": "Level number",
      "ad.b.textEn": "Message (English)",
      "ad.b.textBn": "Message (Bangla)",
      "ad.b.textHint": "Write plain text only. Users with Bangla see the Bangla text, others see English. If one is empty, the other is used.",
      "ad.b.btnText": "Button text (optional)",
      "ad.b.btnUrl": "Button link (optional)",
      "ad.b.btnHint": "Leave the link empty and the button will open the app.",
      "ad.b.preview": "Count users",
      "ad.b.count": "{n} users will receive this message.",
      "ad.b.test": "Send test to me",
      "ad.b.testOk": "Test sent. Check your bot chat.",
      "ad.b.send": "Send broadcast",
      "ad.b.confirmTitle": "Send to {n} users?",
      "ad.b.confirmText": "This cannot be undone. Use the test button first to check how it looks.",
      "ad.b.started": "Broadcast started",
      "ad.b.running": "Sending...",
      "ad.b.last": "Last broadcast",
      "ad.b.finished": "Broadcast finished",
      "ad.b.sent": "Sent",
      "ad.b.failed": "Failed",
      "ad.b.blocked": "Blocked",
      "ad.b.total": "Total",
      "ad.b.keepOpen": "Do not deploy or restart the server while sending.",
      "ad.b.seg.all": "All users",
      "ad.b.seg.active7": "Active in the last 7 days",
      "ad.b.seg.inactive7": "Inactive for 7 days",
      "ad.b.seg.new7": "Joined in the last 7 days",
      "ad.b.seg.depositors": "Users who deposited",
      "ad.b.seg.nondepositors": "Users who never deposited",
      "ad.b.seg.level": "A specific level",
      "ad.b.seg.lang_en": "English users",
      "ad.b.seg.lang_bn": "Bangla users",
    },
    {
      "ad.b.title": "ব্রডকাস্ট",
      "ad.b.sub": "বটের মাধ্যমে ইউজারদের বার্তা পাঠান।",
      "ad.b.audience": "কারা পাবেন",
      "ad.b.level": "লেভেল নম্বর",
      "ad.b.textEn": "বার্তা (ইংরেজি)",
      "ad.b.textBn": "বার্তা (বাংলা)",
      "ad.b.textHint": "শুধু সাধারণ লেখা লিখুন। বাংলা ভাষার ইউজাররা বাংলা বার্তা, বাকিরা ইংরেজি বার্তা পাবেন। একটি ফাঁকা থাকলে অন্যটি যাবে।",
      "ad.b.btnText": "বাটনের লেখা (ঐচ্ছিক)",
      "ad.b.btnUrl": "বাটনের লিংক (ঐচ্ছিক)",
      "ad.b.btnHint": "লিংক ফাঁকা রাখলে বাটনটি অ্যাপ খুলবে।",
      "ad.b.preview": "কতজন পাবেন দেখুন",
      "ad.b.count": "{n} জন ইউজার এই বার্তা পাবেন।",
      "ad.b.test": "আমাকে টেস্ট পাঠান",
      "ad.b.testOk": "টেস্ট পাঠানো হয়েছে। বটের চ্যাট দেখুন।",
      "ad.b.send": "ব্রডকাস্ট পাঠান",
      "ad.b.confirmTitle": "{n} জনকে পাঠাবেন?",
      "ad.b.confirmText": "এটি ফেরানো যাবে না। কেমন দেখাবে জানতে আগে টেস্ট বাটন ব্যবহার করুন।",
      "ad.b.started": "ব্রডকাস্ট শুরু হয়েছে",
      "ad.b.running": "পাঠানো হচ্ছে...",
      "ad.b.last": "শেষ ব্রডকাস্ট",
      "ad.b.finished": "ব্রডকাস্ট শেষ হয়েছে",
      "ad.b.sent": "পাঠানো হয়েছে",
      "ad.b.failed": "ব্যর্থ",
      "ad.b.blocked": "ব্লক করা",
      "ad.b.total": "মোট",
      "ad.b.keepOpen": "পাঠানোর সময় সার্ভার ডিপ্লয় বা রিস্টার্ট করবেন না।",
      "ad.b.seg.all": "সব ইউজার",
      "ad.b.seg.active7": "গত ৭ দিনে সক্রিয়",
      "ad.b.seg.inactive7": "৭ দিন ধরে নিষ্ক্রিয়",
      "ad.b.seg.new7": "গত ৭ দিনে যোগ দিয়েছেন",
      "ad.b.seg.depositors": "যারা ডিপোজিট করেছেন",
      "ad.b.seg.nondepositors": "যারা কখনো ডিপোজিট করেননি",
      "ad.b.seg.level": "নির্দিষ্ট একটি লেভেল",
      "ad.b.seg.lang_en": "ইংরেজি ভাষার ইউজার",
      "ad.b.seg.lang_bn": "বাংলা ভাষার ইউজার",
    }
  );

  const SEGS = ["all", "active7", "inactive7", "new7", "depositors", "nondepositors", "level", "lang_en", "lang_bn"];

  const Page = (Pages.broadcast = {
    id: "broadcast",
    root: null,
    st: { segment: "all", level: "2", en: "", bn: "", btnText: "", btnUrl: "" },
    job: null,
    wasRunning: false,
    timer: null,
    active: false,

    init(root) {
      this.root = root;
      this.render();
      UI.on(root, "input", "[data-f]", (e, el) => {
        this.st[el.dataset.f] = el.value;
      });
      UI.on(root, "change", "[data-f]", (e, el) => {
        this.st[el.dataset.f] = el.value;
        if (el.dataset.f === "segment") this.toggleLevel();
      });
      UI.on(root, "click", "[data-act]", (e, el) => {
        const a = el.dataset.act;
        if (a === "preview") this.preview(el);
        else if (a === "test") this.test(el);
        else if (a === "send") this.send(el);
      });
    },

    show() {
      this.active = true;
      this.loadStatus();
    },

    hide() {
      this.active = false;
      clearTimeout(this.timer);
    },

    payload() {
      const s = this.st;
      return { segment: s.segment, level: s.level, textEn: s.en, textBn: s.bn, buttonText: s.btnText, buttonUrl: s.btnUrl };
    },

    toggleLevel() {
      const box = this.root.querySelector("#bc-level-box");
      if (box) box.classList.toggle("hidden", this.st.segment !== "level");
      const c = this.root.querySelector("#bc-count");
      if (c) c.textContent = "";
    },

    render() {
      if (!this.root) return;
      const s = this.st;
      this.root.innerHTML =
        '<div class="page-head"><div class="page-title">' + esc(t("ad.b.title")) + '</div><div class="page-sub">' + esc(t("ad.b.sub")) + "</div></div>" +
        '<div id="bc-status"></div>' +
        '<div class="card">' +
        '<div class="field"><label>' + esc(t("ad.b.audience")) + '</label><select class="input" data-f="segment">' +
        SEGS.map((id) => '<option value="' + id + '"' + (s.segment === id ? " selected" : "") + ">" + esc(t("ad.b.seg." + id)) + "</option>").join("") +
        "</select></div>" +
        '<div class="field ' + (s.segment === "level" ? "" : "hidden") + '" id="bc-level-box"><label>' + esc(t("ad.b.level")) + '</label><input class="input" data-f="level" inputmode="numeric" value="' + esc(s.level) + '" /></div>' +
        '<div class="field"><label>' + esc(t("ad.b.textEn")) + '</label><textarea class="input" data-f="en" maxlength="3500">' + esc(s.en) + "</textarea></div>" +
        '<div class="field"><label>' + esc(t("ad.b.textBn")) + '</label><textarea class="input" data-f="bn" maxlength="3500">' + esc(s.bn) + '</textarea><div class="field-hint">' + esc(t("ad.b.textHint")) + "</div></div>" +
        '<div class="two"><div class="field"><label>' + esc(t("ad.b.btnText")) + '</label><input class="input" data-f="btnText" maxlength="40" value="' + esc(s.btnText) + '" /></div>' +
        '<div class="field"><label>' + esc(t("ad.b.btnUrl")) + '</label><input class="input" data-f="btnUrl" autocapitalize="off" placeholder="https://" value="' + esc(s.btnUrl) + '" /></div></div>' +
        '<div class="field-hint" style="margin:-6px 0 14px">' + esc(t("ad.b.btnHint")) + "</div>" +
        '<div class="card-sub" id="bc-count" style="margin-bottom:12px;font-weight:600"></div>' +
        '<div class="ad-actions" style="margin-top:0">' +
        '<button class="btn btn-ghost" data-act="preview">' + icon("users", "sm") + esc(t("ad.b.preview")) + "</button>" +
        '<button class="btn btn-ghost" data-act="test">' + icon("send", "sm") + esc(t("ad.b.test")) + "</button></div>" +
        '<button class="btn btn-primary btn-block" data-act="send" style="margin-top:10px">' + icon("megaphone", "sm") + esc(t("ad.b.send")) + "</button>" +
        "</div>";
      this.paintStatus();
    },

    paintStatus() {
      const box = this.root && this.root.querySelector("#bc-status");
      if (!box) return;
      const j = this.job;
      if (!j || !j.startedAt) {
        box.innerHTML = "";
        return;
      }
      const done = j.sent + j.failed + j.blocked;
      const pct = j.total ? Math.min(100, Math.round((done / j.total) * 100)) : 0;
      const stat = (n, k) => "<div><b>" + UI.num(n) + "</b><span>" + esc(t(k)) + "</span></div>";
      box.innerHTML =
        '<div class="card"><div class="flex between"><div class="card-title">' + esc(j.running ? t("ad.b.running") : t("ad.b.last")) + "</div><b>" + pct + "%</b></div>" +
        '<div class="progress" style="margin-top:10px"><span style="width:' + pct + '%"></span></div>' +
        '<div class="bc-stats">' + stat(j.sent, "ad.b.sent") + stat(j.failed, "ad.b.failed") + stat(j.blocked, "ad.b.blocked") + stat(j.total, "ad.b.total") + "</div>" +
        (j.running ? '<div class="note" style="margin:12px 0 0">' + icon("info") + "<div>" + esc(t("ad.b.keepOpen")) + "</div></div>" : "") +
        "</div>";
    },

    async loadStatus() {
      clearTimeout(this.timer);
      try {
        this.job = await API.get("/admin/broadcast/status");
      } catch (e) {
        return;
      }
      if (this.wasRunning && !this.job.running) UI.toast(t("ad.b.finished"), "success");
      this.wasRunning = !!this.job.running;
      this.paintStatus();
      if (this.job.running && this.active) {
        this.timer = setTimeout(() => this.loadStatus(), 2000);
      }
    },

    async preview(btn) {
      const r = await UI.withBusy(btn, () => API.post("/admin/broadcast/preview", { segment: this.st.segment, level: this.st.level }));
      if (!r) return;
      this.root.querySelector("#bc-count").textContent = t("ad.b.count", { n: UI.num(r.count) });
    },

    async test(btn) {
      const r = await UI.withBusy(btn, () => API.post("/admin/broadcast/test", this.payload()));
      if (r) UI.toast(t("ad.b.testOk"), "success");
    },

    async send(btn) {
      const body = this.payload();
      const count = await UI.withBusy(btn, async () => {
        const r = await API.post("/admin/broadcast/preview", { segment: body.segment, level: body.level });
        this.root.querySelector("#bc-count").textContent = t("ad.b.count", { n: UI.num(r.count) });
        return r.count;
      });
      if (count === undefined) return;
      const ok = await UI.confirm({
        title: t("ad.b.confirmTitle", { n: UI.num(count) }),
        text: t("ad.b.confirmText"),
        okText: t("ad.b.send"),
        danger: true,
      });
      if (!ok) return;
      const r = await UI.withBusy(btn, () => API.post("/admin/broadcast", body));
      if (!r) return;
      UI.toast(t("ad.b.started"), "success");
      this.wasRunning = true;
      this.loadStatus();
    },
  });
})();
