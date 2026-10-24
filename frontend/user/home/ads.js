/* TaskGenX Home feature: Watch & Earn (Monetag) */
(function () {
  "use strict";
  const { esc, icon, money } = UI;

  I18n.extend(
    {
      "home.ads.title": "Watch & Earn",
      "home.ads.sub": "Watch a short ad fully and get a quick reward.",
      "home.ads.left": "{used}/{limit} watched today",
      "home.ads.btn": "Watch Ads · {amount}",
      "home.ads.done": "Today's limit reached",
      "home.ads.loading": "Loading ad…",
      "home.ads.ok": "You earned {amount}!",
      "home.ads.unavailable": "No ad is available right now. Try again in a bit.",
      "home.ads.saveFail": "The ad finished, but saving your reward failed. Please try again.",
    },
    {
      "home.ads.title": "Watch & Earn",
      "home.ads.sub": "ছোট বিজ্ঞাপনটি সম্পূর্ণ দেখে দ্রুত পুরস্কার নিন।",
      "home.ads.left": "আজ {used}/{limit}টি দেখা হয়েছে",
      "home.ads.btn": "বিজ্ঞাপন দেখুন · {amount}",
      "home.ads.done": "আজকের সীমা শেষ",
      "home.ads.loading": "বিজ্ঞাপন লোড হচ্ছে…",
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

  function html(me) {
    const a = me.config.ads;
    const used = me.stats.adsWatchedToday || 0;
    const done = used >= a.dailyLimit;
    const pct = a.dailyLimit > 0 ? Math.min(100, Math.round((used / a.dailyLimit) * 100)) : 0;
    return (
      '<div class="ads-card">' +
      '<div class="ads-ring" style="--p:' + pct + '"><div class="ads-ring-ico">' + icon("play", "lg") + "</div></div>" +
      '<div class="ads-main"><div class="ads-title">' + esc(t("home.ads.title")) + "</div>" +
      '<div class="ads-sub">' + esc(t("home.ads.sub")) + "</div>" +
      '<div class="ads-left">' + esc(t("home.ads.left", { used, limit: a.dailyLimit })) + "</div></div></div>" +
      '<button class="btn btn-primary btn-block ads-btn" data-act="watchAd" ' + (done ? "disabled" : "") + ">" +
      '<span class="ads-btn-t">' + icon(done ? "check-circle" : "play", "sm") + esc(done ? t("home.ads.done") : t("home.ads.btn", { amount: money(a.reward) })) + "</span></button>"
    );
  }

  // Shows a real Monetag rewarded ad. The reward is only requested after the SDK
  // confirms the ad was watched (its promise resolves). `busy` is ALWAYS reset
  // at the end, on every path (success, failure, or save error) — that is what
  // used to keep the button disabled after the first successful watch.
  async function run(btn, rerender) {
    if (busy) return;
    const cfg = App.me.config.ads;
    if (!cfg || !cfg.zoneId) return;

    busy = true;
    btn.disabled = true;
    btn.classList.add("loading");
    const label = btn.querySelector(".ads-btn-t");
    const original = label ? label.innerHTML : "";
    if (label) label.innerHTML = icon("play", "sm") + "<span>" + esc(t("home.ads.loading")) + "</span>";

    try {
      const show = await HomeUI.loadMonetag(cfg.zoneId);
      await show(); // resolves once the ad has been fully watched
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
      busy = false; // always clear, whatever happened above
      await App.refreshMe({ silent: true });
      if (rerender) rerender();
    }
  }

  window.HomeFeatures = window.HomeFeatures || {};
  window.HomeFeatures.ads = { html, run, warmUp };
})();
