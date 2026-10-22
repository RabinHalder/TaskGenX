/* TaskGenX admin: Settings (everything configurable) */
(function () {
  "use strict";
  const { esc, icon } = UI;
  const Pages = (window.AdminPages = window.AdminPages || {});

  I18n.extend(
    {
      "ad.s.title": "Settings",
      "ad.s.sub": "Change fees, limits, bonuses, levels and more. Each section has its own Save button.",
      "ad.s.level": "Level {n}",
      "ad.s.lvName": "Name (English)",
      "ad.s.lvNameBn": "Name (Bangla)",
      "ad.s.lvTasks": "Tasks needed",
      "ad.s.lvRefs": "Referrals needed",
      "ad.s.lvFee": "Withdraw fee (%)",
      "ad.s.lvLimit": "Monthly withdraw limit (₹)",
      "ad.s.lvNote": "To reach a level, a user needs both the task and the referral target. The first level always starts at 0.",
      "ad.s.addLevel": "Add level",
      "ad.s.catId": "ID (cannot change later)",
      "ad.s.catEn": "Name (English)",
      "ad.s.catBn": "Name (Bangla)",
      "ad.s.catIcon": "Icon",
      "ad.s.addCat": "Add category",
      "ad.s.catNote": "Tasks in a removed category stay in the system but will not show under any category tab.",
      "ad.s.faqQEn": "Question (English)",
      "ad.s.faqQBn": "Question (Bangla)",
      "ad.s.faqAEn": "Answer (English)",
      "ad.s.faqABn": "Answer (Bangla)",
      "ad.s.faqN": "Question {n}",
      "ad.s.addFaq": "Add question",
      "ad.s.envAdmins": "Main admins (set in the server environment, cannot be removed here)",
      "ad.s.extraAdmins": "Extra admins",
      "ad.s.noExtra": "No extra admins yet.",
      "ad.s.newAdmin": "Telegram ID of the new admin",
      "ad.s.addAdmin": "Add",
      "ad.s.adminNote": "Press Save to apply. New admins should open the bot once first.",
      "ad.s.rewards": "Check-in rewards per day (₹)",
      "ad.s.rewardsHint": "Separate with commas. Example: 1, 1, 2, 2, 3, 3, 5 means a 7-day cycle that starts again after day 7.",
      "ad.s.maintAsk": "Turn on maintenance mode?",
      "ad.s.maintText": "Only admins will be able to use the app until you turn it off.",
      "ad.s.saved": "Settings saved",
      "ad.s.loadFail": "Could not load settings.",
      "ad.s.badId": "Enter a valid Telegram ID",
    },
    {
      "ad.s.title": "সেটিংস",
      "ad.s.sub": "ফি, সীমা, বোনাস, লেভেল ও আরও অনেক কিছু বদলান। প্রতিটি অংশের নিজস্ব সেভ বাটন আছে।",
      "ad.s.level": "লেভেল {n}",
      "ad.s.lvName": "নাম (ইংরেজি)",
      "ad.s.lvNameBn": "নাম (বাংলা)",
      "ad.s.lvTasks": "প্রয়োজনীয় টাস্ক",
      "ad.s.lvRefs": "প্রয়োজনীয় রেফারেল",
      "ad.s.lvFee": "উইথড্র ফি (%)",
      "ad.s.lvLimit": "মাসিক উইথড্র সীমা (₹)",
      "ad.s.lvNote": "কোনো লেভেলে পৌঁছাতে টাস্ক ও রেফারেল, দুটো লক্ষ্যই পূরণ করতে হয়। প্রথম লেভেল সবসময় ০ থেকে শুরু।",
      "ad.s.addLevel": "লেভেল যোগ করুন",
      "ad.s.catId": "আইডি (পরে বদলানো যাবে না)",
      "ad.s.catEn": "নাম (ইংরেজি)",
      "ad.s.catBn": "নাম (বাংলা)",
      "ad.s.catIcon": "আইকন",
      "ad.s.addCat": "ক্যাটাগরি যোগ করুন",
      "ad.s.catNote": "মুছে ফেলা ক্যাটাগরির টাস্ক সিস্টেমে থাকবে, কিন্তু কোনো ক্যাটাগরি ট্যাবে দেখাবে না।",
      "ad.s.faqQEn": "প্রশ্ন (ইংরেজি)",
      "ad.s.faqQBn": "প্রশ্ন (বাংলা)",
      "ad.s.faqAEn": "উত্তর (ইংরেজি)",
      "ad.s.faqABn": "উত্তর (বাংলা)",
      "ad.s.faqN": "প্রশ্ন {n}",
      "ad.s.addFaq": "প্রশ্ন যোগ করুন",
      "ad.s.envAdmins": "মূল অ্যাডমিন (সার্ভারের environment-এ সেট করা, এখান থেকে সরানো যায় না)",
      "ad.s.extraAdmins": "অতিরিক্ত অ্যাডমিন",
      "ad.s.noExtra": "এখনো কোনো অতিরিক্ত অ্যাডমিন নেই।",
      "ad.s.newAdmin": "নতুন অ্যাডমিনের টেলিগ্রাম আইডি",
      "ad.s.addAdmin": "যোগ করুন",
      "ad.s.adminNote": "কার্যকর করতে সেভ চাপুন। নতুন অ্যাডমিনের আগে একবার বট খুলে নেওয়া ভালো।",
      "ad.s.rewards": "প্রতিদিনের চেক-ইন পুরস্কার (₹)",
      "ad.s.rewardsHint": "কমা দিয়ে আলাদা করুন। যেমন: 1, 1, 2, 2, 3, 3, 5 মানে ৭ দিনের চক্র, যা ৭ম দিনের পর আবার শুরু হবে।",
      "ad.s.maintAsk": "রক্ষণাবেক্ষণ মোড চালু করবেন?",
      "ad.s.maintText": "বন্ধ না করা পর্যন্ত শুধু অ্যাডমিনরা অ্যাপ ব্যবহার করতে পারবেন।",
      "ad.s.saved": "সেটিংস সেভ হয়েছে",
      "ad.s.loadFail": "সেটিংস লোড করা যায়নি।",
      "ad.s.badId": "সঠিক টেলিগ্রাম আইডি লিখুন",
    }
  );

  const CAT_ICONS = ["users", "smartphone", "play", "clipboard", "grid", "star", "gift", "zap", "globe", "message-circle", "link", "trending-up"];

  // [path, type, English label, Bangla label, English hint, Bangla hint]
  const SECTIONS = [
    {
      id: "general", icon: "settings", en: "General", bn: "সাধারণ",
      fields: [
        ["app.name", "text", "App name", "অ্যাপের নাম"],
        ["app.botUsername", "text", "Bot username (without @)", "বটের ইউজারনেম (@ ছাড়া)", "Filled in automatically when the server starts.", "সার্ভার চালু হলে নিজে থেকে বসে যায়।"],
        ["app.appShortName", "text", "Mini App short name", "মিনি অ্যাপের শর্ট নেম", "From BotFather (/newapp). Needed for referral links.", "BotFather (/newapp) থেকে পাওয়া। রেফারেল লিংকের জন্য দরকার।"],
        ["app.supportLink", "text", "Support link", "সাপোর্ট লিংক", "Example: https://t.me/yoursupport", "যেমন: https://t.me/yoursupport"],
        ["app.channelLink", "text", "Official channel link", "অফিসিয়াল চ্যানেল লিংক"],
        ["app.timezone", "text", "Timezone", "টাইমজোন", "Example: Asia/Kolkata. Used for daily limits and check-in.", "যেমন: Asia/Kolkata। দৈনিক সীমা ও চেক-ইনে ব্যবহার হয়।"],
        ["bonus.welcome", "num", "Welcome bonus (₹)", "স্বাগত বোনাস (₹)", "Given once to every new user. Use 0 for none.", "প্রতিটি নতুন ইউজার একবার পাবেন। না দিতে চাইলে 0।"],
        ["app.maintenance", "switch", "Maintenance mode", "রক্ষণাবেক্ষণ মোড", "Only admins can use the app.", "শুধু অ্যাডমিনরা অ্যাপ ব্যবহার করতে পারবেন।"],
        ["app.maintenanceMessage", "text", "Maintenance message", "রক্ষণাবেক্ষণের বার্তা"],
      ],
    },
    {
      id: "deposit", icon: "arrow-down-circle", en: "Deposit", bn: "ডিপোজিট",
      fields: [
        ["deposit.enabled", "switch", "Deposits enabled", "ডিপোজিট চালু"],
        ["deposit.min", "num", "Minimum deposit (₹)", "সর্বনিম্ন ডিপোজিট (₹)"],
        ["deposit.max", "num", "Maximum deposit (₹)", "সর্বোচ্চ ডিপোজিট (₹)"],
        ["deposit.feePercent", "num", "Deposit fee (%)", "ডিপোজিট ফি (%)", "Taken from the deposited amount.", "ডিপোজিটের পরিমাণ থেকে কাটা হয়।"],
      ],
    },
    {
      id: "withdraw", icon: "arrow-up-circle", en: "Withdraw", bn: "উইথড্র",
      fields: [
        ["withdraw.enabled", "switch", "Withdrawals enabled", "উইথড্র চালু"],
        ["withdraw.upiEnabled", "switch", "UPI withdrawal", "UPI উইথড্র"],
        ["withdraw.walletEnabled", "switch", "FINZO Wallet withdrawal", "FINZO ওয়ালেট উইথড্র"],
        ["withdraw.min", "num", "Minimum withdraw (₹)", "সর্বনিম্ন উইথড্র (₹)"],
        ["withdraw.max", "num", "Maximum per withdraw (₹)", "প্রতিবারে সর্বোচ্চ উইথড্র (₹)"],
        ["withdraw.dailyLimit", "num", "Daily limit per user (₹)", "প্রতি ইউজারের দৈনিক সীমা (₹)", "The monthly limit and the fee depend on the user's level (see Levels).", "মাসিক সীমা ও ফি ইউজারের লেভেলের ওপর নির্ভর করে (লেভেল অংশ দেখুন)।"],
        ["withdraw.autoPayout", "switch", "Automatic payout", "স্বয়ংক্রিয় পেআউট", "If off, every withdrawal waits for your approval.", "বন্ধ থাকলে প্রতিটি উইথড্র আপনার অনুমোদনের অপেক্ষায় থাকবে।"],
        ["withdraw.approvalEnabled", "switch", "Require approval for large amounts", "বড় অঙ্কে অনুমোদন লাগবে"],
        ["withdraw.approvalAbove", "num", "Approval needed from (₹)", "যে অঙ্ক থেকে অনুমোদন লাগবে (₹)"],
      ],
    },
    {
      id: "referral", icon: "gift", en: "Referral", bn: "রেফারেল",
      fields: [
        ["referral.enabled", "switch", "Referral program enabled", "রেফারেল প্রোগ্রাম চালু"],
        ["referral.l1Percent", "num", "Level 1 commission (%)", "লেভেল ১ কমিশন (%)", "Paid on the task earnings of directly invited users.", "সরাসরি আমন্ত্রিত ইউজারদের টাস্ক আয়ের ওপর।"],
        ["referral.l2Percent", "num", "Level 2 commission (%)", "লেভেল ২ কমিশন (%)", "Paid on the task earnings of users invited by them.", "তাদের আমন্ত্রিত ইউজারদের টাস্ক আয়ের ওপর।"],
      ],
    },
    {
      id: "checkin", icon: "calendar", en: "Daily check-in", bn: "দৈনিক চেক-ইন",
      fields: [["checkin.enabled", "switch", "Check-in enabled", "চেক-ইন চালু"]],
    },
    {
      id: "other", icon: "sliders", en: "Proof and club", bn: "প্রুফ ও ক্লাব",
      fields: [
        ["proof.maxSizeMB", "num", "Maximum screenshot size (MB)", "স্ক্রিনশটের সর্বোচ্চ সাইজ (MB)", "Between 1 and 10.", "১ থেকে ১০ এর মধ্যে।"],
        ["club.enabled", "switch", "Club feed enabled", "ক্লাব ফিড চালু"],
        ["club.showLimit", "num", "Club feed size", "ক্লাব ফিডে কতগুলো দেখাবে", "Between 5 and 100.", "৫ থেকে ১০০ এর মধ্যে।"],
      ],
    },
    { id: "levels", icon: "award", en: "Levels", bn: "লেভেল" },
    { id: "categories", icon: "grid", en: "Task categories", bn: "টাস্ক ক্যাটাগরি" },
    { id: "faq", icon: "help-circle", en: "FAQ", bn: "সচরাচর জিজ্ঞাসা" },
    { id: "admins", icon: "shield", en: "Admins", bn: "অ্যাডমিন" },
  ];

  const get = (obj, path) => path.split(".").reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), obj);
  const clone = (x) => JSON.parse(JSON.stringify(x));

  const Page = (Pages.settings = {
    id: "settings",
    root: null,
    S: null,
    env: [],
    W: { levels: [], categories: [], faq: [], admins: [] },
    open: new Set(["general"]),
    failed: false,

    init(root) {
      this.root = root;
      root.innerHTML = UI.skeleton("card", 4);
      UI.on(root, "click", "[data-act]", (e, el) => this.act(el));
      UI.on(root, "click", ".switch[data-path]", (e, el) => {
        el.classList.toggle("on");
        el.setAttribute("aria-checked", el.classList.contains("on"));
        UI.haptic("select");
      });
    },

    show() {
      this.load();
    },

    async load() {
      try {
        const r = await API.get("/admin/settings");
        this.S = r.settings;
        this.env = r.envAdmins || [];
        this.resetWorking();
        this.failed = false;
      } catch (e) {
        if (!this.S) this.failed = true;
        UI.handleError(e);
      }
      this.render();
    },

    resetWorking() {
      const S = this.S;
      this.W = {
        levels: clone(S.levels || []),
        categories: (S.categories || []).map((c) => ({ id: c.id, en: c.en, bn: c.bn, icon: c.icon, isNew: false })),
        faq: clone(S.faq || []),
        admins: (S.admins || []).slice(),
      };
    },

    secOf(id) {
      return SECTIONS.find((s) => s.id === id);
    },

    bodyEl(id) {
      return this.root.querySelector('[data-body="' + id + '"]');
    },

    paintBody(id) {
      const el = this.bodyEl(id);
      if (el) el.innerHTML = this.bodyHtml(this.secOf(id));
    },

    act(el) {
      const a = el.dataset.act;
      const i = Number(el.dataset.i);
      const id = el.dataset.sec;
      if (a === "toggle") {
        const card = el.closest(".acc");
        card.classList.toggle("open");
        if (card.classList.contains("open")) this.open.add(id);
        else this.open.delete(id);
        UI.haptic("select");
      } else if (a === "save") this.save(id, el);
      else if (a === "lvAdd") {
        this.readLevels();
        const last = this.W.levels[this.W.levels.length - 1] || { minTasks: 0, minReferrals: 0, withdrawFeePercent: 5, monthlyWithdrawLimit: 10000 };
        if (this.W.levels.length >= 15) return;
        this.W.levels.push({ name: "New level", nameBn: "", minTasks: Number(last.minTasks) + 10, minReferrals: Number(last.minReferrals) + 5, withdrawFeePercent: last.withdrawFeePercent, monthlyWithdrawLimit: last.monthlyWithdrawLimit });
        this.paintBody("levels");
      } else if (a === "lvDel") {
        this.readLevels();
        this.W.levels.splice(i, 1);
        this.paintBody("levels");
      } else if (a === "catAdd") {
        this.readCats();
        if (this.W.categories.length >= 20) return;
        this.W.categories.push({ id: "", en: "", bn: "", icon: "grid", isNew: true });
        this.paintBody("categories");
      } else if (a === "catDel") {
        this.readCats();
        this.W.categories.splice(i, 1);
        this.paintBody("categories");
      } else if (a === "faqAdd") {
        this.readFaq();
        if (this.W.faq.length >= 30) return;
        this.W.faq.push({ qEn: "", qBn: "", aEn: "", aBn: "" });
        this.paintBody("faq");
      } else if (a === "faqDel") {
        this.readFaq();
        this.W.faq.splice(i, 1);
        this.paintBody("faq");
      } else if (a === "admAdd") {
        const input = this.root.querySelector("#st-newadm");
        const v = Number(String(input.value).trim());
        if (!Number.isInteger(v) || v <= 0) return UI.toast(t("ad.s.badId"), "error");
        if (!this.W.admins.includes(v) && !this.env.includes(v)) this.W.admins.push(v);
        this.paintBody("admins");
      } else if (a === "admDel") {
        this.W.admins.splice(i, 1);
        this.paintBody("admins");
      }
    },

    /* ----------------------------- RENDER ----------------------------- */

    render() {
      if (!this.root) return;
      if (this.failed) {
        this.root.innerHTML = UI.emptyState("alert", t("ad.s.loadFail")) + '<button class="btn btn-primary btn-block" data-act="reload">' + esc(t("common.retry")) + "</button>";
        const b = this.root.querySelector('[data-act="reload"]');
        if (b) b.onclick = () => this.load();
        return;
      }
      if (!this.S) {
        this.root.innerHTML = UI.skeleton("card", 4);
        return;
      }
      this.root.innerHTML =
        '<div class="page-head"><div class="page-title">' + esc(t("ad.s.title")) + '</div><div class="page-sub">' + esc(t("ad.s.sub")) + "</div></div>" +
        SECTIONS.map(
          (s) =>
            '<div class="card acc ' + (this.open.has(s.id) ? "open" : "") + '">' +
            '<button class="acc-head" data-act="toggle" data-sec="' + s.id + '"><div class="row-ico">' + icon(s.icon) + "</div>" +
            '<div class="menu-label">' + esc(I18n.pick(s.en, s.bn)) + "</div>" + icon("chevron-down", "sm").replace('class="icon sm"', 'class="icon sm chev"') + "</button>" +
            '<div class="acc-body" data-body="' + s.id + '">' + this.bodyHtml(s) + "</div></div>"
        ).join("");
    },

    fieldHtml(f) {
      const path = f[0], type = f[1];
      const label = I18n.pick(f[2], f[3]);
      const hint = f[4] ? I18n.pick(f[4], f[5]) : "";
      const val = get(this.S, path);
      if (type === "switch") {
        return (
          '<div class="switch-row"><div class="grow"><div class="card-title">' + esc(label) + "</div>" +
          (hint ? '<div class="card-sub">' + esc(hint) + "</div>" : "") + "</div>" +
          '<button class="switch ' + (val ? "on" : "") + '" data-path="' + path + '" data-type="switch" role="switch" aria-checked="' + !!val + '"></button></div>'
        );
      }
      return (
        '<div class="field"><label>' + esc(label) + '</label><input class="input" data-path="' + path + '" data-type="' + type + '" ' +
        (type === "num" ? 'inputmode="decimal"' : 'autocapitalize="off"') + ' autocomplete="off" value="' + esc(val === undefined || val === null ? "" : val) + '" />' +
        (hint ? '<div class="field-hint">' + esc(hint) + "</div>" : "") + "</div>"
      );
    },

    bodyHtml(s) {
      let h = "";
      if (s.fields) h += s.fields.map((f) => this.fieldHtml(f)).join("");
      if (s.id === "checkin") {
        h +=
          '<div class="field"><label>' + esc(t("ad.s.rewards")) + '</label><input class="input" id="st-rewards" inputmode="decimal" value="' + esc((this.S.checkin.rewards || []).join(", ")) + '" />' +
          '<div class="field-hint">' + esc(t("ad.s.rewardsHint")) + "</div></div>";
      } else if (s.id === "levels") h += this.levelsHtml();
      else if (s.id === "categories") h += this.catsHtml();
      else if (s.id === "faq") h += this.faqHtml();
      else if (s.id === "admins") h += this.adminsHtml();
      return h + '<button class="btn btn-primary btn-block" data-act="save" data-sec="' + s.id + '" style="margin-top:6px">' + icon("check", "sm") + esc(t("common.save")) + "</button>";
    },

    cell(label, key, val, extra) {
      return '<div class="field"><label>' + esc(label) + '</label><input class="input" data-k="' + key + '" value="' + esc(val === undefined || val === null ? "" : val) + '" autocomplete="off" ' + (extra || "") + " /></div>";
    },

    delBtn(act, i) {
      return '<button class="icon-btn" style="width:32px;height:32px" data-act="' + act + '" data-i="' + i + '" aria-label="' + esc(t("common.remove")) + '">' + icon("trash", "sm") + "</button>";
    },

    levelsHtml() {
      const L = this.W.levels;
      return (
        '<div class="note">' + icon("info") + "<div>" + esc(t("ad.s.lvNote")) + "</div></div>" +
        L.map(
          (x, i) =>
            '<div class="edit-card" data-lv="' + i + '"><div class="hd"><span>' + esc(t("ad.s.level", { n: i + 1 })) + "</span>" + (L.length > 1 ? this.delBtn("lvDel", i) : "") + "</div>" +
            '<div class="two">' + this.cell(t("ad.s.lvName"), "name", x.name) + this.cell(t("ad.s.lvNameBn"), "nameBn", x.nameBn) + "</div>" +
            '<div class="two">' + this.cell(t("ad.s.lvTasks"), "minTasks", i === 0 ? 0 : x.minTasks, 'inputmode="numeric"' + (i === 0 ? " disabled" : "")) +
            this.cell(t("ad.s.lvRefs"), "minReferrals", i === 0 ? 0 : x.minReferrals, 'inputmode="numeric"' + (i === 0 ? " disabled" : "")) + "</div>" +
            '<div class="two">' + this.cell(t("ad.s.lvFee"), "withdrawFeePercent", x.withdrawFeePercent, 'inputmode="decimal"') +
            this.cell(t("ad.s.lvLimit"), "monthlyWithdrawLimit", x.monthlyWithdrawLimit, 'inputmode="decimal"') + "</div></div>"
        ).join("") +
        (L.length < 15 ? '<button class="btn btn-ghost btn-block" data-act="lvAdd" style="margin-bottom:14px">' + icon("plus", "sm") + esc(t("ad.s.addLevel")) + "</button>" : "")
      );
    },

    catsHtml() {
      const C = this.W.categories;
      return (
        '<div class="note">' + icon("info") + "<div>" + esc(t("ad.s.catNote")) + "</div></div>" +
        C.map(
          (c, i) =>
            '<div class="edit-card" data-cat="' + i + '"><div class="hd"><span>' + esc(c.en || c.id || "#" + (i + 1)) + "</span>" + (C.length > 1 ? this.delBtn("catDel", i) : "") + "</div>" +
            '<div class="two">' + this.cell(t("ad.s.catId"), "id", c.id, 'maxlength="20" autocapitalize="off"' + (c.isNew ? "" : " readonly")) +
            '<div class="field"><label>' + esc(t("ad.s.catIcon")) + '</label><select class="input" data-k="icon">' +
            CAT_ICONS.map((n) => '<option value="' + n + '"' + (c.icon === n ? " selected" : "") + ">" + n + "</option>").join("") +
            "</select></div></div>" +
            '<div class="two">' + this.cell(t("ad.s.catEn"), "en", c.en, 'maxlength="30"') + this.cell(t("ad.s.catBn"), "bn", c.bn, 'maxlength="30"') + "</div></div>"
        ).join("") +
        (C.length < 20 ? '<button class="btn btn-ghost btn-block" data-act="catAdd" style="margin-bottom:14px">' + icon("plus", "sm") + esc(t("ad.s.addCat")) + "</button>" : "")
      );
    },

    faqHtml() {
      const F = this.W.faq;
      const area = (label, key, val, max) => '<div class="field"><label>' + esc(label) + '</label><textarea class="input" data-k="' + key + '" maxlength="' + max + '">' + esc(val) + "</textarea></div>";
      return (
        F.map(
          (x, i) =>
            '<div class="edit-card" data-faq="' + i + '"><div class="hd"><span>' + esc(t("ad.s.faqN", { n: i + 1 })) + "</span>" + this.delBtn("faqDel", i) + "</div>" +
            this.cell(t("ad.s.faqQEn"), "qEn", x.qEn, 'maxlength="200"') + this.cell(t("ad.s.faqQBn"), "qBn", x.qBn, 'maxlength="200"') +
            area(t("ad.s.faqAEn"), "aEn", x.aEn, 1000) + area(t("ad.s.faqABn"), "aBn", x.aBn, 1000) + "</div>"
        ).join("") +
        (F.length < 30 ? '<button class="btn btn-ghost btn-block" data-act="faqAdd" style="margin-bottom:14px">' + icon("plus", "sm") + esc(t("ad.s.addFaq")) + "</button>" : "")
      );
    },

    adminsHtml() {
      return (
        '<div class="card-sub" style="margin-bottom:8px">' + esc(t("ad.s.envAdmins")) + "</div>" +
        '<div class="tag-list">' + this.env.map((id) => '<span class="tag">' + icon("lock", "sm") + esc(id) + "</span>").join("") + "</div>" +
        '<div class="card-sub" style="margin:16px 0 8px">' + esc(t("ad.s.extraAdmins")) + "</div>" +
        (this.W.admins.length
          ? '<div class="tag-list">' + this.W.admins.map((id, i) => '<span class="tag">' + esc(id) + '<button data-act="admDel" data-i="' + i + '" aria-label="' + esc(t("common.remove")) + '">' + icon("x", "sm") + "</button></span>").join("") + "</div>"
          : '<div class="card-sub">' + esc(t("ad.s.noExtra")) + "</div>") +
        '<div class="field" style="margin-top:14px"><label>' + esc(t("ad.s.newAdmin")) + '</label><div class="flex"><input class="input" id="st-newadm" inputmode="numeric" autocomplete="off" />' +
        '<button class="btn btn-ghost" data-act="admAdd">' + esc(t("ad.s.addAdmin")) + "</button></div></div>" +
        '<div class="field-hint" style="margin-bottom:14px">' + esc(t("ad.s.adminNote")) + "</div>"
      );
    },

    /* ----------------------------- READ FORMS ----------------------------- */

    readLevels() {
      const box = this.bodyEl("levels");
      if (!box) return;
      this.W.levels = Array.from(box.querySelectorAll("[data-lv]")).map((card) => {
        const g = (k) => card.querySelector('[data-k="' + k + '"]').value.trim();
        return { name: g("name"), nameBn: g("nameBn"), minTasks: g("minTasks"), minReferrals: g("minReferrals"), withdrawFeePercent: g("withdrawFeePercent"), monthlyWithdrawLimit: g("monthlyWithdrawLimit") };
      });
    },

    readCats() {
      const box = this.bodyEl("categories");
      if (!box) return;
      this.W.categories = Array.from(box.querySelectorAll("[data-cat]")).map((card, i) => {
        const g = (k) => card.querySelector('[data-k="' + k + '"]').value.trim();
        return { id: g("id"), en: g("en"), bn: g("bn"), icon: g("icon"), isNew: this.W.categories[i] ? this.W.categories[i].isNew : false };
      });
    },

    readFaq() {
      const box = this.bodyEl("faq");
      if (!box) return;
      this.W.faq = Array.from(box.querySelectorAll("[data-faq]")).map((card) => {
        const g = (k) => card.querySelector('[data-k="' + k + '"]').value.trim();
        return { qEn: g("qEn"), qBn: g("qBn"), aEn: g("aEn"), aBn: g("aBn") };
      });
    },

    collectFields(el) {
      const out = {};
      el.querySelectorAll("[data-path]").forEach((node) => {
        const parts = node.dataset.path.split(".");
        const v = node.dataset.type === "switch" ? node.classList.contains("on") : node.value.trim();
        let o = out;
        for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] = o[parts[i]] || {};
        o[parts[parts.length - 1]] = v;
      });
      return out;
    },

    /* ----------------------------- SAVE ----------------------------- */

    async save(id, btn) {
      const sec = this.secOf(id);
      const el = this.bodyEl(id);
      let payload = {};
      if (sec.fields) payload = this.collectFields(el);

      if (id === "checkin") {
        const arr = el.querySelector("#st-rewards").value.split(/[\s,]+/).filter(Boolean);
        payload.checkin = payload.checkin || {};
        payload.checkin.rewards = arr;
      } else if (id === "levels") {
        this.readLevels();
        payload = { levels: this.W.levels };
      } else if (id === "categories") {
        this.readCats();
        payload = { categories: this.W.categories.map((c) => ({ id: c.id, en: c.en, bn: c.bn, icon: c.icon })) };
      } else if (id === "faq") {
        this.readFaq();
        payload = { faq: this.W.faq };
      } else if (id === "admins") {
        payload = { admins: this.W.admins };
      } else if (id === "general" && payload.app && payload.app.maintenance && !this.S.app.maintenance) {
        const ok = await UI.confirm({ title: t("ad.s.maintAsk"), text: t("ad.s.maintText"), danger: true });
        if (!ok) return;
      }

      const r = await UI.withBusy(btn, () => API.put("/admin/settings", payload));
      if (!r) return;
      this.S = r.settings;
      this.env = r.envAdmins || this.env;
      this.resetWorking();
      this.paintBody(id);
      UI.toast(t("ad.s.saved"), "success");
      App.refreshMe({ silent: true });
    },
  });
})();
