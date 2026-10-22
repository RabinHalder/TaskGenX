/* TaskGenX user panel: Tasks */
(function () {
  "use strict";
  const { esc, icon, money } = UI;

  I18n.extend(
    {
      "task.title": "Tasks",
      "task.sub": "Pick a task, finish it and upload proof to earn.",
      "task.tabTasks": "Tasks",
      "task.tabHistory": "History",
      "task.all": "All",
      "task.empty": "No tasks available right now. Check back soon!",
      "task.loadFail": "Could not load tasks.",
      "task.done": "Completed",
      "task.review": "In review",
      "task.full": "Full",
      "task.expired": "Expired",
      "task.progress": "{used}/{limit} done",
      "task.left": "{n} slots left",
      "task.dProgress": "Your progress",
      "task.dSlots": "Slots left",
      "task.dExpires": "Expires",
      "task.dProof": "Proof",
      "task.unlimited": "Unlimited",
      "task.noExpiry": "No expiry",
      "task.proofYes": "Screenshot",
      "task.proofNo": "Not needed",
      "task.openLink": "Open task link",
      "task.upload": "Tap to upload screenshot",
      "task.change": "Tap to change screenshot",
      "task.uploadHint": "JPG or PNG, up to {mb} MB",
      "task.submit": "Submit proof",
      "task.markDone": "Mark as done",
      "task.needProof": "Please upload a screenshot first",
      "task.tooLarge": "The image is too large. Choose a smaller one.",
      "task.sent": "Submitted! We will review it soon.",
      "task.msgDone": "You have completed this task.",
      "task.msgReview": "Your proof is under review.",
      "task.msgFull": "All slots for this task are filled.",
      "task.msgExpired": "This task has expired.",
      "task.hPending": "Pending",
      "task.hApproved": "Approved",
      "task.hRejected": "Rejected",
      "task.reason": "Reason",
      "task.histEmpty": "No submissions yet. Complete a task to see it here.",
    },
    {
      "task.title": "টাস্ক",
      "task.sub": "একটি টাস্ক বেছে নিন, সম্পন্ন করুন এবং প্রমাণ আপলোড করে আয় করুন।",
      "task.tabTasks": "টাস্ক",
      "task.tabHistory": "হিস্টোরি",
      "task.all": "সব",
      "task.empty": "এখন কোনো টাস্ক নেই। একটু পরে আবার দেখুন!",
      "task.loadFail": "টাস্ক লোড করা যায়নি।",
      "task.done": "সম্পন্ন",
      "task.review": "যাচাইয়ে আছে",
      "task.full": "পূর্ণ",
      "task.expired": "মেয়াদ শেষ",
      "task.progress": "{used}/{limit} সম্পন্ন",
      "task.left": "আর {n}টি সুযোগ বাকি",
      "task.dProgress": "আপনার অগ্রগতি",
      "task.dSlots": "বাকি সুযোগ",
      "task.dExpires": "মেয়াদ",
      "task.dProof": "প্রমাণ",
      "task.unlimited": "সীমাহীন",
      "task.noExpiry": "মেয়াদ নেই",
      "task.proofYes": "স্ক্রিনশট",
      "task.proofNo": "লাগবে না",
      "task.openLink": "টাস্ক লিংক খুলুন",
      "task.upload": "স্ক্রিনশট আপলোড করতে ট্যাপ করুন",
      "task.change": "স্ক্রিনশট বদলাতে ট্যাপ করুন",
      "task.uploadHint": "JPG বা PNG, সর্বোচ্চ {mb} MB",
      "task.submit": "প্রমাণ জমা দিন",
      "task.markDone": "সম্পন্ন হিসেবে জানান",
      "task.needProof": "আগে একটি স্ক্রিনশট আপলোড করুন",
      "task.tooLarge": "ছবিটি অনেক বড়। ছোট একটি ছবি বেছে নিন।",
      "task.sent": "জমা হয়েছে! শীঘ্রই আমরা যাচাই করব।",
      "task.msgDone": "আপনি এই টাস্ক সম্পন্ন করেছেন।",
      "task.msgReview": "আপনার প্রমাণ যাচাই চলছে।",
      "task.msgFull": "এই টাস্কের সব সুযোগ পূর্ণ হয়ে গেছে।",
      "task.msgExpired": "এই টাস্কের মেয়াদ শেষ।",
      "task.hPending": "অপেক্ষমাণ",
      "task.hApproved": "অনুমোদিত",
      "task.hRejected": "বাতিল",
      "task.reason": "কারণ",
      "task.histEmpty": "এখনো কিছু জমা দেননি। টাস্ক সম্পন্ন করলে এখানে দেখা যাবে।",
    }
  );

  function state(tk) {
    if (tk.completed) return "done";
    if (tk.full) return "full";
    if (tk.expiresAt && new Date(tk.expiresAt).getTime() <= Date.now()) return "expired";
    return "open";
  }

  // Shrinks a large screenshot to a JPG that fits the size limit.
  async function toJpeg(file, maxBytes) {
    const bmp = await createImageBitmap(file).catch(() => null);
    if (!bmp) throw new Error(t("err.imageType"));
    let scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    let q = 0.9;
    for (let i = 0; i < 6; i++) {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(bmp.width * scale));
      c.height = Math.max(1, Math.round(bmp.height * scale));
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", q));
      if (blob && blob.size <= maxBytes) return blob;
      q -= 0.1;
      scale *= 0.85;
    }
    throw new Error(t("task.tooLarge"));
  }

  const Page = {
    id: "task",
    root: null,
    view: "tasks",
    cat: "all",
    tasks: null,
    err: false,
    hist: { items: [], page: 0, more: false, status: "", loaded: false, busy: false },

    init(root) {
      this.root = root;
      root.innerHTML = UI.skeleton("card", 3);
      UI.on(root, "click", "[data-act]", (e, el) => this.act(el));
    },

    show() {
      this.loadTasks();
      if (this.view === "history") this.loadHist(true);
    },

    act(el) {
      const a = el.dataset.act;
      if (a === "view") {
        this.view = el.dataset.v;
        UI.haptic("select");
        this.render();
        if (this.view === "history" && !this.hist.loaded) this.loadHist(true);
      } else if (a === "cat") {
        this.cat = el.dataset.v;
        UI.haptic("select");
        this.render();
      } else if (a === "hstatus") {
        this.hist.status = el.dataset.v;
        UI.haptic("select");
        this.loadHist(true);
      } else if (a === "open") {
        this.openTask(el.dataset.id);
      } else if (a === "more") {
        this.loadHist(false);
      } else if (a === "reload") {
        this.err = false;
        this.tasks = null;
        this.render();
        this.loadTasks();
      }
    },

    async loadTasks() {
      try {
        const r = await API.get("/tasks");
        this.tasks = r.items;
        this.err = false;
      } catch (e) {
        if (!this.tasks) this.err = true;
        else UI.handleError(e);
      }
      this.render();
    },

    async loadHist(reset) {
      const h = this.hist;
      if (h.busy) return;
      h.busy = true;
      if (reset) {
        h.items = [];
        h.page = 0;
        h.more = false;
        h.loaded = false;
        this.render();
      }
      try {
        const r = await API.get("/tasks/my/history" + API.qs({ page: h.page + 1, status: h.status }));
        h.items = h.items.concat(r.items);
        h.page = r.page;
        h.more = r.hasMore;
      } catch (e) {
        UI.handleError(e);
      }
      h.loaded = true;
      h.busy = false;
      this.render();
    },

    /* ----------------------------- RENDER ----------------------------- */

    render() {
      if (!this.root || !App.me) return;
      const seg = (v, key) => '<button class="' + (this.view === v ? "active" : "") + '" data-act="view" data-v="' + v + '">' + esc(t(key)) + "</button>";
      this.root.innerHTML =
        '<div class="page-head"><div class="page-title">' + esc(t("task.title")) + '</div><div class="page-sub">' + esc(t("task.sub")) + "</div></div>" +
        '<div class="seg">' + seg("tasks", "task.tabTasks") + seg("history", "task.tabHistory") + "</div>" +
        (this.view === "tasks" ? this.tasksHtml() : this.histHtml());
      const active = this.root.querySelector(".chip.active");
      if (active) {
        try {
          active.scrollIntoView({ inline: "center", block: "nearest" });
        } catch (e) {}
      }
    },

    catIcon(id) {
      const c = (App.me.config.categories || []).find((x) => x.id === id);
      return c ? c.icon || "grid" : "grid";
    },

    tasksHtml() {
      if (this.err) {
        return UI.emptyState("alert", t("task.loadFail")) + '<button class="btn btn-primary btn-block" data-act="reload">' + esc(t("common.retry")) + "</button>";
      }
      if (!this.tasks) return UI.skeleton("card", 3);

      const cats = App.me.config.categories || [];
      const chip = (v, label) => '<button class="chip ' + (this.cat === v ? "active" : "") + '" data-act="cat" data-v="' + esc(v) + '">' + esc(label) + "</button>";
      const chips = '<div class="chips">' + chip("all", t("task.all")) + cats.map((c) => chip(c.id, I18n.pick(c.en, c.bn))).join("") + "</div>";

      const rank = (tk) => (state(tk) === "open" ? 0 : 1);
      const list = this.tasks.filter((tk) => this.cat === "all" || tk.category === this.cat).sort((a, b) => rank(a) - rank(b));
      if (!list.length) return chips + UI.emptyState("check-square", t("task.empty"));

      return chips + list.map((tk) => this.cardHtml(tk)).join("");
    },

    cardHtml(tk) {
      const st = state(tk);
      const used = tk.myApproved + tk.myPending;
      let badge = "";
      if (tk.myPending > 0 && st === "done") badge = '<span class="badge wait">' + esc(t("task.review")) + "</span>";
      else if (st === "done") badge = '<span class="badge ok">' + esc(t("task.done")) + "</span>";
      else if (st === "full") badge = '<span class="badge bad">' + esc(t("task.full")) + "</span>";
      else if (st === "expired") badge = '<span class="badge bad">' + esc(t("task.expired")) + "</span>";

      const meta = ['<span>' + icon("check-circle") + esc(t("task.progress", { used, limit: tk.limitPerUser })) + "</span>"];
      if (tk.remaining !== null) meta.push("<span>" + icon("users") + esc(t("task.left", { n: tk.remaining })) + "</span>");
      if (tk.expiresAt && st === "open") meta.push("<span>" + icon("clock") + esc(UI.timeLeft(tk.expiresAt)) + "</span>");

      return (
        '<button class="card task-card ' + (st === "open" ? "" : "dim") + '" data-act="open" data-id="' + esc(tk.id) + '">' +
        '<div class="task-ico">' + icon(this.catIcon(tk.category), "lg") + "</div>" +
        '<div class="task-main"><div class="task-title">' + esc(I18n.loc(tk.title)) + '</div><div class="task-meta">' + meta.join("") + "</div></div>" +
        '<div class="task-side"><div class="reward-pill">' + esc(money(tk.reward)) + "</div>" + badge + "</div></button>"
      );
    },

    histHtml() {
      const h = this.hist;
      const chip = (v, label) => '<button class="chip ' + (h.status === v ? "active" : "") + '" data-act="hstatus" data-v="' + v + '">' + esc(label) + "</button>";
      const chips =
        '<div class="chips">' + chip("", t("task.all")) + chip("pending", t("task.hPending")) + chip("approved", t("task.hApproved")) + chip("rejected", t("task.hRejected")) + "</div>";
      if (!h.loaded) return chips + UI.skeleton("list", 4);
      if (!h.items.length) return chips + UI.emptyState("history", t("task.histEmpty"));

      const rows = h.items
        .map((it) => {
          const cls = it.status === "approved" ? "ok" : it.status === "rejected" ? "bad" : "wait";
          const ico = it.status === "approved" ? "check-circle" : it.status === "rejected" ? "x-circle" : "clock";
          const reason =
            it.status === "rejected" && it.rejectReason
              ? '<div class="hist-reject"><b>' + esc(t("task.reason")) + ":</b> " + esc(it.rejectReason) + "</div>"
              : "";
          return (
            '<div class="row" style="align-items:flex-start"><div class="row-ico">' + icon(ico) + "</div>" +
            '<div class="row-main"><div class="row-title">' + esc(I18n.loc(it.title)) + "</div>" +
            '<div class="row-sub">' + esc(UI.dateTime(it.createdAt)) + "</div>" + reason + "</div>" +
            '<div class="row-end"><div>' + esc(money(it.reward)) + '</div><span class="badge ' + cls + '">' + esc(t("status." + it.status)) + "</span></div></div>"
          );
        })
        .join("");
      return (
        chips + '<div class="card">' + rows + "</div>" +
        (h.more ? '<button class="btn btn-ghost btn-block ' + (h.busy ? "loading" : "") + '" data-act="more">' + esc(t("common.loadMore")) + "</button>" : "")
      );
    },

    /* ----------------------------- DETAIL ----------------------------- */

    async openTask(id) {
      const sh = UI.sheet({ html: UI.skeleton("card", 2) });
      let tk;
      try {
        tk = (await API.get("/tasks/" + encodeURIComponent(id))).task;
      } catch (e) {
        sh.close();
        UI.handleError(e);
        return;
      }
      this.paintDetail(sh, tk);
    },

    paintDetail(sh, tk) {
      const st = state(tk);
      const canSubmit = st === "open";
      const maxMB = App.me.config.proof.maxSizeMB;
      const desc = I18n.loc(tk.description);
      const cell = (label, value) => '<div class="info-cell">' + esc(label) + "<b>" + esc(value) + "</b></div>";

      let action;
      if (canSubmit) {
        action = tk.proofRequired
          ? '<div class="dropzone" id="t-drop">' + icon("image", "lg") + "<b>" + esc(t("task.upload")) + "</b>" + esc(t("task.uploadHint", { mb: maxMB })) + "</div>" +
            '<input type="file" id="t-file" accept="image/png,image/jpeg" hidden />' +
            '<img id="t-prev" class="proof-preview hidden" alt="" />' +
            '<button class="btn btn-primary btn-block" id="t-submit" disabled>' + icon("upload", "sm") + esc(t("task.submit")) + "</button>"
          : '<button class="btn btn-primary btn-block" id="t-submit">' + icon("check", "sm") + esc(t("task.markDone")) + "</button>";
      } else {
        const msg = st === "done" ? (tk.myPending > 0 ? t("task.msgReview") : t("task.msgDone")) : st === "full" ? t("task.msgFull") : t("task.msgExpired");
        action = '<div class="note">' + icon("info") + "<div>" + esc(msg) + "</div></div>";
      }

      sh.el.innerHTML =
        '<div class="flex between" style="align-items:flex-start;margin-bottom:6px">' +
        '<div class="sheet-title" style="margin:0">' + esc(I18n.loc(tk.title)) + '</div><div class="reward-pill">' + esc(money(tk.reward)) + "</div></div>" +
        (desc ? '<div class="desc">' + esc(desc) + "</div>" : '<div style="height:10px"></div>') +
        '<div class="info-grid">' +
        cell(t("task.dProgress"), t("task.progress", { used: tk.myApproved + tk.myPending, limit: tk.limitPerUser })) +
        cell(t("task.dSlots"), tk.remaining === null ? t("task.unlimited") : String(tk.remaining)) +
        cell(t("task.dExpires"), tk.expiresAt ? UI.timeLeft(tk.expiresAt) : t("task.noExpiry")) +
        cell(t("task.dProof"), tk.proofRequired ? t("task.proofYes") : t("task.proofNo")) +
        "</div>" +
        (tk.link ? '<button class="btn btn-ghost btn-block" id="t-link" style="margin-bottom:14px">' + icon("external-link", "sm") + esc(t("task.openLink")) + "</button>" : "") +
        action;

      const el = sh.el;
      const linkBtn = el.querySelector("#t-link");
      if (linkBtn) linkBtn.onclick = () => UI.openLink(tk.link);
      if (!canSubmit) return;

      const submitBtn = el.querySelector("#t-submit");
      let chosen = null;

      if (tk.proofRequired) {
        const drop = el.querySelector("#t-drop");
        const input = el.querySelector("#t-file");
        const prev = el.querySelector("#t-prev");
        drop.onclick = () => input.click();
        input.onchange = async () => {
          const f = input.files && input.files[0];
          if (!f) return;
          if (f.type !== "image/jpeg" && f.type !== "image/png") {
            UI.toast(t("err.imageType"), "error");
            input.value = "";
            return;
          }
          try {
            const max = maxMB * 1024 * 1024;
            chosen = f.size > max ? await toJpeg(f, max) : f;
          } catch (e) {
            UI.handleError(e);
            input.value = "";
            return;
          }
          if (prev.src) URL.revokeObjectURL(prev.src);
          prev.src = URL.createObjectURL(chosen);
          prev.classList.remove("hidden");
          drop.querySelector("b").textContent = t("task.change");
          submitBtn.disabled = false;
          UI.haptic("light");
        };
      }

      submitBtn.onclick = async () => {
        const r = await UI.withBusy(submitBtn, async () => {
          const path = "/tasks/" + encodeURIComponent(tk.id) + "/submit";
          if (tk.proofRequired) {
            if (!chosen) throw new Error(t("task.needProof"));
            const fd = new FormData();
            fd.append("proof", chosen, "proof." + (chosen.type === "image/png" ? "png" : "jpg"));
            return API.upload(path, fd);
          }
          return API.post(path, {});
        });
        if (!r) return;
        sh.close();
        UI.confetti();
        UI.toast(t("task.sent"), "success");
        Page.loadTasks();
        Page.hist.loaded = false;
        App.refreshMe({ silent: true });
      };
    },
  };

  window.Pages = window.Pages || {};
  window.Pages.task = Page;
})();
