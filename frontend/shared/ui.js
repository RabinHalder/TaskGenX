(function () {
  var tg = window.Telegram && window.Telegram.WebApp;
  var closeHook = null;
  var toastTimer = null;

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

  function loader() { return '<div class="center"><div class="spinner"></div></div>'; }
  function empty(msg) { return '<div class="empty">' + esc(msg) + '</div>'; }

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
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = ''; }, 3500);
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
      try { document.execCommand('copy'); } catch (e) {}
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
    esc: esc, money: money, timeAgo: timeAgo, dateStr: dateStr, loader: loader, empty: empty,
    badge: badge, avatar: avatar, tabs: tabs, bindTabs: bindTabs, toast: toast, modal: modal,
    closeModal: closeModal, promptBox: promptBox, confirmBox: confirmBox, openLink: openLink,
    copyText: copyText, compressImage: compressImage
  };
})();
