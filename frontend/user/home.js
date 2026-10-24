/* TaskGenX user panel: Home (shell). Features live in /user/home/*.js */
(function () {
  "use strict";
  const { esc, icon, money } = UI;

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
      if (window.HomeFeatures && HomeFeatures.ads) HomeFeatures.ads.warmUp(App.me);
    },

    hide() {
      clearInterval(this.timer);
    },

    act(a, el) {
      if (a === "toggleBalance") return this.toggleBalance();
      if (a === "deposit") return HomeFeatures.deposit.open();
      if (a === "withdraw") return HomeFeatures.withdraw.open();
      if (a === "checkin") return HomeFeatures.checkin.run(el);
      if (a === "watchAd") return HomeFeatures.ads.run(el, () => this.render());
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

        (cfg.ads && cfg.ads.enabled ? HomeFeatures.ads.html(me) : "") +
        (cfg.checkin.enabled ? HomeFeatures.checkin.html(me) : "") +

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
  };

  window.Pages = window.Pages || {};
  window.Pages.home = Page;
})();
