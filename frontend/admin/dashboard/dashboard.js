window.Views = window.Views || {};

Views['admin.dashboard'] = async function (box) {
  const esc = UI.esc;
  const money = UI.money;

  const [s, w, tx, series] = await Promise.all([
    api('/api/admin/dashboard/stats'),
    api('/api/admin/dashboard/withdrawals?status=pending'),
    api('/api/admin/dashboard/transactions'),
    api('/api/admin/analytics/series?days=7')
  ]);

  function kpi(icon, tile, label, value, sub) {
    return '<div class="stat row gap"><div class="tile ' + tile + '">' + Icon(icon, 20) + '</div>'
      + '<div style="min-width:0"><div class="v" style="font-size:17px">' + esc(value) + '</div>'
      + '<div class="k">' + esc(label) + '</div>' + (sub ? '<div class="s">' + esc(sub) + '</div>' : '') + '</div></div>';
  }

  function chart() {
    const W = 320, H = 150, base = 112, maxH = 92;
    const max = Math.max.apply(null, series.map((d) => Math.max(d.deposits, d.withdrawals)).concat([1]));
    const n = series.length;
    const gw = W / n;
    const bw = Math.min(gw * 0.3, 16);
    let bars = '';
    series.forEach((d, i) => {
      const x0 = i * gw + gw / 2 - bw - 1.5;
      const h1 = Math.max((d.deposits / max) * maxH, d.deposits > 0 ? 3 : 0);
      const h2 = Math.max((d.withdrawals / max) * maxH, d.withdrawals > 0 ? 3 : 0);
      bars += '<rect x="' + x0 + '" y="' + (base - h1) + '" width="' + bw + '" height="' + h1 + '" rx="4" fill="#14b8a6"/>'
        + '<rect x="' + (x0 + bw + 3) + '" y="' + (base - h2) + '" width="' + bw + '" height="' + h2 + '" rx="4" fill="#5266f4"/>'
        + '<text x="' + (i * gw + gw / 2) + '" y="' + (base + 18) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + esc(d.day.slice(8)) + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">'
      + '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" stroke="var(--border)" stroke-width="1"/>' + bars + '</svg>';
  }

  const totalDep = series.reduce((a, d) => a + d.deposits, 0);
  const totalWd = series.reduce((a, d) => a + d.withdrawals, 0);
  const totalNew = series.reduce((a, d) => a + d.newUsers, 0);

  function alertCard(icon, tile, text, btn, tab) {
    return '<div class="card row gap"><div class="tile ' + tile + '">' + Icon(icon, 20) + '</div>'
      + '<div class="grow bold">' + esc(text) + '</div>'
      + '<button class="btn sm" data-go="' + tab + '">' + esc(btn) + '</button></div>';
  }

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
    return '<div class="item"><div class="ico ' + (dep ? 'in' : 'out') + '">' + Icon(dep ? 'arrowDownLeft' : 'arrowUpRight', 18) + '</div>'
      + '<div class="mid"><div class="t">' + esc(x.userName) + '</div>'
      + '<div class="s">' + esc(x.type) + (x.method ? ' · ' + esc(x.method) : '') + ' · ' + esc(UI.timeAgo(x.createdAt)) + '</div></div>'
      + '<div class="r"><div class="t">' + money(x.amount) + '</div>' + UI.badge(x.status) + '</div></div>';
  }

  box.innerHTML =
    '<div class="h1">Dashboard</div>'

    + (s.pendingSubmissions > 0 ? alertCard('clipboard', 't-amber', s.pendingSubmissions + ' proof(s) waiting for review', 'Review', 'tasks') : '')
    + (s.pendingWithdrawals > 0 ? alertCard('wallet', 't-red', s.pendingWithdrawals + ' withdrawal(s) need approval', 'Below', '') : '')

    + '<div class="grid2">'
    + kpi('users', 't-blue', 'Total users', s.totalUsers, '+' + s.newToday + ' in 24h')
    + kpi('activity', 't-green', 'Active (24h)', s.activeToday, '')
    + kpi('arrowDownLeft', 't-teal', 'Deposits', money(s.depositTotal), s.depositCount + ' successful')
    + kpi('arrowUpRight', 't-violet', 'Withdrawn', money(s.withdrawSent), s.withdrawCount + ' successful')
    + kpi('trendingUp', 't-amber', 'Fees collected', money(s.appFees), 'by this app')
    + kpi('wallet', 't-pink', 'Users balance', money(s.usersBalanceTotal), 'owed to users')
    + kpi('checkSquare', 't-green', 'Task rewards paid', money(s.taskRewardsPaid), '')
    + kpi('gift', 't-blue', 'Referral paid', money(s.referralPaid), '')
    + '</div>'

    + '<div class="card chart-wrap"><div class="row between"><div class="bold">Last 7 days</div>'
    + '<div class="small muted">+' + totalNew + ' new users</div></div>'
    + chart()
    + '<div class="legend"><span><i style="background:#14b8a6"></i>Deposits ' + money(totalDep) + '</span>'
    + '<span><i style="background:#5266f4"></i>Withdrawals ' + money(totalWd) + '</span></div></div>'

    + '<div class="section-title">Withdrawals waiting for approval</div>'
    + (w.length ? w.map(wRow).join('') : UI.emptyState('checkCircle', 'All clear', 'No pending withdrawals.'))
    + '<div class="section-title">Recent deposits & withdrawals</div>'
    + (tx.length ? '<div class="list">' + tx.slice(0, 15).map(tRow).join('') + '</div>' : UI.emptyState('inbox', 'No transactions yet', ''));

  box.querySelectorAll('[data-go]').forEach((b) => {
    b.onclick = () => { if (b.dataset.go) App.go('admin', b.dataset.go); };
  });

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
