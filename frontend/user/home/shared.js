/* TaskGenX Home: shared helpers used by checkin.js, ads.js, deposit.js, withdraw.js */
(function () {
  "use strict";
  const { esc, icon } = UI;

  const head = (ico, title, sub) =>
    '<div class="mn-head"><span class="mn-badge">' + icon(ico) + '</span><div><div class="mn-title">' + esc(title) +
    '</div><div class="mn-sub">' + esc(sub) + "</div></div></div>";

  const row = (label, value, cls) =>
    '<div class="mn-row ' + (cls || "") + '"><span>' + esc(label) + "</span><b>" + esc(value) + "</b></div>";

  const info = (ico, text) => '<div class="mn-info">' + icon(ico, "sm") + "<span>" + esc(text) + "</span></div>";

  function resultHtml(o) {
    const top = o.spin
      ? '<div class="mn-ring"><i class="ring"></i><span class="mn-ring-ico">' + icon(o.ico, "lg") + "</span></div>"
      : '<div class="mn-r-ico ' + o.tone + '">' + icon(o.ico, "lg") + "</div>";
    return (
      '<div class="mn-result">' + top + '<div class="mn-r-title">' + esc(o.title) + "</div>" +
      (o.amount ? '<div class="mn-r-amt">' + esc(o.amount) + "</div>" : "") +
      (o.text ? '<div class="mn-r-text">' + esc(o.text) + "</div>" : "") + "</div>" +
      (o.rows && o.rows.length ? '<div class="mn-sum mn-rows">' + o.rows.map((r) => row(r[0], r[1])).join("") + "</div>" : "") +
      '<div class="mn-btns">' + (o.buttons || "") + "</div>"
    );
  }

  const doneBtn = () => '<button class="btn btn-primary btn-block" id="mn-done">' + esc(t("mn.done")) + "</button>";

  function maskDest(v) {
    v = String(v || "");
    if (!v) return "";
    if (v.includes("@")) {
      const p = v.split("@");
      return p[0].slice(0, 2) + "***@" + p.slice(1).join("@");
    }
    return v.length > 4 ? "*".repeat(v.length - 3) + v.slice(-3) : "***";
  }

  /* ----------------------------- Monetag loader ----------------------------- */

  const monetagCache = {};
  function loadMonetag(zoneId) {
    const fnName = "show_" + zoneId;
    if (monetagCache[zoneId]) return monetagCache[zoneId];
    monetagCache[zoneId] = new Promise((resolve, reject) => {
      if (typeof window[fnName] === "function") return resolve(window[fnName]);
      const s = document.createElement("script");
      s.src = "https://libtl.com/sdk.js";
      s.setAttribute("data-zone", zoneId);
      s.setAttribute("data-sdk", fnName);
      s.onload = () => {
        if (typeof window[fnName] === "function") resolve(window[fnName]);
        else reject(new Error("ad sdk did not initialize"));
      };
      s.onerror = () => reject(new Error("ad sdk failed to load"));
      document.body.appendChild(s);
    });
    return monetagCache[zoneId];
  }

  I18n.extend({ "mn.balance": "Available balance", "mn.done": "Done" }, { "mn.balance": "উপলব্ধ ব্যালেন্স", "mn.done": "সম্পন্ন" });

  window.HomeUI = { head, row, info, resultHtml, doneBtn, maskDest, loadMonetag };
})();
