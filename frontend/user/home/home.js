window.Views = window.Views || {};

Views.home = async function (box) {
  const esc = UI.esc;
  const money = UI.money;
  let home = await App.loadHome();
  let hidden = false;
  let animated = false;
  try { hidden = localStorage.getItem('tgx_hide_bal') === '1'; } catch (e) { /* ignore */ }

  function bar(label, cur, req, p) {
    return '<div class="pbar-row"><span>' + esc(label) + '</span><span>' + cur + ' / ' + req + '</span></div>'
      + '<div class="pbar"><i style="width:' + Math.round(p * 100) + '%"></i></div>';
  }

  function levelCard() {
    const u = home.user;
    const next = home.levelInfo.next;
    if (!next) {
      return '<div class="card row gap"><div class="tile t-amber">' + Icon('trophy', 22) + '</div>'
        + '<div class="grow"><div class="bold">' + esc(u.levelName) + '</div>'
        + '<div class="small muted">' + esc(t('home.maxLevel')) + '</div></div></div>';
    }
    const tp = next.requiredTasks > 0 ? Math.min(u.tasksCompleted / next.requiredTasks, 1) : 1;
    const rp = next.requiredReferrals > 0 ? Math.min(u.referralsCount / next.requiredReferrals, 1) : 1;
    const pct = (tp + rp) / 2;
    return '<div class="card"><div class="row gap">'
      + UI.ring(pct, 72, 8, Math.round(pct * 100) + '%')
      + '<div class="grow"><div class="small muted">' + esc(t2('home.levelProgress')) + '</div>'
      + '<div class="bold">' + esc(t('home.nextLevel', { name: next.name })) + '</div></div></div>'
      + bar(t('home.tasks'), u.tasksCompleted, next.requiredTasks, tp)
      + bar(t('home.referrals'), u.referralsCount, next.requiredReferrals, rp)
      + '<div class="small muted mt">' + esc(t('home.nextHint')) + '</div></div>';
  }

  function checkInCard() {
    const ci = home.checkIn;
    if (!ci.enabled) return '';
    const filled = ci.streak === 0 ? 0 : ((ci.streak - 1) % 7) + 1;
    let dots = '';
    for (let i = 1; i <= 7; i++) dots += '<i class="' + (i <= filled ? 'on' : '') + '"></i>';
    return '<div class="card"><div class="row between"><div class="row gap"><div class="tile t-green">' + Icon('gift', 22) + '</div>'
      + '<div><div class="bold">' + esc(t('home.checkin')) + '</div>'
      + '<div class="small muted">+' + money(ci.amount) + ' · ' + esc(t('home.streak', { n: ci.streak })) + '</div></div></div>'
      + '<button class="btn sm" id="h-ci"' + (ci.canCheckIn ? '' : ' disabled') + '>'
      + esc(ci.canCheckIn ? t('home.checkinBtn') : t('home.checkinDone')) + '</button></div>'
      + '<div class="dots">' + dots + '</div></div>';
  }

  function howCard() {
    return '<div class="card"><div class="bold">' + esc(t('home.how.title')) + '</div>'
      + [1, 2, 3].map((i) => '<div class="how-step"><i>' + i + '</i><span>' + esc(t('home.how.' + i)) + '</span></div>').join('')
      + '</div>';
  }

  function paintAmount(animate) {
    const el = box.querySelector('#h-amt');
    if (!el) return;
    if (hidden) { el.textContent = '₹ ••••••'; return; }
    if (animate) UI.countUp(el, home.user.balance, 900);
    else el.textContent = money(home.user.balance);
  }

  function paint() {
    const u = home.user;
    const first = String(u.name || '').split(' ')[0];

    box.innerHTML =
      '<div class="hero">'
      + '<div class="hero-top"><div class="hero-label">' + esc(t('home.balance')) + '</div>'
      + '<div class="row gap"><button class="icon-btn" id="h-eye" aria-label="toggle">' + Icon(hidden ? 'eyeOff' : 'eye', 17) + '</button>'
      + '<span class="lvl">' + Icon('star', 12) + esc(u.levelName) + '</span></div></div>'
      + '<div class="hero-amt" id="h-amt">' + money(0) + '</div>'
      + '<div class="hero-sub">' + esc(t('home.greeting', { name: first })) + ' · ID ' + esc(u.telegramId) + '</div>'
      + '<div class="hero-mini"><div>' + esc(t('home.tasksDone')) + '<b>' + u.tasksCompleted + '</b></div>'
      + '<div>' + esc(t('home.referrals')) + '<b>' + u.referralsCount + '</b></div></div>'
      + '</div>'

      + '<div class="qa">'
      + '<button id="qa-dep"><span class="tile t-green">' + Icon('plus', 22) + '</span>' + esc(t('home.deposit')) + '</button>'
      + '<button id="qa-wd"><span class="tile t-blue">' + Icon('arrowUpRight', 22) + '</span>' + esc(t('home.withdraw')) + '</button>'
      + '<button id="qa-task"><span class="tile t-violet">' + Icon('checkSquare', 22) + '</span>' + esc(t('nav.task')) + '</button>'
      + '<button id="qa-inv"><span class="tile t-amber">' + Icon('userPlus', 22) + '</span>' + esc(t2('qa.invite')) + '</button>'
      + '</div>'

      + '<div id="h-live"></div>'
      + checkInCard()
      + (u.tasksCompleted === 0 ? howCard() : '')
      + levelCard();

    paintAmount(!animated);
    animated = true;

    box.querySelector('#h-eye').onclick = () => {
      hidden = !hidden;
      try { localStorage.setItem('tgx_hide_bal', hidden ? '1' : '0'); } catch (e) { /* ignore */ }
      UI.haptic('light');
      box.querySelector('#h-eye').innerHTML = Icon(hidden ? 'eyeOff' : 'eye', 17);
      paintAmount(false);
    };
    box.querySelector('#qa-dep').onclick = () => { UI.haptic('light'); openDeposit(); };
    box.querySelector('#qa-wd').onclick = () => { UI.haptic('light'); openWithdraw(); };
    box.querySelector('#qa-task').onclick = () => App.go('user', 'task');
    box.querySelector('#qa-inv').onclick = () => App.go('user', 'referral');
    const ciBtn = box.querySelector('#h-ci');
    if (ciBtn) ciBtn.onclick = doCheckIn;

    loadLive();
  }

  async function loadLive() {
    const el = box.querySelector('#h-live');
    if (!el) return;
    try {
      const d = await api('/api/user/club?type=all');
      if (!d.enabled || !d.items.length) return;
      el.innerHTML =
        '<div class="live-head"><span class="live-dot"></span>' + esc(t2('home.live')) + '</div>'
        + '<div class="ticker">' + d.items.slice(0, 8).map((it) =>
          '<div class="tk">' + UI.avatarMini(it.name, 26) + '<span><b>' + esc(String(it.name).split(' ')[0]) + '</b> '
          + esc(it.type === 'deposit' ? t('club.deposited') : t('club.withdrew')) + ' ' + money(it.amount) + '</span></div>'
        ).join('') + '</div>';
      const tick = el.querySelector('.ticker');
      if (tick) tick.onclick = () => App.go('user', 'club');
    } catch (e) { /* the ticker is optional */ }
  }

  async function doCheckIn() {
    const btn = box.querySelector('#h-ci');
    UI.busy(btn, true);
    try {
      const r = await api('/api/user/home/checkin', { method: 'POST', body: {} });
      UI.confetti();
      UI.toast(t('home.checkinOk', { amount: money(r.amount) }), 'ok');
      home = await App.reloadHome();
      animated = false;
      paint();
    } catch (e) {
      UI.busy(btn, false);
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
      + '<p class="hint">' + esc(t('dep.hint')) + '</p>'
      + '<label class="label">' + esc(t('dep.amount')) + ' (₹' + d.min + ' – ₹' + d.max + ')</label>'
      + '<input class="input" id="dp-amt" type="number" inputmode="numeric" placeholder="500">'
      + '<div class="chips mt">' + quick.map((x) => '<button class="chip" data-q="' + x + '">₹' + x + '</button>').join('') + '</div>'
      + '<div class="note" id="dp-fee"></div>'
      + '<p class="hint">' + esc(t('dep.validity')) + '</p>'
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
      b.onclick = () => { amt.value = b.dataset.q; showFee(); UI.haptic('light'); };
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
            UI.confetti();
            UI.toast(t('dep.success'), 'ok');
            home = await App.reloadHome();
            animated = false;
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
      UI.busy(btn, true);
      try {
        const r = await api('/api/user/payments/deposit', { method: 'POST', body: { amount: a } });
        waitPayment(r);
      } catch (e) {
        UI.busy(btn, false);
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
      + '<p class="hint">' + esc(t('wd.hint')) + '</p>'
      + (methods.length > 1
        ? '<div id="wd-m">' + UI.tabs(methods.map((m) => ({ k: m, label: m === 'upi' ? t('wd.upi') : t('wd.wallet') })), method) + '</div>'
        : '')
      + '<label class="label">' + esc(t('wd.amount')) + ' (₹' + w.min + ' – ₹' + w.max + ')</label>'
      + '<input class="input" id="wd-amt" type="number" inputmode="decimal" placeholder="100">'
      + '<div id="wd-fields"></div>'
      + '<div class="note" id="wd-fee"></div>'
      + '<div class="small muted mb">' + esc(t('wd.monthly')) + ': '
      + (limit > 0 ? money(p.withdrawnThisMonth) + ' / ' + money(limit) : esc(t('wd.noLimit'))) + '</div>'
      + '<p class="hint safe">' + esc(t('wd.safe')) + '</p>'
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
      UI.busy(btn, true);
      try {
        const r = await api('/api/user/payments/withdraw', {
          method: 'POST',
          body: { method: method, amount: amount, destination: dest, name: name }
        });
        const save = method === 'upi' ? { upiId: dest, withdrawName: name } : { walletNumber: dest };
        api('/api/user/profile/withdraw-info', { method: 'PUT', body: save }).catch(() => {});
        UI.closeModal();
        if (r.status === 'success') UI.confetti();
        const msg = r.status === 'success' ? t('wd.success') : r.status === 'pending_approval' ? t('wd.approval') : t('wd.processing');
        UI.toast(msg, 'ok');
        home = await App.reloadHome();
        animated = false;
        paint();
      } catch (e) {
        UI.busy(btn, false);
        UI.toast(e.message, 'bad');
      }
    };
  }

  paint();
};
