/* TaskGenX user panel: Club (live deposits and withdrawals) */
(function () {
  "use strict";
  const { esc, icon, money } = UI;

  I18n.extend(
    {
      "club.title": "Club",
      "club.sub": "Live successful deposits and withdrawals from our community.",
      "club.hideName": "Hide my name",
      "club.hideNameSub": "Your name will show as \"Hidden user\" in this feed.",
      "club.all": "All",
      "club.deposits": "Deposits",
      "club.withdrawals": "Withdrawals",
      "club.deposited": "Deposited",
      "club.withdrew": "Withdrew",
      "club.id": "ID {id}",
      "club.to": "to {dest}",
      "club.off": "The club feed is turned off right now.",
      "club.empty": "No activity yet. Be the first!",
    },
    {
      "club.title": "ক্লাব",
      "club.sub": "আমাদের কমিউনিটির সফল ডিপোজিট ও উইথড্র লাইভ দেখুন।",
      "club.hideName": "আমার নাম লুকান",
      "club.hideNameSub": "এই ফিডে আপনার নাম “গোপন ইউজার” হিসেবে দেখাবে।",
      "club.all": "সব",
      "club.deposits": "ডিপোজিট",
      "club.withdrawals": "উইথড্র",
      "club.deposited": "ডিপোজিট করেছেন",
      "club.withdrew": "উইথড্র করেছেন",
      "club.id": "আইডি {id}",
      "club.to": "{dest} এ",
      "club.off": "ক্লাব ফিড এখন বন্ধ আছে।",
      "club.empty": "এখনো কোনো কার্যক্রম নেই। প্রথম হয়ে যান!",
    }
  );

  const Page = {
    id: "club",
    root: null,
    data: null,
    filter: "all",
    timer: null,

    init(root) {
      this.root = root;
      root.innerHTML = UI.skeleton("list", 6);
      UI.on(root, "click", "[data-act]", (e, el) => {
        const a = el.dataset.act;
        if (a === "filter") {
          this.filter = el.dataset.v;
          UI.haptic("select");
          this.render();
        } else if (a === "hideName") {
          this.toggleHide();
        }
      });
    },

    show() {
      if (this.data) this.render();
      this.load();
      clearInterval(this.timer);
      this.timer = setInterval(() => this.load(), 15000);
    },

    hide() {
      clearInterval(this.timer);
    },

    async load() {
      try {
        this.data = await API.get("/club/feed");
      } catch (e) {
        if (!this.data) UI.handleError(e);
        return;
      }
      const list = this.root.querySelector("#club-list");
      if (list) list.innerHTML = this.listHtml();
      else this.render();
    },

    listHtml() {
      const d = this.data;
      if (!d) return UI.skeleton("list", 6);
      if (!d.enabled) return UI.emptyState("trophy", t("club.off"));
      const items = d.items.filter((f) => this.filter === "all" || f.type === this.filter);
      if (!items.length) return UI.emptyState("trophy", t("club.empty"));
      return (
        '<div class="card">' +
        items
          .map((f) => {
            const dep = f.type === "deposit";
            let sub = t(dep ? "club.deposited" : "club.withdrew") + " · " + t("club.id", { id: f.maskedId });
            if (!dep && f.maskedDestination) sub += " · " + t("club.to", { dest: f.maskedDestination });
            return (
              '<div class="row"><div class="row-ico">' + icon(dep ? "arrow-down-circle" : "arrow-up-circle") + "</div>" +
              '<div class="row-main"><div class="row-title">' + esc(f.name || t("common.hidden")) + "</div>" +
              '<div class="row-sub">' + esc(sub) + "</div></div>" +
              '<div class="row-end"><div class="' + (dep ? "plus" : "") + '" style="' + (dep ? "" : "color:var(--accent-1)") + '">' + esc(money(f.amount)) + "</div>" +
              '<div class="row-sub">' + esc(UI.timeAgo(f.at)) + "</div></div></div>"
            );
          })
          .join("") +
        "</div>"
      );
    },

    render() {
      if (!this.root || !App.me) return;
      const on = !!App.me.user.hideName;
      const tab = (v, key) => '<button class="' + (this.filter === v ? "active" : "") + '" data-act="filter" data-v="' + v + '">' + esc(t(key)) + "</button>";
      this.root.innerHTML =
        '<div class="page-head"><div class="page-title">' + esc(t("club.title")) + '</div><div class="page-sub">' + esc(t("club.sub")) + "</div></div>" +
        '<div class="card"><div class="switch-row" style="padding:0;border:0"><div class="grow"><div class="card-title">' + esc(t("club.hideName")) + "</div>" +
        '<div class="card-sub">' + esc(t("club.hideNameSub")) + "</div></div>" +
        '<button class="switch ' + (on ? "on" : "") + '" data-act="hideName" role="switch" aria-checked="' + on + '"></button></div></div>' +
        '<div class="seg">' + tab("all", "club.all") + tab("deposit", "club.deposits") + tab("withdraw", "club.withdrawals") + "</div>" +
        '<div id="club-list">' + this.listHtml() + "</div>";
    },

    async toggleHide() {
      const u = App.me.user;
      const next = !u.hideName;
      u.hideName = next;
      UI.haptic("select");
      this.render();
      try {
        await API.patch("/user/prefs", { hideName: next });
        this.load();
      } catch (e) {
        u.hideName = !next;
        this.render();
        UI.handleError(e);
      }
    },
  };

  window.Pages = window.Pages || {};
  window.Pages.club = Page;
})();
