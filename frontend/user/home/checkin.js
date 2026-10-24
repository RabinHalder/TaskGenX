/* TaskGenX Home feature: Daily check-in */
(function () {
  "use strict";
  const { esc, icon, money } = UI;

  I18n.extend(
    {
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
    },
    {
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
    }
  );

  function html(me) {
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
  }

  async function run(btn) {
    const r = await UI.withBusy(btn, () => API.post("/user/checkin"));
    if (!r) return;
    UI.confetti();
    UI.toast(r.reward > 0 ? t("home.ci.ok", { amount: money(r.reward) }) : t("home.ci.okFree", { n: r.streak }), "success");
    App.refreshMe({ silent: true });
  }

  window.HomeFeatures = window.HomeFeatures || {};
  window.HomeFeatures.checkin = { html, run };
})();
