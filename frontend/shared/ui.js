(function () {
  var tg = window.Telegram && window.Telegram.WebApp;
  var closeHook = null;
  var toastTimer = null;

  var PALETTE = [
    ['#4a62f3', '#8b5cf6'],
    ['#10b981', '#14b8a6'],
    ['#f59e0b', '#ef4444'],
    ['#ec4899', '#8b5cf6'],
    ['#06b6d4', '#3b82f6'],
    ['#f97316', '#f59e0b']
  ];

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(n) {
    var v = Number(n) || 0;
    return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function timeAgo(d) {
    var s = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
    if (s < 60) return t('time.now');
    if (s < 3600) return t('time.min', { n: Math.floor(s / 60) });
    if (s < 86400) return t('time.hour', { n: Math.floor(s / 3600) });
    return t('time.day', { n: Math.floor(s / 86400) });
  }

  function dateStr(d) {
    return new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function haptic(kind) {
    try {
      var h = tg && tg.HapticFeedback;
      if (!h) return;
      if (kind === 'success' || kind === 'error' || kind === 'warning') h.notificationOccurred(kind);
      else h.impactOccurred(kind || 'light');
    } catch (e) { /* ignore */ }
  }

  function loader() { return '<div class="center"><div class="spinner"></div></div>'; }

  function skRows(n) {
    var h = '';
    for (var i = 0; i < n; i++) {
      h += '<div class="sk-item"><div class="sk sk-avatar"></div><div class="sk-col"><div class="sk sk-line w60"></div><div class="sk sk-line w40"></div></div><div class="sk sk-pill"></div></div>';
    }
    return '<div class="list">' + h + '</div>';
  }

  function skeleton(kind, n) {
    if (kind === 'home') {
      return '<div class="sk sk-hero"></div><div class="sk-grid4"><div class="sk sk-sq"></div><div class="sk sk-sq"></div><div class="sk sk-sq"></div><div class="sk sk-sq"></div></div><div class="sk sk-card"></div>';
    }
    if (kind === 'cards') {
      var c = '';
      for (var i = 0; i < (n || 3); i++) c += '<div class="sk sk-card"></div>';
      return c;
    }
    return skRows(n || 5);
  }

  function empty(msg) { return '<div class="empty">' + esc(msg) + '</div>'; }

  function emptyState(icon, title, text) {
    return '<div class="empty-state"><div class="es-ico">' + Icon(icon, 28) + '</div>'
      + '<div class="es-t">' + esc(title) + '</div>'
      + (text ? '<div class="es-s">' + esc(text) + '</div>' : '') + '</div>';
  }

  function badge(status) {
    var kinds = {
      success: 'ok', approved: 'ok', active: 'ok',
      pending: 'warn', processing: 'warn', paused: 'warn',
      failed: 'bad', rejected: 'bad', refunded: 'bad', cancelled: 'bad', ended: 'bad'
    };
    return '<span class="badge ' + (kinds[status] || '') + '">' + esc(t('status.' + status)) + '</span>';
  }

  function avatar(u, size) {
    var name = (u && u.name) || 'U';
    var letter = esc(String(name).trim().charAt(0).toUpperCase() || 'U');
    var img = u && u.photoUrl ? '<img src="' + esc(u.photoUrl) + '" alt="" onerror="this.remove()">' : '';
    return '<div class="avatar' + (size ? ' ' + size : '') + '"><span>' + letter + '</span>' + img + '</div>';
  }

  function avatarMini(name, size) {
    var s = String(name || '?');
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    var p = PALETTE[h % PALETTE.length];
    var dim = size ? 'width:' + size + 'px;height:' + size + 'px;' : '';
    return '<div class="av-mini" style="' + dim + 'background:linear-gradient(135deg,' + p[0] + ',' + p[1] + ')">'
      + esc(s.trim().charAt(0).toUpperCase() || '?') + '</div>';
  }

  function ring(pct, size, stroke, inner) {
    var r = (size - stroke) / 2;
    var c = size / 2;
    var circ = 2 * Math.PI * r;
    var off = circ * (1 - Math.min(Math.max(pct, 0), 1));
    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px">'
      + '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">'
      + '<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a62f3"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>'
      + '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="var(--input)" stroke-width="' + stroke + '"/>'
      + '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="url(#rg)" stroke-width="' + stroke + '" stroke-linecap="round"'
      + ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + off + '" transform="rotate(-90 ' + c + ' ' + c + ')"/></svg>'
      + '<div class="ring-in">' + (inner || '') + '</div></div>';
  }

  function tabs(items, active) {
    return '<div class="tabs">' + items.map(function (x) {
      return '<button data-k="' + esc(x.k) + '" class="' + (x.k === active ? 'on' : '') + '">' + esc(x.label) + '</button>';
    }).join('') + '</div>';
  }

  function bindTabs(root, fn) {
    var groups = root.classList && root.classList.contains('tabs') ? [root] : Array.prototype.slice.call(root.querySelectorAll('.tabs'));
    groups.forEach(function (g) {
      var btns = g.querySelectorAll('button');
      Array.prototype.forEach.call(btns, function (b) {
        b.onclick = function () {
          haptic('light');
          Array.prototype.forEach.call(btns, function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          fn(b.dataset.k);
        };
      });
    });
  }

  function toast(msg, kind) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'show ' + (kind || '');
    if (kind === 'ok') haptic('success');
    else if (kind === 'bad') haptic('error');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = ''; }, 3800);
  }

  function busy(btn, on) {
    if (!btn) return;
    btn.classList.toggle('loading', !!on);
    btn.disabled = !!on;
  }

  function countUp(el, to, ms) {
    if (!el) return;
    var start = null;
    var dur = ms || 900;
    var target = Number(to) || 0;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = money(target * e);
      if (p < 1 && document.body.contains(el)) requestAnimationFrame(step);
      else el.textContent = money(target);
    }
    requestAnimationFrame(step);
  }

  function confetti() {
    var c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:300';
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    document.body.appendChild(c);
    var ctx = c.getContext('2d');
    var colors = ['#5266f4', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e'];
    var parts = [];
    for (var i = 0; i < 90; i++) {
      parts.push({
        x: c.width / 2 + (Math.random() - 0.5) * 80,
        y: c.height * 0.35,
        vx: (Math.random() - 0.5) * 9,
        vy: -Math.random() * 10 - 4,
        g: 0.28 + Math.random() * 0.12,
        s: 5 + Math.random() * 5,
        r: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.4,
        c: colors[i % colors.length]
      });
    }
    var frames = 0;
    function tick() {
      frames++;
      ctx.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - frames / 110);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      if (frames < 120) requestAnimationFrame(tick);
      else if (c.parentNode) c.parentNode.removeChild(c);
    }
    tick();
  }

  function modal(html, opts) {
    var ov = document.getElementById('overlay');
    ov.innerHTML = '<div class="sheet"><div class="sheet-handle"></div>' + html + '</div>';
    ov.className = 'open';
    closeHook = (opts && opts.onClose) || null;
    ov.onclick = function (e) { if (e.target === ov) closeModal(); };
    return ov.querySelector('.sheet');
  }

  function closeModal() {
    var ov = document.getElementById('overlay');
    var hook = closeHook;
    closeHook = null;
    ov.className = '';
    ov.innerHTML = '';
    ov.onclick = null;
    if (hook) hook();
  }

  function promptBox(title, placeholder, okText) {
    return new Promise(function (resolve) {
      var done = false;
      function finish(v) { if (done) return; done = true; resolve(v); }
      var sheet = modal(
        '<h3>' + esc(title) + '</h3>'
        + '<input class="input" id="pb-in" placeholder="' + esc(placeholder || '') + '">'
        + '<div class="row gap mt"><button class="btn secondary block" id="pb-no">' + esc(t('common.cancel')) + '</button>'
        + '<button class="btn block" id="pb-ok">' + esc(okText || t('common.ok')) + '</button></div>',
        { onClose: function () { finish(null); } }
      );
      sheet.querySelector('#pb-no').onclick = closeModal;
      sheet.querySelector('#pb-ok').onclick = function () {
        finish(sheet.querySelector('#pb-in').value.trim());
        closeModal();
      };
    });
  }

  function confirmBox(title, message, okText) {
    return new Promise(function (resolve) {
      var done = false;
      function finish(v) { if (done) return; done = true; resolve(v); }
      var sheet = modal(
        '<h3>' + esc(title) + '</h3>'
        + (message ? '<p class="muted">' + esc(message) + '</p>' : '')
        + '<div class="row gap mt"><button class="btn secondary block" id="cb-no">' + esc(t('common.cancel')) + '</button>'
        + '<button class="btn block" id="cb-ok">' + esc(okText || t('common.ok')) + '</button></div>',
        { onClose: function () { finish(false); } }
      );
      sheet.querySelector('#cb-no').onclick = closeModal;
      sheet.querySelector('#cb-ok').onclick = function () { finish(true); closeModal(); };
    });
  }

  function openLink(url) {
    if (!/^https?:\/\//i.test(String(url || ''))) return;
    if (tg && /^https:\/\/t\.me\//i.test(url) && tg.openTelegramLink) tg.openTelegramLink(url);
    else if (tg && tg.openLink) tg.openLink(url);
    else window.open(url, '_blank');
  }

  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(fallback);
    else fallback();
    toast(t('common.copied'), 'ok');
  }

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error(t('err.image'))); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error(t('err.image'))); };
        img.onload = function () {
          var max = 1400, w = img.width, h = img.height;
          if (w > max || h > max) {
            var r = Math.min(max / w, max / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }
          var c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  window.UI = {
    esc: esc, money: money, timeAgo: timeAgo, dateStr: dateStr, haptic: haptic,
    loader: loader, skeleton: skeleton, empty: empty, emptyState: emptyState,
    badge: badge, avatar: avatar, avatarMini: avatarMini, ring: ring,
    tabs: tabs, bindTabs: bindTabs, toast: toast, busy: busy, countUp: countUp, confetti: confetti,
    modal: modal, closeModal: closeModal, promptBox: promptBox, confirmBox: confirmBox,
    openLink: openLink, copyText: copyText, compressImage: compressImage
  };
})();
