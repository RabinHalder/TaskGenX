/* TaskGenX user panel: app shell (boot, tabs, admin toggle) */
(function () {
  "use strict";
  const { $, $$, esc, icon } = UI;

  const TABS = ["home", "club", "task", "referral", "profile"];
  const TAB_ICONS = { home: "home", club: "trophy", task: "check-square", referral: "gift", profile: "user" };

  const App = {
    me: null,
    tab: "home",
    panel: "user",
    lastLoad: 0,
    refreshing: null,
  };
  window.App = App;

  const pageOf = (id) => (window.Pages && window.Pages[id]) || null;

  function renderAll() {
    TABS.forEach((id) => {
      const p = pageOf(id);
      if (p && p.render) p.render();
    });
  }

  function renderNav() {
    const nav = $("#user-nav");
    nav.innerHTML = TABS.map(
      (id) =>
        '<button class="nav-item ' + (id === App.tab ? "active" : "") + '" data-tab="' + id + '" aria-label="' + esc(t("nav." + id)) + '">' +
        '<span class="nav-ico">' + icon(TAB_ICONS[id]) + "</span><span>" + esc(t("nav." + id)) + "</span></button>"
    ).join("");
  }

  function go(tab, force) {
    if (!TABS.includes(tab)) return;
    if (tab === App.tab && !force) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const prev = pageOf(App.tab);
    if (prev && prev.hide && tab !== App.tab) prev.hide();
    App.tab = tab;
    TABS.forEach((id) => {
      const el = $("#page-" + id);
      if (el) el.classList.toggle("active", id === tab);
    });
    $$("#user-nav .nav-item").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    window.scrollTo({ top: 0 });
    if (!force) UI.haptic("select");
    const p = pageOf(tab);
    if (p && p.show) p.show();
  }
  App.go = go;

  // Reloads /user/me and redraws every page.
  App.refreshMe = function (opts) {
    if (App.refreshing) return App.refreshing;
    App.refreshing = (async () => {
      try {
        App.me = await API.get("/user/me");
        App.lastLoad = Date.now();
        renderAll();
      } catch (e) {
        if (!(opts && opts.silent)) UI.handleError(e);
      } finally {
        App.refreshing = null;
      }
      return App.me;
    })();
    return App.refreshing;
  };

  App.refreshIfStale = function (ms) {
    if (Date.now() - App.lastLoad > (ms || 20000)) return App.refreshMe({ silent: true });
    return Promise.resolve(App.me);
  };

  /* ----------------------------- ADMIN TOGGLE ----------------------------- */

  // The admin panel (admin/admin.js) must define window.AdminPanel.mount(rootEl, navEl)
  // and may define AdminPanel.unmount() and AdminPanel.rerender().
  App.showAdmin = async function () {
    if (!App.me || !App.me.isAdmin) return;
    UI.haptic("medium");
    if (!window.AdminPanel) {
      try {
        await Promise.all([UI.loadCss("/admin/admin.css"), UI.loadScript("/admin/admin.js")]);
      } catch (e) {
        UI.toast(t("err.network"), "error");
        return;
      }
    }
    if (!window.AdminPanel) {
      UI.toast(t("err.generic"), "error");
      return;
    }
    const hide = pageOf(App.tab);
    if (hide && hide.hide) hide.hide();
    $("#user-root").classList.add("hidden");
    $("#user-nav").classList.add("hidden");
    $("#admin-root").classList.remove("hidden");
    $("#admin-nav").classList.remove("hidden");
    App.panel = "admin";
    window.scrollTo({ top: 0 });
    window.AdminPanel.mount($("#admin-root"), $("#admin-nav"));
  };

  App.showUser = function () {
    if (window.AdminPanel && window.AdminPanel.unmount) window.AdminPanel.unmount();
    $("#admin-root").classList.add("hidden");
    $("#admin-nav").classList.add("hidden");
    $("#user-root").classList.remove("hidden");
    $("#user-nav").classList.remove("hidden");
    App.panel = "user";
    window.scrollTo({ top: 0 });
    UI.haptic("medium");
    const p = pageOf(App.tab);
    if (p && p.show) p.show();
  };

  // Tapping a profile photo: admins open the admin panel, everyone else goes to Profile.
  UI.on(document, "click", "[data-admin-toggle]", () => {
    if (App.me && App.me.isAdmin) App.showAdmin();
    else go("profile");
  });

  /* ----------------------------- BOOT ----------------------------- */

  function buildShell() {
    $("#user-root").innerHTML = TABS.map((id) => '<section class="page" id="page-' + id + '"></section>').join("");
    TABS.forEach((id) => {
      const p = pageOf(id);
      if (p && p.init) p.init($("#page-" + id));
    });
    renderNav();
    UI.on($("#user-nav"), "click", ".nav-item", (e, el) => go(el.dataset.tab));
    $("#user-nav").classList.remove("hidden");
  }

  async function boot() {
    UI.initTelegram();
    if (!UI.tg || !UI.tg.initData) {
      UI.fatal("unauthorized");
      return;
    }
    try {
      App.me = await API.get("/user/me");
    } catch (e) {
      if (e.status === 0) UI.fatal("network");
      else if (![401, 403, 503].includes(e.status)) UI.fatal("network", e.message);
      return;
    }
    App.lastLoad = Date.now();
    UI.applyPrefs(App.me.user);
    buildShell();
    renderAll();
    go("home", true);
    UI.hideSplash();
  }

  window.addEventListener("langchange", () => {
    if (!App.me) return;
    renderNav();
    renderAll();
    if (window.AdminPanel && window.AdminPanel.rerender) window.AdminPanel.rerender();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && App.me && App.panel === "user") App.refreshIfStale(30000);
  });

  boot();
})();
