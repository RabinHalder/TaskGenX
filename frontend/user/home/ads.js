/* TaskGenX Home feature: Watch & Earn (Monetag) */
(function () {
  "use strict";
  const { esc, icon, money } = UI;

  UI.loadCss("/user/home/ads.css").catch(() => {});

  I18n.extend(
    {
      "home.ads.title": "Watch & Earn",
      "home.ads.sub": "Watch a short ad fully for a reward.",
      "home.ads.left": "{used}/{limit} today",
      "home.ads.btn": "Watch · {amount}",
      "home.ads.done": "Limit reached",
      "home.ads.loading": "Loading…",
      "home.ads.ok": "You earned {amount}!",
      "home.ads.unavailable": "No ad is available right now. Try again in a bit.",
      "home.ads.saveFail": "The ad finished, but saving your reward failed. Please try again.",
    },
    {
      "home.ads.title": "Watch & Earn",
      "home.ads.sub": "ছোট বিজ্ঞাপন সম্পূর্ণ দেখে পুরস্কার নিন।",
      "home.ads.left": "আজ {used}/{limit}",
      "home.ads.btn": "দেখুন · {amount}",
      "home.ads.done": "সীমা শেষ",
      "home.ads.loading": "লোড হচ্ছে…",
      "home.ads.ok": "আপনি {amount} পেয়েছেন!",
      "home.ads.unavailable": "এখন কোনো বিজ্ঞাপন পাওয়া যাচ্ছে না। একটু পর আবার চেষ্টা করুন।",
      "home.ads.saveFail": "বিজ্ঞাপন শেষ হয়েছে, কিন্তু পুরস্কার সেভ করা যায়নি। আবার চেষ্টা করুন।",
    }
  );

  let busy = false;

  function warmUp(me) {
    const cfg = me && me.config && me.config.ads;
    if (cfg && cfg.enabled && cfg.zoneId) HomeUI.loadMonetag(cfg.zoneId).catch(() => {});
  }

  // Compact card: icon + title/subtitle on the left, the action button beside it on the right.
  function html(me) {
    const a = me.config.ads;
    const used = me.stats.adsWatchedToday || 0;
    const done = used >= a.dailyLimit;
    return (
      '<div class="adsx-card">' +
      '<div class="adsx-ico">' + icon("play") + "</div>" +
      '<div class="adsx-info"><div class="adsx-title">' + esc(t("home.ads.title")) + "</div>" +
      '<div class="adsx-sub">' + esc(t("home.ads.sub")) + "</div>" +
      '<div class="adsx-left">' + esc(t("home.ads.left", { used, limit: a.dailyLimit })) + "</div></div>" +
      '<button class="adsx-btn" data-act="watchAd" ' + (done ? "disabled" : "") + ">" +
      '<span class="adsx-btn-t">' + icon(done ? "check-circle" : "play", "sm") + "<span>" +
      esc(done ? t("home.ads.done") : t("home.ads.btn", { amount: money(a.reward) })) + "</span></span></button></div>"
    );
  }

  async function run(btn, rerender) {
    if (busy) return;
    const cfg = App.me.config.ads;
    if (!cfg || !cfg.zoneId) return;

    busy = true;
    btn.disabled = true;
    btn.classList.add("loading");
    const label = btn.querySelector(".adsx-btn-t");
    const original = label ? label.innerHTML : "";
    if (label) label.innerHTML = icon("play", "sm") + "<span>" + esc(t("home.ads.loading")) + "</span>";

    try {
      const show = await HomeUI.loadMonetag(cfg.zoneId);
      await show();
    } catch (e) {
      busy = false;
      btn.disabled = false;
      btn.classList.remove("loading");
      if (label) label.innerHTML = original;
      UI.toast(t("home.ads.unavailable"), "error");
      return;
    }

    try {
      const r = await API.post("/user/watch-ad");
      UI.confetti();
      UI.toast(t("home.ads.ok", { amount: money(r.reward) }), "success");
    } catch (e) {
      UI.toast(t("home.ads.saveFail"), "error");
    } finally {
      busy = false;
      await App.refreshMe({ silent: true });
      if (rerender) rerender();
    }
  }

  window.HomeFeatures = window.HomeFeatures || {};
  window.HomeFeatures.ads = { html, run, warmUp };
})();
