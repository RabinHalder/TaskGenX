/* TaskGenX user panel: Home */
(function () {
  "use strict";
  const { esc, icon, money } = UI;
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  UI.loadCss("/user/money.css").catch(() => {});

  I18n.extend(
    {
      "home.welcome": "Welcome back",
      "home.balance": "Total balance",
      "home.hideBalance": "Hide balance",
      "home.showBalance": "Show balance",
      "home.deposit": "Deposit",
      "home.withdraw": "Withdraw",
      "home.pendingProofs": "{n} in review",
      "home.pendingWithdraws": "{n} payout in progress",
      "home.support": "Support",
      "home.live": "LIVE",
      "home.liveTitle": "Live activity",
      "home.tkDeposit": "{name} deposited {amount}",
      "home.tkWithdraw": "{name} withdrew {amount}",
      "home.ci.title": "Daily check-in",
      "home.ci.streak": "{n}-day streak",
      "home.ci.sub": "Check in every day to keep your streak and earn rewards.",
      "home.ci.day": "Day {n}",
      "home.ci.btn": "Check in and get {amount}",
      "home.ci.btnFree": "Check in",
      "home.ci.done": "Checked in today",
      "home.ci.tomorrow": "Come back tomorrow to get {amount}",
      "home.ci.ok": "Checked in! You got {amount}",
      "home.ci.okFree": "Checked in! Day {n} streak",

      "home.ads.title": "Watch & Earn",
      "home.ads.sub": "Watch a short ad and get a quick reward.",
      "home.ads.left": "{used}/{limit} watched today",
      "home.ads.btn": "Watch Ads · {amount}",
      "home.ads.done": "Today's limit reached",
      "home.ads.watching": "Watching ad…",
      "home.ads.wait": "Please wait {n}s",
      "home.ads.ok": "You earned {amount}!",

      "mn.balance": "Available balance",
      "mn.done": "Done",

      "dep.title": "Deposit money",
      "dep.sub": "Add money instantly with UPI",
      "dep.amount": "Enter amount",
      "dep.hint": "Min {min} · Max {max} · Whole rupees only",
      "dep.range": "Enter an amount between {min} and {max}",
      "dep.sumAmount": "You pay",
      "dep.sumFee": "Fee ({pct}%)",
      "dep.sumGet": "Added to balance",
      "dep.pay": "Pay with UPI",
      "dep.payBtn": "Pay {amount}",
      "dep.secure": "Secure UPI payment via FINZO Wallet",
      "dep.off": "Deposits are turned off right now.",
      "dep.waitTitle": "Waiting for your payment",
      "dep.waitText": "Finish the payment in the page that opened. This screen updates by itself.",
      "dep.reopen": "Open payment page",
      "dep.check": "I have paid, check now",
      "dep.doneTitle": "Deposit successful",
      "dep.doneText": "{amount} was added to your balance.",
      "dep.failTitle": "Payment not completed",
      "dep.failText": "The payment failed or was cancelled. No money was added.",
      "dep.tryAgain": "Try again",

      "wd.title": "Withdraw money",
      "wd.sub": "Send money to your UPI or FINZO Wallet",
      "wd.noDetail": "Add your {method} details in Profile first.",
      "wd.addDetail": "Add details",
      "wd.notAdded": "Not added",
      "wd.amount": "Enter amount",
      "wd.hint": "Min {min} · Max {max}",
      "wd.max": "Max",
      "wd.range": "Enter an amount between {min} and {max}",
      "wd.low": "You do not have enough balance",
      "wd.sumAmount": "Withdraw amount",
      "wd.sumFee": "Fee ({pct}%)",
      "wd.sumGet": "You receive",
      "wd.infoFee": "Withdraw fee {pct}% at your level",
      "wd.infoMonth": "{used} of {limit} withdrawals used this month",
      "wd.infoDaily": "Daily limit {daily} for this method",
      "wd.limitReached": "You have used all {limit} withdrawals for this month. Reach the next level to get more.",
      "wd.approval": "Withdrawals of {amount} or more need admin approval.",
      "wd.submit": "Withdraw",
      "wd.btn": "Withdraw {amount}",
      "wd.off": "Withdrawals are turned off right now.",
      "wd.okTitle": "Withdrawal sent",
      "wd.okText": "The money is on its way to your account.",
      "wd.pendTitle": "Request received",
      "wd.pendText": "Your request is waiting for approval. You will be notified.",
      "wd.procTitle": "Payout in progress",
      "wd.procText": "Your payout is being processed. You will be notified when it is done.",
      "wd.failTitle": "Withdrawal failed",
      "wd.failText": "The amount was returned to your balance.",
      "wd.rowFee": "Fee",
      "wd.rowGet": "You receive",
      "wd.rowTo": "To",
    },
    {
      "home.welcome": "স্বাগতম",
      "home.balance": "মোট ব্যালেন্স",
      "home.hideBalance": "ব্যালেন্স লুকান",
      "home.showBalance": "ব্যালেন্স দেখান",
      "home.deposit": "ডিপোজিট",
      "home.withdraw": "উইথড্র",
      "home.pendingProofs": "{n}টি যাচাইয়ে আছে",
      "home.pendingWithdraws": "{n}টি পেআউট চলছে",
      "home.support": "সাপোর্ট",
      "home.live": "লাইভ",
      "home.liveTitle": "লাইভ কার্যক্রম",
      "home.tkDeposit": "{name} {amount} ডিপোজিট করেছেন",
      "home.tkWithdraw": "{name} {amount} উইথড্র করেছেন",
      "home.ci.title": "দৈনিক চেক-ইন",
      "home.ci.streak": "{n} দিনের স্ট্রিক",
      "home.ci.sub": "প্রতিদিন চেক-ইন করে স্ট্রিক ধরে রাখুন এবং পুরস্কার পান।",
      "home.ci.day": "দিন {n}",
      "home.ci.btn": "চেক-ইন করে {amount} নিন",
      "home.ci.btnFree": "চেক-ইন করুন",
      "home.ci.done": "আজ চেক-ইন হয়েছে",
      "home.ci.tomorrow": "কাল আবার এসে {amount} নিন",
      "home.ci.ok": "চেক-ইন সফল! আপনি {amount} পেয়েছেন",
      "home.ci.okFree": "চেক-ইন সফল! {n} দিনের স্ট্রিক",

      "home.ads.title": "Watch & Earn",
      "home.ads.sub": "ছোট একটি বিজ্ঞাপন দেখে দ্রুত পুরস্কার নিন।",
      "home.ads.left": "আজ {used}/{limit}টি দেখা হয়েছে",
      "home.ads.btn": "বিজ্ঞাপন দেখুন · {amount}",
      "home.ads.done": "আজকের সীমা শেষ",
      "home.ads.watching": "বিজ্ঞাপন চলছে…",
      "home.ads.wait": "{n} সেকেন্ড অপেক্ষা করুন",
      "home.ads.ok": "আপনি {amount} পেয়েছেন!",

      "mn.balance": "উপলব্ধ ব্যালেন্স",
      "mn.done": "সম্পন্ন",

      "dep.title": "টাকা ডিপোজিট করুন",
      "dep.sub": "UPI দিয়ে সঙ্গে সঙ্গে টাকা যোগ করুন",
      "dep.amount": "পরিমাণ লিখুন",
      "dep.hint": "সর্বনিম্ন {min} · সর্বোচ্চ {max} · শুধু পূর্ণ টাকা",
      "dep.range": "{min} থেকে {max} এর মধ্যে পরিমাণ লিখুন",
      "dep.sumAmount": "আপনি দেবেন",
      "dep.sumFee": "ফি ({pct}%)",
      "dep.sumGet": "ব্যালেন্সে যোগ হবে",
      "dep.pay": "UPI দিয়ে পেমেন্ট করুন",
      "dep.payBtn": "{amount} পেমেন্ট করুন",
      "dep.secure": "FINZO Wallet-এর মাধ্যমে নিরাপদ UPI পেমেন্ট",
      "dep.off": "এখন ডিপোজিট বন্ধ আছে।",
      "dep.waitTitle": "আপনার পেমেন্টের অপেক্ষায়",
      "dep.waitText": "যে পেজ খুলেছে সেখানে পেমেন্ট শেষ করুন। এই স্ক্রিন নিজে থেকেই আপডেট হবে।",
      "dep.reopen": "পেমেন্ট পেজ খুলুন",
      "dep.check": "পেমেন্ট করেছি, এখনই দেখুন",
      "dep.doneTitle": "ডিপোজিট সফল",
      "dep.doneText": "{amount} আপনার ব্যালেন্সে যোগ হয়েছে।",
      "dep.failTitle": "পেমেন্ট সম্পন্ন হয়নি",
      "dep.failText": "পেমেন্ট ব্যর্থ হয়েছে বা বাতিল হয়েছে। কোনো টাকা যোগ হয়নি।",
      "dep.tryAgain": "আবার চেষ্টা করুন",

      "wd.title": "টাকা উইথড্র করুন",
      "wd.sub": "আপনার UPI বা FINZO Wallet-এ টাকা পাঠান",
      "wd.noDetail": "আগে প্রোফাইলে আপনার {method} তথ্য যোগ করুন।",
      "wd.addDetail": "তথ্য যোগ করুন",
      "wd.notAdded": "যোগ করা হয়নি",
      "wd.amount": "পরিমাণ লিখুন",
      "wd.hint": "সর্বনিম্ন {min} · সর্বোচ্চ {max}",
      "wd.max": "সর্বোচ্চ",
      "wd.range": "{min} থেকে {max} এর মধ্যে পরিমাণ লিখুন",
      "wd.low": "আপনার ব্যালেন্স যথেষ্ট নয়",
      "wd.sumAmount": "উইথড্রর পরিমাণ",
      "wd.sumFee": "ফি ({pct}%)",
      "wd.sumGet": "আপনি পাবেন",
      "wd.infoFee": "আপনার লেভেলে উইথড্র ফি {pct}%",
      "wd.infoMonth": "এই মাসে {limit}টির মধ্যে {used}টি উইথড্র হয়েছে",
      "wd.infoDaily": "এই পদ্ধতিতে দৈনিক সীমা {daily}",
      "wd.limitReached": "এই মাসের {limit}টি উইথড্রই আপনি ব্যবহার করেছেন। বেশি পেতে পরের লেভেলে উঠুন।",
      "wd.approval": "{amount} বা তার বেশি উইথড্রে অ্যাডমিনের অনুমোদন লাগে।",
      "wd.submit": "উইথড্র করুন",
      "wd.btn": "{amount} উইথড্র করুন",
      "wd.off": "এখন উইথড্র বন্ধ আছে।",
      "wd.okTitle": "উইথড্র পাঠানো হয়েছে",
      "wd.okText": "টাকা আপনার অ্যাকাউন্টের পথে আছে।",
      "wd.pendTitle": "অনুরোধ পাওয়া গেছে",
      "wd.pendText": "আপনার অনুরোধ অনুমোদনের অপেক্ষায় আছে। আপনাকে জানানো হবে।",
      "wd.procTitle": "পেআউট চলছে",
      "wd.procText": "আপনার পেআউট প্রক্রিয়াধীন। শেষ হলে আপনাকে জানানো হবে।",
      "wd.failTitle": "উইথড্র ব্যর্থ হয়েছে",
      "wd.failText": "টাকা আপনার ব্যালেন্সে ফেরত দেওয়া হয়েছে।",
      "wd.rowFee": "ফি",
      "wd.rowGet": "আপনি পাবেন",
      "wd.rowTo": "কোথায়",
    }
  );

  function maskDest(v) {
    v = String(v || "");
    if (!v) return "";
    if (v.includes("@")) {
      const p = v.split("@");
      return p[0].slice(0, 2) + "***@" + p.slice(1).join("@");
    }
    return v.length > 4 ? "*".repeat(v.length - 3) + v.slice(-3) : "***";
  }

  const head = (ico, title, sub) =>
    '<div class="mn-head"><span class="mn-badge">' + icon(ico) + '</span><div><div class="mn-title">' + esc(title) +
    '</div><div class="mn-sub">' + esc(sub) + "</div></div></div>";

  const row = (label, value, cls) =>
    '<div class="mn-row ' + (cls || "") + '"><span>' + esc(label) + "</span><b>" + esc(value) + "</b></div>";

  const info = (ico, text) => '<div class="mn-info">' + icon(ico, "sm") + "<span>" + esc(text) + "</span></div>";

  function resultHtml(o) {
    const top = o.spin
      ? '<div class="mn-ring"><i class="ring"></i><span class="mn-ring-ico">' + icon(o.ico, "lg") + "</span></div>"
      : '<div class="mn-r-ico ' + o.tone + '">' + icon(o.ico, "lg") + "</div>";
    return (
      '<div class="mn-result">' + top + '<div class="mn-r-title">' + esc(o.title) + "</div>" +
      (o.amount ? '<div class="mn-r-amt">' + esc(o.amount) + "</div>" : "") +
      (o.text ? '<div class="mn-r-text">' + esc(o.text) + "</div>" : "") + "</div>" +
      (o.rows && o.rows.length ? '<div class="mn-sum mn-rows">' + o.rows.map((r) => row(r[0], r[1])).join("") + "</div>" : "") +
      '<div class="mn-btns">' + (o.buttons || "") + "</div>"
    );
  }

  const doneBtn = () => '<button class="btn btn-primary btn-block" id="mn-done">' + esc(t("mn.done")) + "</button>";

  const Page = {
    id: "home",
    root: null,
    feed: [],
    prev: 0,
    timer: null,

    init(root) {
      this.root = root;
      root.innerHTML = UI.skeleton("home");
      UI.on(root, "click", "[data-act]", (e, el) => this.act(el.dataset.act, el));
    },

    show() {
      App.refreshIfStale(15000);
      this.loadFeed();
      clearInterval(this.timer);
      this.timer = setInterval(() => this.loadFeed(), 45000);
    },

    hide() {
      clearInterval(this.timer);
    },

    act(a, el) {
      if (a === "toggleBalance") return this.toggleBalance();
      if (a === "deposit") return this.openDeposit();
      if (a === "withdraw") return this.openWithdraw();
      if (a === "checkin") return this.checkin(el);
      if (a === "watchAd") return this.watchAd(el);
      if (a === "support") return UI.openLink(App.me.config.app.supportLink);
    },

    async loadFeed() {
      try {
        const r = await API.get("/club/feed" + API.qs({ limit: 12 }));
        this.feed = r.enabled ? r.items : [];
      } catch (e) {
        return;
      }
      const wrap = this.root && this.root.querySelector("#home-live");
      const el = this.root && this.root.querySelector("#home-ticker");
      if (wrap && el) {
        wrap.classList.toggle("hidden", !this.feed.length);
        el.innerHTML = this.tickerInner();
      }
    },

    tickerInner() {
      if (!this.feed.length) return "";
      const text = this.feed
        .map((f) => {
          const name = f.name || t("common.hidden");
          const key = f.type === "deposit" ? "home.tkDeposit" : "home.tkWithdraw";
          return '<span class="tk">' + esc(t(key, { name, amount: money(f.amount) })) + "</span>";
        })
        .join("");
      const secs = Math.max(20, this.feed.length * 5);
      return (
        '<span class="ticker-dot"></span><b class="ticker-live">' + esc(t("home.live")) + "</b>" +
        '<div class="ticker-track"><div class="ticker-inner" style="animation:tickmove ' + secs + 's linear infinite">' +
        text + "</div></div>"
      );
    },

    /* ----------------------------- RENDER ----------------------------- */

    render() {
      const me = App.me;
      if (!this.root || !me) return;
      const u = me.user, cfg = me.config, st = me.stats;
      const hidden = u.hideBalance;
      const name = u.firstName || u.username || t("common.unknown");

      const chips = [];
      if (st.pendingProofs > 0) {
        chips.push('<span class="chip-lite">' + icon("clock", "sm") + esc(t("home.pendingProofs", { n: st.pendingProofs })) + "</span>");
      }
      if (st.pendingWithdraws > 0) {
        chips.push('<span class="chip-lite">' + icon("send", "sm") + esc(t("home.pendingWithdraws", { n: st.pendingWithdraws })) + "</span>");
      }

      this.root.innerHTML =
        '<div class="topbar"><div class="user-chip">' +
        '<span class="av-wrap ' + (me.isAdmin ? "admin" : "") + '" data-admin-toggle>' + UI.avatar({ name, photoUrl: u.photoUrl }, "tap") + "</span>" +
        '<div><div class="hello">' + esc(t("home.welcome")) + '</div><div class="uname">' + esc(name) + "</div></div></div>" +
        '<div class="top-actions">' +
        (cfg.app.supportLink
          ? '<button class="icon-btn" data-act="support" aria-label="' + esc(t("home.support")) + '">' + icon("headphones") + "</button>"
          : "") +
        "</div></div>" +

        '<div class="balance-card">' +
        '<div class="balance-top"><div class="balance-label">' + icon("wallet", "sm") + esc(t("home.balance")) + "</div>" +
        '<button class="eye-btn" data-act="toggleBalance" aria-label="' + esc(hidden ? t("home.showBalance") : t("home.hideBalance")) + '">' +
        icon(hidden ? "eye-off" : "eye", "sm") + "</button></div>" +
        '<div class="balance-amount" id="home-balance">' + esc(hidden ? UI.HIDDEN_MONEY : money(this.prev)) + "</div>" +
        (chips.length ? '<div class="balance-foot">' + chips.join("") + "</div>" : "") +
        '<div class="balance-actions">' +
        '<button class="btn btn-light" data-act="deposit">' + icon("arrow-down-circle", "sm") + esc(t("home.deposit")) + "</button>" +
        '<button class="btn btn-light" data-act="withdraw">' + icon("arrow-up-circle", "sm") + esc(t("home.withdraw")) + "</button>" +
        "</div></div>" +

        (cfg.ads && cfg.ads.enabled ? this.adsHtml(me) : "") +
        (cfg.checkin.enabled ? this.checkinHtml(me) : "") +

        '<div id="home-live" class="' + (this.feed.length ? "" : "hidden") + '">' +
        '<div class="section-head"><div class="section-title">' + esc(t("home.liveTitle")) + "</div></div>" +
        '<div class="ticker" id="home-ticker">' + this.tickerInner() + "</div></div>";

      const bal = this.root.querySelector("#home-balance");
      if (bal) {
        if (hidden) {
          bal.dataset.v = String(u.balance);
        } else {
          bal.dataset.v = String(this.prev);
          UI.countTo(bal, u.balance);
        }
      }
      this.prev = u.balance;
    },

    adsHtml(me) {
      const a = me.config.ads;
      const used = me.stats.adsWatchedToday || 0;
      const done = used >= a.dailyLimit;
      return (
        '<div class="card">' +
        '<div class="flex between" style="margin-bottom:12px"><div><div class="card-title">' + esc(t("home.ads.title")) + "</div>" +
        '<div class="card-sub">' + esc(t("home.ads.sub")) + "</div></div>" +
        '<div class="row-ico">' + icon("play") + "</div></div>" +
        '<div class="card-sub" style="margin-bottom:10px">' + esc(t("home.ads.left", { used, limit: a.dailyLimit })) + "</div>" +
        '<button class="btn btn-primary btn-block" data-act="watchAd" ' + (done ? "disabled" : "") + ">" +
        icon(done ? "check-circle" : "play", "sm") + esc(done ? t("home.ads.done") : t("home.ads.btn", { amount: money(a.reward) })) + "</button></div>"
      );
    },

    checkinHtml(me) {
      const c = me.checkin;
      const rewards = c.rewards && c.rewards.length ? c.rewards : [0];
      const L = rewards.length;
      const s = c.streak;
      const filled = c.doneToday ? ((s - 1) % L) + 1 : s % L;
      const dots = rewards
        .map((r, i) => {
          const cls = (i < filled ? " done" : "") + (!c.doneToday && i === filled ? " next" : "");
          return '<div class="streak-dot' + cls + '"><b>' + (r > 0 ? esc(money(r)) : "–") + "</b>" + esc(t("home.ci.day", { n: i + 1 })) + "</div>";
        })
        .join("");

      let action;
      if (c.doneToday) {
        action =
          '<button class="btn btn-ghost btn-block" disabled>' + icon("check-circle", "sm") + esc(t("home.ci.done")) + "</button>" +
          (c.nextReward > 0
            ? '<div class="card-sub" style="text-align:center;margin-top:8px">' + esc(t("home.ci.tomorrow", { amount: money(c.nextReward) })) + "</div>"
            : "");
      } else {
        action =
          '<button class="btn btn-primary btn-block" data-act="checkin">' + icon("calendar", "sm") +
          esc(c.nextReward > 0 ? t("home.ci.btn", { amount: money(c.nextReward) }) : t("home.ci.btnFree")) + "</button>";
      }

      return (
        '<div class="card"><div class="streak-head"><div><div class="card-title">' + esc(t("home.ci.title")) + "</div>" +
        '<div class="card-sub">' + esc(t("home.ci.sub")) + "</div></div>" +
        '<div class="streak-flame">' + icon("flame") + esc(t("home.ci.streak", { n: s })) + "</div></div>" +
        '<div class="streak-row">' + dots + "</div>" + action + "</div>"
      );
    },

    /* ----------------------------- ACTIONS ----------------------------- */

    async toggleBalance() {
      const u = App.me.user;
      u.hideBalance = !u.hideBalance;
      UI.haptic("light");
      this.render();
      try {
        await API.patch("/user/prefs", { hideBalance: u.hideBalance });
      } catch (e) {
        u.hideBalance = !u.hideBalance;
        this.render();
        UI.handleError(e);
      }
    },

    async checkin(btn) {
      const r = await UI.withBusy(btn, () => API.post("/user/checkin"));
      if (!r) return;
      UI.confetti();
      UI.toast(
        r.reward > 0 ? t("home.ci.ok", { amount: money(r.reward) }) : t("home.ci.okFree", { n: r.streak }),
        "success"
      );
      App.refreshMe({ silent: true });
    },

    // Simulated ad: shows a countdown (no real ad network wired up yet), then pays the reward.
    async watchAd(btn) {
      const secs = (App.me.config.ads && App.me.config.ads.watchSeconds) || 15;
      btn.disabled = true;
      btn.classList.add("loading");
      const original = btn.innerHTML;
      let left = secs;
      const timer = setInterval(() => {
        left -= 1;
        if (left > 0) btn.querySelector("span") && (btn.querySelector("span").textContent = t("home.ads.wait", { n: left }));
      }, 1000);
      btn.innerHTML = icon("play", "sm") + '<span>' + esc(t("home.ads.watching")) + "</span>";

      try {
        await UI.sleep(secs * 1000);
        clearInterval(timer);
        const r = await API.post("/user/watch-ad");
        UI.confetti();
        UI.toast(t("home.ads.ok", { amount: money(r.reward) }), "success");
        App.refreshMe({ silent: true });
      } catch (e) {
        clearInterval(timer);
        UI.handleError(e);
        btn.disabled = false;
        btn.classList.remove("loading");
        btn.innerHTML = original;
      }
    },

    /* ----------------------------- DEPOSIT ----------------------------- */

    openDeposit() {
      const cfg = App.me.config.deposit;
      if (!cfg.enabled) return UI.toast(t("dep.off"), "error");
      const quick = [100, 200, 500, 1000, 2000, 5000].filter((v) => v >= cfg.min && v <= cfg.max).slice(0, 4);
      let stopped = false;

      UI.sheet({
        html:
          head("arrow-down-circle", t("dep.title"), t("dep.sub")) +
          '<div class="mn-bal">' + icon("wallet", "sm") + "<span>" + esc(t("mn.balance")) + "</span><b>" + esc(money(App.me.user.balance)) + "</b></div>" +
          '<div class="mn-amt"><label for="dep-amt">' + esc(t("dep.amount")) + '</label><div class="mn-amt-row"><span>₹</span>' +
          '<input id="dep-amt" type="text" inputmode="numeric" autocomplete="off" placeholder="0" /></div>' +
          '<div class="mn-hint">' + esc(t("dep.hint", { min: money(cfg.min), max: money(cfg.max) })) + "</div></div>" +
          '<div class="mn-chips">' + quick.map((v) => '<button class="chip" data-amt="' + v + '">' + esc(money(v)) + "</button>").join("") + "</div>" +
          '<div class="mn-sum" id="dep-sum"></div>' +
          '<button class="btn btn-primary btn-block" id="dep-go">' + icon("arrow-down-circle", "sm") + '<span id="dep-go-t"></span></button>' +
          '<div class="mn-secure">' + icon("lock", "sm") + "<span>" + esc(t("dep.secure")) + "</span></div>",
        onClose() {
          stopped = true;
          App.refreshMe({ silent: true });
        },
        onMount(el, close) {
          const input = el.querySelector("#dep-amt");
          const sum = el.querySelector("#dep-sum");
          const go = el.querySelector("#dep-go");
          const goText = el.querySelector("#dep-go-t");
          let order = "";
          let payUrl = "";

          function paint() {
            input.value = input.value.replace(/[^0-9]/g, "");
            const a = parseInt(input.value, 10) || 0;
            const fee = round2((a * cfg.feePercent) / 100);
            sum.innerHTML =
              row(t("dep.sumAmount"), money(a)) +
              (cfg.feePercent > 0 ? row(t("dep.sumFee", { pct: cfg.feePercent }), "-" + money(fee)) : "") +
              row(t("dep.sumGet"), money(Math.max(0, round2(a - fee))), "total");
            goText.textContent = a > 0 ? t("dep.payBtn", { amount: money(a) }) : t("dep.pay");
            el.querySelectorAll("[data-amt]").forEach((b) => b.classList.toggle("active", Number(b.dataset.amt) === a));
          }
          input.addEventListener("input", paint);
          el.querySelectorAll("[data-amt]").forEach((b) =>
            b.addEventListener("click", () => {
              input.value = b.dataset.amt;
              UI.haptic("select");
              paint();
            })
          );
          paint();

          function showFail() {
            el.innerHTML = resultHtml({
              tone: "bad",
              ico: "x",
              title: t("dep.failTitle"),
              text: t("dep.failText"),
              buttons: '<button class="btn btn-primary btn-block" id="dep-retry">' + esc(t("dep.tryAgain")) + "</button>",
            });
            el.querySelector("#dep-retry").onclick = () => {
              close();
              Page.openDeposit();
            };
          }

          async function check() {
            const r = await API.get("/wallet/deposit/" + encodeURIComponent(order));
            if (r.status === "success") {
              stopped = true;
              UI.confetti();
              el.innerHTML = resultHtml({
                tone: "ok",
                ico: "check",
                title: t("dep.doneTitle"),
                amount: "+" + money(r.netAmount),
                text: t("dep.doneText", { amount: money(r.netAmount) }),
                buttons: doneBtn(),
              });
              el.querySelector("#mn-done").onclick = () => close();
              return true;
            }
            if (r.status === "failed" || r.status === "cancelled") {
              stopped = true;
              showFail();
              return true;
            }
            return false;
          }

          async function poll() {
            for (let i = 0; i < 200 && !stopped; i++) {
              await UI.sleep(3000);
              if (stopped) return;
              try {
                if (await check()) return;
              } catch (e) {
                /* keep waiting */
              }
            }
          }

          function showWait() {
            el.innerHTML = resultHtml({
              spin: true,
              ico: "smartphone",
              title: t("dep.waitTitle"),
              text: t("dep.waitText"),
              buttons:
                '<button class="btn btn-primary btn-block" id="dep-reopen">' + icon("external-link", "sm") + esc(t("dep.reopen")) + "</button>" +
                '<button class="btn btn-ghost btn-block" id="dep-check">' + esc(t("dep.check")) + "</button>",
            });
            el.querySelector("#dep-reopen").onclick = () => UI.openLink(payUrl);
            const cb = el.querySelector("#dep-check");
            cb.onclick = () => UI.withBusy(cb, check);
          }

          go.onclick = () =>
            UI.withBusy(go, async () => {
              const a = parseInt(input.value, 10) || 0;
              if (!(a >= cfg.min && a <= cfg.max)) {
                throw new Error(t("dep.range", { min: money(cfg.min), max: money(cfg.max) }));
              }
              const p = await API.post("/wallet/deposit", { amount: a });
              order = p.orderId;
              payUrl = p.paymentUrl;
              showWait();
              UI.openLink(payUrl);
              poll();
            });
        },
      });
    },

    /* ----------------------------- WITHDRAW ----------------------------- */

    openWithdraw() {
      const me = App.me;
      const cfg = me.config.withdraw;
      if (!cfg.enabled) return UI.toast(t("wd.off"), "error");
      const methods = [];
      if (cfg.upi.enabled) methods.push("upi");
      if (cfg.wallet.enabled) methods.push("finzo_wallet");
      if (!methods.length) return UI.toast(t("wd.off"), "error");

      const cur = me.level.current;
      const feePct = cur ? cur.withdrawFeePercent : 0;
      const monthly = cur ? cur.monthlyWithdrawals : 0;
      const used = me.stats.withdrawalsThisMonth || 0;
      const blocked = used >= monthly;
      let method = methods[0];
      const mc = () => (method === "upi" ? cfg.upi : cfg.wallet);
      const detail = (m) => {
        const d = App.me.user.withdrawDetails;
        return m === "upi" ? d.upi : d.finzoWallet;
      };

      UI.sheet({
        html:
          head("arrow-up-circle", t("wd.title"), t("wd.sub")) +
          '<div class="mn-bal">' + icon("wallet", "sm") + "<span>" + esc(t("mn.balance")) + "</span><b>" + esc(money(me.user.balance)) + "</b></div>" +
          '<div class="mn-methods ' + (methods.length === 1 ? "one" : "") + '">' +
          methods
            .map(
              (m) =>
                '<button class="mn-method" data-m="' + m + '"><span class="mn-m-ico">' + icon(m === "upi" ? "smartphone" : "wallet") + "</span>" +
                '<span class="mn-m-txt"><b>' + esc(t("method." + m)) + "</b><small></small></span>" +
                '<i class="mn-m-check">' + icon("check", "sm") + "</i></button>"
            )
            .join("") +
          "</div>" +
          '<div id="wd-detail"></div>' +
          (blocked ? '<div class="mn-warn">' + icon("alert", "sm") + "<span>" + esc(t("wd.limitReached", { limit: monthly })) + "</span></div>" : "") +
          '<div class="mn-amt"><label for="wd-amt">' + esc(t("wd.amount")) + '</label><div class="mn-amt-row"><span>₹</span>' +
          '<input id="wd-amt" type="text" inputmode="decimal" autocomplete="off" placeholder="0" /></div>' +
          '<div class="mn-hint"><span id="wd-hint"></span><button class="mn-max" id="wd-max">' + esc(t("wd.max")) + "</button></div></div>" +
          '<div class="mn-sum" id="wd-sum" style="margin-top:14px"></div>' +
          '<div class="mn-infos" id="wd-info"></div>' +
          '<div class="mn-appr" id="wd-appr"></div>' +
          '<button class="btn btn-primary btn-block" id="wd-go"' + (blocked ? " disabled" : "") + ">" + icon("arrow-up-circle", "sm") + '<span id="wd-go-t"></span></button>',
        onClose() {
          App.refreshMe({ silent: true });
        },
        onMount(el, close) {
          const input = el.querySelector("#wd-amt");
          const sum = el.querySelector("#wd-sum");
          const box = el.querySelector("#wd-detail");
          const go = el.querySelector("#wd-go");
          const goText = el.querySelector("#wd-go-t");

          function paintSum() {
            input.value = input.value.replace(/[^0-9.]/g, "");
            const a = parseFloat(input.value) || 0;
            const fee = round2((a * feePct) / 100);
            sum.innerHTML =
              row(t("wd.sumAmount"), money(a)) +
              row(t("wd.sumFee", { pct: feePct }), "-" + money(fee)) +
              row(t("wd.sumGet"), money(Math.max(0, round2(a - fee))), "total");
            goText.textContent = a > 0 ? t("wd.btn", { amount: money(a) }) : t("wd.submit");
            const needs = cfg.approvalEnabled && a >= cfg.approvalAbove && a > 0;
            el.querySelector("#wd-appr").innerHTML = needs ? '<div class="note">' + icon("info") + "<div>" + esc(t("wd.approval", { amount: money(cfg.approvalAbove) })) + "</div></div>" : "";
          }

          function paintMethod() {
            const c = mc();
            el.querySelectorAll(".mn-method").forEach((b) => {
              b.classList.toggle("active", b.dataset.m === method);
              const v = detail(b.dataset.m);
              b.querySelector("small").textContent = v ? maskDest(v) : t("wd.notAdded");
            });
            el.querySelector("#wd-hint").textContent = t("wd.hint", { min: money(c.min), max: money(c.max) });
            el.querySelector("#wd-info").innerHTML =
              info("percent", t("wd.infoFee", { pct: feePct })) +
              info("calendar", t("wd.infoMonth", { used, limit: monthly })) +
              info("clock", t("wd.infoDaily", { daily: money(c.dailyLimit) }));
            if (detail(method)) {
              box.innerHTML = "";
            } else {
              box.innerHTML =
                '<div class="note">' + icon("alert") + "<div>" + esc(t("wd.noDetail", { method: t("method." + method) })) + "</div></div>" +
                '<button class="btn btn-ghost btn-block" id="wd-add" style="margin-bottom:14px">' + esc(t("wd.addDetail")) + "</button>";
              box.querySelector("#wd-add").onclick = () => {
                close();
                App.go("profile");
                setTimeout(() => Pages.profile && Pages.profile.focusDetails(), 400);
              };
            }
            paintSum();
          }

          input.addEventListener("input", paintSum);
          el.querySelectorAll(".mn-method").forEach((b) =>
            b.addEventListener("click", () => {
              method = b.dataset.m;
              UI.haptic("select");
              paintMethod();
            })
          );
          el.querySelector("#wd-max").onclick = () => {
            const m = Math.min(App.me.user.balance, mc().max);
            input.value = String(Math.floor(m * 100) / 100);
            UI.haptic("select");
            paintSum();
          };

          function showResult(r, a) {
            const rows = [
              [t("wd.sumAmount"), money(r.amount || a)],
              [t("wd.rowFee"), money(r.fee || 0)],
              [t("wd.rowGet"), money(r.netAmount)],
              [t("wd.rowTo"), t("method." + method) + " · " + maskDest(r.destination || detail(method))],
            ];
            let o;
            if (r.status === "success") {
              UI.confetti();
              o = { tone: "ok", ico: "check", title: t("wd.okTitle"), amount: money(r.netAmount), text: t("wd.okText") };
            } else if (r.status === "awaiting_approval") {
              o = { tone: "wait", ico: "clock", title: t("wd.pendTitle"), amount: money(r.amount || a), text: t("wd.pendText") };
            } else if (r.status === "processing") {
              o = { tone: "wait", ico: "send", title: t("wd.procTitle"), amount: money(r.netAmount), text: t("wd.procText") };
            } else {
              o = { tone: "bad", ico: "x", title: t("wd.failTitle"), text: t("wd.failText") };
            }
            el.innerHTML = resultHtml({ ...o, rows: o.tone === "bad" ? [] : rows, buttons: doneBtn() });
            el.querySelector("#mn-done").onclick = () => close();
          }

          go.onclick = () =>
            UI.withBusy(go, async () => {
              const a = parseFloat(input.value) || 0;
              const c = mc();
              if (!detail(method)) throw new Error(t("wd.noDetail", { method: t("method." + method) }));
              if (!(a >= c.min && a <= c.max)) {
                throw new Error(t("wd.range", { min: money(c.min), max: money(c.max) }));
              }
              if (a > App.me.user.balance) throw new Error(t("wd.low"));
              const r = await API.post("/wallet/withdraw", { amount: a, method });
              showResult(r, a);
            });

          paintMethod();
        },
      });
    },
  };

  window.Pages = window.Pages || {};
  window.Pages.home = Page;
})();
