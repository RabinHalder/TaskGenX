/* TaskGenX user panel: Referral (2 levels) */
(function () {
  "use strict";
  const { esc, icon, money } = UI;

  I18n.extend(
    {
      "ref.title": "Referral",
      "ref.sub": "Invite friends and earn from their tasks.",
      "ref.heroTitle": "Invite and earn",
      "ref.heroText": "Earn {l1}% of every task your friends earn, plus {l2}% from the friends they invite.",
      "ref.code": "Your referral code",
      "ref.link": "Your invite link",
      "ref.share": "Share invite link",
      "ref.shareText": "Join {app}, complete simple tasks and earn real money!",
      "ref.noLink": "The invite link is not ready yet. Share your referral code with friends instead.",
      "ref.l1": "Level 1",
      "ref.l2": "Level 2",
      "ref.friends": "{n} friends",
      "ref.earned": "Earned",
      "ref.total": "Total referral earnings",
      "ref.list": "Your direct referrals",
      "ref.tasks": "{n} tasks",
      "ref.joined": "Joined {date}",
      "ref.empty": "No referrals yet. Share your link to get started!",
      "ref.off": "The referral program is paused right now.",
    },
    {
      "ref.title": "রেফারেল",
      "ref.sub": "বন্ধুদের আমন্ত্রণ জানান এবং তাদের টাস্ক থেকে আয় করুন।",
      "ref.heroTitle": "আমন্ত্রণ জানান, আয় করুন",
      "ref.heroText": "বন্ধুদের প্রতিটি টাস্ক আয়ের {l1}% এবং তারা যাদের আমন্ত্রণ করবে তাদের আয়ের {l2}% আপনি পাবেন।",
      "ref.code": "আপনার রেফারেল কোড",
      "ref.link": "আপনার আমন্ত্রণ লিংক",
      "ref.share": "আমন্ত্রণ লিংক শেয়ার করুন",
      "ref.shareText": "{app}-এ যোগ দিন, সহজ টাস্ক করুন এবং আসল টাকা আয় করুন!",
      "ref.noLink": "আমন্ত্রণ লিংক এখনো তৈরি হয়নি। বন্ধুদের সাথে আপনার রেফারেল কোড শেয়ার করুন।",
      "ref.l1": "লেভেল ১",
      "ref.l2": "লেভেল ২",
      "ref.friends": "{n} জন বন্ধু",
      "ref.earned": "আয়",
      "ref.total": "মোট রেফারেল আয়",
      "ref.list": "আপনার সরাসরি রেফারেল",
      "ref.tasks": "{n}টি টাস্ক",
      "ref.joined": "যোগ দিয়েছেন {date}",
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
        if (a === "copyCode") UI.copy(this.data.code);
        else if (a === "copyLink") UI.copy(this.data.link);
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

      const levelCard = (key, pct, friends, earned) =>
        '<div class="card"><div class="stat"><span>' + esc(t(key)) + "</span><b>" + esc(pct) + "%</b>" +
        '<span>' + esc(t("ref.friends", { n: friends })) + "</span><br>" +
        '<span>' + esc(t("ref.earned")) + ": <b style=\"display:inline;font-size:13px\">" + esc(money(earned)) + "</b></span></div></div>";

      const people = d.referrals.length
        ? '<div class="card">' +
          d.referrals
            .map(
              (r) =>
                '<div class="row"><div class="row-ico">' + icon("user") + "</div>" +
                '<div class="row-main"><div class="row-title">' + esc(r.name === "Hidden user" ? t("common.hidden") : r.name) + "</div>" +
                '<div class="row-sub">' + esc(t("ref.joined", { date: UI.date(r.joinedAt) })) + "</div></div>" +
                '<div class="row-end"><span class="badge ok">' + esc(t("ref.tasks", { n: r.tasks })) + "</span></div></div>"
            )
            .join("") +
          "</div>"
        : UI.emptyState("users", t("ref.empty"));

      this.root.innerHTML =
        head +
        '<div class="ref-hero"><h3>' + esc(t("ref.heroTitle")) + "</h3><p>" + esc(t("ref.heroText", { l1: d.percent.l1, l2: d.percent.l2 })) + "</p>" +
        '<div class="copy-box"><div class="val"><small>' + esc(t("ref.code")) + "</small>" + esc(d.code) + "</div>" +
        '<button class="icon-btn" data-act="copyCode" aria-label="' + esc(t("common.copy")) + '">' + icon("copy") + "</button></div>" +
        (d.link
          ? '<div class="copy-box"><div class="val"><small>' + esc(t("ref.link")) + "</small>" + esc(d.link) + "</div>" +
            '<button class="icon-btn" data-act="copyLink" aria-label="' + esc(t("common.copy")) + '">' + icon("link") + "</button></div>" +
            '<button class="btn btn-light btn-block" data-act="share">' + icon("share", "sm") + esc(t("ref.share")) + "</button>"
          : '<p style="margin-top:12px">' + esc(t("ref.noLink")) + "</p>") +
        "</div>" +
        '<div class="grid2">' + levelCard("ref.l1", d.percent.l1, d.counts.l1, d.earned.l1) + levelCard("ref.l2", d.percent.l2, d.counts.l2, d.earned.l2) + "</div>" +
        '<div class="card"><div class="stat"><span>' + esc(t("ref.total")) + "</span><b>" + esc(money(d.total)) + "</b></div></div>" +
        '<div class="section-head"><div class="section-title">' + esc(t("ref.list")) + "</div></div>" +
        people;
    },
  };

  window.Pages = window.Pages || {};
  window.Pages.referral = Page;
})();
