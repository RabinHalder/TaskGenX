window.Views = window.Views || {};

Views['admin.users'] = async function (box) {
  const esc = UI.esc;
  const money = UI.money;
  let q = '';
  let page = 1;

  function shell() {
    box.innerHTML =
      '<div class="h1">Users</div>'
      + '<div class="row gap"><input class="input" id="us-q" placeholder="Search name, @username or ID" value="' + esc(q) + '">'
      + '<button class="btn" id="us-go">Search</button></div>'
      + '<div id="us-list" class="mt"></div>';
    box.querySelector('#us-go').onclick = () => { q = box.querySelector('#us-q').value.trim(); page = 1; loadList(); };
    box.querySelector('#us-q').onkeydown = (e) => { if (e.key === 'Enter') box.querySelector('#us-go').click(); };
  }

  async function loadList() {
    const el = box.querySelector('#us-list');
    el.innerHTML = UI.loader();
    try {
      const r = await api('/api/admin/users?q=' + encodeURIComponent(q) + '&page=' + page);
      if (!r.items.length) { el.innerHTML = UI.empty('No users found.'); return; }
      el.innerHTML =
        '<div class="small muted mb">' + r.total + ' users</div>'
        + '<div class="list">' + r.items.map((u) =>
          '<div class="item" data-id="' + esc(u.telegramId) + '" style="cursor:pointer"><div class="mid"><div class="t">' + esc(u.name)
          + (u.isBanned ? ' <span class="badge bad">banned</span>' : '') + '</div>'
          + '<div class="s">ID ' + esc(u.telegramId) + (u.username ? ' · @' + esc(u.username) : '') + ' · L' + esc(u.level) + '</div></div>'
          + '<div class="r"><div class="t">' + money(u.balance) + '</div><div class="s">' + esc(UI.timeAgo(u.lastActiveAt)) + '</div></div></div>'
        ).join('') + '</div>'
        + '<div class="row gap"><button class="btn secondary block" id="us-prev"' + (page <= 1 ? ' disabled' : '') + '>← Prev</button>'
        + '<div class="small muted">' + page + ' / ' + r.totalPages + '</div>'
        + '<button class="btn secondary block" id="us-next"' + (page >= r.totalPages ? ' disabled' : '') + '>Next →</button></div>';
      el.querySelectorAll('[data-id]').forEach((n) => { n.onclick = () => showUser(n.dataset.id); });
      el.querySelector('#us-prev').onclick = () => { page -= 1; loadList(); };
      el.querySelector('#us-next').onclick = () => { page += 1; loadList(); };
    } catch (e) {
      el.innerHTML = UI.empty(e.message);
    }
  }

  async function showUser(id) {
    box.innerHTML = UI.loader();
    let d;
    try {
      d = await api('/api/admin/users/' + encodeURIComponent(id));
    } catch (e) {
      UI.toast(e.message, 'bad');
      shell();
      loadList();
      return;
    }
    const u = d.user;

    box.innerHTML =
      '<button class="back" id="ud-back">← Back</button>'
      + '<div class="card"><div class="h2">' + esc(u.name) + (u.isBanned ? ' <span class="badge bad">banned</span>' : '') + '</div>'
      + '<div class="small muted">ID ' + esc(u.telegramId) + (u.username ? ' · @' + esc(u.username) : '') + '</div>'
      + '<div class="bc-amount" style="color:var(--text)">' + money(u.balance) + '</div>'
      + '<div class="small">Level ' + esc(u.level) + ' · Tasks ' + esc(u.tasksCompleted) + ' · Referrals ' + esc(u.referralsCount)
      + (u.referredBy ? ' · Referred by ' + esc(u.referredBy) : '') + '</div>'
      + '<div class="small muted mt">Earned ' + money(u.totalEarned) + ' · Referral ' + money(u.totalReferralEarned)
      + ' · Deposited ' + money(u.totalDeposited) + ' · Withdrawn ' + money(u.totalWithdrawn) + '</div>'
      + (u.upiId || u.walletNumber
        ? '<div class="small mt">' + (u.upiId ? 'UPI: ' + esc(u.upiId) : '') + (u.walletNumber ? ' Wallet: ' + esc(u.walletNumber) : '') + '</div>' : '')
      + (u.isBanned && u.banReason ? '<div class="note bad">Ban reason: ' + esc(u.banReason) + '</div>' : '')
      + '<div class="small muted mt">Proofs: ' + d.submissions.approved + ' approved · ' + d.submissions.pending + ' pending · ' + d.submissions.rejected + ' rejected</div>'
      + '<div class="row gap mt"><button class="btn secondary block" id="ud-bal">Adjust balance</button>'
      + '<button class="btn ' + (u.isBanned ? 'ok' : 'danger') + ' block" id="ud-ban">' + (u.isBanned ? 'Unban' : 'Ban') + '</button></div></div>'
      + '<div class="section-title">Recent transactions</div>'
      + (d.transactions.length
        ? '<div class="list">' + d.transactions.map((x) =>
          '<div class="item"><div class="mid"><div class="t">' + esc(x.type) + '</div><div class="s">' + esc(x.note || '') + ' ' + esc(UI.timeAgo(x.createdAt)) + '</div></div>'
          + '<div class="r"><div class="t ' + (x.direction === 'credit' ? 'pos' : 'neg') + '">' + (x.direction === 'credit' ? '+' : '−') + money(x.amount) + '</div>'
          + UI.badge(x.status) + '</div></div>').join('') + '</div>'
        : UI.empty('No transactions.'));

    box.querySelector('#ud-back').onclick = () => { shell(); loadList(); };

    box.querySelector('#ud-ban').onclick = async () => {
      if (u.isBanned) {
        const yes = await UI.confirmBox('Unban this user?', '', 'Unban');
        if (!yes) return;
        try {
          await api('/api/admin/users/' + id + '/ban', { method: 'POST', body: { ban: false } });
          UI.toast('Unbanned', 'ok');
          showUser(id);
        } catch (e) { UI.toast(e.message, 'bad'); }
      } else {
        const reason = await UI.promptBox('Ban this user', 'Reason (optional)', 'Ban');
        if (reason === null) return;
        try {
          await api('/api/admin/users/' + id + '/ban', { method: 'POST', body: { ban: true, reason: reason } });
          UI.toast('Banned', 'ok');
          showUser(id);
        } catch (e) { UI.toast(e.message, 'bad'); }
      }
    };

    box.querySelector('#ud-bal').onclick = () => {
      const sheet = UI.modal(
        '<h3>Adjust balance</h3>'
        + '<label class="label">Amount (use a minus sign to deduct)</label><input class="input" id="ab-amt" type="number" step="any" placeholder="e.g. 50 or -20">'
        + '<label class="label">Note</label><input class="input" id="ab-note" placeholder="Reason">'
        + '<div class="row gap mt"><button class="btn secondary block" id="ab-no">Cancel</button><button class="btn block" id="ab-ok">Apply</button></div>'
      );
      sheet.querySelector('#ab-no').onclick = UI.closeModal;
      sheet.querySelector('#ab-ok').onclick = async () => {
        const amount = Number(sheet.querySelector('#ab-amt').value);
        if (!amount) return UI.toast('Enter an amount', 'bad');
        try {
          await api('/api/admin/users/' + id + '/balance', {
            method: 'POST',
            body: { amount: amount, note: sheet.querySelector('#ab-note').value }
          });
          UI.closeModal();
          UI.toast('Balance updated', 'ok');
          showUser(id);
        } catch (e) { UI.toast(e.message, 'bad'); }
      };
    };
  }

  shell();
  await loadList();
};
