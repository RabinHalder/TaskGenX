/* TaskGenX user panel: Referral (single level, fixed reward) */
(function () {
  "use strict";
  const { esc, icon, money } = UI;

  I18n.extend(
    {
      "ref.title": "Referral",
      "ref.sub": "Invite friends and earn a reward for each one.",
      "ref.heroTitle": "Earn {amount} per referral",
      "ref.heroFirst": "You get {amount} when a friend joins with your link and gets their first task approved.",
      "ref.heroJoin": "You get {amount} as soon as a friend joins with your link.",
      "ref.link": "Your invite link",
      "ref.share": "Share invite link",
      "ref.shareText": "Join {app}, complete simple tasks and earn real money!",
      "ref.noLink": "Your invite link is not ready yet. Please try again later.",
      "ref.invited": "Invited",
      "ref.rewarded": "Rewarded",
      "ref.earned": "Earned",
      "ref.list": "Your referrals",
      "ref.tasks": "{n} tasks",
      "ref.joined": "Joined {date}",
      "ref.stRewarded": "Rewarded",
      "ref.stPending": "Pending",
      "ref.empty": "No referrals yet. Share your link to get started!",
      "ref.off": "The referral program is paused right now.",
    },
    {
      "ref.title": "রেফারেল",
      "ref.sub": "বন্ধুদের আমন্ত্রণ জানান এবং প্রতিজনের জন্য পুরস্কার পান।",
      "ref.heroTitle": "প্রতি রেফারেলে {amount} আয় করুন",
      "ref.heroFirst": "আপনার লিংকে যোগ দিয়ে কোনো বন্ধুর প্রথম টাস্ক অনুমোদিত হলে আপনি {amount} পাবেন।",
      "ref.heroJoin": "আপনার লিংকে কোনো বন্ধু যোগ দিলেই আপনি {amount} পাবেন।",
      "ref.link": "আপনার আমন্ত্রণ লিংক",
      "ref.share": "আমন্ত্রণ লিংক শেয়ার করুন",
      "ref.shareText": "{app}-এ যোগ দিন, সহজ টাস্ক করুন এবং আসল টাকা আয় করুন!",
      "ref.noLink": "আমন্ত্রণ লিংক এখনো তৈরি হয়নি। একটু পরে আবার চেষ্টা করুন।",
      "ref.invited": "আমন্ত্রিত",
      "ref.rewarded": "পুরস্কার পেয়েছেন",
      "ref.earned": "মোট আয়",
      "ref.list": "আপনার রেফারেল",
      "ref.tasks": "{n}টি টাস্ক",
      "ref.joined": "যোগ দিয়েছেন {date}",
      "ref.stRewarded": "পুরস্কৃত",
      "ref.stPending": "অপেক্ষমাণ",
      "ref.empty": "এখনো কোনো রেফারেল নেই। শুরু করতে আপনার লিংক শেয়ার করুন!",
      "ref.off": "রেফারেল প্রোগ্রাম এখন বন্ধ আছে।",
    }
  );

  const Page = {
    id: "referral",
    root: null,
    data: null,

    init(root) {
      this.root = root;
      root.innerHTML = UI.skeleton("card", 3);
      UI.on(root, "click", "[data-act]", (e, el) => {
        const a = el.dataset.act;
        if (a === "copyLink") UI.copy(this.data.link);
        else if (a === "share") UI.shareLink(this.data.link, t("ref.shareText", { app: App.me.config.app.name }));
      });
    },

    show() {
      this.load();
    },

    async load() {
      try {
        this.data = await API.get("/referral");
      } catch (e) {
        if (!this.data) UI.handleError(e);
        return;
      }
      this.render();
    },

    render() {
      if (!this.root || !App.me) return;
      const d = this.data;
      if (!d) {
        this.root.innerHTML = UI.skeleton("card", 3);
        return;
      }
      const head = '<div class="page-head"><div class="page-title">' + esc(t("ref.title")) + '</div><div class="page-sub">' + esc(t("ref.sub")) + "</div></div>";
      if (!d.enabled) {
        this.root.innerHTML = head + UI.emptyState("gift", t("ref.off"));
        return;
      }

      const amount = money(d.reward);
      const people = d.referrals.length
        ? '<div class="card">' +
          d.referrals
            .map(
              (r) =>
                '<div class="row"><div class="row-ico">' + icon("user") + "</div>" +
                '<div class="row-main"><div class="row-title">' + esc(r.name === "Hidden user" ? t("common.hidden") : r.name) + "</div>" +
                '<div class="row-sub">' + esc(t("ref.joined", { date: UI.date(r.joinedAt) })) + " · " + esc(t("ref.tasks", { n: r.tasks })) + "</div></div>" +
                '<div class="row-end"><span class="badge ' + (r.rewarded ? "ok" : "wait") + '">' + esc(t(r.rewarded ? "ref.stRewarded" : "ref.stPending")) + "</span></div></div>"
            )
            .join("") +
          "</div>"
        : UI.emptyState("users", t("ref.empty"));

      this.root.innerHTML =
        head +
        '<div class="ref-hero"><h3>' + esc(t("ref.heroTitle", { amount })) + "</h3><p>" + esc(t(d.payOn === "join" ? "ref.heroJoin" : "ref.heroFirst", { amount })) + "</p>" +
        (d.link
          ? '<div class="copy-box"><div class="val"><small>' + esc(t("ref.link")) + "</small>" + esc(d.link) + "</div>" +
            '<button class="icon-btn" data-act="copyLink" aria-label="' + esc(t("common.copy")) + '">' + icon("copy") + "</button></div>" +
            '<button class="btn btn-light btn-block" data-act="share">' + icon("share", "sm") + esc(t("ref.share")) + "</button>"
          : '<p style="margin-top:12px">' + esc(t("ref.noLink")) + "</p>") +
        "</div>" +
        '<div class="mini-stats">' +
        '<div class="mini-stat"><b>' + UI.num(d.counts.joined) + "</b><span>" + esc(t("ref.invited")) + "</span></div>" +
        '<div class="mini-stat"><b>' + UI.num(d.counts.rewarded) + "</b><span>" + esc(t("ref.rewarded")) + "</span></div>" +
        '<div class="mini-stat"><b>' + esc(money(d.total)) + "</b><span>" + esc(t("ref.earned")) + "</span></div></div>" +
        '<div class="section-head"><div class="section-title">' + esc(t("ref.list")) + "</div></div>" +
        people;
    },
  };

  window.Pages = window.Pages || {};
  window.Pages.referral = Page;
})();
