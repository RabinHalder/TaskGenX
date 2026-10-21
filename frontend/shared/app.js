(function () {
  var tg = window.Telegram && window.Telegram.WebApp;
  var State = { home: null, homeAt: 0, panel: 'user', tab: 'home' };
  window.State = State;
  window.Views = window.Views || {};

  var splashStart = Date.now();

  var USER_TABS = [
    { k: 'home', icon: 'home', label: 'nav.home' },
    { k: 'club', icon: 'award', label: 'nav.club' },
    { k: 'task', icon: 'checkSquare', label: 'nav.task' },
    { k: 'referral', icon: 'users', label: 'nav.referral' },
    { k: 'profile', icon: 'user', label: 'nav.profile' }
  ];
  var ADMIN_TABS = [
    { k: 'dashboard', icon: 'barChart', label: 'Dashboard' },
    { k: 'users', icon: 'users', label: 'Users' },
    { k: 'tasks', icon: 'clipboard', label: 'Tasks' },
    { k: 'broadcast', icon: 'send', label: 'Broadcast' },
    { k: 'settings', icon: 'sliders', label: 'Settings' }
  ];

  function hideSplash() {
    var el = document.getElementById('splash');
    if (!el) return;
    var wait = Math.max(0, 700 - (Date.now() - splashStart));
    setTimeout(function () {
      el.classList.add('hide');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 600);
    }, wait);
  }

  function applyTheme(theme) {
    var v = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', v);
    try { localStorage.setItem('tgx_theme', v); } catch (e) {}
    try {
      if (tg) {
        tg.setHeaderColor(v === 'dark' ? '#0b0f1d' : '#f4f6fc');
        tg.setBackgroundColor(v === 'dark' ? '#0b0f1d' : '#f4f6fc');
      }
    } catch (e) {}
  }

  function applyLang(l) {
    I18N.set(l);
    try { localStorage.setItem('tgx_lang', l); } catch (e) {}
  }

  async function loadHome() {
    if (State.home && Date.now() - State.homeAt < 4000) return State.home;
    State.home = await api('/api/user/home');
    State.homeAt = Date.now();
    return State.home;
  }

  async function reloadHome() {
    State.homeAt = 0;
    return loadHome();
  }

  function fatal(err) {
    document.getElementById('topbar').innerHTML = '';
    document.getElementById('nav').innerHTML = '';
    var code = err && err.code;
    var msg = code === 'UNAUTHORIZED' ? t('err.telegram') : (err && err.message) || t('err.generic');
    var icon = code === 'MAINTENANCE' ? 'tool' : code === 'BANNED' ? 'slash' : 'alert';
    var canRetry = code !== 'BANNED' && code !== 'MAINTENANCE' && code !== 'UNAUTHORIZED';
    document.getElementById('view').innerHTML =
      '<div class="full-msg"><div class="big">' + Icon(icon, 56) + '</div><p>' + UI.esc(msg) + '</p>'
      + (canRetry ? '<button class="btn" id="fm-retry">' + UI.esc(t('common.retry')) + '</button>' : '') + '</div>';
    var rb = document.getElementById('fm-retry');
    if (rb) rb.onclick = boot;
    hideSplash();
  }

  function togglePanel() {
    State.panel = State.panel === 'admin' ? 'user' : 'admin';
    State.tab = State.panel === 'admin' ? 'dashboard' : 'home';
    render();
  }

  function renderTop() {
    var u = State.home.user;
    var top = document.getElementById('topbar');
    var admin = State.panel === 'admin';
    top.innerHTML =
      '<div class="avatar-btn" id="tb-avatar">' + UI.avatar(u) + '</div>'
      + '<div class="tb-text"><div class="tb-name">' + UI.esc(u.name) + '</div>'
      + '<div class="tb-sub">' + (admin ? 'Admin panel' : UI.esc(State.home.app.name)) + '</div></div>'
      + (u.isAdmin
        ? '<button class="tb-switch" id="tb-switch">' + Icon('repeat', 14) + '<span>' + (admin ? 'User' : 'Admin') + '</span></button>'
        : '');
    if (u.isAdmin) {
      document.getElementById('tb-avatar').onclick = togglePanel;
      document.getElementById('tb-switch').onclick = togglePanel;
    }
  }

  function renderNav() {
    var admin = State.panel === 'admin';
    var tabs = admin ? ADMIN_TABS : USER_TABS;
    var nav = document.getElementById('nav');
    nav.innerHTML = tabs.map(function (x) {
      var label = admin ? x.label : t(x.label);
      return '<button data-k="' + x.k + '" class="' + (x.k === State.tab ? 'on' : '') + '">'
        + '<span class="ic">' + Icon(x.icon, 22) + '</span><span class="lb">' + UI.esc(label) + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(nav.querySelectorAll('button'), function (b) {
      b.onclick = function () {
        if (State.tab === b.dataset.k) return;
        State.tab = b.dataset.k;
        render();
      };
    });
  }

  async function renderView() {
    var root = document.getElementById('view');
    var box = document.createElement('div');
    box.innerHTML = UI.loader();
    root.innerHTML = '';
    root.appendChild(box);
    root.scrollTop = 0;

    var key = State.panel === 'admin' ? 'admin.' + State.tab : State.tab;
    try {
      await window.Views[key](box);
    } catch (err) {
      if (['UNAUTHORIZED', 'BANNED', 'MAINTENANCE'].indexOf(err.code) !== -1) return fatal(err);
      box.innerHTML = '<div class="empty">' + UI.esc(err.message || t('err.generic'))
        + '<br><br><button class="btn sm" id="ev-retry">' + UI.esc(t('common.retry')) + '</button></div>';
      var rb = box.querySelector('#ev-retry');
      if (rb) rb.onclick = renderView;
    }
  }

  function render() {
    renderTop();
    renderNav();
    renderView();
  }

  function initLocal() {
    var th = null, lg = null;
    try { th = localStorage.getItem('tgx_theme'); lg = localStorage.getItem('tgx_lang'); } catch (e) {}
    applyTheme(th || (tg && tg.colorScheme) || 'light');
    I18N.set(lg || 'en');
  }

  async function boot() {
    initLocal();
    if (tg) { try { tg.ready(); tg.expand(); } catch (e) {} }
    document.getElementById('view').innerHTML = UI.loader();
    try {
      State.home = await api('/api/user/home');
      State.homeAt = Date.now();
    } catch (err) {
      return fatal(err);
    }
    applyLang(State.home.user.language);
    applyTheme(State.home.user.theme);
    State.panel = 'user';
    State.tab = 'home';
    render();
    hideSplash();
  }

  window.App = {
    render: render,
    loadHome: loadHome,
    reloadHome: reloadHome,
    applyTheme: applyTheme,
    applyLang: applyLang
  };

  boot();
})();
