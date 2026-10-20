window.Views = window.Views || {};

Views['admin.tasks'] = async function (box) {
  const esc = UI.esc;
  const money = UI.money;
  let tab = 'tasks';
  let rv = 'pending';

  box.innerHTML = UI.tabs([{ k: 'tasks', label: 'Tasks' }, { k: 'review', label: 'Review' }], tab) + '<div id="tk-body"></div>';
  UI.bindTabs(box, (k) => {
    tab = k;
    if (k === 'tasks') showTasks(); else showReview();
  });

  function toLocalInput(d) {
    if (!d) return '';
    const x = new Date(d);
    const p = (n) => String(n).padStart(2, '0');
    return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()) + 'T' + p(x.getHours()) + ':' + p(x.getMinutes());
  }

  function row(it) {
    return '<div class="card"><div class="row between"><div class="bold">' + esc(it.title) + '</div>' + UI.badge(it.status) + '</div>'
      + '<div class="small muted">' + esc(it.category) + ' · Reward ' + money(it.reward) + ' · Users ' + it.filledCount + ' / ' + (it.maxUsers > 0 ? it.maxUsers : '∞') + '</div>'
      + (it.expiresAt ? '<div class="small muted">Ends ' + esc(UI.dateStr(it.expiresAt)) + '</div>' : '')
      + '<div class="row gap mt"><button class="btn secondary block sm" data-edit="' + esc(it._id) + '">Edit</button>'
      + '<button class="btn danger block sm" data-del="' + esc(it._id) + '">Delete</button></div></div>';
  }

  async function showTasks() {
    const body = box.querySelector('#tk-body');
    body.innerHTML = UI.loader();
    try {
      const items = await api('/api/admin/tasks');
      body.innerHTML = '<button class="btn block mb" id="at-new">＋ New task</button>'
        + (items.length ? items.map(row).join('') : UI.empty('No tasks yet.'));
      body.querySelector('#at-new').onclick = () => openForm(null);
      body.querySelectorAll('[data-edit]').forEach((b) => {
        b.onclick = () => openForm(items.find((x) => x._id === b.dataset.edit));
      });
      body.querySelectorAll('[data-del]').forEach((b) => {
        b.onclick = () => removeTask(b.dataset.del);
      });
    } catch (e) {
      body.innerHTML = UI.empty(e.message);
    }
  }

  async function removeTask(id) {
    const yes = await UI.confirmBox('Delete this task?', 'If users already submitted it, the task will be ended instead of deleted.', 'Delete');
    if (!yes) return;
    try {
      const r = await api('/api/admin/tasks/' + id, { method: 'DELETE' });
      UI.toast(r && r.deleted ? 'Deleted' : 'Task ended', 'ok');
      showTasks();
    } catch (e) {
      UI.toast(e.message, 'bad');
    }
  }

  function openForm(task) {
    const t0 = task || {};
    const cats = (State.home.app.taskCategories || []).slice();
    if (t0.category && cats.indexOf(t0.category) === -1) cats.push(t0.category);
    const statuses = ['active', 'paused', 'ended'];

    const sheet = UI.modal(
      '<h3>' + (task ? 'Edit task' : 'New task') + '</h3>'
      + '<label class="label">Title</label><input class="input" id="f-title" maxlength="120" value="' + esc(t0.title || '') + '">'
      + '<label class="label">Category</label><select class="input" id="f-cat">'
      + cats.map((c) => '<option value="' + esc(c) + '"' + (c === t0.category ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select>'
      + '<label class="label">Reward (₹)</label><input class="input" id="f-reward" type="number" step="any" value="' + esc(t0.reward != null ? t0.reward : '') + '">'
      + '<label class="label">Description</label><textarea class="input" id="f-desc">' + esc(t0.description || '') + '</textarea>'
      + '<label class="label">Task link (optional)</label><input class="input" id="f-link" value="' + esc(t0.link || '') + '" placeholder="https://...">'
      + '<label class="label">Instructions (one per line)</label><textarea class="input" id="f-ins">' + esc((t0.instructions || []).join('\n')) + '</textarea>'
      + '<label class="label">User limit (0 = unlimited)</label><input class="input" id="f-max" type="number" value="' + esc(t0.maxUsers != null ? t0.maxUsers : 0) + '">'
      + '<label class="label">Publish at (empty = now)</label><input class="input" id="f-pub" type="datetime-local" value="' + esc(toLocalInput(t0.publishAt)) + '">'
      + '<label class="label">Ends at (empty = never)</label><input class="input" id="f-exp" type="datetime-local" value="' + esc(toLocalInput(t0.expiresAt)) + '">'
      + '<label class="label">Status</label><select class="input" id="f-status">'
      + statuses.map((s) => '<option value="' + s + '"' + (s === (t0.status || 'active') ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>'
      + '<div class="row gap mt"><button class="btn secondary block" id="f-no">Cancel</button><button class="btn block" id="f-ok">Save</button></div>'
    );

    sheet.querySelector('#f-no').onclick = UI.closeModal;
    sheet.querySelector('#f-ok').onclick = async () => {
      const pub = sheet.querySelector('#f-pub').value;
      const exp = sheet.querySelector('#f-exp').value;
      const body = {
        title: sheet.querySelector('#f-title').value,
        category: sheet.querySelector('#f-cat').value,
        reward: sheet.querySelector('#f-reward').value,
        description: sheet.querySelector('#f-desc').value,
        link: sheet.querySelector('#f-link').value,
        instructions: sheet.querySelector('#f-ins').value.split('\n').map((s) => s.trim()).filter(Boolean),
        maxUsers: Number(sheet.querySelector('#f-max').value) || 0,
        publishAt: pub ? new Date(pub).toISOString() : '',
        expiresAt: exp ? new Date(exp).toISOString() : '',
        status: sheet.querySelector('#f-status').value
      };
      if (!body.title.trim()) return UI.toast('Enter a title', 'bad');
      if (body.reward === '' || Number(body.reward) < 0) return UI.toast('Enter a valid reward', 'bad');
      try {
        if (task) await api('/api/admin/tasks/' + task._id, { method: 'PUT', body: body });
        else await api('/api/admin/tasks', { method: 'POST', body: body });
        UI.closeModal();
        UI.toast('Saved', 'ok');
        showTasks();
      } catch (e) {
        UI.toast(e.message, 'bad');
      }
    };
  }

  function sub(s) {
    return '<div class="card"><div class="row between"><div class="bold">' + esc(s.taskTitle) + '</div><div class="reward">' + money(s.reward) + '</div></div>'
      + '<div class="small muted">' + esc(s.userName) + ' · ID ' + esc(s.userId) + (s.username ? ' · @' + esc(s.username) : '') + ' · ' + esc(UI.timeAgo(s.createdAt)) + '</div>'
      + (s.note ? '<div class="small mt">Note: ' + esc(s.note) + '</div>' : '')
      + (s.status === 'rejected' && s.rejectReason ? '<div class="note bad">' + esc(s.rejectReason) + '</div>' : '')
      + '<div class="row gap mt"><button class="btn secondary block sm" data-proof="' + esc(s.id) + '">Screenshot</button>'
      + (s.status === 'pending'
        ? '<button class="btn ok block sm" data-ok="' + esc(s.id) + '">Approve</button><button class="btn danger block sm" data-no="' + esc(s.id) + '">Reject</button>'
        : UI.badge(s.status))
      + '</div></div>';
  }

  async function viewProof(id) {
    let url = '';
    const sheet = UI.modal('<div class="center"><div class="spinner"></div></div>', {
      onClose: () => { if (url) URL.revokeObjectURL(url); }
    });
    try {
      url = await apiBlob('/api/admin/tasks/submissions/' + id + '/proof');
      sheet.innerHTML = '<img class="proof full" src="' + url + '" alt=""><button class="btn secondary block mt" id="pv-close">Close</button>';
      sheet.querySelector('#pv-close').onclick = UI.closeModal;
    } catch (e) {
      sheet.innerHTML = UI.empty(e.message);
    }
  }

  async function showReview() {
    const body = box.querySelector('#tk-body');
    body.innerHTML =
      '<div class="chips">' + ['pending', 'approved', 'rejected'].map((s) =>
        '<button class="chip' + (s === rv ? ' on' : '') + '" data-s="' + s + '">' + s + '</button>').join('') + '</div>'
      + '<div id="rv-list">' + UI.loader() + '</div>';
    body.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => { rv = b.dataset.s; showReview(); }; });

    const list = body.querySelector('#rv-list');
    try {
      const items = await api('/api/admin/tasks/submissions/list?status=' + rv);
      if (!items.length) { list.innerHTML = UI.empty('Nothing here.'); return; }
      list.innerHTML = items.map(sub).join('');

      list.querySelectorAll('[data-proof]').forEach((b) => { b.onclick = () => viewProof(b.dataset.proof); });
      list.querySelectorAll('[data-ok]').forEach((b) => {
        b.onclick = async () => {
          b.disabled = true;
          try {
            await api('/api/admin/tasks/submissions/' + b.dataset.ok + '/approve', { method: 'POST', body: {} });
            UI.toast('Approved and paid', 'ok');
            showReview();
          } catch (e) {
            b.disabled = false;
            UI.toast(e.message, 'bad');
          }
        };
      });
      list.querySelectorAll('[data-no]').forEach((b) => {
        b.onclick = async () => {
          const reason = await UI.promptBox('Reject this proof', 'Reason shown to the user', 'Reject');
          if (reason === null) return;
          try {
            await api('/api/admin/tasks/submissions/' + b.dataset.no + '/reject', { method: 'POST', body: { reason: reason } });
            UI.toast('Rejected', 'ok');
            showReview();
          } catch (e) {
            UI.toast(e.message, 'bad');
          }
        };
      });
    } catch (e) {
      list.innerHTML = UI.empty(e.message);
    }
  }

  await showTasks();
};
