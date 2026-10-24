/* TaskGenX Home feature: Deposit */
(function () {
  "use strict";
  const { esc, icon, money } = UI;
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  I18n.extend(
    {
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
    },
    {
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
    }
  );

  function open() {
    const { head, row, resultHtml, doneBtn } = HomeUI;
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
            open();
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
  }

  window.HomeFeatures = window.HomeFeatures || {};
  window.HomeFeatures.deposit = { open };
})();
