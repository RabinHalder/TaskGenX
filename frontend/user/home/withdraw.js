/* TaskGenX Home feature: Withdraw */
(function () {
  "use strict";
  const { esc, icon, money } = UI;
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  I18n.extend(
    {
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

  function open() {
    const { head, row, info, resultHtml, doneBtn, maskDest } = HomeUI;
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
            // Show the real reason from the server when we have one, instead of a generic line.
            o = { tone: "bad", ico: "x", title: t("wd.failTitle"), text: r.failureReason || t("wd.failText") };
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
  }

  window.HomeFeatures = window.HomeFeatures || {};
  window.HomeFeatures.withdraw = { open };
})();
