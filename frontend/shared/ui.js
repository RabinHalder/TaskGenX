/* TaskGenX shared UI helpers */
(function () {
  "use strict";

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reducedMotion = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(v) {
    return String(v === undefined || v === null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ------------------------------ ICONS ------------------------------ */

  const ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "user-check": '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
    "check-square": '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 14h2"/>',
    "arrow-down-circle": '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>',
    "arrow-up-circle": '<circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/>',
    "arrow-left": '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    "arrow-right": '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    "eye-off": '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    "help-circle": '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    "check-circle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    "x-circle": '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    history: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    "chevron-right": '<polyline points="9 18 15 12 9 6"/>',
    "chevron-left": '<polyline points="15 18 9 12 15 6"/>',
    "chevron-down": '<polyline points="6 9 12 15 18 9"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    "bar-chart": '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    "trending-up": '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    ban: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    "external-link": '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    smartphone: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    "message-circle": '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    rupee: '<path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/>',
  };

  function icon(name, size) {
    const body = ICONS[name] || ICONS.grid;
    return (
      '<svg class="icon' + (size ? " " + size : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + body + "</svg>"
    );
  }

  /* ------------------------------ STYLES ------------------------------ */

  function injectStyles() {
    if (document.getElementById("ui-styles")) return;
    const style = document.createElement("style");
    style.id = "ui-styles";
    style.textContent = `
#confetti{width:100%;height:100%}
#fatal{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:24px;background:var(--bg)}
#fatal.show{display:flex}
.fatal-box{max-width:340px;text-align:center}
.fatal-ico{width:76px;height:76px;margin:0 auto 18px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--accent-grad);color:#fff;box-shadow:0 12px 30px rgba(0,0,0,.18)}
.fatal-box h2{font-size:20px;font-weight:800;margin-bottom:8px}
.fatal-box p{color:var(--text-soft);margin-bottom:20px}
#toast{display:flex;align-items:center;gap:8px}
#toast[data-type="error"]{background:var(--danger);color:#fff}
#toast[data-type="success"]{background:var(--success);color:#fff}
.sheet-actions{display:flex;gap:10px;margin-top:6px}
.sheet-actions .btn{flex:1}
textarea.input{min-height:96px;resize:vertical;line-height:1.45}
.btn.loading{pointer-events:none;opacity:.75}
.btn.loading::after{content:"";width:16px;height:16px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:tgx-spin .7s linear infinite}
@keyframes tgx-spin{to{transform:rotate(360deg)}}
`;
    document.head.appendChild(style);
  }

  /* ------------------------------ TELEGRAM ------------------------------ */

  function initTelegram() {
    if (!tg) return;
    try { tg.ready(); } catch (e) {}
    try { tg.expand(); } catch (e) {}
    try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
  }

  // Back button stack (used by popups and sub-pages)
  const backHandlers = [];
  function updateBack() {
    try {
      if (!tg || !tg.BackButton) return;
      if (backHandlers.length) tg.BackButton.show();
      else tg.BackButton.hide();
    } catch (e) {}
  }
  try {
    if (tg && tg.BackButton) {
      tg.BackButton.onClick(() => {
        const h = backHandlers[backHandlers.length - 1];
        if (h) h();
      });
    }
  } catch (e) {}
  function pushBack(fn) {
    backHandlers.push(fn);
    updateBack();
    return function pop() {
      const i = backHandlers.indexOf(fn);
      if (i > -1) backHandlers.splice(i, 1);
      updateBack();
    };
  }

  function haptic(kind) {
    try {
      const h = tg && tg.HapticFeedback;
      if (h) {
        if (kind === "success" || kind === "error" || kind === "warning") h.notificationOccurred(kind);
        else if (kind === "select") h.selectionChanged();
        else h.impactOccurred(kind || "light");
        return;
      }
      if (navigator.vibrate) navigator.vibrate(kind === "heavy" ? 30 : kind === "error" ? [20, 40, 20] : 10);
    } catch (e) {}
  }

  function openLink(url) {
    if (!url) return;
    try {
      if (tg && /^https?:\/\/(t\.me|telegram\.me)\//i.test(url) && tg.openTelegramLink) {
        tg.openTelegramLink(url);
        return;
      }
      if (tg && tg.openLink) {
        tg.openLink(url);
        return;
      }
    } catch (e) {}
    window.open(url, "_blank");
  }

  function shareLink(link, text) {
    const url =
      "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(text || "");
    openLink(url);
  }

  async function copy(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      haptic("light");
      toast(t("common.copied"), "success");
      return true;
    } catch (e) {
      toast(t("err.copyFail"), "error");
      return false;
    }
  }

  /* ------------------------------ TOAST ------------------------------ */

  let toastTimer;
  function toast(msg, type) {
    const el = $("#toast");
    if (!el) return;
    const ico = type === "error" ? "alert" : type === "success" ? "check-circle" : "info";
    el.innerHTML = icon(ico, "sm") + "<span>" + esc(msg) + "</span>";
    el.setAttribute("data-type", type || "info");
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), type === "error" ? 3600 : 2400);
    if (type === "error") haptic("error");
    else if (type === "success") haptic("success");
  }

  function handleError(e) {
    if (!e) return;
    // The full-screen message is already shown for these
    if (e.status === 401 || e.code === "banned" || e.code === "maintenance") return;
    toast(e.message || t("err.generic"), "error");
  }

  // Runs fn while the button shows a spinner. Returns fn's result, or undefined on error.
  async function withBusy(btn, fn) {
    if (btn) {
      if (btn.classList.contains("loading")) return undefined;
      btn.classList.add("loading");
    }
    try {
      return await fn();
    } catch (e) {
      handleError(e);
      return undefined;
    } finally {
      if (btn) btn.classList.remove("loading");
    }
  }

  /* ------------------------------ POPUP SHEETS ------------------------------ */

  function sheet(o) {
    o = o || {};
    const backdrop = document.createElement("div");
    backdrop.className = "sheet-backdrop open";
    backdrop.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div>' +
      (o.title ? '<div class="sheet-title">' + esc(o.title) + "</div>" : "") +
      '<div class="sheet-body">' +
      (o.html || "") +
      "</div></div>";
    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";

    let closed = false;
    const popBack = pushBack(() => close());

    function close(result) {
      if (closed) return;
      closed = true;
      popBack();
      backdrop.remove();
      if (!document.querySelector(".sheet-backdrop")) document.body.style.overflow = "";
      if (o.onClose) o.onClose(result);
    }

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
    const el = backdrop.querySelector(".sheet-body");
    el.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => close()));
    if (o.onMount) o.onMount(el, close);
    return { el, close };
  }

  function confirmDialog(o) {
    o = o || {};
    return new Promise((resolve) => {
      let result = false;
      sheet({
        title: o.title,
        html:
          (o.text ? '<p class="muted" style="margin-bottom:16px">' + esc(o.text) + "</p>" : "") +
          '<div class="sheet-actions">' +
          '<button class="btn btn-ghost" data-act="no">' + esc(o.cancelText || t("common.cancel")) + "</button>" +
          '<button class="btn ' + (o.danger ? "btn-danger" : "btn-primary") + '" data-act="yes">' +
          esc(o.okText || t("common.confirm")) + "</button></div>",
        onMount(el, close) {
          el.querySelector('[data-act="yes"]').onclick = () => {
            result = true;
            close();
          };
          el.querySelector('[data-act="no"]').onclick = () => close();
        },
        onClose() {
          resolve(result);
        },
      });
    });
  }

  // Asks for one line (or paragraph) of text. Resolves to the text, or null if cancelled.
  function promptDialog(o) {
    o = o || {};
    return new Promise((resolve) => {
      let value = null;
      const max = o.maxLength || 300;
      const field = o.multiline
        ? '<textarea class="input" id="tgx-prompt" maxlength="' + max + '" placeholder="' + esc(o.placeholder || "") + '">' + esc(o.value || "") + "</textarea>"
        : '<input class="input" id="tgx-prompt" type="text" maxlength="' + max + '" inputmode="' + esc(o.inputmode || "text") + '" value="' + esc(o.value || "") + '" placeholder="' + esc(o.placeholder || "") + '" />';
      sheet({
        title: o.title,
        html:
          '<div class="field">' + (o.label ? "<label>" + esc(o.label) + "</label>" : "") + field + "</div>" +
          '<div class="sheet-actions">' +
          '<button class="btn btn-ghost" data-act="cancel">' + esc(t("common.cancel")) + "</button>" +
          '<button class="btn btn-primary" data-act="ok">' + esc(o.okText || t("common.confirm")) + "</button></div>",
        onMount(el, close) {
          const input = el.querySelector("#tgx-prompt");
          setTimeout(() => input && input.focus(), 200);
          el.querySelector('[data-act="ok"]').onclick = () => {
            const v = input.value.trim();
            if (o.required && !v) {
              haptic("error");
              input.focus();
              return;
            }
            value = v;
            close();
          };
          el.querySelector('[data-act="cancel"]').onclick = () => close();
        },
        onClose() {
          resolve(value);
        },
      });
    });
  }

  /* ------------------------------ FATAL SCREEN ------------------------------ */

  function fatal(kind, message) {
    let el = document.getElementById("fatal");
    if (!el) {
      el = document.createElement("div");
      el.id = "fatal";
      document.body.appendChild(el);
    }
    const icons = { unauthorized: "lock", banned: "ban", maintenance: "settings", network: "alert" };
    const k = icons[kind] ? kind : "network";
    el.innerHTML =
      '<div class="fatal-box"><div class="fatal-ico">' + icon(icons[k], "lg") + "</div>" +
      "<h2>" + esc(t("fatal." + k + ".title")) + "</h2>" +
      "<p>" + esc(message || t("fatal." + k + ".text")) + "</p>" +
      (k !== "banned" ? '<button class="btn btn-primary" id="fatal-retry">' + esc(t("common.retry")) + "</button>" : "") +
      "</div>";
    const btn = el.querySelector("#fatal-retry");
    if (btn) btn.onclick = () => location.reload();
    el.classList.add("show");
    hideSplash();
  }

  /* ------------------------------ SPLASH ------------------------------ */

  function hideSplash() {
    const el = $("#splash");
    if (!el || el.classList.contains("hide")) return;
    const wait = Math.max(0, 900 - performance.now());
    setTimeout(() => {
      el.classList.add("hide");
      setTimeout(() => el.remove(), 700);
    }, wait);
  }

  /* ------------------------------ CONFETTI ------------------------------ */

  let confettiRaf = 0;
  function confetti() {
    const canvas = $("#confetti");
    if (!canvas || reducedMotion()) return;
    cancelAnimationFrame(confettiRaf);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cs = getComputedStyle(document.documentElement);
    const colors = [
      cs.getPropertyValue("--accent-1").trim() || "#6a5cff",
      cs.getPropertyValue("--accent-2").trim() || "#00c2ff",
      "#12b76a", "#f79009", "#f04438", "#ffffff",
    ];
    const rand = (a, b) => a + Math.random() * (b - a);
    const parts = Array.from({ length: 150 }, () => ({
      x: W / 2 + rand(-30, 30),
      y: H * 0.42,
      vx: rand(-8, 8),
      vy: rand(-15, -5),
      w: rand(6, 11),
      h: rand(4, 8),
      rot: rand(0, 6.28),
      vr: rand(-0.3, 0.3),
      c: colors[(Math.random() * colors.length) | 0],
      round: Math.random() < 0.3,
    }));
    const start = performance.now();

    function frame(now) {
      const el = now - start;
      ctx.clearRect(0, 0, W, H);
      const alpha = el > 1800 ? Math.max(0, 1 - (el - 1800) / 900) : 1;
      for (const p of parts) {
        p.vy += 0.38;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, 6.283);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (el < 2700) confettiRaf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    }
    confettiRaf = requestAnimationFrame(frame);
  }

  /* ------------------------------ FORMATTING ------------------------------ */

  function locale() {
    return I18n.lang() === "bn" ? "bn-BD-u-nu-latn" : "en-IN";
  }

  function money(n) {
    n = Number(n);
    if (!Number.isFinite(n)) n = 0;
    const a = Math.abs(n);
    const fixed = Number.isInteger(a) ? 0 : 2;
    return (n < 0 ? "-" : "") + "₹" + a.toLocaleString("en-IN", { minimumFractionDigits: fixed, maximumFractionDigits: 2 });
  }

  function signedMoney(n) {
    n = Number(n) || 0;
    return (n > 0 ? "+" : n < 0 ? "-" : "") + money(Math.abs(n));
  }

  const HIDDEN_MONEY = "₹ ••••";

  function num(n) {
    return (Number(n) || 0).toLocaleString("en-IN");
  }

  function date(iso) {
    const d = new Date(iso);
    if (!iso || Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });
  }

  function dateTime(iso) {
    const d = new Date(iso);
    if (!iso || Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function timeAgo(iso) {
    const ms = Date.now() - new Date(iso).getTime();
    if (!iso || Number.isNaN(ms)) return "";
    const s = Math.floor(ms / 1000);
    if (s < 60) return t("time.now");
    const m = Math.floor(s / 60);
    if (m < 60) return t("time.m", { n: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t("time.h", { n: h });
    const d = Math.floor(h / 24);
    if (d < 7) return t("time.d", { n: d });
    return date(iso);
  }

  function timeLeft(iso) {
    const ms = new Date(iso).getTime() - Date.now();
    if (!iso || Number.isNaN(ms)) return "";
    if (ms <= 0) return t("time.expired");
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d >= 1) return t("time.left.d", { d, h: h % 24 });
    if (h >= 1) return t("time.left.h", { h, m: m % 60 });
    return t("time.left.m", { m: Math.max(1, m) });
  }

  // Animated number (for the balance)
  function countTo(el, to, opts) {
    opts = opts || {};
    const fmt = opts.format || money;
    const from = Number(el.dataset.v || 0);
    to = Number(to) || 0;
    el.dataset.v = String(to);
    if (from === to || reducedMotion()) {
      el.textContent = fmt(to);
      return;
    }
    const dur = opts.duration || 700;
    const t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? fmt(from + (to - from) * eased) : fmt(to);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ------------------------------ SMALL HTML HELPERS ------------------------------ */

  function skeleton(kind, n) {
    n = n || 1;
    if (kind === "list") {
      let rows = "";
      for (let i = 0; i < n; i++) {
        rows +=
          '<div class="row"><div class="skeleton" style="width:42px;height:42px;border-radius:50%"></div>' +
          '<div class="row-main"><div class="skeleton sk-line" style="width:60%"></div>' +
          '<div class="skeleton sk-line" style="width:35%;height:11px;margin:0"></div></div>' +
          '<div class="skeleton" style="width:54px;height:16px"></div></div>';
      }
      return '<div class="card">' + rows + "</div>";
    }
    if (kind === "home") {
      return (
        '<div class="skeleton" style="height:170px;border-radius:26px;margin-bottom:14px"></div>' +
        '<div class="skeleton sk-card"></div><div class="skeleton sk-card"></div>'
      );
    }
    let out = "";
    for (let i = 0; i < n; i++) out += '<div class="skeleton sk-card"></div>';
    return out;
  }

  function emptyState(iconName, text) {
    return '<div class="empty">' + icon(iconName || "grid") + "<div>" + esc(text || t("common.noData")) + "</div></div>";
  }

  function avatar(u, cls) {
    u = u || {};
    const name = u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "?";
    const first = Array.from(String(name).trim())[0];
    const initial = esc(first ? first.toUpperCase() : "?");
    if (u.photoUrl && /^https:\/\//i.test(u.photoUrl)) {
      const safe = encodeURI(u.photoUrl).replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");
      return (
        '<div class="avatar ' + (cls || "") + '" style="background-image:url(\'' + esc(safe) + "');background-size:cover;background-position:center\"></div>"
      );
    }
    return '<div class="avatar ' + (cls || "") + '">' + initial + "</div>";
  }

  // Event delegation: on(root, "click", ".button-class", (event, element) => {...})
  function on(root, evt, sel, fn) {
    root.addEventListener(evt, (e) => {
      const el = e.target.closest(sel);
      if (el && root.contains(el)) fn(e, el);
    });
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms || 300);
    };
  }

  const loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => {
        delete loaded[src];
        reject(new Error("Failed to load " + src));
      };
      document.body.appendChild(s);
    });
    return loaded[src];
  }
  function loadCss(href) {
    if (loaded[href]) return loaded[href];
    loaded[href] = new Promise((resolve, reject) => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      l.onload = resolve;
      l.onerror = () => {
        delete loaded[href];
        reject(new Error("Failed to load " + href));
      };
      document.head.appendChild(l);
    });
    return loaded[href];
  }

  /* ------------------------------ THEME & CUSTOMIZE ------------------------------ */

  const ACCENTS = ["#6a5cff", "#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

  let themePref = "auto";

  function resolveTheme(pref) {
    if (pref === "dark" || pref === "light") return pref;
    const scheme = tg && tg.colorScheme;
    if (scheme === "dark" || scheme === "light") return scheme;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(pref) {
    themePref = pref === "dark" || pref === "light" ? pref : "auto";
    document.documentElement.setAttribute("data-theme", resolveTheme(themePref));
    try { localStorage.setItem("tgx_theme", themePref); } catch (e) {}
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
      if (tg && bg) {
        if (tg.setHeaderColor) tg.setHeaderColor(bg);
        if (tg.setBackgroundColor) tg.setBackgroundColor(bg);
        if (tg.setBottomBarColor) tg.setBottomBarColor(bg);
      }
    } catch (e) {}
  }

  try {
    if (tg && tg.onEvent) {
      tg.onEvent("themeChanged", () => {
        if (themePref === "auto") applyTheme("auto");
      });
    }
  } catch (e) {}

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
    return "#" + to(r) + to(g) + to(b);
  }

  function applyAccent(hex) {
    const root = document.documentElement;
    let style = document.getElementById("accent-dyn");
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
      root.style.removeProperty("--accent-1");
      root.style.removeProperty("--accent-2");
      if (style) style.remove();
      return;
    }
    const [r, g, b] = hexToRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);
    const second = hslToHex(h - 48, Math.max(s, 0.6), Math.min(0.6, Math.max(0.45, l)));
    root.style.setProperty("--accent-1", hex);
    root.style.setProperty("--accent-2", second);
    if (!style) {
      style = document.createElement("style");
      style.id = "accent-dyn";
      document.head.appendChild(style);
    }
    const c = r + "," + g + "," + b;
    style.textContent =
      ".btn-primary{box-shadow:0 8px 20px rgba(" + c + ",.32)}" +
      ".balance-card{box-shadow:0 14px 36px rgba(" + c + ",.38)}" +
      ".logo-round{box-shadow:0 12px 34px rgba(" + c + ",.45)}" +
      ".nav-item.active .nav-ico{box-shadow:0 6px 16px rgba(" + c + ",.4)}" +
      ".input:focus{box-shadow:0 0 0 4px rgba(" + c + ",.15)}";
  }

  // Card and button styles are set on <body> so they override the defaults on <html>.
  function applyCustomize(c) {
    c = c || {};
    applyAccent(c.accent);
    document.body.setAttribute("data-btn", c.btnStyle || "round");
    document.body.setAttribute("data-card", c.cardStyle || "glass");
    try {
      localStorage.setItem(
        "tgx_prefs",
        JSON.stringify({ accent: c.accent || "", btn: c.btnStyle || "round", card: c.cardStyle || "glass" })
      );
    } catch (e) {}
  }

  // Applies everything saved in the user's profile (language, theme, accent, styles)
  function applyPrefs(u) {
    if (!u) return;
    I18n.setLang(u.language);
    applyTheme(u.theme);
    applyCustomize(u.customize);
  }

  /* ------------------------------ BOOT ------------------------------ */

  injectStyles();
  try {
    const cached = JSON.parse(localStorage.getItem("tgx_prefs") || "{}");
    applyTheme(localStorage.getItem("tgx_theme") || "auto");
    applyCustomize({ accent: cached.accent, btnStyle: cached.btn, cardStyle: cached.card });
  } catch (e) {
    applyTheme("auto");
    applyCustomize({});
  }
  I18n.apply(document);

  window.UI = {
    tg, $, $$, sleep, esc, icon, ICONS, ACCENTS,
    initTelegram, pushBack, haptic, openLink, shareLink, copy,
    toast, handleError, withBusy,
    sheet, confirm: confirmDialog, prompt: promptDialog,
    fatal, hideSplash, confetti,
    money, signedMoney, HIDDEN_MONEY, num, date, dateTime, timeAgo, timeLeft, countTo,
    skeleton, emptyState, avatar, on, debounce, loadScript, loadCss,
    applyTheme, applyAccent, applyCustomize, applyPrefs,
  };
})();
