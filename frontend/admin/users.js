/* TaskGenX admin: Users (search, ban, balance adjust) */
(function () {
  "use strict";
  const { esc, icon, money } = UI;
  const Pages = (window.AdminPages = window.AdminPages || {});
  const Kit = window.AdminKit;

  I18n.extend(
    {
      "ad.u.title": "Users",
      "ad.u.sub": "Search, review and manage your users.",
      "ad.u.search": "Search by name, @username or ID",
      "ad.u.bannedOnly": "Banned only",
      "ad.u.count": "{n} users",
      "ad.u.empty": "No users found.",
      "ad.u.banned": "Banned",
      "ad.u.meta": "ID {id} · Level {lv}",
      "ad.u.balance": "Balance",
      "ad.u.earned": "Total earned",
      "ad.u.deposited": "Deposited",
      "ad.u.withdrawn": "Withdrawn",
      "ad.u.refEarn": "Referral earnings",
      "ad.u.level": "Level",
      "ad.u.tasks": "Approved tasks",
      "ad.u.refs": "Referrals (joined / rewarded)",
      "ad.u.refBy": "Referred by",
      "ad.u.joined": "Joined",
      "ad.u.lastSeen": "Last seen",
      "ad.u.upi": "UPI ID",
      "ad.u.wallet": "FINZO Wallet",
      "ad.u.wdCount": "Successful withdrawals",
      "ad.u.botBlocked": "Bot blocked",
      "ad.u.never": "Never",
      "ad.u.none": "None",
      "ad.u.adjust": "Adjust balance",
      "ad.u.ban": "Ban user",
      "ad.u.unban": "Unban user",
      "ad.u.banTitle": "Ban this user?",
      "ad.u.banHint": "Reason (optional)",
      "ad.u.banOk": "User banned",
      "ad.u.unbanAsk": "Unban this user?",
      "ad.u.unbanOk": "User unbanned",
      "ad.u.add": "Add money",
      "ad.u.deduct": "Deduct money",
      "ad.u.amount": "Amount (₹)",
      "ad.u.note": "Note (optional)",
      "ad.u.apply": "Apply",
      "ad.u.current": "Current balance: {amount}",
      "ad.u.adjOk": "Balance updated. New balance: {amount}",
      "ad.u.recent": "Recent transactions",
      "ad.u.noTx": "No transactions yet.",
      "ad.u.badAmount": "Enter a valid amount",
      "ad.u.active": "Active",
      "ad.u.inactive": "Inactive",
    },
    {
      "ad.u.title": "ইউজার",
      "ad.u.sub": "ইউজার খুঁজুন, দেখুন ও পরিচালনা করুন।",
      "ad.u.search": "নাম, @ইউজারনেম বা আইডি দিয়ে খুঁজুন",
      "ad.u.bannedOnly": "শুধু ব্যান করা",
      "ad.u.count": "{n} জন ইউজার",
      "ad.u.empty": "কোনো ইউজার পাওয়া যায়নি।",
      "ad.u.banned": "ব্যান",
      "ad.u.meta": "আইডি {id} · লেভেল {lv}",
      "ad.u.balance": "ব্যালেন্স",
      "ad.u.earned": "মোট আয়",
      "ad.u.deposited": "ডিপোজিট",
      "ad.u.withdrawn": "উইথড্র",
      "ad.u.refEarn": "রেফারেল আয়",
      "ad.u.level": "লেভেল",
      "ad.u.tasks": "অনুমোদিত টাস্ক",
      "ad.u.refs": "রেফারেল (যোগ দিয়েছে / পুরস্কৃত)",
      "ad.u.refBy": "যার রেফারেলে এসেছেন",
      "ad.u.joined": "যোগ দিয়েছেন",
      "ad.u.lastSeen": "শেষ দেখা",
      "ad.u.upi": "UPI আইডি",
      "ad.u.wallet": "FINZO ওয়ালেট",
      "ad.u.wdCount": "সফল উইথড্র",
      "ad.u.botBlocked": "বট ব্লক করেছে",
      "ad.u.never": "কখনো না",
      "ad.u.none": "নেই",
      "ad.u.adjust": "ব্যালেন্স সমন্বয়",
      "ad.u.ban": "ইউজার ব্যান করুন",
      "ad.u.unban": "ইউজার আনব্যান করুন",
      "ad.u.banTitle": "এই ইউজারকে ব্যান করবেন?",
      "ad.u.banHint": "কারণ (ঐচ্ছিক)",
      "ad.u.banOk": "ইউজার ব্যান হয়েছে",
      "ad.u.unbanAsk": "এই ইউজারকে আনব্যান করবেন?",
      "ad.u.unbanOk": "ইউজার আনব্যান হয়েছে",
      "ad.u.add": "টাকা যোগ করুন",
      "ad.u.deduct": "টাকা কাটুন",
      "ad.u.amount": "পরিমাণ (₹)",
      "ad.u.note": "নোট (ঐচ্ছিক)",
      "ad.u.apply": "প্রয়োগ করুন",
      "ad.u.current": "বর্তমান ব্যালেন্স: {amount}",
      "ad.u.adjOk": "ব্যালেন্স আপডেট হয়েছে। নতুন ব্যালেন্স: {amount}",
      "ad.u.recent": "সাম্প্রতিক লেনদেন",
      "ad.u.noTx": "এখনো কোনো লেনদেন নেই।",
      "ad.u.badAmount": "সঠিক পরিমাণ লিখুন",
      "ad.u.active": "সক্রিয়",
      "ad.u.inactive": "নিষ্ক্রিয়",
    }
  );

  const Page = (Pages.users = {
    id: "users",
    root: null,
    q: "",
    banned: false,
    items: [],
    page: 0,
    total: 0,
    more: false,
    loaded: false,
    busy: false,
    again: false,

    init(root) {
      this.root = root;
      this.render();
      UI.on(
        root,
        "input",
        "#u-q",
        UI.debounce((e, el) => {
          this.q = el.value.trim();
          this.load(true);
        }, 400)
      );
      UI.on(root, "click", "[data-act]", (e, el) => {
        const a = el.dataset.act;
        if (a === "banned") {
          this.banned = !this.banned;
          UI.haptic("select");
          el.classList.toggle("active", this.banned);
          this.load(true);
        } else if (a === "open") {
          this.openUser(el.dataset.id);
        } else if (a === "more") {
          this.load(false);
        }
      });
    },

    show() {
      this.load(true);
    },

    async load(reset) {
      if (this.busy) {
        if (reset) this.again = true;
        return;
      }
      this.busy = true;
      if (reset) {
        this.items = [];
        this.page = 0;
        this.more = false;
        this.loaded = false;
        this.paintList();
      }
      try {
        const r = await API.get("/admin/users" + API.qs({ q: this.q, page: this.page + 1, banned: this.banned ? "1" : "" }));
        this.items = this.items.concat(r.items);
        this.page = r.page;
        this.total = r.total;
        this.more = r.hasMore;
      } catch (e) {
        UI.handleError(e);
      }
      this.loaded = true;
      this.busy = false;
      this.paintList();
      if (this.again) {
        this.again = false;
        this.load(true);
      }
    },

    render() {
      if (!this.root) return;
      this.root.innerHTML =
        '<div class="page-head"><div class="page-title">' + esc(t("ad.u.title")) + '</div><div class="page-sub">' + esc(t("ad.u.sub")) + "</div></div>" +
        '<div class="field"><input class="input" id="u-q" type="text" autocomplete="off" autocapitalize="off" placeholder="' + esc(t("ad.u.search")) + '" value="' + esc(this.q) + '" /></div>' +
        '<div class="chips"><button class="chip ' + (this.banned ? "active" : "") + '" data-act="banned">' + esc(t("ad.u.bannedOnly")) + "</button></div>" +
        '<div id="u-list"></div>';
      this.paintList();
    },

    paintList() {
      const box = this.root && this.root.querySelector("#u-list");
      if (!box) return;
      if (!this.loaded) {
        box.innerHTML = UI.skeleton("list", 5);
        return;
      }
      if (!this.items.length) {
        box.innerHTML = UI.emptyState("users", t("ad.u.empty"));
        return;
      }
      box.innerHTML =
        '<div class="card-sub" style="margin:0 2px 10px">' + esc(t("ad.u.count", { n: UI.num(this.total) })) + "</div>" +
        this.items
          .map((u) => {
            const active = u.lastSeenAt && Date.now() - new Date(u.lastSeenAt).getTime() < 86400000;
            return (
              '<button class="card usr-row" data-act="open" data-id="' + esc(u.tgId) + '">' +
              '<span class="usr-av-wrap">' + UI.avatar(u) + '<i class="usr-dot ' + (active ? "on" : "") + '"></i></span>' +
              '<div class="row-main"><div class="row-title">' + esc(u.name) + (u.username ? " · @" + esc(u.username) : "") + "</div>" +
              '<div class="row-sub">' + esc(t("ad.u.meta", { id: u.tgId, lv: u.level })) + "</div></div>" +
              '<div class="row-end"><div>' + esc(money(u.balance)) + "</div>" +
              '<span class="badge ' + (u.isBanned ? "bad" : "ok") + '">' + esc(u.isBanned ? t("ad.u.banned") : t("ad.u.active")) + "</span></div></button>"
            );
          })
          .join("") +
        (this.more ? '<button class="btn btn-ghost btn-block" data-act="more">' + esc(t("common.loadMore")) + "</button>" : "");
    },

    /* ----------------------------- DETAIL ----------------------------- */

    async openUser(tgId) {
      let changed = false;
      let cur = null;
      const sh = UI.sheet({
        html: UI.skeleton("card", 2),
        onClose: () => {
          if (changed) Page.load(true);
        },
      });

      const kpi = (ico, label, value) =>
        '<div class="kpi"><div class="kpi-ico">' + icon(ico) + "</div><b>" + esc(value) + "</b><span>" + esc(label) + "</span></div>";
      const kv = (label, value) => "<div>" + esc(label) + "<b>" + esc(value) + "</b></div>";

      function paint(r) {
        cur = r.user;
        const u = r.user;
        const txs = r.transactions;
        sh.el.innerHTML =
          '<div class="usr-hero">' +
          UI.avatar(u, "avatar-lg") +
          '<div class="usr-hero-name">' + esc(u.name) + "</div>" +
          '<div class="card-sub">' + esc(Kit.who(u)) + "</div>" +
          '<div class="usr-hero-badges">' +
          '<span class="pf-pill" style="background:var(--surface-2);color:var(--text)">' + icon("award", "sm") + "Level " + esc(u.level) + "</span>" +
          (u.isBanned
            ? '<span class="pf-pill" style="background:var(--danger)">' + icon("ban", "sm") + esc(t("ad.u.banned")) + "</span>"
            : "") +
          "</div>" +
          '<button class="icon-btn" id="usr-copy" style="position:absolute;top:0;right:0" aria-label="Copy">' + icon("copy", "sm") + "</button>" +
          "</div>" +
          (u.isBanned && u.banReason ? '<div class="note" style="margin-bottom:12px">' + icon("alert") + "<div>" + esc(u.banReason) + "</div></div>" : "") +
          '<div class="kpi-grid">' +
          kpi("wallet", t("ad.u.balance"), money(u.balance)) +
          kpi("trending-up", t("ad.u.earned"), money(u.totalEarned)) +
          kpi("arrow-down-circle", t("ad.u.deposited"), money(u.totalDeposited)) +
          kpi("arrow-up-circle", t("ad.u.withdrawn"), money(u.totalWithdrawn)) +
          "</div>" +
          '<div class="card"><div class="kv">' +
          kv(t("ad.u.tasks"), UI.num(u.tasksApproved)) +
          kv(t("ad.u.refs"), u.referralCount + " / " + u.referralsRewarded) +
          kv(t("ad.u.refEarn"), money(u.referralEarnings)) +
          kv(t("ad.u.refBy"), u.referredBy ? String(u.referredBy) : t("ad.u.none")) +
          kv(t("ad.u.wdCount"), UI.num(u.successfulWithdrawals)) +
          kv(t("ad.u.botBlocked"), u.botBlocked ? t("common.yes") : t("common.no")) +
          kv(t("ad.u.joined"), UI.date(u.createdAt)) +
          kv(t("ad.u.lastSeen"), u.lastSeenAt ? UI.timeAgo(u.lastSeenAt) : t("ad.u.never")) +
          kv(t("ad.u.upi"), u.withdrawDetails && u.withdrawDetails.upi ? u.withdrawDetails.upi : t("ad.u.none")) +
          kv(t("ad.u.wallet"), u.withdrawDetails && u.withdrawDetails.finzoWallet ? u.withdrawDetails.finzoWallet : t("ad.u.none")) +
          "</div></div>" +
          '<div class="ad-actions" style="margin:14px 0">' +
          '<button class="btn btn-primary" data-act="adjust">' + icon("sliders", "sm") + esc(t("ad.u.adjust")) + "</button>" +
          '<button class="btn ' + (u.isBanned ? "btn-ok" : "btn-danger") + '" data-act="ban">' + icon(u.isBanned ? "check-circle" : "ban", "sm") + esc(u.isBanned ? t("ad.u.unban") : t("ad.u.ban")) + "</button></div>" +
          '<div class="card"><div class="card-title" style="margin-bottom:6px">' + esc(t("ad.u.recent")) + "</div>" +
          (txs.length
            ? txs
                .map(
                  (x) =>
                    '<div class="row"><div class="row-ico">' + icon("history", "sm") + "</div>" +
                    '<div class="row-main"><div class="row-title">' + esc(t("tx." + x.type)) + "</div>" +
                    '<div class="row-sub">' + esc(UI.dateTime(x.createdAt)) + (x.note ? " · " + esc(x.note) : "") + "</div></div>" +
                    '<div class="row-end"><div class="' + (x.amount >= 0 ? "plus" : "minus") + '">' + esc(UI.signedMoney(x.amount)) + "</div></div></div>"
                )
                .join("")
            : UI.emptyState("history", t("ad.u.noTx"))) +
          "</div>";

        sh.el.querySelector("#usr-copy").onclick = () => UI.copy(String(u.tgId));
      }

      async function load() {
        try {
          paint(await API.get("/admin/users/" + encodeURIComponent(tgId)));
        } catch (e) {
          sh.close();
          UI.handleError(e);
        }
      }

      UI.on(sh.el, "click", "[data-act]", async (e, el) => {
        const a = el.dataset.act;
        if (!cur) return;
        if (a === "adjust") {
          Page.adjust(cur, () => {
            changed = true;
            load();
          });
        } else if (a === "ban") {
          let body;
          if (cur.isBanned) {
            const ok = await UI.confirm({ title: t("ad.u.unbanAsk"), okText: t("ad.u.unban") });
            if (!ok) return;
            body = { banned: false };
          } else {
            const reason = await UI.prompt({ title: t("ad.u.banTitle"), label: t("ad.u.banHint"), okText: t("ad.u.ban"), maxLength: 200 });
            if (reason === null) return;
            body = { banned: true, reason };
          }
          const r = await UI.withBusy(el, () => API.post("/admin/users/" + encodeURIComponent(cur.tgId) + "/ban", body));
          if (!r) return;
          UI.toast(body.banned ? t("ad.u.banOk") : t("ad.u.unbanOk"), "success");
          changed = true;
          load();
        }
      });

      load();
    },

    adjust(u, done) {
      let sign = 1;
      UI.sheet({
        title: t("ad.u.adjust"),
        html:
          '<div class="note">' + icon("wallet") + "<div>" + esc(t("ad.u.current", { amount: money(u.balance) })) + "</div></div>" +
          '<div class="seg" id="adj-seg"><button class="active" data-s="1">' + esc(t("ad.u.add")) + '</button><button data-s="-1">' + esc(t("ad.u.deduct")) + "</button></div>" +
          '<div class="field"><label>' + esc(t("ad.u.amount")) + '</label><div class="amount-wrap"><span>₹</span><input class="input" id="adj-amt" type="text" inputmode="decimal" autocomplete="off" placeholder="0" /></div></div>' +
          '<div class="field"><label>' + esc(t("ad.u.note")) + '</label><input class="input" id="adj-note" type="text" maxlength="120" /></div>' +
          '<button class="btn btn-primary btn-block" id="adj-go">' + esc(t("ad.u.apply")) + "</button>",
        onMount(el, close) {
          const amt = el.querySelector("#adj-amt");
          amt.addEventListener("input", () => (amt.value = amt.value.replace(/[^0-9.]/g, "")));
          el.querySelectorAll("#adj-seg button").forEach((b) =>
            b.addEventListener("click", () => {
              sign = Number(b.dataset.s);
              UI.haptic("select");
              el.querySelectorAll("#adj-seg button").forEach((x) => x.classList.toggle("active", x === b));
            })
          );
          const go = el.querySelector("#adj-go");
          go.onclick = () =>
            UI.withBusy(go, async () => {
              const a = parseFloat(amt.value);
              if (!(a > 0)) throw new Error(t("ad.u.badAmount"));
              const r = await API.post("/admin/users/" + encodeURIComponent(u.tgId) + "/balance", {
                amount: sign * a,
                note: el.querySelector("#adj-note").value.trim(),
              });
              UI.toast(t("ad.u.adjOk", { amount: money(r.balance) }), "success");
              close();
              done();
            });
        },
      });
    },
  });
})();
