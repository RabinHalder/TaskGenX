/* TaskGenX admin panel: shell + dashboard */
(function () {
  "use strict";
  const { esc, icon, money } = UI;

  I18n.extend(
    {
      "ad.title": "Admin panel",
      "ad.mode": "Admin mode",
      "ad.back": "Back to app",
      "ad.loadFail": "Could not load the admin panel.",
      "ad.nav.dashboard": "Dashboard",
      "ad.nav.users": "Users",
      "ad.nav.tasks": "Tasks",
      "ad.nav.broadcast": "Broadcast",
      "ad.nav.settings": "Settings",

      "ad.d.title": "Dashboard",
      "ad.d.sub": "A live summary of your app.",
      "ad.d.pending": "Needs your attention",
      "ad.d.week": "Last 7 days",
      "ad.d.mMoney": "Money",
      "ad.d.mUsers": "New users",
      "ad.d.mTasks": "Tasks approved",
      "ad.d.lDeposits": "Deposits",
      "ad.d.lWithdrawals": "Withdrawals",
      "ad.d.lUsers": "New users",
      "ad.d.lTasks": "Approved tasks",
      "ad.k.users": "Total users",
      "ad.k.newToday": "{n} new today",
      "ad.k.active": "Active in 24h",
      "ad.k.deposited": "Total deposited",
      "ad.k.depCount": "{n} payments",
      "ad.k.withdrawn": "Total withdrawn",
      "ad.k.wdCount": "{n} payouts",
      "ad.k.fees": "Fee earnings",
      "ad.k.balances": "User balances",
      "ad.k.balancesSub": "Money owed to users",
      "ad.k.tasks": "Active tasks",
      "ad.k.banned": "Banned users",
      "ad.p.proofs": "Proofs to review",
      "ad.p.approval": "Withdrawals to approve",
      "ad.p.processing": "Payouts in progress",
      "ad.p.deposits": "Open deposits",
    },
    {
      "ad.title": "অ্যাডমিন প্যানেল",
      "ad.mode": "অ্যাডমিন মোড",
      "ad.back": "অ্যাপে ফিরুন",
      "ad.loadFail": "অ্যাডমিন প্যানেল লোড করা যায়নি।",
      "ad.nav.dashboard": "ড্যাশবোর্ড",
      "ad.nav.users": "ইউজার",
      "ad.nav.tasks": "টাস্ক",
      "ad.nav.broadcast": "ব্রডকাস্ট",
      "ad.nav.settings": "সেটিংস",

      "ad.d.title": "ড্যাশবোর্ড",
      "ad.d.sub": "আপনার অ্যাপের লাইভ সারসংক্ষেপ।",
      "ad.d.pending": "আপনার নজর দরকার",
      "ad.d.week": "গত ৭ দিন",
      "ad.d.mMoney": "টাকা",
      "ad.d.mUsers": "নতুন ইউজার",
      "ad.d.mTasks": "অনুমোদিত টাস্ক",
      "ad.d.lDeposits": "ডিপোজিট",
      "ad.d.lWithdrawals": "উইথড্র",
      "ad.d.lUsers": "নতুন ইউজার",
      "ad.d.lTasks": "অনুমোদিত টাস্ক",
      "ad.k.users": "মোট ইউজার",
      "ad.k.newToday": "আজ নতুন {n} জন",
      "ad.k.active": "২৪ ঘণ্টায় সক্রিয়",
      "ad.k.deposited": "মোট ডিপোজিট",
      "ad.k.depCount": "{n}টি পেমেন্ট",
      "ad.k.withdrawn": "মোট উইথড্র",
      "ad.k.wdCount": "{n}টি পেআউট",
      "ad.k.fees": "ফি থেকে আয়",
      "ad.k.balances": "ইউজারদের ব্যালেন্স",
      "ad.k.balancesSub": "ইউজারদের পাওনা টাকা",
      "ad.k.tasks": "সক্রিয় টাস্ক",
      "ad.k.banned": "ব্যান করা ইউজার",
      "ad.p.proofs": "যাচাইয়ের অপেক্ষায় প্রমাণ",
      "ad.p.approval": "অনুমোদনের অপেক্ষায় উইথড্র",
      "ad.p.processing": "চলমান পেআউট",
      "ad.p.deposits": "খোলা ডিপোজিট",
    }
  );

  const TABS = ["dashboard", "users", "tasks", "broadcast", "settings"];
  const TAB_ICONS = { dashboard: "bar-chart", users: "users", tasks: "check-square", broadcast: "megaphone", settings: "settings" };
  const MODULES = ["/admin/users.js", "/admin/tasks.js", "/admin/broadcast.js", "/admin/settings.js"];
  const BADGE = { success: "ok", approved: "ok", pending: "wait", created: "wait", processing: "wait", awaiting_approval: "wait", failed: "bad", rejected: "bad", cancelled: "bad" };

  const Pages = (window.AdminPages = window.AdminPages || {});
  const A = { root: null, nav: null, tab: "dashboard", shell: false, ready: false, loading: null, pendingOpts: null };
  const $r = (sel) => A.root.querySelector(sel);

  function compact(n) {
    n = Number(n) || 0;
    const f = (v, s) => v.toFixed(1).replace(/\.0$/, "") + s;
    if (n >= 1e7) return f(n / 1e7, "Cr");
    if (n >= 1e5) return f(n / 1e5, "L");
    if (n >= 1e3) return f(n / 1e3, "k");
    return String(Math.round(n * 10) / 10);
  }

  // Shared helpers for the other admin files
  window.AdminKit = {
    go: (tab, opts) => go(tab, false, opts),
    compact,
    badge: (st) => '<span class="badge ' + (BADGE[st] || "wait") + '">' + esc(t("status." + st)) + "</span>",
    who: (u) => (u && u.username ? "@" + u.username + " · " : "") + "ID " + (u ? u.tgId : ""),
  };

  /* ----------------------------- SHELL ----------------------------- */

  function headerHtml() {
    return (
      '<div class="topbar"><div class="user-chip">' +
      '<button class="icon-btn" data-ad="back" aria-label="' + esc(t("ad.back")) + '">' + icon("arrow-left") + "</button>" +
      '<div><div class="hello">' + esc(t("ad.mode")) + '</div><div class="uname">' + esc(t("ad.title")) + "</div></div></div>" +
      '<span class="ad-badge">' + icon("shield", "sm") + "Admin</span></div>"
    );
  }

  function renderNav() {
    A.nav.innerHTML = TABS.map(
      (id) =>
        '<button class="nav-item ' + (id === A.tab ? "active" : "") + '" data-tab="' + id + '" aria-label="' + esc(t("ad.nav." + id)) + '">' +
        '<span class="nav-ico">' + icon(TAB_ICONS[id]) + "</span><span>" + esc(t("ad.nav." + id)) + "</span></button>"
    ).join("");
  }

  function buildShell() {
    A.root.innerHTML =
      '<div id="ad-head">' + headerHtml() + "</div>" +
      TABS.map((id) => '<section class="page" id="ad-page-' + id + '"></section>').join("");
    $r("#ad-page-dashboard").innerHTML = UI.skeleton("card", 3);
    renderNav();
    UI.on(A.root, "click", "[data-ad]", (e, el) => {
      if (el.dataset.ad === "back") App.showUser();
      else if (el.dataset.ad === "retry") window.AdminPanel.mount(A.root, A.nav);
    });
    UI.on(A.nav, "click", ".nav-item", (e, el) => go(el.dataset.tab));
    A.shell = true;
  }

  function showLoadError() {
    const box = $r("#ad-page-dashboard");
    box.innerHTML =
      UI.emptyState("alert", t("ad.loadFail")) +
      '<button class="btn btn-primary btn-block" data-ad="retry">' + esc(t("common.retry")) + "</button>";
    box.classList.add("active");
  }

  function ensureReady() {
    if (A.ready) return Promise.resolve(true);
    if (A.loading) return A.loading;
    A.loading = (async () => {
      try {
        await Promise.all(MODULES.map((src) => UI.loadScript(src)));
      } catch (e) {
        showLoadError();
        return false;
      }
      TABS.forEach((id) => {
        const p = Pages[id];
        if (p && p.init) p.init($r("#ad-page-" + id));
      });
      A.ready = true;
      return true;
    })().finally(() => {
      A.loading = null;
    });
    return A.loading;
  }

  function go(tab, force, opts) {
    if (!TABS.includes(tab)) return;
    if (!A.ready) {
      A.tab = tab;
      A.pendingOpts = opts || null;
      return;
    }
    if (tab === A.tab && !force && !opts) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const prev = Pages[A.tab];
    if (prev && prev.hide && tab !== A.tab) prev.hide();
    A.tab = tab;
    TABS.forEach((id) => {
      const el = $r("#ad-page-" + id);
      if (el) el.classList.toggle("active", id === tab);
    });
    A.nav.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    window.scrollTo({ top: 0 });
    if (!force) UI.haptic("select");
    const p = Pages[tab];
    if (p && p.show) p.show(opts || {});
  }

  window.AdminPanel = {
    async mount(root, nav) {
      A.root = root;
      A.nav = nav;
      if (!A.shell) buildShell();
      const ok = await ensureReady();
      if (!ok) return;
      const opts = A.pendingOpts;
      A.pendingOpts = null;
      go(A.tab, true, opts);
    },
    unmount() {
      const p = Pages[A.tab];
      if (p && p.hide) p.hide();
    },
    rerender() {
      if (!A.shell) return;
      $r("#ad-head").innerHTML = headerHtml();
      renderNav();
      if (!A.ready) return;
      TABS.forEach((id) => {
        const p = Pages[id];
        if (p && p.render) p.render();
      });
    },
  };

  /* ----------------------------- DASHBOARD ----------------------------- */

  function chartSvg(days, series) {
    const W = 340, H = 180, pl = 6, pr = 6, pt = 18, pb = 24;
    const max = Math.max(1, ...series.reduce((a, s) => a.concat(s.values), []));
    const n = days.length;
    const gw = (W - pl - pr) / n;
    const bw = Math.min(24, (gw - 10) / series.length);
    const soft = "font-size:9px;fill:var(--text-soft)";
    let out = '<svg viewBox="0 0 ' + W + " " + H + '" role="img">';
    out += '<line x1="' + pl + '" y1="' + (H - pb) + '" x2="' + (W - pr) + '" y2="' + (H - pb) + '" style="stroke:var(--border);stroke-width:1"/>';
    out += '<text x="' + pl + '" y="10" style="' + soft + '">' + esc(compact(max)) + "</text>";
    for (let i = 0; i < n; i++) {
      const gx = pl + i * gw + (gw - bw * series.length) / 2;
      series.forEach((s, si) => {
        const v = s.values[i] || 0;
        const h = v > 0 ? Math.max(3, (v / max) * (H - pt - pb)) : 0;
        const x = gx + si * bw;
        const y = H - pb - h;
        out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw - 3).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="4" style="fill:' + s.color + '"/>';
        if (series.length === 1 && v > 0) {
          out += '<text x="' + (x + (bw - 3) / 2).toFixed(1) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="middle" style="' + soft + '">' + esc(compact(v)) + "</text>";
        }
      });
      out += '<text x="' + (pl + i * gw + gw / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" style="' + soft + '">' + esc(days[i].slice(8) + "/" + days[i].slice(5, 7)) + "</text>";
    }
    return out + "</svg>";
  }

  const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

  Pages.dashboard = {
    id: "dashboard",
    root: null,
    data: null,
    metric: "money",
    timer: null,

    init(root) {
      this.root = root;
      root.innerHTML = UI.skeleton("card", 3);
      UI.on(root, "click", "[data-act]", (e, el) => {
        const a = el.dataset.act;
        if (a === "metric") {
          this.metric = el.dataset.v;
          UI.haptic("select");
          this.render();
        } else if (a === "goto") {
          go("tasks", false, { view: el.dataset.view, pf: el.dataset.pf });
        } else if (a === "refresh") {
          UI.haptic("light");
          this.load();
        }
      });
    },

    show() {
      this.load();
      clearInterval(this.timer);
      this.timer = setInterval(() => this.load(), 30000);
    },

    hide() {
      clearInterval(this.timer);
    },

    async load() {
      try {
        this.data = await API.get("/admin/dashboard");
      } catch (e) {
        if (!this.data) UI.handleError(e);
        return;
      }
      this.render();
    },

    render() {
      const d = this.data;
      if (!this.root) return;
      if (!d) {
        this.root.innerHTML = UI.skeleton("card", 3);
        return;
      }
      const k = d.kpis, p = d.pending, c = d.chart;

      const kpi = (ico, label, value, sub) =>
        '<div class="kpi"><div class="kpi-ico">' + icon(ico) + "</div><b>" + esc(value) + "</b><span>" + esc(label) + "</span>" +
        (sub ? "<small>" + esc(sub) + "</small>" : "") + "</div>";

      const tile = (n, label, view, pf, hot) =>
        '<button class="pend ' + (hot && n > 0 ? "hot" : "") + '" data-act="goto" data-view="' + view + '"' + (pf ? ' data-pf="' + pf + '"' : "") + ">" +
        "<b>" + UI.num(n) + "</b><span>" + esc(label) + "</span></button>";

      let series, legend;
      if (this.metric === "users") {
        series = [{ values: c.newUsers, color: "var(--accent-1)" }];
        legend = [[t("ad.d.lUsers"), UI.num(sum(c.newUsers)), "var(--accent-1)"]];
      } else if (this.metric === "tasks") {
        series = [{ values: c.tasksApproved, color: "var(--accent-1)" }];
        legend = [[t("ad.d.lTasks"), UI.num(sum(c.tasksApproved)), "var(--accent-1)"]];
      } else {
        series = [
          { values: c.deposits, color: "var(--accent-1)" },
          { values: c.withdrawals, color: "var(--accent-2)" },
        ];
        legend = [
          [t("ad.d.lDeposits"), money(sum(c.deposits)), "var(--accent-1)"],
          [t("ad.d.lWithdrawals"), money(sum(c.withdrawals)), "var(--accent-2)"],
        ];
      }
      const chip = (v, key) => '<button class="chip ' + (this.metric === v ? "active" : "") + '" data-act="metric" data-v="' + v + '">' + esc(t(key)) + "</button>";

      this.root.innerHTML =
        '<div class="page-head ad-head-row"><div><div class="page-title">' + esc(t("ad.d.title")) + '</div><div class="page-sub">' + esc(t("ad.d.sub")) + "</div></div>" +
        '<button class="icon-btn" data-act="refresh" aria-label="Refresh">' + icon("refresh") + "</button></div>" +

        '<div class="section-head" style="margin-top:4px"><div class="section-title">' + esc(t("ad.d.pending")) + "</div></div>" +
        '<div class="card"><div class="pend-grid">' +
        tile(p.proofs, t("ad.p.proofs"), "proofs", "", true) +
        tile(p.withdrawalsToApprove, t("ad.p.approval"), "payouts", "approval", true) +
        tile(p.withdrawalsProcessing, t("ad.p.processing"), "payouts", "processing", false) +
        tile(p.depositsOpen, t("ad.p.deposits"), "payouts", "deposits", false) +
        "</div></div>" +

        '<div class="kpi-grid">' +
        kpi("users", t("ad.k.users"), UI.num(k.totalUsers), t("ad.k.newToday", { n: k.newToday })) +
        kpi("activity", t("ad.k.active"), UI.num(k.active24h)) +
        kpi("arrow-down-circle", t("ad.k.deposited"), money(k.totalDeposited), t("ad.k.depCount", { n: k.depositCount })) +
        kpi("arrow-up-circle", t("ad.k.withdrawn"), money(k.totalWithdrawn), t("ad.k.wdCount", { n: k.withdrawCount })) +
        kpi("percent", t("ad.k.fees"), money(k.feeRevenue)) +
        kpi("wallet", t("ad.k.balances"), money(k.userBalances), t("ad.k.balancesSub")) +
        kpi("check-square", t("ad.k.tasks"), UI.num(k.activeTasks)) +
        kpi("ban", t("ad.k.banned"), UI.num(k.banned)) +
        "</div>" +

        '<div class="card"><div class="card-title">' + esc(t("ad.d.week")) + "</div>" +
        '<div class="chips" style="margin-top:10px">' + chip("money", "ad.d.mMoney") + chip("users", "ad.d.mUsers") + chip("tasks", "ad.d.mTasks") + "</div>" +
        '<div class="chart-wrap">' + chartSvg(c.days, series) + "</div>" +
        '<div class="legend">' + legend.map((l) => '<span><i style="background:' + l[2] + '"></i>' + esc(l[0]) + " · <b>" + esc(l[1]) + "</b></span>").join("") + "</div></div>";
    },
  };
})();
