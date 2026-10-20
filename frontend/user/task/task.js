window.Views = window.Views || {};

Views.task = async function (box) {
  const esc = UI.esc;
  const money = UI.money;
  const home = await App.loadHome();
  let tab = 'tasks';
  let cat = 'All';

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
      + '<div class="row between"><div class="bold">' + esc(it.title) + '</div><div class="reward">+' + money(it.reward) + '</div></div>'
      + '<div class="row between mt"><span class="badge">' + esc(it.category) + '</span>'
      + (it.myStatus
        ? UI.badge(it.myStatus)
        : (it.slotsLeft !== null ? '<span class="small muted">' + esc(t('task.slots', { n: it.slotsLeft })) + '</span>' : ''))
      + '</div></div>';
  }

  async function showList() {
    const body = box.querySelector('#tk-body');
    const cats = ['All'].concat(home.app.taskCategories || []);
    body.innerHTML =
      '<div class="chips">' + cats.map((c) =>
        '<button class="chip' + (c === cat ? ' on' : '') + '" data-c="' + esc(c) + '">' + esc(c === 'All' ? t('task.all') : c) + '</button>'
      ).join('') + '</div><div id="tk-list">' + UI.loader() + '</div>';
    body.querySelectorAll('[data-c]').forEach((b) => {
      b.onclick = () => { cat = b.dataset.c; showList(); };
    });

    const list = body.querySelector('#tk-list');
    try {
      const items = await api('/api/user/task?category=' + encodeURIComponent(cat));
      if (!items.length) { list.innerHTML = UI.empty(t('task.none')); return; }
      list.innerHTML = items.map(card).join('');
      list.querySelectorAll('[data-id]').forEach((el) => {
        el.onclick = () => showDetail(el.dataset.id);
      });
    } catch (e) {
      list.innerHTML = UI.empty(e.message);
    }
  }

  async function showHistory() {
    const body = box.querySelector('#tk-body');
    body.innerHTML = UI.loader();
    try {
      const items = await api('/api/user/task/history');
      if (!items.length) { body.innerHTML = UI.empty(t('task.historyNone')); return; }
      body.innerHTML = '<div class="list">' + items.map((s) =>
        '<div class="item"><div class="mid"><div class="t">' + esc(s.taskTitle) + '</div>'
        + '<div class="s">' + esc(s.category) + ' · ' + esc(UI.timeAgo(s.createdAt))
        + (s.rejectReason ? '<br>' + esc(t('task.reason')) + ': ' + esc(s.rejectReason) : '') + '</div></div>'
        + '<div class="r"><div class="t pos">+' + money(s.reward) + '</div>' + UI.badge(s.status) + '</div></div>'
      ).join('') + '</div>';
    } catch (e) {
      body.innerHTML = UI.empty(e.message);
    }
  }

  async function showDetail(id) {
    box.innerHTML = UI.loader();
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
      status = '<div class="note ok">✅ ' + esc(t('task.done')) + '</div>';
    } else if (d.myStatus === 'pending') {
      status = '<div class="note">⏳ ' + esc(t('task.waiting')) + '</div>';
    } else if (d.myStatus === 'rejected') {
      status = '<div class="note bad">❌ ' + esc(t('task.rejected'))
        + (d.rejectReason ? ' — ' + esc(t('task.reason')) + ': ' + esc(d.rejectReason) : '') + '</div>';
    } else if (!d.isOpen) {
      status = '<div class="note">' + esc(t('task.closed')) + '</div>';
    }

    const instructions = d.instructions || [];
    const form = canSubmit
      ? '<div class="card"><div class="bold mb">' + esc(d.myStatus === 'rejected' ? t('task.resubmit') : t('task.upload')) + '</div>'
        + '<input type="file" id="tk-file" accept="image/*" hidden>'
        + '<button class="btn secondary block" id="tk-pick">📷 ' + esc(t('task.choose')) + '</button>'
        + '<img id="tk-prev" class="proof hidden" alt="">'
        + '<input class="input mt" id="tk-note" maxlength="200" placeholder="' + esc(t('task.note')) + '">'
        + '<button class="btn block mt" id="tk-send">' + esc(t('task.submit')) + '</button></div>'
      : '';

    box.innerHTML =
      '<button class="back" id="tk-back">← ' + esc(t('common.back')) + '</button>'
      + '<div class="card"><div class="row between"><span class="badge">' + esc(d.category) + '</span>'
      + '<span class="reward">+' + money(d.reward) + '</span></div>'
      + '<div class="h2 mt">' + esc(d.title) + '</div>'
      + (d.description ? '<div class="pre muted mt">' + esc(d.description) + '</div>' : '')
      + (instructions.length
        ? '<div class="bold mt">' + esc(t('task.instructions')) + '</div><ol class="steps">'
          + instructions.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>'
        : '')
      + (d.expiresAt ? '<div class="small muted mt">⏱ ' + esc(t('task.expires')) + ': ' + esc(UI.dateStr(d.expiresAt)) + '</div>' : '')
      + (d.slotsLeft !== null ? '<div class="small muted">' + esc(t('task.slots', { n: d.slotsLeft })) + '</div>' : '')
      + (/^https?:\/\//i.test(d.link || '') ? '<button class="btn secondary block mt" id="tk-link">🔗 ' + esc(t('task.openLink')) + '</button>' : '')
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
        btn.disabled = true;
        try {
          await api('/api/user/task/' + encodeURIComponent(id) + '/submit', {
            method: 'POST',
            body: { image: image, note: box.querySelector('#tk-note').value }
          });
          UI.toast(t('task.submitted'), 'ok');
          showDetail(id);
        } catch (e) {
          btn.disabled = false;
          UI.toast(e.message, 'bad');
        }
      };
    }
  }

  frame();
  await showList();
};
