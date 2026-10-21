window.Views = window.Views || {};

Views.task = async function (box) {
  const esc = UI.esc;
  const money = UI.money;
  const home = await App.loadHome();
  let tab = 'tasks';
  let cat = 'All';

  const TILES = ['t-blue', 't-violet', 't-teal', 't-amber', 't-pink', 't-green'];

  function catIcon(c) {
    const k = String(c || '').toLowerCase();
    if (k.indexOf('social') > -1) return 'share';
    if (k.indexOf('app') > -1) return 'smartphone';
    if (k.indexOf('web') > -1) return 'globe';
    return 'zap';
  }

  function catTile(c) {
    let h = 0;
    const s = String(c || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return TILES[h % TILES.length];
  }

  function frame() {
    box.innerHTML =
      UI.tabs([{ k: 'tasks', label: t('task.tasks') }, { k: 'history', label: t('task.history') }], tab)
      + '<div id="tk-body"></div>';
    UI.bindTabs(box, (k) => {
      tab = k;
      if (k === 'tasks') showList(); else showHistory();
    });
  }

  function card(it) {
    return '<div class="card tcard" data-id="' + esc(it.id) + '">'
      + '<div class="row gap"><div class="tile ' + catTile(it.category) + '">' + Icon(catIcon(it.category), 22) + '</div>'
      + '<div class="grow"><div class="bold">' + esc(it.title) + '</div>'
      + '<div class="small muted">' + esc(it.category) + '</div></div>'
      + '<div class="reward-pill">+' + money(it.reward) + '</div></div>'
      + (it.description ? '<div class="small muted mt" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(it.description) + '</div>' : '')
      + '<div class="row between mt">'
      + (it.slotsLeft !== null ? '<span class="small muted row" style="gap:5px">' + Icon('users', 14) + esc(t('task.slots', { n: it.slotsLeft })) + '</span>' : '<span></span>')
      + (it.myStatus ? UI.badge(it.myStatus) : '<span class="small bold" style="color:var(--brand)">' + esc(t('common.ok') === 'OK' ? 'Start' : 'শুরু করুন') + ' →</span>')
      + '</div></div>';
  }

  async function showList() {
    const body = box.querySelector('#tk-body');
    const cats = ['All'].concat(home.app.taskCategories || []);
    body.innerHTML =
      '<div class="chips">' + cats.map((c) =>
        '<button class="chip' + (c === cat ? ' on' : '') + '" data-c="' + esc(c) + '">' + esc(c === 'All' ? t('task.all') : c) + '</button>'
      ).join('') + '</div><div id="tk-list">' + UI.skeleton('cards', 3) + '</div>';
    body.querySelectorAll('[data-c]').forEach((b) => {
      b.onclick = () => { UI.haptic('light'); cat = b.dataset.c; showList(); };
    });

    const list = body.querySelector('#tk-list');
    try {
      const items = await api('/api/user/task?category=' + encodeURIComponent(cat));
      if (!items.length) { list.innerHTML = UI.emptyState('clipboard', t2('es.tasks'), t('task.none')); return; }
      list.innerHTML = '<div class="small muted mb">' + esc(t2('task.available', { n: items.length })) + '</div>' + items.map(card).join('');
      list.querySelectorAll('[data-id]').forEach((el) => {
        el.onclick = () => { UI.haptic('light'); showDetail(el.dataset.id); };
      });
    } catch (e) {
      list.innerHTML = UI.empty(e.message);
    }
  }

  async function showHistory() {
    const body = box.querySelector('#tk-body');
    body.innerHTML = UI.skeleton('rows', 4);
    try {
      const items = await api('/api/user/task/history');
      if (!items.length) { body.innerHTML = UI.emptyState('checkSquare', t2('es.history'), t('task.historyNone')); return; }
      body.innerHTML = '<div class="list">' + items.map((s) =>
        '<div class="item"><div class="tile sm ' + catTile(s.category) + '">' + Icon(catIcon(s.category), 18) + '</div>'
        + '<div class="mid"><div class="t">' + esc(s.taskTitle) + '</div>'
        + '<div class="s">' + esc(s.category) + ' · ' + esc(UI.timeAgo(s.createdAt))
        + (s.rejectReason ? '<br>' + esc(t('task.reason')) + ': ' + esc(s.rejectReason) : '') + '</div></div>'
        + '<div class="r"><div class="t pos">+' + money(s.reward) + '</div>' + UI.badge(s.status) + '</div></div>'
      ).join('') + '</div>';
    } catch (e) {
      body.innerHTML = UI.empty(e.message);
    }
  }

  async function showDetail(id) {
    box.innerHTML = UI.skeleton('cards', 3);
    let d;
    try {
      d = await api('/api/user/task/' + encodeURIComponent(id));
    } catch (e) {
      UI.toast(e.message, 'bad');
      frame();
      showList();
      return;
    }

    const canSubmit = d.isOpen && (!d.myStatus || d.myStatus === 'rejected');
    let status = '';
    if (d.myStatus === 'approved') {
      status = '<div class="note ok row gap">' + Icon('checkCircle', 18) + '<span>' + esc(t('task.done')) + '</span></div>';
    } else if (d.myStatus === 'pending') {
      status = '<div class="note row gap">' + Icon('clock', 18) + '<span>' + esc(t('task.waiting')) + '</span></div>';
    } else if (d.myStatus === 'rejected') {
      status = '<div class="note bad row gap">' + Icon('xCircle', 18) + '<span>' + esc(t('task.rejected'))
        + (d.rejectReason ? ' — ' + esc(t('task.reason')) + ': ' + esc(d.rejectReason) : '') + '</span></div>';
    } else if (!d.isOpen) {
      status = '<div class="note">' + esc(t('task.closed')) + '</div>';
    }

    const instructions = d.instructions || [];
    const form = canSubmit
      ? '<div class="card"><div class="bold mb">' + esc(d.myStatus === 'rejected' ? t('task.resubmit') : t('task.upload')) + '</div>'
        + '<p class="hint">' + esc(t('task.proofTip')) + '</p>'
        + '<input type="file" id="tk-file" accept="image/*" hidden>'
        + '<button class="btn secondary block" id="tk-pick">' + Icon('camera', 18) + esc(t('task.choose')) + '</button>'
        + '<img id="tk-prev" class="proof hidden" alt="">'
        + '<input class="input mt" id="tk-note" maxlength="200" placeholder="' + esc(t('task.note')) + '">'
        + '<button class="btn block mt" id="tk-send">' + esc(t('task.submit')) + '</button></div>'
      : '';

    box.innerHTML =
      '<button class="back" id="tk-back">' + Icon('chevronRight', 16).replace('<svg', '<svg style="transform:rotate(180deg)"') + esc(t('common.back')) + '</button>'
      + '<div class="card"><div class="row gap"><div class="tile lg ' + catTile(d.category) + '">' + Icon(catIcon(d.category), 28) + '</div>'
      + '<div class="grow"><span class="badge">' + esc(d.category) + '</span>'
      + '<div class="h2" style="margin-top:4px">' + esc(d.title) + '</div></div></div>'
      + '<div class="row between mt"><div class="small muted">' + esc(t('task.upload')) + '</div><div class="reward-pill">+' + money(d.reward) + '</div></div>'
      + (d.description ? '<div class="pre muted mt">' + esc(d.description) + '</div>' : '')
      + (instructions.length
        ? '<div class="bold mt">' + esc(t('task.instructions')) + '</div>'
          + instructions.map((s, i) => '<div class="how-step"><i>' + (i + 1) + '</i><span>' + esc(s) + '</span></div>').join('')
        : '')
      + (d.expiresAt
        ? '<div class="small muted mt row" style="gap:6px">' + Icon('clock', 14) + '<span>' + esc(t('task.expires')) + ': ' + esc(UI.dateStr(d.expiresAt)) + '</span></div>'
        : '')
      + (d.slotsLeft !== null ? '<div class="small muted row" style="gap:6px;margin-top:4px">' + Icon('users', 14) + '<span>' + esc(t('task.slots', { n: d.slotsLeft })) + '</span></div>' : '')
      + (/^https?:\/\//i.test(d.link || '')
        ? '<button class="btn secondary block mt" id="tk-link">' + Icon('link', 18) + esc(t('task.openLink')) + '</button>'
        : '')
      + '</div>' + status + form;

    box.querySelector('#tk-back').onclick = () => { tab = 'tasks'; frame(); showList(); };
    const lk = box.querySelector('#tk-link');
    if (lk) lk.onclick = () => UI.openLink(d.link);

    if (canSubmit) {
      let image = '';
      const file = box.querySelector('#tk-file');
      box.querySelector('#tk-pick').onclick = () => file.click();
      file.onchange = async () => {
        if (!file.files[0]) return;
        try {
          image = await UI.compressImage(file.files[0]);
          const prev = box.querySelector('#tk-prev');
          prev.src = image;
          prev.classList.remove('hidden');
        } catch (e) {
          UI.toast(e.message, 'bad');
        }
      };
      box.querySelector('#tk-send').onclick = async () => {
        if (!image) return UI.toast(t('task.pickFirst'), 'bad');
        const btn = box.querySelector('#tk-send');
        UI.busy(btn, true);
        try {
          await api('/api/user/task/' + encodeURIComponent(id) + '/submit', {
            method: 'POST',
            body: { image: image, note: box.querySelector('#tk-note').value }
          });
          UI.confetti();
          UI.toast(t('task.submitted'), 'ok');
          showDetail(id);
        } catch (e) {
          UI.busy(btn, false);
          UI.toast(e.message, 'bad');
        }
      };
    }
  }

  frame();
  await showList();
};
