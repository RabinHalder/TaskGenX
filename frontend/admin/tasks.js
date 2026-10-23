/* TaskGenX admin: Tasks, proof review, payments */
(function () {
  "use strict";
  const { esc, icon, money } = UI;
  const Pages = (window.AdminPages = window.AdminPages || {});
  const Kit = window.AdminKit;

  I18n.extend(
    {
      "ad.t.title": "Tasks",
      "ad.t.sub": "Create tasks, review proofs and approve withdrawals.",
      "ad.t.vTasks": "Tasks",
      "ad.t.vProofs": "Proofs",
      "ad.t.vPayouts": "Payments",
      "ad.t.new": "New task",
      "ad.t.edit": "Edit task",
      "ad.t.empty": "No tasks yet. Create your first task!",
      "ad.t.inactive": "Inactive",
      "ad.t.filled": "{a}/{b} used",
      "ad.t.filledU": "{a} used",
      "ad.t.pendingN": "{n} to review",
      "ad.t.lvAll": "All levels",
      "ad.t.fTitleEn": "Title (English)",
      "ad.t.fTitleBn": "Title (Bangla)",
      "ad.t.fDescEn": "Description (English)",
      "ad.t.fDescBn": "Description (Bangla)",
      "ad.t.fCat": "Category",
      "ad.t.fLevel": "Level",
      "ad.t.fLevelHint": "Only users at this level can see and do this task. \"All levels\" shows it to everyone.",
      "ad.t.onceNote": "Every task can be completed only once per user. A submitted task leaves the user's list and comes back only if you reject it.",
      "ad.t.fReward": "Reward (₹)",
      "ad.t.fLink": "Task link (optional)",
      "ad.t.fProof": "Screenshot proof required",
      "ad.t.fTotal": "Total slots (0 = unlimited)",
      "ad.t.fExpiry": "Expiry (optional)",
      "ad.t.fOrder": "Sort order (higher shows first)",
      "ad.t.fActive": "Active (visible to users)",
      "ad.t.saved": "Task saved",
      "ad.t.deleted": "Task deleted",
      "ad.t.deactivated": "This task has submissions, so it was deactivated instead",
      "ad.t.delAsk": "Delete this task?",
      "ad.t.delText": "If users already submitted it, it will be deactivated instead.",
      "ad.t.reviewProofs": "Review proofs ({n})",
      "ad.t.pPending": "Pending",
      "ad.t.pApproved": "Approved",
      "ad.t.pRejected": "Rejected",
      "ad.t.pFilter": "Showing one task only.",
      "ad.t.pClear": "Show all",
      "ad.t.pEmpty": "Nothing to review here.",
      "ad.t.viewProof": "View proof",
      "ad.t.approve": "Approve",
      "ad.t.reject": "Reject",
      "ad.t.apAsk": "Approve this proof?",
      "ad.t.apText": "{user} will receive {amount}.",
      "ad.t.approved": "Approved",
      "ad.t.rejected": "Rejected",
      "ad.t.rejTitle": "Reject proof",
      "ad.t.rejHint": "Pick a reason or write your own. The user will see it.",
      "ad.t.rejPh": "Reason for rejection",
      "ad.t.rejNeed": "Please write a reason",
      "ad.t.fApproval": "To approve",
      "ad.t.fProcessing": "Processing",
      "ad.t.fDone": "Paid",
      "ad.t.fDeposits": "Deposits",
      "ad.t.fAll": "All",
      "ad.t.payEmpty": "No records here.",
      "ad.t.payApAsk": "Approve this withdrawal?",
      "ad.t.payApText": "{net} will be sent to {dest} for {user}.",
      "ad.t.payApproved": "Payout sent",
      "ad.t.payStarted": "Payout started, waiting for FINZO",
      "ad.t.payFailed": "Payout failed. The amount was refunded to the user.",
      "ad.t.payRejTitle": "Reject withdrawal",
      "ad.t.payRejected": "Withdrawal rejected and refunded",
      "ad.t.fee": "Fee {fee} · Net {net}",
      "ad.t.dest": "To {dest}",
    },
    {
      "ad.t.title": "টাস্ক",
      "ad.t.sub": "টাস্ক তৈরি করুন, প্রুফ যাচাই করুন এবং উইথড্র অনুমোদন করুন।",
      "ad.t.vTasks": "টাস্ক",
      "ad.t.vProofs": "প্রুফ",
      "ad.t.vPayouts": "পেমেন্ট",
      "ad.t.new": "নতুন টাস্ক",
      "ad.t.edit": "টাস্ক এডিট",
      "ad.t.empty": "এখনো কোনো টাস্ক নেই। প্রথম টাস্কটি তৈরি করুন!",
      "ad.t.inactive": "নিষ্ক্রিয়",
      "ad.t.filled": "{a}/{b} ব্যবহৃত",
      "ad.t.filledU": "{a} ব্যবহৃত",
      "ad.t.pendingN": "{n}টি যাচাই বাকি",
      "ad.t.lvAll": "সব লেভেল",
      "ad.t.fTitleEn": "শিরোনাম (ইংরেজি)",
      "ad.t.fTitleBn": "শিরোনাম (বাংলা)",
      "ad.t.fDescEn": "বিবরণ (ইংরেজি)",
      "ad.t.fDescBn": "বিবরণ (বাংলা)",
      "ad.t.fCat": "ক্যাটাগরি",
      "ad.t.fLevel": "লেভেল",
      "ad.t.fLevelHint": "শুধু এই লেভেলের ইউজাররা টাস্কটি দেখতে ও করতে পারবে। “সব লেভেল” বাছলে সবাই দেখবে।",
      "ad.t.onceNote": "প্রতিটি টাস্ক একজন ইউজার একবারই করতে পারবে। জমা দেওয়া টাস্ক ইউজারের তালিকা থেকে সরে যায় এবং আপনি রিজেক্ট করলেই আবার ফিরে আসে।",
      "ad.t.fReward": "পুরস্কার (₹)",
      "ad.t.fLink": "টাস্ক লিংক (ঐচ্ছিক)",
      "ad.t.fProof": "স্ক্রিনশট প্রমাণ আবশ্যক",
      "ad.t.fTotal": "মোট সুযোগ (০ = সীমাহীন)",
      "ad.t.fExpiry": "মেয়াদ (ঐচ্ছিক)",
      "ad.t.fOrder": "ক্রম (বেশি হলে আগে দেখাবে)",
      "ad.t.fActive": "সক্রিয় (ইউজাররা দেখবে)",
      "ad.t.saved": "টাস্ক সেভ হয়েছে",
      "ad.t.deleted": "টাস্ক মুছে ফেলা হয়েছে",
      "ad.t.deactivated": "এই টাস্কে জমা পড়েছে, তাই মুছে না ফেলে নিষ্ক্রিয় করা হয়েছে",
      "ad.t.delAsk": "এই টাস্ক মুছবেন?",
      "ad.t.delText": "ইউজাররা আগেই জমা দিয়ে থাকলে মুছে না ফেলে নিষ্ক্রিয় করা হবে।",
      "ad.t.reviewProofs": "প্রুফ যাচাই ({n})",
      "ad.t.pPending": "অপেক্ষমাণ",
      "ad.t.pApproved": "অনুমোদিত",
      "ad.t.pRejected": "বাতিল",
      "ad.t.pFilter": "শুধু একটি টাস্ক দেখাচ্ছে।",
      "ad.t.pClear": "সব দেখান",
      "ad.t.pEmpty": "এখানে যাচাই করার কিছু নেই।",
      "ad.t.viewProof": "প্রুফ দেখুন",
      "ad.t.approve": "অনুমোদন",
      "ad.t.reject": "বাতিল",
      "ad.t.apAsk": "এই প্রুফ অনুমোদন করবেন?",
      "ad.t.apText": "{user} {amount} পাবেন।",
      "ad.t.approved": "অনুমোদিত হয়েছে",
      "ad.t.rejected": "বাতিল করা হয়েছে",
      "ad.t.rejTitle": "প্রুফ বাতিল করুন",
      "ad.t.rejHint": "একটি কারণ বেছে নিন বা নিজে লিখুন। ইউজার এটি দেখতে পাবেন।",
      "ad.t.rejPh": "বাতিলের কারণ",
      "ad.t.rejNeed": "একটি কারণ লিখুন",
      "ad.t.fApproval": "অনুমোদন বাকি",
      "ad.t.fProcessing": "প্রক্রিয়াধীন",
      "ad.t.fDone": "পরিশোধিত",
      "ad.t.fDeposits": "ডিপোজিট",
      "ad.t.fAll": "সব",
      "ad.t.payEmpty": "এখানে কোনো রেকর্ড নেই।",
      "ad.t.payApAsk": "এই উইথড্র অনুমোদন করবেন?",
      "ad.t.payApText": "{user}-এর জন্য {dest} এ {net} পাঠানো হবে।",
      "ad.t.payApproved": "পেআউট পাঠানো হয়েছে",
      "ad.t.payStarted": "পেআউট শুরু হয়েছে, FINZO-র উত্তরের অপেক্ষায়",
      "ad.t.payFailed": "পেআউট ব্যর্থ হয়েছে। টাকা ইউজারকে ফেরত দেওয়া হয়েছে।",
      "ad.t.payRejTitle": "উইথড্র বাতিল করুন",
      "ad.t.payRejected": "উইথড্র বাতিল করে টাকা ফেরত দেওয়া হয়েছে",
      "ad.t.fee": "ফি {fee} · নিট {net}",
      "ad.t.dest": "{dest} এ",
    }
  );

  const PAYF = {
    approval: { type: "withdraw", status: "awaiting_approval" },
    processing: { type: "withdraw", status: "processing" },
    done: { type: "withdraw", status: "success" },
    deposits: { type: "deposit" },
    all: {},
  };
  const PAYCHIPS = [["approval", "ad.t.fApproval"], ["processing", "ad.t.fProcessing"], ["done", "ad.t.fDone"], ["deposits", "ad.t.fDeposits"], ["all", "ad.t.fAll"]];

  const PRESET_PROOF = [
    "Screenshot is not clear / স্ক্রিনশট পরিষ্কার নয়",
    "Task was not completed / টাস্ক সম্পন্ন হয়নি",
    "Wrong screenshot / ভুল স্ক্রিনশট",
    "Fake or edited proof / নকল বা এডিট করা প্রমাণ",
  ];
  const PRESET_PAY = [
    "Invalid payment details / পেমেন্ট তথ্য সঠিক নয়",
    "Suspicious activity / সন্দেহজনক কার্যকলাপ",
    "Please contact support / সাপোর্টে যোগাযোগ করুন",
  ];

  function toLocalInput(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  // Name of the level a task is for (0 = all levels)
  function levelLabel(n) {
    if (!n) return t("ad.t.lvAll");
    const L = (App.me.config.levels || [])[n - 1];
    return L ? L.name : "Level " + n;
  }

  // Reason picker: resolves to the text, or null if cancelled
  function askReason(title, presets) {
    return new Promise((resolve) => {
      let value = null;
      UI.sheet({
        title,
        html:
          '<div class="card-sub" style="margin-bottom:10px">' + esc(t("ad.t.rejHint")) + "</div>" +
          '<div class="chips wrap-chips">' + presets.map((p, i) => '<button class="chip" data-i="' + i + '">' + esc(p) + "</button>").join("") + "</div>" +
          '<div class="field"><textarea class="input" id="rj-text" maxlength="300" placeholder="' + esc(t("ad.t.rejPh")) + '"></textarea></div>' +
          '<div class="sheet-actions"><button class="btn btn-ghost" data-act="no">' + esc(t("common.cancel")) + '</button><button class="btn btn-danger" data-act="yes">' + esc(t("ad.t.reject")) + "</button></div>",
        onMount(el, close) {
          const ta = el.querySelector("#rj-text");
          el.querySelectorAll("[data-i]").forEach((b) =>
            b.addEventListener("click", () => {
              ta.value = presets[Number(b.dataset.i)];
              UI.haptic("select");
            })
          );
          el.querySelector('[data-act="no"]').onclick = () => close();
          el.querySelector('[data-act="yes"]').onclick = () => {
            const v = ta.value.trim();
            if (!v) {
              UI.toast(t("ad.t.rejNeed"), "error");
              return;
            }
            value = v;
            close();
          };
        },
        onClose() {
          resolve(value);
        },
      });
    });
  }

  async function loadList(st, fetcher, reset, repaint) {
    if (st.busy) {
      if (reset) st.again = true;
      return;
    }
    st.busy = true;
    if (reset) {
      st.items = [];
      st.page = 0;
      st.more = false;
      st.loaded = false;
      repaint();
    }
    try {
      const r = await fetcher(st.page + 1);
      st.items = st.items.concat(r.items);
      st.page = r.page;
      st.more = r.hasMore;
    } catch (e) {
      UI.handleError(e);
    }
    st.loaded = true;
    st.busy = false;
    repaint();
    if (st.again) {
      st.again = false;
      loadList(st, fetcher, true, repaint);
    }
  }

  const Page = (Pages.tasks = {
    id: "tasks",
    root: null,
    view: "tasks",
    tasks: null,
    proofs: { status: "pending", task: "", items: [], page: 0, more: false, loaded: false, busy: false, again: false },
    pay: { pf: "approval", items: [], page: 0, more: false, loaded: false, busy: false, again: false },

    init(root) {
      this.root = root;
      root.innerHTML = UI.skeleton("card", 3);
      UI.on(root, "click", "[data-act]", (e, el) => this.act(el));
    },

    show(opts) {
      opts = opts || {};
      if (opts.view) this.view = opts.view;
      if (opts.pf && PAYF[opts.pf]) this.pay.pf = opts.pf;
      if (opts.status) this.proofs.status = opts.status;
      this.refresh();
    },

    refresh() {
      if (this.view === "tasks") this.loadTasks();
      else if (this.view === "proofs") this.loadProofs(true);
      else this.loadPay(true);
      this.render();
    },

    act(el) {
      const a = el.dataset.act;
      const v = el.dataset.v;
      const id = el.dataset.id;
      if (a === "view") {
        this.view = v;
        UI.haptic("select");
        this.refresh();
      } else if (a === "newTask") this.openForm(null);
      else if (a === "editTask") this.openForm((this.tasks || []).find((x) => x.id === id));
      else if (a === "pstatus") {
        this.proofs.status = v;
        UI.haptic("select");
        this.loadProofs(true);
      } else if (a === "pclear") {
        this.proofs.task = "";
        this.loadProofs(true);
      } else if (a === "pmore") this.loadProofs(false);
      else if (a === "paychip") {
        this.pay.pf = v;
        UI.haptic("select");
        this.loadPay(true);
      } else if (a === "paymore") this.loadPay(false);
      else if (a === "viewProof") this.viewProof(this.proofs.items.find((s) => s.id === id));
      else if (a === "approve") this.approveSub(id, el);
      else if (a === "reject") this.rejectSub(id, el);
      else if (a === "payApprove") this.payApprove(id, el);
      else if (a === "payReject") this.payReject(id, el);
      else if (a === "copy") UI.copy(v);
    },

    async loadTasks() {
      try {
        this.tasks = (await API.get("/admin/tasks")).items;
      } catch (e) {
        if (!this.tasks) UI.handleError(e);
      }
      this.render();
    },

    loadProofs(reset) {
      const p = this.proofs;
      return loadList(p, (page) => API.get("/admin/submissions" + API.qs({ status: p.status, task: p.task, page })), reset, () => this.render());
    },

    loadPay(reset) {
      const p = this.pay;
      const f = PAYF[p.pf] || {};
      return loadList(p, (page) => API.get("/admin/payments" + API.qs({ type: f.type, status: f.status, page })), reset, () => this.render());
    },

    /* ----------------------------- RENDER ----------------------------- */

    render() {
      if (!this.root) return;
      const seg = (v, k) => '<button class="' + (this.view === v ? "active" : "") + '" data-act="view" data-v="' + v + '">' + esc(t(k)) + "</button>";
      const body = this.view === "tasks" ? this.tasksHtml() : this.view === "proofs" ? this.proofsHtml() : this.payHtml();
      this.root.innerHTML =
        '<div class="page-head"><div class="page-title">' + esc(t("ad.t.title")) + '</div><div class="page-sub">' + esc(t("ad.t.sub")) + "</div></div>" +
        '<div class="seg">' + seg("tasks", "ad.t.vTasks") + seg("proofs", "ad.t.vProofs") + seg("payouts", "ad.t.vPayouts") + "</div>" +
        body;
    },

    tasksHtml() {
      let h = '<button class="btn btn-primary btn-block" data-act="newTask" style="margin-bottom:14px">' + icon("plus", "sm") + esc(t("ad.t.new")) + "</button>";
      if (!this.tasks) return h + UI.skeleton("card", 3);
      if (!this.tasks.length) return h + UI.emptyState("check-square", t("ad.t.empty"));
      const cats = App.me.config.categories || [];
      return (
        h +
        this.tasks
          .map((tk) => {
            const cat = cats.find((c) => c.id === tk.category);
            const expired = tk.expiresAt && new Date(tk.expiresAt).getTime() <= Date.now();
            const full = tk.totalLimit > 0 && tk.filled >= tk.totalLimit;
            const badges = [];
            if (!tk.active) badges.push('<span class="badge bad">' + esc(t("ad.t.inactive")) + "</span>");
            if (expired) badges.push('<span class="badge bad">' + esc(t("task.expired")) + "</span>");
            if (full) badges.push('<span class="badge bad">' + esc(t("task.full")) + "</span>");
            const meta = [
              "<span>" + icon("layers") + esc(levelLabel(tk.level)) + "</span>",
              "<span>" + icon("users") + esc(tk.totalLimit > 0 ? t("ad.t.filled", { a: tk.filled, b: tk.totalLimit }) : t("ad.t.filledU", { a: tk.filled })) + "</span>",
            ];
            if (tk.pending > 0) meta.push("<span>" + icon("clock") + esc(t("ad.t.pendingN", { n: tk.pending })) + "</span>");
            return (
              '<button class="card task-card ' + (tk.active && !expired ? "" : "dim") + '" data-act="editTask" data-id="' + esc(tk.id) + '">' +
              '<div class="task-ico">' + icon(cat ? cat.icon || "grid" : "grid", "lg") + "</div>" +
              '<div class="task-main"><div class="task-title">' + esc(tk.title.en) + '</div><div class="task-meta">' + meta.join("") + "</div></div>" +
              '<div class="task-side"><div class="reward-pill">' + esc(money(tk.reward)) + "</div>" + badges.join("") + "</div></button>"
            );
          })
          .join("")
      );
    },

    proofsHtml() {
      const p = this.proofs;
      const chip = (v, k) => '<button class="chip ' + (p.status === v ? "active" : "") + '" data-act="pstatus" data-v="' + v + '">' + esc(t(k)) + "</button>";
      let h = '<div class="chips">' + chip("pending", "ad.t.pPending") + chip("approved", "ad.t.pApproved") + chip("rejected", "ad.t.pRejected") + "</div>";
      if (p.task) {
        h += '<div class="note">' + icon("info") + "<div>" + esc(t("ad.t.pFilter")) + ' <button class="btn btn-ghost btn-sm" data-act="pclear" style="margin-left:8px">' + esc(t("ad.t.pClear")) + "</button></div></div>";
      }
      if (!p.loaded) return h + UI.skeleton("list", 4);
      if (!p.items.length) return h + UI.emptyState("check-square", t("ad.t.pEmpty"));
      return (
        h + '<div class="card">' +
        p.items
          .map((s) => {
            const pending = s.status === "pending";
            return (
              '<div class="ad-item"><div class="top"><div class="row-ico">' + icon("image") + "</div>" +
              '<div class="row-main"><div class="row-title">' + esc(s.user.name) + "</div>" +
              '<div class="row-sub">' + esc(Kit.who(s.user)) + "</div>" +
              '<div class="row-sub" style="margin-top:2px">' + esc(I18n.loc(s.task.title)) + "</div></div>" +
              '<div class="row-end"><div>' + esc(money(s.reward)) + "</div>" + (pending ? "" : Kit.badge(s.status)) + "</div></div>" +
              '<div class="row-sub" style="margin-top:6px">' + esc(UI.dateTime(s.createdAt)) + "</div>" +
              (s.rejectReason ? '<div class="hist-reject">' + esc(s.rejectReason) + "</div>" : "") +
              (pending
                ? '<div class="ad-actions">' +
                  (s.hasProof ? '<button class="btn btn-ghost btn-sm" data-act="viewProof" data-id="' + esc(s.id) + '">' + icon("eye", "sm") + esc(t("ad.t.viewProof")) + "</button>" : "") +
                  '<button class="btn btn-danger btn-sm" data-act="reject" data-id="' + esc(s.id) + '">' + esc(t("ad.t.reject")) + "</button>" +
                  '<button class="btn btn-ok btn-sm" data-act="approve" data-id="' + esc(s.id) + '">' + esc(t("ad.t.approve")) + "</button></div>"
                : "") +
              "</div>"
            );
          })
          .join("") +
        "</div>" +
        (p.more ? '<button class="btn btn-ghost btn-block" data-act="pmore">' + esc(t("common.loadMore")) + "</button>" : "")
      );
    },

    payHtml() {
      const p = this.pay;
      let h =
        '<div class="chips">' +
        PAYCHIPS.map((c) => '<button class="chip ' + (p.pf === c[0] ? "active" : "") + '" data-act="paychip" data-v="' + c[0] + '">' + esc(t(c[1])) + "</button>").join("") +
        "</div>";
      if (!p.loaded) return h + UI.skeleton("list", 4);
      if (!p.items.length) return h + UI.emptyState("wallet", t("ad.t.payEmpty"));
      return (
        h + '<div class="card">' +
        p.items
          .map((x) => {
            const dep = x.type === "deposit";
            return (
              '<div class="ad-item"><div class="top"><div class="row-ico">' + icon(dep ? "arrow-down-circle" : "arrow-up-circle") + "</div>" +
              '<div class="row-main"><div class="row-title">' + esc(x.user.name) + "</div>" +
              '<div class="row-sub">' + esc(Kit.who(x.user)) + "</div>" +
              '<div class="row-sub" style="margin-top:2px">' + esc(t("tx." + x.type) + " · " + t("method." + x.method)) + "</div></div>" +
              '<div class="row-end"><div>' + esc(money(x.amount)) + "</div>" + Kit.badge(x.status) + "</div></div>" +
              '<div class="row-sub" style="margin-top:6px">' + esc(UI.dateTime(x.createdAt)) + (x.fee > 0 ? " · " + esc(t("ad.t.fee", { fee: money(x.fee), net: money(x.netAmount) })) : "") + "</div>" +
              (!dep && x.destination
                ? '<div class="flex" style="margin-top:6px"><div class="row-sub" style="word-break:break-all">' + esc(t("ad.t.dest", { dest: x.destination })) + "</div>" +
                  '<button class="icon-btn" style="width:30px;height:30px" data-act="copy" data-v="' + esc(x.destination) + '" aria-label="Copy">' + icon("copy", "sm") + "</button></div>"
                : "") +
              (x.failureReason ? '<div class="hist-reject">' + esc(x.failureReason) + "</div>" : "") +
              (x.status === "awaiting_approval"
                ? '<div class="ad-actions"><button class="btn btn-danger btn-sm" data-act="payReject" data-id="' + esc(x.id) + '">' + esc(t("ad.t.reject")) + "</button>" +
                  '<button class="btn btn-ok btn-sm" data-act="payApprove" data-id="' + esc(x.id) + '">' + esc(t("ad.t.approve")) + "</button></div>"
                : "") +
              "</div>"
            );
          })
          .join("") +
        "</div>" +
        (p.more ? '<button class="btn btn-ghost btn-block" data-act="paymore">' + esc(t("common.loadMore")) + "</button>" : "")
      );
    },

    /* ----------------------------- PROOF ACTIONS ----------------------------- */

    removeSub(id) {
      this.proofs.items = this.proofs.items.filter((s) => s.id !== id);
      this.render();
    },

    async approveSub(id, btn) {
      const sub = this.proofs.items.find((s) => s.id === id);
      if (!sub) return false;
      const ok = await UI.confirm({
        title: t("ad.t.apAsk"),
        text: t("ad.t.apText", { user: sub.user.name, amount: money(sub.reward) }),
        okText: t("ad.t.approve"),
      });
      if (!ok) return false;
      const r = await UI.withBusy(btn, () => API.post("/admin/submissions/" + encodeURIComponent(id) + "/approve"));
      if (!r) return false;
      UI.toast(t("ad.t.approved"), "success");
      this.removeSub(id);
      return true;
    },

    async rejectSub(id, btn) {
      const reason = await askReason(t("ad.t.rejTitle"), PRESET_PROOF);
      if (reason === null) return false;
      const r = await UI.withBusy(btn, () => API.post("/admin/submissions/" + encodeURIComponent(id) + "/reject", { reason }));
      if (!r) return false;
      UI.toast(t("ad.t.rejected"), "success");
      this.removeSub(id);
      return true;
    },

    async viewProof(sub) {
      if (!sub) return;
      let url = "";
      const pending = sub.status === "pending";
      const sh = UI.sheet({
        title: sub.user.name,
        html:
          '<div class="card-sub" style="margin-bottom:10px">' + esc(I18n.loc(sub.task.title) + " · " + money(sub.reward)) + "</div>" +
          '<div id="pv-img">' + UI.skeleton("card", 1) + "</div>" +
          (pending
            ? '<div class="sheet-actions"><button class="btn btn-danger" id="pv-rej">' + esc(t("ad.t.reject")) + '</button><button class="btn btn-ok" id="pv-ok">' + esc(t("ad.t.approve")) + "</button></div>"
            : ""),
        onClose() {
          if (url) URL.revokeObjectURL(url);
        },
      });
      if (pending) {
        sh.el.querySelector("#pv-ok").onclick = async function () {
          if (await Page.approveSub(sub.id, this)) sh.close();
        };
        sh.el.querySelector("#pv-rej").onclick = async function () {
          if (await Page.rejectSub(sub.id, this)) sh.close();
        };
      }
      const box = sh.el.querySelector("#pv-img");
      try {
        url = await API.blobUrl("/admin/submissions/" + encodeURIComponent(sub.id) + "/proof");
        box.innerHTML = '<img class="proof-img" src="' + url + '" alt="" />';
      } catch (e) {
        box.innerHTML = UI.emptyState("image", e.message || t("err.generic"));
      }
    },

    /* ----------------------------- PAYMENT ACTIONS ----------------------------- */

    async payApprove(id, btn) {
      const x = this.pay.items.find((p) => p.id === id);
      if (!x) return;
      const ok = await UI.confirm({
        title: t("ad.t.payApAsk"),
        text: t("ad.t.payApText", { net: money(x.netAmount), dest: x.destination, user: x.user.name }),
        okText: t("ad.t.approve"),
      });
      if (!ok) return;
      const r = await UI.withBusy(btn, () => API.post("/admin/payments/" + encodeURIComponent(id) + "/approve"));
      if (!r) return;
      if (r.status === "success") UI.toast(t("ad.t.payApproved"), "success");
      else if (r.status === "processing") UI.toast(t("ad.t.payStarted"), "success");
      else UI.toast(t("ad.t.payFailed"), "error");
      this.loadPay(true);
    },

    async payReject(id, btn) {
      const reason = await askReason(t("ad.t.payRejTitle"), PRESET_PAY);
      if (reason === null) return;
      const r = await UI.withBusy(btn, () => API.post("/admin/payments/" + encodeURIComponent(id) + "/reject", { reason }));
      if (!r) return;
      UI.toast(t("ad.t.payRejected"), "success");
      this.loadPay(true);
    },

    /* ----------------------------- TASK FORM ----------------------------- */

    openForm(tk) {
      const cats = App.me.config.categories || [];
      const levels = App.me.config.levels || [];
      const isEdit = !!tk;
      const v = tk || {
        title: { en: "", bn: "" },
        description: { en: "", bn: "" },
        category: cats[0] ? cats[0].id : "other",
        level: 0,
        reward: "",
        link: "",
        proofRequired: true,
        totalLimit: 0,
        expiresAt: null,
        active: true,
        sortOrder: 0,
      };

      const f = (label, html, hint) =>
        '<div class="field"><label>' + esc(label) + "</label>" + html + (hint ? '<div class="field-hint">' + esc(hint) + "</div>" : "") + "</div>";
      const inp = (id, val, extra) => '<input class="input" id="' + id + '" value="' + esc(val) + '" ' + (extra || "") + " />";
      const area = (id, val) => '<textarea class="input" id="' + id + '" maxlength="2000">' + esc(val) + "</textarea>";
      const sw = (id, label, on) =>
        '<div class="switch-row"><div class="grow"><div class="card-title">' + esc(label) + "</div></div>" +
        '<button class="switch ' + (on ? "on" : "") + '" id="' + id + '" role="switch" aria-checked="' + !!on + '"></button></div>';

      const catList = cats.slice();
      if (!catList.some((c) => c.id === v.category)) catList.push({ id: v.category, en: v.category });
      const catSelect =
        '<select class="input" id="tf-cat">' +
        catList.map((c) => '<option value="' + esc(c.id) + '"' + (c.id === v.category ? " selected" : "") + ">" + esc(c.en) + "</option>").join("") +
        "</select>";

      const lvl = v.level || 0;
      const levelSelect =
        '<select class="input" id="tf-level"><option value="0"' + (lvl === 0 ? " selected" : "") + ">" + esc(t("ad.t.lvAll")) + "</option>" +
        levels.map((L, i) => '<option value="' + (i + 1) + '"' + (lvl === i + 1 ? " selected" : "") + ">" + esc(L.name) + "</option>").join("") +
        "</select>";

      UI.sheet({
        title: isEdit ? t("ad.t.edit") : t("ad.t.new"),
        html:
          '<div class="note">' + icon("info") + "<div>" + esc(t("ad.t.onceNote")) + "</div></div>" +
          f(t("ad.t.fTitleEn"), inp("tf-ten", v.title.en, 'maxlength="120"')) +
          f(t("ad.t.fTitleBn"), inp("tf-tbn", v.title.bn, 'maxlength="120"')) +
          f(t("ad.t.fDescEn"), area("tf-den", v.description.en)) +
          f(t("ad.t.fDescBn"), area("tf-dbn", v.description.bn)) +
          f(t("ad.t.fCat"), catSelect) +
          f(t("ad.t.fLevel"), levelSelect, t("ad.t.fLevelHint")) +
          f(t("ad.t.fReward"), inp("tf-reward", v.reward, 'inputmode="decimal" autocomplete="off"')) +
          f(t("ad.t.fLink"), inp("tf-link", v.link, 'placeholder="https://" autocapitalize="off" autocomplete="off"')) +
          f(t("ad.t.fTotal"), inp("tf-total", v.totalLimit, 'inputmode="numeric"')) +
          f(t("ad.t.fExpiry"), inp("tf-exp", toLocalInput(v.expiresAt), 'type="datetime-local"')) +
          f(t("ad.t.fOrder"), inp("tf-order", v.sortOrder, 'inputmode="numeric"')) +
          sw("tf-proof", t("ad.t.fProof"), v.proofRequired) +
          sw("tf-active", t("ad.t.fActive"), v.active) +
          '<div class="ad-actions" style="margin-top:16px">' +
          (isEdit && tk.pending > 0 ? '<button class="btn btn-ghost" id="tf-review">' + esc(t("ad.t.reviewProofs", { n: tk.pending })) + "</button>" : "") +
          (isEdit ? '<button class="btn btn-danger" id="tf-del">' + icon("trash", "sm") + esc(t("common.delete")) + "</button>" : "") +
          "</div>" +
          '<button class="btn btn-primary btn-block" id="tf-save" style="margin-top:10px">' + icon("check", "sm") + esc(t("common.save")) + "</button>",
        onMount(el, close) {
          el.querySelectorAll(".switch").forEach((s) =>
            s.addEventListener("click", () => {
              s.classList.toggle("on");
              s.setAttribute("aria-checked", s.classList.contains("on"));
              UI.haptic("select");
            })
          );
          const val = (id) => el.querySelector("#" + id).value.trim();
          const on = (id) => el.querySelector("#" + id).classList.contains("on");

          const save = el.querySelector("#tf-save");
          save.onclick = () =>
            UI.withBusy(save, async () => {
              const exp = val("tf-exp");
              const body = {
                title: { en: val("tf-ten"), bn: val("tf-tbn") },
                description: { en: val("tf-den"), bn: val("tf-dbn") },
                category: el.querySelector("#tf-cat").value,
                level: el.querySelector("#tf-level").value,
                reward: val("tf-reward"),
                link: val("tf-link"),
                proofRequired: on("tf-proof"),
                totalLimit: val("tf-total"),
                expiresAt: exp ? new Date(exp).toISOString() : "",
                active: on("tf-active"),
                sortOrder: val("tf-order"),
              };
              if (isEdit) await API.put("/admin/tasks/" + encodeURIComponent(tk.id), body);
              else await API.post("/admin/tasks", body);
              UI.toast(t("ad.t.saved"), "success");
              close();
              Page.loadTasks();
            });

          const del = el.querySelector("#tf-del");
          if (del) {
            del.onclick = async () => {
              const ok = await UI.confirm({ title: t("ad.t.delAsk"), text: t("ad.t.delText"), danger: true, okText: t("common.delete") });
              if (!ok) return;
              const r = await UI.withBusy(del, () => API.del("/admin/tasks/" + encodeURIComponent(tk.id)));
              if (!r) return;
              UI.toast(r.deactivated ? t("ad.t.deactivated") : t("ad.t.deleted"), "success");
              close();
              Page.loadTasks();
            };
          }

          const review = el.querySelector("#tf-review");
          if (review) {
            review.onclick = () => {
              close();
              Page.proofs.task = tk.id;
              Page.proofs.status = "pending";
              Page.view = "proofs";
              Page.refresh();
            };
          }
        },
      });
    },
  });
})();
