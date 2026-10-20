window.Views = window.Views || {};

Views['admin.dashboard'] = async function (box) {
  const esc = UI.esc;
  const money = UI.money;

  const [s, w, tx] = await Promise.all([
    api('/api/admin/dashboard/stats'),
    api('/api/admin/dashboard/withdrawals?status=pending'),
    api('/api/admin/dashboard/transactions')
  ]);

  const cards = [
    ['Total users', s.totalUsers, ''],
    ['Active (24h)', s.activeToday, ''],
    ['New (24h)', s.newToday, ''],
    ['Pending proofs', s.pendingSubmissions, ''],
    ['Pending withdrawals', s.pendingWithdrawals, ''],
    ['Deposits', money(s.depositTotal), s.depositCount + ' successful'],
    ['Withdrawn (sent)', money(s.withdrawSent), s.withdrawCount + ' successful'],
    ['Fees collected', money(s.appFees), 'by this app'],
    ['Task rewards paid', money(s.taskRewardsPaid), ''],
    ['Referral paid', money(s.referralPaid), ''],
    ['Users balance', money(s.usersBalanceTotal), 'owed to users']
  ];

  function wRow(x) {
    return '<div class="card">'
      + '<div class="row between"><div class="bold">' + esc(x.userName) + '</div><div class="bold">' + money(x.amount) + '</div></div>'
      + '<div class="small muted">ID ' + esc(x.userId) + (x.username ? ' · @' + esc(x.username) : '') + '</div>'
      + '<div class="small mt">' + esc(x.method.toUpperCase()) + ': <b>' + esc(x.destination) + '</b>'
      + (x.beneficiaryName ? ' (' + esc(x.beneficiaryName) + ')' : '') + '</div>'
      + '<div class="small muted">Fee ' + money(x.fee) + ' · Send ' + money(x.netAmount) + ' · ' + esc(UI.timeAgo(x.createdAt)) + '</div>'
      + '<div class="row gap mt"><button class="btn ok block sm" data-ok="' + esc(x.id) + '">Approve & send</button>'
      + '<button class="btn danger block sm" data-no="' + esc(x.id) + '">Reject</button></div></div>';
  }

  function tRow(x) {
    const dep = x.type === 'deposit';
    return '<div class="item"><div class="ico ' + (dep ? 'in' : 'out') + '">' + (dep ? '⬇' : '⬆') + '</div>'
      + '<div class="mid"><div class="t">' + esc(x.userName) + '</div>'
      + '<div class="s">' + esc(x.type) + (x.method ? ' · ' + esc(x.method) : '') + ' · ' + esc(UI.timeAgo(x.createdAt)) + '</div></div>'
      + '<div class="r"><div class="t">' + money(x.amount) + '</div>' + UI.badge(x.status) + '</div></div>';
  }

  box.innerHTML =
    '<div class="h1">Dashboard</div>'
    + '<div class="grid2">' + cards.map((c) =>
      '<div class="stat"><div class="v">' + esc(c[1]) + '</div><div class="k">' + esc(c[0]) + '</div>'
      + (c[2] ? '<div class="s">' + esc(c[2]) + '</div>' : '') + '</div>'
    ).join('') + '</div>'
    + '<div class="section-title">Withdrawals waiting for approval</div>'
    + (w.length ? w.map(wRow).join('') : UI.empty('No pending withdrawals.'))
    + '<div class="section-title">Recent deposits & withdrawals</div>'
    + (tx.length ? '<div class="list">' + tx.slice(0, 15).map(tRow).join('') + '</div>' : UI.empty('No transactions yet.'));

  box.querySelectorAll('[data-ok]').forEach((b) => {
    b.onclick = async () => {
      const yes = await UI.confirmBox('Approve and send this withdrawal?', 'The money will be sent from your FINZO wallet.', 'Approve');
      if (!yes) return;
      try {
        const r = await api('/api/admin/dashboard/withdrawals/' + b.dataset.ok + '/approve', { method: 'POST', body: {} });
        UI.toast(r && r.refunded ? 'Payout failed. User was refunded.' : 'Sent / processing.', r && r.refunded ? 'bad' : 'ok');
        Views['admin.dashboard'](box);
      } catch (e) {
        UI.toast(e.message, 'bad');
      }
    };
  });

  box.querySelectorAll('[data-no]').forEach((b) => {
    b.onclick = async () => {
      const reason = await UI.promptBox('Reject withdrawal', 'Reason (optional)', 'Reject');
      if (reason === null) return;
      try {
        await api('/api/admin/dashboard/withdrawals/' + b.dataset.no + '/reject', { method: 'POST', body: { reason: reason } });
        UI.toast('Rejected. User was refunded.', 'ok');
        Views['admin.dashboard'](box);
      } catch (e) {
        UI.toast(e.message, 'bad');
      }
    };
  });
};
