/* TaskGenX admin: Settings (everything configurable) */
(function () {
  "use strict";
  const { esc, icon } = UI;
  const Pages = (window.AdminPages = window.AdminPages || {});

  I18n.extend(
    {
      "ad.s.title": "Settings",
      "ad.s.sub": "Change fees, limits, rewards, levels and more. Each section has its own Save button.",
      "ad.s.cName": "Name",
      "ad.s.cTasks": "Tasks",
      "ad.s.cRefs": "Referrals",
      "ad.s.cFee": "Fee %",
      "ad.s.cWd": "Withdrawals / month",
      "ad.s.cId": "ID",
      "ad.s.cIcon": "Icon",
      "ad.s.lvNote": "One line per level. Tasks and Referrals are the mission a user must complete at THAT level (both) to move up. Example: Silver = 10 tasks and 5 referrals takes the user from Silver to Gold. Bronze can have a mission too. The last level has no mission. Withdrawals / month: how many withdrawals a user can make each month. Level names are shown in English.",
      "ad.s.addLevel": "Add level",
      "ad.s.catNote": "One line per category (English names). The ID cannot be changed later. Tasks in a removed category stay in the system but will not show under any category tab.",
      "ad.s.addCat": "Add category",
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
      "ad.s.sub": "ফি, সীমা, পুরস্কার, লেভেল ও আরও অনেক কিছু বদলান। প্রতিটি অংশের নিজস্ব সেভ বাটন আছে।",
      "ad.s.cName": "নাম",
      "ad.s.cTasks": "টাস্ক",
      "ad.s.cRefs": "রেফারেল",
      "ad.s.cFee": "ফি %",
      "ad.s.cWd": "উইথড্র / মাস",
      "ad.s.cId": "আইডি",
      "ad.s.cIcon": "আইকন",
      "ad.s.lvNote": "প্রতি লেভেল একটি লাইনে। Tasks ও Referrals হলো ওই লেভেলে থেকে ইউজারকে যা শেষ করতে হবে (দুটোই), তবেই পরের লেভেলে উঠবেন। যেমন: Silver = ১০ টাস্ক ও ৫ রেফারেল মানে Silver থেকে Gold-এ উঠতে এটুকু করতে হবে। Bronze-এও মিশন দেওয়া যায়। শেষ লেভেলের কোনো মিশন নেই। Withdrawals / month: একজন ইউজার প্রতি মাসে কতবার উইথড্র করতে পারবেন। লেভেলের নাম ইংরেজিতে দেখাবে।",
      "ad.s.addLevel": "লেভেল যোগ করুন",
      "ad.s.catNote": "প্রতি ক্যাটাগরি একটি লাইনে (ইংরেজি নাম)। আইডি পরে বদলানো যাবে না। মুছে ফেলা ক্যাটাগরির টাস্ক সিস্টেমে থাকবে, কিন্তু কোনো ক্যাটাগরি ট্যাবে দেখাবে না।",
      "ad.s.addCat": "ক্যাটাগরি যোগ করুন",
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

  // field: [path, type, English label, Bangla label, English hint, Bangla hint, select options]
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
        ["deposit.min", "num", "Minimum deposit (₹)", "সর্বনিম্ন ডিপোজিট (₹)", "FINZO accepts ₹50 to ₹1,00,000, whole rupees only.", "FINZO ₹50 থেকে ₹1,00,000 পর্যন্ত নেয়, শুধু পূর্ণ টাকা।"],
        ["deposit.max", "num", "Maximum deposit (₹)", "সর্বোচ্চ ডিপোজিট (₹)"],
        ["deposit.feePercent", "num", "Deposit fee (%)", "ডিপোজিট ফি (%)", "Taken from the deposited amount. FINZO itself keeps 5% of every UPI deposit.", "ডিপোজিটের পরিমাণ থেকে কাটা হয়। FINZO নিজে প্রতিটি UPI ডিপোজিটের ৫% রাখে।"],
      ],
    },
    {
      id: "withdraw", icon: "arrow-up-circle", en: "Withdraw rules", bn: "উইথড্র নিয়ম",
      fields: [
        ["withdraw.enabled", "switch", "Withdrawals enabled", "উইথড্র চালু"],
        ["withdraw.autoPayout", "switch", "Automatic payout", "স্বয়ংক্রিয় পেআউট", "If off, every withdrawal waits for your approval.", "বন্ধ থাকলে প্রতিটি উইথড্র আপনার অনুমোদনের অপেক্ষায় থাকবে।"],
        ["withdraw.approvalEnabled", "switch", "Require approval for large amounts", "বড় অঙ্কে অনুমোদন লাগবে"],
        ["withdraw.approvalAbove", "num", "Approval needed from (₹)", "যে অঙ্ক থেকে অনুমোদন লাগবে (₹)", "The fee and the monthly withdrawal count depend on the user's level.", "ফি ও মাসে কতবার উইথড্র, ইউজারের লেভেলের ওপর নির্ভর করে।"],
      ],
    },
    {
      id: "upi", icon: "smartphone", en: "UPI withdraw limits", bn: "UPI উইথড্র সীমা",
      fields: [
        ["withdraw.upi.enabled", "switch", "UPI withdrawal enabled", "UPI উইথড্র চালু"],
        ["withdraw.upi.min", "num", "Minimum per withdrawal (₹)", "প্রতিবারে সর্বনিম্ন (₹)", "FINZO sends ₹50 to ₹50,000 per UPI payout.", "FINZO প্রতিটি UPI পেআউটে ₹50 থেকে ₹50,000 পাঠায়।"],
        ["withdraw.upi.max", "num", "Maximum per withdrawal (₹)", "প্রতিবারে সর্বোচ্চ (₹)"],
        ["withdraw.upi.dailyLimit", "num", "Daily limit per user (₹)", "প্রতি ইউজারের দৈনিক সীমা (₹)"],
      ],
    },
    {
      id: "wallet", icon: "wallet", en: "FINZO Wallet withdraw limits", bn: "FINZO Wallet উইথড্র সীমা",
      fields: [
        ["withdraw.wallet.enabled", "switch", "Wallet withdrawal enabled", "Wallet উইথড্র চালু"],
        ["withdraw.wallet.min", "num", "Minimum per withdrawal (₹)", "প্রতিবারে সর্বনিম্ন (₹)", "FINZO sends ₹1 to ₹10,000 per wallet payment.", "FINZO প্রতিটি ওয়ালেট পেমেন্টে ₹1 থেকে ₹10,000 পাঠায়।"],
        ["withdraw.wallet.max", "num", "Maximum per withdrawal (₹)", "প্রতিবারে সর্বোচ্চ (₹)"],
        ["withdraw.wallet.dailyLimit", "num", "Daily limit per user (₹)", "প্রতি ইউজারের দৈনিক সীমা (₹)"],
      ],
    },
    {
      id: "referral", icon: "gift", en: "Referral", bn: "রেফারেল",
      fields: [
        ["referral.enabled", "switch", "Referral program enabled", "রেফারেল প্রোগ্রাম চালু"],
        ["referral.reward", "num", "Reward per referral (₹)", "প্রতি রেফারেলের পুরস্কার (₹)", "A fixed amount paid to the person who invited. One level only, no percentage.", "যিনি আমন্ত্রণ জানিয়েছেন তাঁকে নির্দিষ্ট অঙ্ক দেওয়া হয়। শুধু ১ লেভেল, কোনো শতাংশ নেই।"],
        ["referral.payOn", "select", "A referral counts and is rewarded", "রেফারেল গোনা ও পুরস্কার দেওয়া হবে", "This also decides when a referral counts for level missions. \"After first approved task\" protects you from fake accounts.", "লেভেল মিশনে রেফারেল কখন গোনা হবে তাও এটি ঠিক করে। “প্রথম অনুমোদিত টাস্কের পর” বেছে নিলে নকল অ্যাকাউন্টের ঝুঁকি কমে।", [
          ["first_task", "After the friend's first approved task", "বন্ধুর প্রথম অনুমোদিত টাস্কের পর"],
          ["join", "As soon as the friend joins", "বন্ধু যোগ দিলেই"],
        ]],
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
        levels: (S.levels || []).map((L) => ({
          name: L.name,
          minTasks: L.minTasks,
          minReferrals: L.minReferrals,
          withdrawFeePercent: L.withdrawFeePercent,
          monthlyWithdrawals: L.monthlyWithdrawals === undefined ? 2 : L.monthlyWithdrawals,
        })),
        categories: (S.categories || []).map((c) => ({ id: c.id, en: c.en, icon: c.icon, isNew: false })),
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
        if (this.W.levels.length >= 15) return;
        const prev = this.W.levels[this.W.levels.length - 1] || { minTasks: 0, minReferrals: 0, withdrawFeePercent: 5, monthlyWithdrawals: 2 };
        // The old last level now needs a mission to move users up to the new level
        if (this.W.levels.length && !(Number(prev.minTasks) > 0) && !(Number(prev.minReferrals) > 0)) prev.minTasks = 20;
        this.W.levels.push({
          name: "New level",
          minTasks: 0,
          minReferrals: 0,
          withdrawFeePercent: prev.withdrawFeePercent,
          monthlyWithdrawals: prev.monthlyWithdrawals,
        });
        this.paintBody("levels");
      } else if (a === "lvDel") {
        this.readLevels();
        this.W.levels.splice(i, 1);
        this.paintBody("levels");
      } else if (a === "catAdd") {
        this.readCats();
        if (this.W.categories.length >= 20) return;
        this.W.categories.push({ id: "", en: "", icon: "grid", isNew: true });
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
      const hintHtml = hint ? '<div class="field-hint">' + esc(hint) + "</div>" : "";
      if (type === "switch") {
        return (
          '<div class="switch-row"><div class="grow"><div class="card-title">' + esc(label) + "</div>" +
          (hint ? '<div class="card-sub">' + esc(hint) + "</div>" : "") + "</div>" +
          '<button class="switch ' + (val ? "on" : "") + '" data-path="' + path + '" data-type="switch" role="switch" aria-checked="' + !!val + '"></button></div>'
        );
      }
      if (type === "select") {
        return (
          '<div class="field"><label>' + esc(label) + '</label><select class="input" data-path="' + path + '" data-type="select">' +
          (f[6] || []).map((o) => '<option value="' + o[0] + '"' + (val === o[0] ? " selected" : "") + ">" + esc(I18n.pick(o[1], o[2])) + "</option>").join("") +
          "</select>" + hintHtml + "</div>"
        );
      }
      return (
        '<div class="field"><label>' + esc(label) + '</label><input class="input" data-path="' + path + '" data-type="' + type + '" ' +
        (type === "num" ? 'inputmode="decimal"' : 'autocapitalize="off"') + ' autocomplete="off" value="' + esc(val === undefined || val === null ? "" : val) + '" />' +
        hintHtml + "</div>"
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

    inp(key, val, extra) {
      return '<input class="input sm" data-k="' + key + '" value="' + esc(val === undefined || val === null ? "" : val) + '" autocomplete="off" ' + (extra || "") + " />";
    },

    delBtn(act, i) {
      return '<button class="icon-btn" style="width:30px;height:30px" data-act="' + act + '" data-i="' + i + '" aria-label="' + esc(t("common.remove")) + '">' + icon("trash", "sm") + "</button>";
    },

    // One line per level: its mission (tasks + referrals), fee and withdrawals per month
    levelsHtml() {
      const L = this.W.levels;
      return (
        '<div class="note">' + icon("info") + "<div>" + esc(t("ad.s.lvNote")) + "</div></div>" +
        '<div class="lv-edit"><div class="lv-grid lv-h"><span>#</span><span>' + esc(t("ad.s.cName")) + "</span><span>" + esc(t("ad.s.cTasks")) + "</span><span>" +
        esc(t("ad.s.cRefs")) + "</span><span>" + esc(t("ad.s.cFee")) + "</span><span>" + esc(t("ad.s.cWd")) + "</span><span></span></div>" +
        L.map((x, i) => {
          const last = i === L.length - 1; // the last level has no mission
          return (
            '<div class="lv-grid" data-lv="' + i + '"><span class="lv-n">' + (i + 1) + "</span>" +
            this.inp("name", x.name, 'maxlength="30"') +
            this.inp("minTasks", last ? 0 : x.minTasks, 'inputmode="numeric"' + (last ? " disabled" : "")) +
            this.inp("minReferrals", last ? 0 : x.minReferrals, 'inputmode="numeric"' + (last ? " disabled" : "")) +
            this.inp("withdrawFeePercent", x.withdrawFeePercent, 'inputmode="decimal"') +
            this.inp("monthlyWithdrawals", x.monthlyWithdrawals, 'inputmode="numeric"') +
            (L.length > 1 ? this.delBtn("lvDel", i) : "<span></span>") + "</div>"
          );
        }).join("") + "</div>" +
        (L.length < 15 ? '<button class="btn btn-ghost btn-block" data-act="lvAdd" style="margin-bottom:14px">' + icon("plus", "sm") + esc(t("ad.s.addLevel")) + "</button>" : "")
      );
    },

    // One line per category
    catsHtml() {
      const C = this.W.categories;
      return (
        '<div class="note">' + icon("info") + "<div>" + esc(t("ad.s.catNote")) + "</div></div>" +
        '<div class="lv-edit"><div class="cat-grid lv-h"><span>#</span><span>' + esc(t("ad.s.cId")) + "</span><span>" + esc(t("ad.s.cName")) + "</span><span>" + esc(t("ad.s.cIcon")) + "</span><span></span></div>" +
        C.map((c, i) =>
          '<div class="cat-grid" data-cat="' + i + '"><span class="lv-n">' + (i + 1) + "</span>" +
          this.inp("id", c.id, 'maxlength="20" autocapitalize="off"' + (c.isNew ? "" : " readonly")) +
          this.inp("en", c.en, 'maxlength="30"') +
          '<select class="input sm" data-k="icon">' + CAT_ICONS.map((n) => '<option value="' + n + '"' + (c.icon === n ? " selected" : "") + ">" + n + "</option>").join("") + "</select>" +
          (C.length > 1 ? this.delBtn("catDel", i) : "<span></span>") + "</div>"
        ).join("") + "</div>" +
        (C.length < 20 ? '<button class="btn btn-ghost btn-block" data-act="catAdd" style="margin-bottom:14px">' + icon("plus", "sm") + esc(t("ad.s.addCat")) + "</button>" : "")
      );
    },

    faqHtml() {
      const F = this.W.faq;
      const one = (label, key, val, max) => '<div class="field"><label>' + esc(label) + '</label><input class="input" data-k="' + key + '" maxlength="' + max + '" value="' + esc(val) + '" /></div>';
      const area = (label, key, val, max) => '<div class="field"><label>' + esc(label) + '</label><textarea class="input" data-k="' + key + '" maxlength="' + max + '">' + esc(val) + "</textarea></div>";
      return (
        F.map(
          (x, i) =>
            '<div class="edit-card" data-faq="' + i + '"><div class="hd"><span>' + esc(t("ad.s.faqN", { n: i + 1 })) + "</span>" + this.delBtn("faqDel", i) + "</div>" +
            one(t("ad.s.faqQEn"), "qEn", x.qEn, 200) + one(t("ad.s.faqQBn"), "qBn", x.qBn, 200) +
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
      this.W.levels = Array.from(box.querySelectorAll("[data-lv]")).map((row) => {
        const g = (k) => row.querySelector('[data-k="' + k + '"]').value.trim();
        return { name: g("name"), minTasks: g("minTasks"), minReferrals: g("minReferrals"), withdrawFeePercent: g("withdrawFeePercent"), monthlyWithdrawals: g("monthlyWithdrawals") };
      });
    },

    readCats() {
      const box = this.bodyEl("categories");
      if (!box) return;
      this.W.categories = Array.from(box.querySelectorAll("[data-cat]")).map((row, i) => {
        const g = (k) => row.querySelector('[data-k="' + k + '"]').value.trim();
        return { id: g("id"), en: g("en"), icon: g("icon"), isNew: this.W.categories[i] ? this.W.categories[i].isNew : false };
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
        payload.checkin = payload.checkin || {};
        payload.checkin.rewards = el.querySelector("#st-rewards").value.split(/[\s,]+/).filter(Boolean);
      } else if (id === "levels") {
        this.readLevels();
        payload = { levels: this.W.levels };
      } else if (id === "categories") {
        this.readCats();
        payload = { categories: this.W.categories.map((c) => ({ id: c.id, en: c.en, icon: c.icon })) };
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
