/* TaskGenX user panel: Profile */
(function () {
  "use strict";
  const { esc, icon, money } = UI;

  UI.loadCss("/user/profile.css").catch(() => {});

  I18n.extend(
    {
      "pf.id": "ID {id}",
      "pf.since": "Member since {date}",
      "pf.statTasks": "Tasks done",
      "pf.statEarned": "Earned",
      "pf.statRefs": "Referrals",
      "pf.statWithdrawn": "Withdrawn",
      "pf.lv.pill": "{name}",
      "pf.lv.of": "Level {n} of {total}",
      "pf.lv.mission": "Mission to reach {name}",
      "pf.lv.tasks": "Tasks completed",
      "pf.lv.refs": "Referrals completed",
      "pf.lv.hint": "Complete everything above to level up.",
      "pf.lv.max": "You have reached the top level.",
      "pf.lv.fee": "Withdraw fee",
      "pf.lv.wd": "Withdrawals this month",
      "pf.lv.cLevel": "Level",
      "pf.lv.cTasks": "Tasks",
      "pf.lv.cRefs": "Referrals",
      "pf.lv.cFee": "Fee",
      "pf.lv.cWd": "Withdrawals / month",
      "pf.lv.note": "Tasks and Referrals: the mission you complete at that level to move up (both are needed). – means none.",
      "pf.detailsTitle": "Withdraw details",
      "pf.detailsSub": "Saved details are used when you withdraw.",
      "pf.upiSub": "UPI",
      "pf.upi": "UPI ID",
      "pf.upiName": "Account holder name",
      "pf.upiNameHint": "Your name exactly as registered with your bank or UPI. Required for successful UPI payouts.",
      "pf.walletSub": "FINZO Wallet",
      "pf.wallet": "FINZO Wallet number",
      "pf.walletPh": "10-digit FINZO wallet number",
      "pf.appear": "Appearance",
      "pf.appearSub": "Make the app look the way you like.",
      "pf.theme": "Theme",
      "pf.themeAuto": "Auto",
      "pf.themeLight": "Light",
      "pf.themeDark": "Dark",
      "pf.accent": "Accent color",
      "pf.btnStyle": "Button style",
      "pf.cardStyle": "Card style",
      "pf.btnRound": "Round",
      "pf.btnSoft": "Soft",
      "pf.btnSquare": "Square",
      "pf.cardGlass": "Glass",
      "pf.cardFlat": "Flat",
      "pf.cardOutline": "Outline",
      "pf.reset": "Reset colors and styles",
      "pf.resetOk": "Appearance reset to default",
      "pf.prefs": "Preferences",
      "pf.language": "Language",
      "pf.notif": "Notifications",
      "pf.notifSub": "Get bot messages about tasks, deposits and withdrawals.",
      "pf.hideName": "Hide my name",
      "pf.hideNameSub": "Show \"Hidden user\" in the club feed.",
      "pf.history": "Transaction history",
      "pf.faq": "FAQ",
      "pf.support": "Support",
      "pf.channel": "Official channel",
      "hist.title": "History",
      "hist.tx": "Transactions",
      "hist.pay": "Deposits and withdrawals",
      "hist.empty": "No records yet.",
      "hist.balance": "Balance {amount}",
      "hist.fee": "Fee {fee} · Net {net}",
      "hist.cancel": "Cancel request",
      "hist.cancelAsk": "Cancel this withdrawal?",
      "hist.cancelText": "The amount will be returned to your balance.",
      "hist.cancelled": "Request cancelled. Amount refunded.",
      "faq.title": "Frequently asked questions",
      "faq.empty": "No questions yet.",
    },
    {
      "pf.id": "আইডি {id}",
      "pf.since": "সদস্য হয়েছেন {date}",
      "pf.statTasks": "টাস্ক সম্পন্ন",
      "pf.statEarned": "আয়",
      "pf.statRefs": "রেফারেল",
      "pf.statWithdrawn": "উইথড্র",
      "pf.lv.pill": "{name}",
      "pf.lv.of": "{total}টির মধ্যে লেভেল {n}",
      "pf.lv.mission": "{name}-এ পৌঁছানোর মিশন",
      "pf.lv.tasks": "সম্পন্ন টাস্ক",
      "pf.lv.refs": "সম্পন্ন রেফারেল",
      "pf.lv.hint": "লেভেল বাড়াতে ওপরের সবকিছু শেষ করুন।",
      "pf.lv.max": "আপনি সর্বোচ্চ লেভেলে পৌঁছে গেছেন।",
      "pf.lv.fee": "উইথড্র ফি",
      "pf.lv.wd": "এই মাসের উইথড্র",
      "pf.lv.cLevel": "লেভেল",
      "pf.lv.cTasks": "টাস্ক",
      "pf.lv.cRefs": "রেফারেল",
      "pf.lv.cFee": "ফি",
      "pf.lv.cWd": "উইথড্র / মাস",
      "pf.lv.note": "টাস্ক ও রেফারেল: ওই লেভেলে থেকে পরের লেভেলে ওঠার মিশন (দুটোই লাগবে)। – মানে লাগবে না।",
      "pf.detailsTitle": "উইথড্র তথ্য",
      "pf.detailsSub": "উইথড্র করার সময় সেভ করা তথ্য ব্যবহার হবে।",
      "pf.upiSub": "UPI",
      "pf.upi": "UPI আইডি",
      "pf.upiName": "অ্যাকাউন্ট হোল্ডারের নাম",
      "pf.upiNameHint": "আপনার ব্যাংক বা UPI-তে নথিভুক্ত নাম, হুবহু ইংরেজিতে লিখুন। UPI উইথড্র সফল হতে এটা জরুরি।",
      "pf.walletSub": "FINZO Wallet",
      "pf.wallet": "FINZO ওয়ালেট নম্বর",
      "pf.walletPh": "১০ সংখ্যার FINZO ওয়ালেট নম্বর",
      "pf.appear": "চেহারা",
      "pf.appearSub": "অ্যাপটি আপনার পছন্দমতো সাজিয়ে নিন।",
      "pf.theme": "থিম",
      "pf.themeAuto": "অটো",
      "pf.themeLight": "লাইট",
      "pf.themeDark": "ডার্ক",
      "pf.accent": "অ্যাকসেন্ট কালার",
      "pf.btnStyle": "বাটন স্টাইল",
      "pf.cardStyle": "কার্ড স্টাইল",
      "pf.btnRound": "গোল",
      "pf.btnSoft": "নরম",
      "pf.btnSquare": "চৌকো",
      "pf.cardGlass": "গ্লাস",
      "pf.cardFlat": "ফ্ল্যাট",
      "pf.cardOutline": "আউটলাইন",
      "pf.reset": "রং ও স্টাইল ডিফল্টে ফেরান",
      "pf.resetOk": "চেহারা ডিফল্টে ফিরেছে",
      "pf.prefs": "পছন্দসমূহ",
      "pf.language": "ভাষা",
      "pf.notif": "নোটিফিকেশন",
      "pf.notifSub": "টাস্ক, ডিপোজিট ও উইথড্র নিয়ে বটের বার্তা পান।",
      "pf.hideName": "আমার নাম লুকান",
      "pf.hideNameSub": "ক্লাব ফিডে “গোপন ইউজার” দেখাবে।",
      "pf.history": "লেনদেনের ইতিহাস",
      "pf.faq": "সচরাচর জিজ্ঞাসা",
      "pf.support": "সাপোর্ট",
      "pf.channel": "অফিসিয়াল চ্যানেল",
      "hist.title": "ইতিহাস",
      "hist.tx": "লেনদেন",
      "hist.pay": "ডিপোজিট ও উইথড্র",
      "hist.empty": "এখনো কোনো রেকর্ড নেই।",
      "hist.balance": "ব্যালেন্স {amount}",
      "hist.fee": "ফি {fee} · নিট {net}",
      "hist.cancel": "অনুরোধ বাতিল করুন",
      "hist.cancelAsk": "এই উইথড্র বাতিল করবেন?",
      "hist.cancelText": "টাকা আপনার ব্যালেন্সে ফেরত যাবে।",
      "hist.cancelled": "অনুরোধ বাতিল হয়েছে। টাকা ফেরত দেওয়া হয়েছে।",
      "faq.title": "সচরাচর জিজ্ঞাসা",
      "faq.empty": "এখনো কোনো প্রশ্ন নেই।",
    }
  );

  const TXICON = {
    task: "check-square",
    deposit: "arrow-down-circle",
    withdraw: "arrow-up-circle",
    withdraw_refund: "refresh",
    referral: "users",
    referral_l1: "users",
    referral_l2: "users",
    checkin: "calendar",
    bonus: "gift",
    admin_adjust: "sliders",
  };

  const CUSTOM_KEYS = ["accent", "btnStyle", "cardStyle"];
  const DEFAULT_LOOK = { accent: "", btnStyle: "round", cardStyle: "glass" };

  function compact(n) {
    n = Number(n) || 0;
    const f = (v, s) => "₹" + v.toFixed(1).replace(/\.0$/, "") + s;
    if (n >= 1e7) return f(n / 1e7, "Cr");
    if (n >= 1e5) return f(n / 1e5, "L");
    if (n >= 1e4) return f(n / 1e3, "k");
    return money(n);
  }

  function seg(act, cur, opts) {
    return (
      '<div class="seg">' +
      opts
        .map(
          (o) =>
            '<button class="' + (cur === o[0] ? "active" : "") + '" data-act="' + act + '" data-v="' + o[0] + '">' +
            (o[2] ? icon(o[2], "sm") : "") + esc(o[1]) + "</button>"
        )
        .join("") +
      "</div>"
    );
  }

  function optGrid(act, cur, opts) {
    return (
      '<div class="opts">' +
      opts.map((o) => '<button class="opt ' + (cur === o[0] ? "active" : "") + '" data-act="' + act + '" data-v="' + o[0] + '"><i class="' + o[2] + '"></i>' + esc(o[1]) + "</button>").join("") +
      "</div>"
    );
  }

  function switchRow(act, on, title, sub) {
    return (
      '<div class="switch-row"><div class="grow"><div class="card-title">' + esc(title) + "</div>" +
      (sub ? '<div class="card-sub">' + esc(sub) + "</div>" : "") + "</div>" +
      '<button class="switch ' + (on ? "on" : "") + '" data-act="' + act + '" role="switch" aria-checked="' + !!on + '"></button></div>'
    );
  }

  function menuItem(act, ico, label) {
    return (
      '<button class="menu-item" data-act="' + act + '"><div class="row-ico">' + icon(ico) + "</div>" +
      '<div class="menu-label">' + esc(label) + "</div>" + icon("chevron-right", "sm") + "</button>"
    );
  }

  const Page = {
    id: "profile",
    root: null,

    init(root) {
      this.root = root;
      root.innerHTML = UI.skeleton("card", 3);
      UI.on(root, "click", "[data-act]", (e, el) => this.act(el));
      root.addEventListener("change", (e) => {
        if (e.target && e.target.id === "pf-color") setPref("accent", e.target.value);
      });
    },

    show() {
      this.render();
      App.refreshIfStale(20000);
    },

    focusDetails() {
      const box = this.root && this.root.querySelector("#pf-details");
      if (!box) return;
      box.scrollIntoView({ behavior: "smooth", block: "center" });
      const f = this.root.querySelector("#pf-upi");
      if (f) setTimeout(() => f.focus(), 350);
    },

    act(el) {
      const a = el.dataset.act;
      const v = el.dataset.v;
      const u = App.me.user;
      if (a === "saveDetails") return this.saveDetails(el);
      if (a === "lang") return setPref("language", v);
      if (a === "theme") return setPref("theme", v);
      if (a === "notif") return setPref("notifications", !u.notifications);
      if (a === "hideName") return setPref("hideName", !u.hideName);
      if (a === "accent") return setPref("accent", v);
      if (a === "btnStyle") return setPref("btnStyle", v);
      if (a === "cardStyle") return setPref("cardStyle", v);
      if (a === "resetLook") return resetLook();
      if (a === "history") return this.openHistory();
      if (a === "faq") return this.openFaq();
      if (a === "support") return UI.openLink(App.me.config.app.supportLink);
      if (a === "channel") return UI.openLink(App.me.config.app.channelLink);
    },

    async saveDetails(btn) {
      const upi = this.root.querySelector("#pf-upi").value.trim();
      const upiName = this.root.querySelector("#pf-upi-name").value.trim();
      const wal = this.root.querySelector("#pf-wallet").value.trim();
      const r = await UI.withBusy(btn, () => API.put("/user/withdraw-details", { upi, upiName, finzoWallet: wal }));
      if (!r) return;
      App.me.user.withdrawDetails = r.withdrawDetails;
      UI.toast(t("common.saved"), "success");
    },

    /* ----------------------------- LEVEL CARD ----------------------------- */

    levelCard(me) {
      const lv = me.level;
      const cur = lv.current;
      if (!cur) return "";
      const levels = me.config.levels || [];
      const used = me.stats.withdrawalsThisMonth || 0;

      let next;
      if (lv.next && lv.progress) {
        const p = lv.progress;
        const bar = (label, have, need) => {
          const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 100;
          return (
            '<div class="prog-line"><div class="meta"><span>' + esc(label) + "</span><b>" +
            UI.num(Math.min(have, need)) + "/" + UI.num(need) + "</b></div>" +
            '<div class="progress"><span style="width:' + pct + '%"></span></div></div>'
          );
        };
        next =
          '<div class="card-sub" style="margin-bottom:10px">' + esc(t("pf.lv.mission", { name: lv.next.name })) + "</div>" +
          (p.tasks.need > 0 ? bar(t("pf.lv.tasks"), p.tasks.have, p.tasks.need) : "") +
          (p.referrals.need > 0 ? bar(t("pf.lv.refs"), p.referrals.have, p.referrals.need) : "") +
          '<div class="card-sub">' + esc(t("pf.lv.hint")) + "</div>";
      } else {
        next = '<div class="card-sub">' + esc(t("pf.lv.max")) + "</div>";
      }

      const dash = (v) => (v > 0 ? UI.num(v) : "–");
      const rows = levels
        .map((L, i) => {
          const n = i + 1;
          const isLast = i === levels.length - 1;
          const state = n < lv.level ? "done" : n === lv.level ? "cur" : "todo";
          return (
            '<div class="ladder-row ' + state + '"><div class="nm"><i class="dot"></i><span>' + esc(L.name) + "</span></div>" +
            '<div class="c">' + (isLast ? "–" : dash(L.minTasks)) + '</div><div class="c">' + (isLast ? "–" : dash(L.minReferrals)) + "</div>" +
            '<div class="c">' + esc(L.withdrawFeePercent) + '%</div><div class="c">' + esc(L.monthlyWithdrawals) + "</div></div>"
          );
        })
        .join("");

      return (
        '<div class="card"><div class="lvl-head"><div class="lvl-badge">' + icon(lv.level >= 5 ? "crown" : "award", "lg") + "</div>" +
        '<div><div class="lvl-name">' + esc(cur.name) + '</div><div class="card-sub">' + esc(t("pf.lv.of", { n: lv.level, total: lv.totalLevels })) + "</div></div></div>" +
        next +
        '<div class="perks"><div class="perk">' + esc(t("pf.lv.fee")) + "<b>" + esc(cur.withdrawFeePercent) + "%</b></div>" +
        '<div class="perk">' + esc(t("pf.lv.wd")) + "<b>" + esc(used + " / " + cur.monthlyWithdrawals) + "</b></div></div>" +
        '<div class="ladder"><div class="ladder-row head"><div class="nm">' + esc(t("pf.lv.cLevel")) + "</div>" +
        '<div class="c">' + esc(t("pf.lv.cTasks")) + '</div><div class="c">' + esc(t("pf.lv.cRefs")) + "</div>" +
        '<div class="c">' + esc(t("pf.lv.cFee")) + '</div><div class="c">' + esc(t("pf.lv.cWd")) + "</div></div>" +
        rows + "</div>" +
        '<div class="pf-ladder-note">' + esc(t("pf.lv.note")) + "</div></div>"
      );
    },

    /* ----------------------------- RENDER ----------------------------- */

    render() {
      const me = App.me;
      if (!this.root || !me) return;
      const u = me.user, cfg = me.config, lv = me.level;

      const oldUpi = this.root.querySelector("#pf-upi");
      const oldUpiName = this.root.querySelector("#pf-upi-name");
      const oldWal = this.root.querySelector("#pf-wallet");
      const upiVal = oldUpi ? oldUpi.value : u.withdrawDetails.upi;
      const upiNameVal = oldUpiName ? oldUpiName.value : u.withdrawDetails.upiName || "";
      const walVal = oldWal ? oldWal.value : u.withdrawDetails.finzoWallet;

      const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || t("common.unknown");
      const accent = (u.customize.accent || "").toLowerCase();
      const swatches = UI.ACCENTS.map((hex, i) => {
        const active = i === 0 ? !accent || accent === hex : accent === hex;
        return '<button class="swatch ' + (active ? "active" : "") + '" data-act="accent" data-v="' + (i === 0 ? "" : hex) + '" style="background:' + hex + '" aria-label="' + hex + '"></button>';
      }).join("");
      const isCustom = accent && !UI.ACCENTS.includes(accent);
      const custom =
        '<label class="swatch swatch-custom ' + (isCustom ? "active" : "") + '"><input type="color" id="pf-color" value="' + (isCustom ? accent : "#4c5bff") + '" /></label>';

      const stat = (label, value) => '<div class="pf-stat"><b>' + esc(value) + "</b><span>" + esc(label) + "</span></div>";
      const input = (id, label, val, ph, mode, hint) =>
        '<div class="field"><label>' + esc(label) + '</label><input class="input" id="' + id + '" type="text" maxlength="256" inputmode="' + (mode || "text") + '" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(val) + '" placeholder="' + esc(ph) + '" />' +
        (hint ? '<div class="field-hint">' + esc(hint) + "</div>" : "") + "</div>";

      this.root.innerHTML =
        '<div class="pf-hero"><div class="pf-cover"></div>' +
        '<span class="av-wrap pf-av ' + (me.isAdmin ? "admin" : "") + '" data-admin-toggle>' + UI.avatar({ name, photoUrl: u.photoUrl }, "avatar-lg tap") + "</span>" +
        '<div class="profile-name">' + esc(name) + "</div>" +
        '<div class="card-sub">' + (u.username ? "@" + esc(u.username) + " · " : "") + esc(t("pf.id", { id: u.tgId })) + "</div>" +
        (lv.current ? '<div><span class="pf-pill">' + icon(lv.level >= 5 ? "crown" : "award", "sm") + esc(t("pf.lv.pill", { name: lv.current.name })) + "</span></div>" : "") +
        '<div class="card-sub" style="margin-top:10px">' + esc(t("pf.since", { date: UI.date(u.createdAt) })) + "</div></div>" +

        '<div class="pf-stats">' +
        stat(t("pf.statTasks"), UI.num(u.tasksApproved)) + stat(t("pf.statEarned"), compact(u.totalEarned)) +
        stat(t("pf.statRefs"), UI.num(u.referralCount)) + stat(t("pf.statWithdrawn"), compact(u.totalWithdrawn)) +
        "</div>" +

        this.levelCard(me) +

        '<div class="card pf-sec" id="pf-details"><div class="card-title">' + icon("wallet", "sm") + esc(t("pf.detailsTitle")) + '</div><div class="card-sub" style="margin:4px 0 4px">' + esc(t("pf.detailsSub")) + "</div>" +
        '<div class="pf-sub-head" style="margin-top:14px">' + icon("smartphone", "sm") + esc(t("pf.upiSub")) + "</div>" +
        input("pf-upi", t("pf.upi"), upiVal, "name@bank") +
        input("pf-upi-name", t("pf.upiName"), upiNameVal, "Example: Rahim Uddin", "text", t("pf.upiNameHint")) +
        '<div class="pf-divider"></div>' +
        '<div class="pf-sub-head">' + icon("wallet", "sm") + esc(t("pf.walletSub")) + "</div>" +
        input("pf-wallet", t("pf.wallet"), walVal, t("pf.walletPh"), "numeric") +
        '<button class="btn btn-primary btn-block" data-act="saveDetails">' + icon("check", "sm") + esc(t("common.save")) + "</button></div>" +

        '<div class="card pf-sec"><div class="card-title">' + icon("palette", "sm") + esc(t("pf.appear")) + '</div><div class="card-sub" style="margin-top:4px">' + esc(t("pf.appearSub")) + "</div>" +
        '<div class="pf-label">' + esc(t("pf.theme")) + "</div>" +
        seg("theme", u.theme, [["auto", t("pf.themeAuto"), "sliders"], ["light", t("pf.themeLight"), "sun"], ["dark", t("pf.themeDark"), "moon"]]) +
        '<div class="pf-label">' + esc(t("pf.accent")) + "</div>" +
        '<div class="swatches">' + swatches + custom + "</div>" +
        '<div class="pf-label">' + esc(t("pf.btnStyle")) + "</div>" +
        optGrid("btnStyle", u.customize.btnStyle, [["round", t("pf.btnRound"), "pv-round"], ["soft", t("pf.btnSoft"), "pv-soft"], ["square", t("pf.btnSquare"), "pv-square"]]) +
        '<div class="pf-label">' + esc(t("pf.cardStyle")) + "</div>" +
        optGrid("cardStyle", u.customize.cardStyle, [["glass", t("pf.cardGlass"), "pv-glass"], ["flat", t("pf.cardFlat"), "pv-flat"], ["outline", t("pf.cardOutline"), "pv-outline"]]) +
        '<button class="btn btn-ghost btn-block pf-reset" data-act="resetLook">' + icon("refresh", "sm") + esc(t("pf.reset")) + "</button></div>" +

        '<div class="card pf-sec"><div class="card-title">' + icon("sliders", "sm") + esc(t("pf.prefs")) + "</div>" +
        '<div class="pf-label">' + esc(t("pf.language")) + "</div>" +
        seg("lang", u.language, [["en", t("lang.en"), "globe"], ["bn", t("lang.bn"), "globe"]]) +
        switchRow("notif", u.notifications, t("pf.notif"), t("pf.notifSub")) +
        switchRow("hideName", u.hideName, t("pf.hideName"), t("pf.hideNameSub")) +
        "</div>" +

        '<div class="card">' +
        menuItem("history", "history", t("pf.history")) +
        menuItem("faq", "help-circle", t("pf.faq")) +
        (cfg.app.supportLink ? menuItem("support", "headphones", t("pf.support")) : "") +
        (cfg.app.channelLink ? menuItem("channel", "message-circle", t("pf.channel")) : "") +
        "</div>" +
        '<div class="card-sub" style="text-align:center;margin-top:8px">' + esc(cfg.app.name) + " v1.0</div>";
    },

    /* ----------------------------- FAQ ----------------------------- */

    openFaq() {
      const list = App.me.config.faq || [];
      const sh = UI.sheet({
        title: t("faq.title"),
        html: list.length
          ? list
              .map(
                (f) =>
                  '<div class="faq-item"><button class="faq-q"><span>' + esc(I18n.pick(f.qEn, f.qBn)) + "</span>" + icon("chevron-down", "sm") + "</button>" +
                  '<div class="faq-a">' + esc(I18n.pick(f.aEn, f.aBn)) + "</div></div>"
              )
              .join("")
          : UI.emptyState("help-circle", t("faq.empty")),
      });
      UI.on(sh.el, "click", ".faq-q", (e, el) => {
        el.parentElement.classList.toggle("open");
        UI.haptic("select");
      });
    },

    /* ----------------------------- HISTORY ----------------------------- */

    openHistory() {
      let tab = "tx";
      let page = 0;
      let more = false;
      let busy = false;
      let txItems = [];

      const sh = UI.sheet({
        title: t("hist.title"),
        html:
          '<div class="seg" id="h-seg"><button class="active" data-tab="tx">' + esc(t("hist.tx")) + '</button><button data-tab="pay">' + esc(t("hist.pay")) + "</button></div>" +
          '<div id="h-body">' + UI.skeleton("list", 4) + "</div>",
      });
      const body = sh.el.querySelector("#h-body");

      function txHtml() {
        if (!txItems.length) return UI.emptyState("history", t("hist.empty"));
        return (
          '<div class="card" style="box-shadow:none;border:0;padding:0;background:transparent">' +
          txItems
            .map(
              (x) =>
                '<div class="row"><div class="row-ico">' + icon(TXICON[x.type] || "wallet") + "</div>" +
                '<div class="row-main"><div class="row-title">' + esc(t("tx." + x.type)) + "</div>" +
                '<div class="row-sub">' + esc(UI.dateTime(x.createdAt)) + "</div></div>" +
                '<div class="row-end"><div class="' + (x.amount >= 0 ? "plus" : "minus") + '">' + esc(UI.signedMoney(x.amount)) + "</div>" +
                '<div class="row-sub">' + esc(t("hist.balance", { amount: money(x.balanceAfter) })) + "</div></div></div>"
            )
            .join("") +
          "</div>" +
          (more ? '<button class="btn btn-ghost btn-block" id="h-more">' + esc(t("common.loadMore")) + "</button>" : "")
        );
      }

      async function loadTx(reset) {
        if (busy) return;
        busy = true;
        if (reset) {
          txItems = [];
          page = 0;
          more = false;
          body.innerHTML = UI.skeleton("list", 4);
        }
        try {
          const r = await API.get("/user/transactions" + API.qs({ page: page + 1 }));
          txItems = txItems.concat(r.items);
          page = r.page;
          more = r.hasMore;
        } catch (e) {
          UI.handleError(e);
        }
        busy = false;
        if (tab !== "tx") return;
        body.innerHTML = txHtml();
        const mb = body.querySelector("#h-more");
        if (mb) mb.onclick = () => loadTx(false);
      }

      async function loadPay() {
        body.innerHTML = UI.skeleton("list", 4);
        let items = [];
        try {
          items = (await API.get("/wallet/payments")).items;
        } catch (e) {
          UI.handleError(e);
        }
        if (tab !== "pay") return;
        if (!items.length) {
          body.innerHTML = UI.emptyState("wallet", t("hist.empty"));
          return;
        }
        body.innerHTML =
          '<div class="card" style="box-shadow:none;border:0;padding:0;background:transparent">' +
          items
            .map((p) => {
              const cls = p.status === "success" ? "ok" : ["failed", "rejected", "cancelled"].includes(p.status) ? "bad" : "wait";
              const dep = p.type === "deposit";
              return (
                '<div class="row" style="align-items:flex-start"><div class="row-ico">' + icon(dep ? "arrow-down-circle" : "arrow-up-circle") + "</div>" +
                '<div class="row-main"><div class="row-title">' + esc(t("tx." + p.type) + " · " + t("method." + p.method)) + "</div>" +
                '<div class="row-sub">' + esc(UI.dateTime(p.createdAt)) + "</div>" +
                (p.fee > 0 ? '<div class="row-sub">' + esc(t("hist.fee", { fee: money(p.fee), net: money(p.netAmount) })) + "</div>" : "") +
                (p.failureReason ? '<div class="hist-reject">' + esc(p.failureReason) + "</div>" : "") +
                (!dep && p.status === "awaiting_approval"
                  ? '<button class="btn btn-ghost btn-sm" data-cancel="' + esc(p.orderId) + '" style="margin-top:8px">' + esc(t("hist.cancel")) + "</button>"
                  : "") +
                "</div>" +
                '<div class="row-end"><div>' + esc(money(p.amount)) + '</div><span class="badge ' + cls + '">' + esc(t("status." + p.status)) + "</span></div></div>"
              );
            })
            .join("") +
          "</div>";
      }

      UI.on(sh.el, "click", "#h-seg button", (e, el) => {
        tab = el.dataset.tab;
        UI.haptic("select");
        sh.el.querySelectorAll("#h-seg button").forEach((b) => b.classList.toggle("active", b === el));
        if (tab === "tx") loadTx(true);
        else loadPay();
      });

      UI.on(body, "click", "[data-cancel]", async (e, el) => {
        const ok = await UI.confirm({ title: t("hist.cancelAsk"), text: t("hist.cancelText"), danger: true });
        if (!ok) return;
        const r = await UI.withBusy(el, () => API.post("/wallet/withdraw/" + encodeURIComponent(el.dataset.cancel) + "/cancel"));
        if (!r) return;
        UI.toast(t("hist.cancelled"), "success");
        loadPay();
        App.refreshMe({ silent: true });
      });

      loadTx(true);
    },
  };

  async function setPref(key, value) {
    const prev = JSON.parse(JSON.stringify(App.me.user));
    const u = App.me.user;
    const isCustom = CUSTOM_KEYS.includes(key);

    if (isCustom) {
      u.customize[key] = value;
      UI.applyCustomize(u.customize);
    } else {
      u[key] = value;
      if (key === "language") I18n.setLang(value);
      if (key === "theme") UI.applyTheme(value);
    }
    UI.haptic("select");
    Page.render();

    try {
      await API.patch("/user/prefs", isCustom ? { customize: { [key]: value } } : { [key]: value });
    } catch (e) {
      App.me.user = prev;
      UI.applyPrefs(prev);
      Page.render();
      UI.handleError(e);
    }
  }

  async function resetLook() {
    const prev = JSON.parse(JSON.stringify(App.me.user));
    App.me.user.customize = { ...DEFAULT_LOOK };
    UI.applyCustomize(App.me.user.customize);
    UI.haptic("medium");
    Page.render();
    try {
      await API.patch("/user/prefs", { customize: { ...DEFAULT_LOOK } });
      UI.toast(t("pf.resetOk"), "success");
    } catch (e) {
      App.me.user = prev;
      UI.applyPrefs(prev);
      Page.render();
      UI.handleError(e);
    }
  }

  window.Pages = window.Pages || {};
  window.Pages.profile = Page;
})();
