window.Views = window.Views || {};

Views.home = async function (box) {
  const esc = UI.esc;
  const money = UI.money;
  let home = await App.loadHome();

  function bar(label, cur, req, p) {
    return '<div class="pbar-row"><span>' + esc(label) + '</span><span>' + cur + ' / ' + req + '</span></div>'
      + '<div class="pbar"><i style="width:' + Math.round(p * 100) + '%"></i></div>';
  }

  function levelBlock() {
    const next = home.levelInfo.next;
    if (!next) return '<div class="small muted">' + esc(t('home.maxLevel')) + '</div>';
    const u = home.user;
    const tp = next.requiredTasks > 0 ? Math.min(u.tasksCompleted / next.requiredTasks, 1) : 1;
    const rp = next.requiredReferrals > 0 ? Math.min(u.referralsCount / next.requiredReferrals, 1) : 1;
    return '<div class="bold">' + esc(t('home.nextLevel', { name: next.name })) + '</div>'
      + bar(t('home.tasks'), u.tasksCompleted, next.requiredTasks, tp)
      + bar(t('home.referrals'), u.referralsCount, next.requiredReferrals, rp);
  }

  function paint() {
    const u = home.user;
    const ci = home.checkIn;
    box.innerHTML =
      '<div class="balance-card">'
      + '<div class="bc-top"><span>' + esc(t('home.balance')) + '</span><span class="lvl">' + Icon('star', 12) + esc(u.levelName) + '</span></div>'
      + '<div class="bc-amount">' + money(u.balance) + '</div>'
      + '<div class="bc-id">ID: ' + esc(u.telegramId) + '</div>'
      + '<div class="row gap mt"><button class="btn light block" id="h-dep">' + Icon('plus', 18) + esc(t('home.deposit')) + '</button>'
      + '<button class="btn light block" id="h-wd">' + Icon('arrowUpRight', 18) + esc(t('home.withdraw')) + '</button></div>'
      + '</div>'
      + (ci.enabled
        ? '<div class="card row between"><div class="row gap"><div class="ico in">' + Icon('gift', 20) + '</div>'
          + '<div><div class="bold">' + esc(t('home.checkin')) + '</div>'
          + '<div class="small muted">+' + money(ci.amount) + ' · ' + esc(t('home.streak', { n: ci.streak })) + '</div></div></div>'
          + '<button class="btn sm" id="h-ci"' + (ci.canCheckIn ? '' : ' disabled') + '>'
          + esc(ci.canCheckIn ? t('home.checkinBtn') : t('home.checkinDone')) + '</button></div>'
        : '')
      + '<div class="card">' + levelBlock() + '</div>'
      + '<div class="grid2">'
      + '<div class="stat row gap"><div class="ico out">' + Icon('checkSquare', 18) + '</div>'
      + '<div><div class="v">' + u.tasksCompleted + '</div><div class="k">' + esc(t('home.tasksDone')) + '</div></div></div>'
      + '<div class="stat row gap"><div class="ico in">' + Icon('users', 18) + '</div>'
      + '<div><div class="v">' + u.referralsCount + '</div><div class="k">' + esc(t('home.referrals')) + '</div></div></div>'
      + '</div>';

    box.querySelector('#h-dep').onclick = openDeposit;
    box.querySelector('#h-wd').onclick = openWithdraw;
    const ciBtn = box.querySelector('#h-ci');
    if (ciBtn) ciBtn.onclick = doCheckIn;
  }

  async function doCheckIn() {
    try {
      const r = await api('/api/user/home/checkin', { method: 'POST', body: {} });
      UI.toast(t('home.checkinOk', { amount: money(r.amount) }), 'ok');
      home = await App.reloadHome();
      paint();
    } catch (e) {
      UI.toast(e.message, 'bad');
    }
  }

  function feeFor(amount) {
    const d = home.app.deposit;
    const f = d.feeType === 'fixed' ? Number(d.feeValue) : (amount * Number(d.feeValue)) / 100;
    return Math.round(Math.max(f || 0, 0) * 100) / 100;
  }

  function openDeposit() {
    const d = home.app.deposit;
    if (!d.enabled) return UI.toast(t('home.depositOff'), 'bad');

    let pollTimer = null;
    const quick = [100, 500, 1000, 2000].filter((x) => x >= d.min && x <= d.max);

    const sheet = UI.modal(
      '<h3>' + esc(t('dep.title')) + '</h3><div id="dp-body">'
      + '<label class="label">' + esc(t('dep.amount')) + ' (₹' + d.min + ' – ₹' + d.max + ')</label>'
      + '<input class="input" id="dp-amt" type="number" inputmode="numeric" placeholder="500">'
      + '<div class="chips mt">' + quick.map((x) => '<button class="chip" data-q="' + x + '">₹' + x + '</button>').join('') + '</div>'
      + '<div class="note" id="dp-fee"></div>'
      + '<button class="btn block" id="dp-go">' + esc(t('dep.pay')) + '</button></div>',
      { onClose: () => clearInterval(pollTimer) }
    );

    const amt = sheet.querySelector('#dp-amt');
    const feeEl = sheet.querySelector('#dp-fee');

    function showFee() {
      const a = Number(amt.value);
      if (!(a > 0)) { feeEl.textContent = ''; return; }
      const f = feeFor(a);
      feeEl.textContent = t('dep.fee') + ': ' + money(f) + ' · ' + t('dep.receive') + ': ' + money(Math.max(a - f, 0));
    }
    amt.oninput = showFee;
    sheet.querySelectorAll('[data-q]').forEach((b) => {
      b.onclick = () => { amt.value = b.dataset.q; showFee(); };
    });

    function waitPayment(r) {
      sheet.querySelector('#dp-body').innerHTML =
        '<div class="center-col"><div class="spinner"></div>'
        + '<div class="bold mt">' + esc(t('dep.waiting')) + '</div>'
        + '<div class="small muted mt">' + esc(t('dep.waitingHint')) + '</div>'
        + '<button class="btn block mt" id="dp-open">' + Icon('link', 18) + esc(t('dep.openPay')) + '</button></div>';
      sheet.querySelector('#dp-open').onclick = () => UI.openLink(r.paymentUrl);
      UI.openLink(r.paymentUrl);

      pollTimer = setInterval(async () => {
        try {
          const s = await api('/api/user/payments/deposit/' + encodeURIComponent(r.orderId));
          if (s.status === 'success') {
            clearInterval(pollTimer);
            UI.closeModal();
            UI.toast(t('dep.success'), 'ok');
            home = await App.reloadHome();
            paint();
          } else if (s.status === 'failed') {
            clearInterval(pollTimer);
            sheet.querySelector('#dp-body').innerHTML = '<div class="empty">' + esc(t('dep.failed')) + '</div>';
          }
        } catch (e) { /* keep trying */ }
      }, 5000);
    }

    sheet.querySelector('#dp-go').onclick = async () => {
      const a = Number(amt.value);
      if (!Number.isInteger(a) || a < d.min || a > d.max) return UI.toast(t('dep.invalid'), 'bad');
      const btn = sheet.querySelector('#dp-go');
      btn.disabled = true;
      try {
        const r = await api('/api/user/payments/deposit', { method: 'POST', body: { amount: a } });
        waitPayment(r);
      } catch (e) {
        btn.disabled = false;
        UI.toast(e.message, 'bad');
      }
    };
  }

  async function openWithdraw() {
    const w = home.app.withdraw;
    if (!w.enabled) return UI.toast(t('home.withdrawOff'), 'bad');

    const methods = [];
    if (w.upiEnabled) methods.push('upi');
    if (w.walletEnabled) methods.push('wallet');
    if (!methods.length) return UI.toast(t('wd.noMethod'), 'bad');

    let p;
    try { p = await api('/api/user/profile'); } catch (e) { return UI.toast(e.message, 'bad'); }

    let method = methods[0];
    const feePct = home.levelInfo.current ? Number(home.levelInfo.current.withdrawFeePercent) || 0 : 0;
    const limit = Number(p.monthlyWithdrawLimit) || 0;

    const sheet = UI.modal(
      '<h3>' + esc(t('wd.title')) + '</h3>'
      + (methods.length > 1
        ? '<div id="wd-m">' + UI.tabs(methods.map((m) => ({ k: m, label: m === 'upi' ? t('wd.upi') : t('wd.wallet') })), method) + '</div>'
        : '')
      + '<label class="label">' + esc(t('wd.amount')) + ' (₹' + w.min + ' – ₹' + w.max + ')</label>'
      + '<input class="input" id="wd-amt" type="number" inputmode="decimal" placeholder="100">'
      + '<div id="wd-fields"></div>'
      + '<div class="note" id="wd-fee"></div>'
      + '<div class="small muted mb">' + esc(t('wd.monthly')) + ': '
      + (limit > 0 ? money(p.withdrawnThisMonth) + ' / ' + money(limit) : esc(t('wd.noLimit'))) + '</div>'
      + '<button class="btn block" id="wd-go">' + esc(t('wd.submit')) + '</button>'
    );

    const amt = sheet.querySelector('#wd-amt');
    const feeEl = sheet.querySelector('#wd-fee');

    function fields() {
      const el = sheet.querySelector('#wd-fields');
      if (method === 'upi') {
        el.innerHTML =
          '<label class="label">' + esc(t('wd.upiId')) + '</label>'
          + '<input class="input" id="wd-dest" value="' + esc(p.upiId) + '" placeholder="name@bank">'
          + '<label class="label">' + esc(t('wd.holder')) + '</label>'
          + '<input class="input" id="wd-name" value="' + esc(p.withdrawName) + '">';
      } else {
        el.innerHTML =
          '<label class="label">' + esc(t('wd.walletNo')) + '</label>'
          + '<input class="input" id="wd-dest" inputmode="numeric" maxlength="10" value="' + esc(p.walletNumber) + '">';
      }
    }

    function showFee() {
      const a = Number(amt.value);
      if (!(a > 0)) { feeEl.textContent = ''; return; }
      const fee = Math.round(((a * feePct) / 100) * 100) / 100;
      feeEl.textContent = t('wd.fee', { pct: feePct }) + ': ' + money(fee) + ' · ' + t('wd.receive') + ': ' + money(a - fee);
    }

    amt.oninput = showFee;
    fields();
    if (methods.length > 1) {
      UI.bindTabs(sheet.querySelector('#wd-m'), (k) => { method = k; fields(); });
    }

    sheet.querySelector('#wd-go').onclick = async () => {
      const amount = Number(amt.value);
      if (!(amount > 0)) return UI.toast(t('wd.invalid'), 'bad');
      const dest = sheet.querySelector('#wd-dest').value.trim();
      const nameEl = sheet.querySelector('#wd-name');
      const name = nameEl ? nameEl.value.trim() : '';
      const btn = sheet.querySelector('#wd-go');
      btn.disabled = true;
      try {
        const r = await api('/api/user/payments/withdraw', {
          method: 'POST',
          body: { method: method, amount: amount, destination: dest, name: name }
        });
        const save = method === 'upi' ? { upiId: dest, withdrawName: name } : { walletNumber: dest };
        api('/api/user/profile/withdraw-info', { method: 'PUT', body: save }).catch(() => {});
        UI.closeModal();
        const msg = r.status === 'success' ? t('wd.success') : r.status === 'pending_approval' ? t('wd.approval') : t('wd.processing');
        UI.toast(msg, 'ok');
        home = await App.reloadHome();
        paint();
      } catch (e) {
        btn.disabled = false;
        UI.toast(e.message, 'bad');
      }
    };
  }

  paint();
};
