/* TaskGenX user panel: Home */
(function () {
  "use strict";
  const { esc, icon, money } = UI;
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

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

      "dep.title": "Deposit money",
      "dep.amount": "Amount (₹)",
      "dep.hint": "Minimum {min}, maximum {max}. Whole rupees only.",
      "dep.range": "Enter an amount between {min} and {max}",
      "dep.sumAmount": "You pay",
      "dep.sumFee": "Fee ({pct}%)",
      "dep.sumGet": "Added to balance",
      "dep.pay": "Pay with UPI",
      "dep.off": "Deposits are turned off right now.",
      "dep.waitTitle": "Waiting for your payment",
      "dep.waitText": "Finish the payment in the page that opened. This screen updates by itself.",
      "dep.reopen": "Open payment page",
      "dep.check": "I have paid, check now",
      "dep.ok": "Deposit successful! {amount} added to your balance.",
      "dep.failTitle": "Payment not completed",
      "dep.failText": "The payment failed or was cancelled. No money was added.",
      "dep.tryAgain": "Try again",

      "wd.title": "Withdraw money",
      "wd.to": "Withdraw to",
      "wd.noDetail": "Add your {method} details in Profile first.",
      "wd.addDetail": "Add details",
      "wd.amount": "Amount (₹)",
      "wd.hint": "Minimum {min}, maximum {max}",
      "wd.max": "Max",
      "wd.range": "Enter an amount between {min} and {max}",
      "wd.low": "You do not have enough balance",
      "wd.sumAmount": "Withdraw amount",
      "wd.sumFee": "Fee ({pct}%)",
      "wd.sumGet": "You receive",
      "wd.note": "Fee {pct}% · {used} of {limit} withdrawals used this month · Daily limit {daily}",
      "wd.approval": "Withdrawals of {amount} or more need admin approval.",
      "wd.submit": "Request withdrawal",
      "wd.off": "Withdrawals are turned off right now.",
      "wd.okSuccess": "Withdrawal sent to your account!",
      "wd.okPending": "Request received. You will be notified after approval.",
      "wd.okProcessing": "Your payout is being processed.",
      "wd.failed": "Withdrawal failed. The amount was returned to your balance.",
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

      "dep.title": "টাকা ডিপোজিট করুন",
      "dep.amount": "পরিমাণ (₹)",
      "dep.hint": "সর্বনিম্ন {min}, সর্বোচ্চ {max}। শুধু পূর্ণ টাকা।",
      "dep.range": "{min} থেকে {max} এর মধ্যে পরিমাণ লিখুন",
      "dep.sumAmount": "আপনি দেবেন",
      "dep.sumFee": "ফি ({pct}%)",
      "dep.sumGet": "ব্যালেন্সে যোগ হবে",
      "dep.pay": "UPI দিয়ে পেমেন্ট করুন",
      "dep.off": "এখন ডিপোজিট বন্ধ আছে।",
      "dep.waitTitle": "আপনার পেমেন্টের অপেক্ষায়",
      "dep.waitText": "যে পেজ খুলেছে সেখানে পেমেন্ট শেষ করুন। এই স্ক্রিন নিজে থেকেই আপডেট হবে।",
      "dep.reopen": "পেমেন্ট পেজ খুলুন",
      "dep.check": "পেমেন্ট করেছি, এখনই দেখুন",
      "dep.ok": "ডিপোজিট সফল! {amount} আপনার ব্যালেন্সে যোগ হয়েছে।",
      "dep.failTitle": "পেমেন্ট সম্পন্ন হয়নি",
      "dep.failText": "পেমেন্ট ব্যর্থ হয়েছে বা বাতিল হয়েছে। কোনো টাকা যোগ হয়নি।",
      "dep.tryAgain": "আবার চেষ্টা করুন",

      "wd.title": "টাকা উইথড্র করুন",
      "wd.to": "যেখানে নেবেন",
      "wd.noDetail": "আগে প্রোফাইলে আপনার {method} তথ্য যোগ করুন।",
      "wd.addDetail": "তথ্য যোগ করুন",
      "wd.amount": "পরিমাণ (₹)",
      "wd.hint": "সর্বনিম্ন {min}, সর্বোচ্চ {max}",
      "wd.max": "সর্বোচ্চ",
      "wd.range": "{min} থেকে {max} এর মধ্যে পরিমাণ লিখুন",
      "wd.low": "আপনার ব্যালেন্স যথেষ্ট নয়",
      "wd.sumAmount": "উইথড্রর পরিমাণ",
      "wd.sumFee": "ফি ({pct}%)",
      "wd.sumGet": "আপনি পাবেন",
      "wd.note": "ফি {pct}% · এই মাসে {limit}টির মধ্যে {used}টি উইথড্র হয়েছে · দৈনিক সীমা {daily}",
      "wd.approval": "{amount} বা তার বেশি উইথড্রে অ্যাডমিনের অনুমোদন লাগে।",
      "wd.submit": "উইথড্র অনুরোধ করুন",
      "wd.off": "এখন উইথড্র বন্ধ আছে।",
      "wd.okSuccess": "উইথড্র আপনার অ্যাকাউন্টে পাঠানো হয়েছে!",
      "wd.okPending": "অনুরোধ পাওয়া গেছে। অনুমোদনের পর আপনাকে জানানো হবে।",
      "wd.okProcessing": "আপনার পেআউট প্রক্রিয়াধীন আছে।",
      "wd.failed": "উইথড্র ব্যর্থ হয়েছে। টাকা ব্যালেন্সে ফেরত দেওয়া হয়েছে।",
    }
  );

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

        (cfg.checkin.enabled ? this.checkinHtml(me) : "") +

        // Live activity sits at the bottom of the page
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

    /* ----------------------------- DEPOSIT ----------------------------- */

    openDeposit() {
      const cfg = App.me.config.deposit;
      if (!cfg.enabled) return UI.toast(t("dep.off"), "error");
      const quick = [100, 200, 500, 1000, 2000].filter((v) => v >= cfg.min && v <= cfg.max).slice(0, 4);
      let stopped = false;

      UI.sheet({
        title: t("dep.title"),
        html:
          '<div class="field"><label>' + esc(t("dep.amount")) + "</label>" +
          '<div class="amount-wrap"><span>₹</span><input class="input" id="dep-amt" type="text" inputmode="numeric" autocomplete="off" placeholder="0" /></div>' +
          '<div class="card-sub" style="margin-top:6px">' + esc(t("dep.hint", { min: money(cfg.min), max: money(cfg.max) })) + "</div></div>" +
          '<div class="chip-row">' + quick.map((v) => '<button class="chip" data-amt="' + v + '">' + esc(money(v)) + "</button>").join("") + "</div>" +
          '<div id="dep-sum"></div>' +
          '<button class="btn btn-primary btn-block" id="dep-go">' + icon("arrow-down-circle", "sm") + esc(t("dep.pay")) + "</button>",
        onClose() {
          stopped = true;
          App.refreshMe({ silent: true });
        },
        onMount(el, close) {
          const input = el.querySelector("#dep-amt");
          const sum = el.querySelector("#dep-sum");
          const go = el.querySelector("#dep-go");
          let order = "";
          let payUrl = "";

          function calc() {
            input.value = input.value.replace(/[^0-9]/g, "");
            const a = parseInt(input.value, 10);
            if (!(a > 0)) {
              sum.innerHTML = "";
              return;
            }
            const fee = round2((a * cfg.feePercent) / 100);
            const net = round2(a - fee);
            sum.innerHTML =
              '<div class="summary"><div class="line"><span>' + esc(t("dep.sumAmount")) + "</span><b>" + esc(money(a)) + "</b></div>" +
              (cfg.feePercent > 0 ? '<div class="line"><span>' + esc(t("dep.sumFee", { pct: cfg.feePercent })) + "</span><b>-" + esc(money(fee)) + "</b></div>" : "") +
              '<div class="line total"><span>' + esc(t("dep.sumGet")) + "</span><b>" + esc(money(net)) + "</b></div></div>";
          }
          input.addEventListener("input", calc);
          el.querySelectorAll("[data-amt]").forEach((b) =>
            b.addEventListener("click", () => {
              input.value = b.dataset.amt;
              UI.haptic("select");
              calc();
            })
          );

          function showFail() {
            el.innerHTML =
              '<div class="wait-box"><div class="res-ico bad">' + icon("x", "lg") + "</div>" +
              '<div class="card-title">' + esc(t("dep.failTitle")) + "</div>" +
              '<p class="card-sub" style="margin:6px 0 16px">' + esc(t("dep.failText")) + "</p></div>" +
              '<button class="btn btn-primary btn-block" id="dep-retry">' + esc(t("dep.tryAgain")) + "</button>";
            el.querySelector("#dep-retry").onclick = () => {
              close();
              Page.openDeposit();
            };
          }

          // Returns true when the payment reached a final state.
          async function check() {
            const r = await API.get("/wallet/deposit/" + encodeURIComponent(order));
            if (r.status === "success") {
              stopped = true;
              UI.confetti();
              UI.toast(t("dep.ok", { amount: money(r.netAmount) }), "success");
              close();
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
            el.innerHTML =
              '<div class="wait-box"><div class="spinner"></div><div class="card-title">' + esc(t("dep.waitTitle")) + "</div>" +
              '<p class="card-sub" style="margin:6px 0 16px">' + esc(t("dep.waitText")) + "</p></div>" +
              '<button class="btn btn-primary btn-block" id="dep-reopen" style="margin-bottom:10px">' + icon("external-link", "sm") + esc(t("dep.reopen")) + "</button>" +
              '<button class="btn btn-ghost btn-block" id="dep-check">' + esc(t("dep.check")) + "</button>";
            el.querySelector("#dep-reopen").onclick = () => UI.openLink(payUrl);
            const cb = el.querySelector("#dep-check");
            cb.onclick = () => UI.withBusy(cb, check);
          }

          go.onclick = () =>
            UI.withBusy(go, async () => {
              const a = parseInt(input.value, 10);
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
      let method = methods[0];
      // UPI and FINZO Wallet have separate limits
      const mc = () => (method === "upi" ? cfg.upi : cfg.wallet);
      const detail = (m) => {
        const d = App.me.user.withdrawDetails;
        return m === "upi" ? d.upi : d.finzoWallet;
      };

      UI.sheet({
        title: t("wd.title"),
        html:
          (methods.length > 1
            ? '<div class="field"><label>' + esc(t("wd.to")) + '</label><div class="seg" id="wd-seg" style="margin-bottom:0">' +
              methods.map((m) => '<button data-m="' + m + '">' + esc(t("method." + m)) + "</button>").join("") + "</div></div>"
            : "") +
          '<div id="wd-detail"></div>' +
          '<div class="field"><label>' + esc(t("wd.amount")) + "</label>" +
          '<div class="amount-wrap"><span>₹</span><input class="input" id="wd-amt" type="text" inputmode="decimal" autocomplete="off" placeholder="0" /></div>' +
          '<div class="card-sub" style="margin-top:6px" id="wd-hint"></div></div>' +
          '<div class="chip-row"><button class="chip" id="wd-max">' + esc(t("wd.max")) + "</button></div>" +
          '<div id="wd-sum"></div>' +
          '<div class="note" id="wd-note"></div>' +
          '<button class="btn btn-primary btn-block" id="wd-go">' + icon("arrow-up-circle", "sm") + esc(t("wd.submit")) + "</button>",
        onClose() {
          App.refreshMe({ silent: true });
        },
        onMount(el, close) {
          const input = el.querySelector("#wd-amt");
          const sum = el.querySelector("#wd-sum");
          const box = el.querySelector("#wd-detail");
          const go = el.querySelector("#wd-go");

          function paintMethod() {
            const c = mc();
            el.querySelectorAll("#wd-seg button").forEach((b) => b.classList.toggle("active", b.dataset.m === method));
            el.querySelector("#wd-hint").textContent = t("wd.hint", { min: money(c.min), max: money(c.max) });
            el.querySelector("#wd-note").innerHTML =
              icon("info") + "<div>" +
              esc(t("wd.note", { pct: feePct, used, limit: monthly, daily: money(c.dailyLimit) })) +
              (cfg.approvalEnabled ? "<br>" + esc(t("wd.approval", { amount: money(cfg.approvalAbove) })) : "") + "</div>";
            const v = detail(method);
            if (v) {
              box.innerHTML = '<div class="note">' + icon("check-circle") + "<div>" + esc(t("method." + method)) + ": <b>" + esc(v) + "</b></div></div>";
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
            calc();
          }

          function calc() {
            input.value = input.value.replace(/[^0-9.]/g, "");
            const a = parseFloat(input.value);
            if (!(a > 0)) {
              sum.innerHTML = "";
              return;
            }
            const fee = round2((a * feePct) / 100);
            sum.innerHTML =
              '<div class="summary"><div class="line"><span>' + esc(t("wd.sumAmount")) + "</span><b>" + esc(money(a)) + "</b></div>" +
              '<div class="line"><span>' + esc(t("wd.sumFee", { pct: feePct })) + "</span><b>-" + esc(money(fee)) + "</b></div>" +
              '<div class="line total"><span>' + esc(t("wd.sumGet")) + "</span><b>" + esc(money(Math.max(0, round2(a - fee)))) + "</b></div></div>";
          }

          input.addEventListener("input", calc);
          el.querySelectorAll("#wd-seg button").forEach((b) =>
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
            calc();
          };

          go.onclick = () =>
            UI.withBusy(go, async () => {
              const a = parseFloat(input.value);
              const c = mc();
              if (!detail(method)) throw new Error(t("wd.noDetail", { method: t("method." + method) }));
              if (!(a >= c.min && a <= c.max)) {
                throw new Error(t("wd.range", { min: money(c.min), max: money(c.max) }));
              }
              if (a > App.me.user.balance) throw new Error(t("wd.low"));
              const r = await API.post("/wallet/withdraw", { amount: a, method });
              close();
              if (r.status === "success") {
                UI.confetti();
                UI.toast(t("wd.okSuccess"), "success");
              } else if (r.status === "awaiting_approval") {
                UI.toast(t("wd.okPending"), "success");
              } else if (r.status === "processing") {
                UI.toast(t("wd.okProcessing"), "success");
              } else {
                UI.toast(t("wd.failed"), "error");
              }
            });

          paintMethod();
        },
      });
    },
  };

  window.Pages = window.Pages || {};
  window.Pages.home = Page;
})();
