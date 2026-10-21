window.Views = window.Views || {};

Views.profile = async function (box) {
  const esc = UI.esc;
  const money = UI.money;
  const p = await api('/api/user/profile');
  let page = 1;
  let totalPages = 1;

  function sw(id, on, label) {
    return '<div class="row between sw-row"><span>' + esc(label) + '</span>'
      + '<label class="switch"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><i></i></label></div>';
  }

  box.innerHTML =
    '<div class="card center-col">' + UI.avatar({ name: p.name, photoUrl: p.photoUrl }, 'lg')
    + '<div class="h2 mt">' + esc(p.name) + '</div>'
    + '<div class="small muted">' + (p.username ? '@' + esc(p.username) + ' · ' : '') + 'ID: ' + esc(p.telegramId) + '</div>'
    + '<div class="mt"><span class="badge ok">' + esc(p.levelName) + '</span></div>'
    + '<div class="bc-amount" style="color:var(--text)">' + money(p.balance) + '</div></div>'

    + '<div class="grid2">'
    + '<div class="stat"><div class="v">' + money(p.totalEarned) + '</div><div class="k">' + esc(t('prof.earned')) + '</div></div>'
    + '<div class="stat"><div class="v">' + money(p.totalDeposited) + '</div><div class="k">' + esc(t('prof.deposited')) + '</div></div>'
    + '</div>'
    + '<div class="grid2">'
    + '<div class="stat"><div class="v">' + money(p.totalWithdrawn) + '</div><div class="k">' + esc(t('prof.withdrawn')) + '</div></div>'
    + '<div class="stat"><div class="v">' + esc(p.withdrawFeePercent) + '%</div><div class="k">' + esc(t('prof.fee')) + '</div></div>'
    + '</div>'
    + '<div class="card small"><span class="muted">' + esc(t('prof.monthly')) + ':</span> '
    + (p.monthlyWithdrawLimit > 0 ? money(p.withdrawnThisMonth) + ' / ' + money(p.monthlyWithdrawLimit) : esc(t('prof.noLimit'))) + '</div>'

    + '<div class="card"><div class="bold">' + esc(t('prof.details')) + '</div>'
    + '<label class="label">' + esc(t('prof.upi')) + '</label><input class="input" id="pf-upi" value="' + esc(p.upiId) + '" placeholder="name@bank">'
    + '<label class="label">' + esc(t('prof.holder')) + '</label><input class="input" id="pf-name" value="' + esc(p.withdrawName) + '">'
    + '<label class="label">' + esc(t('prof.wallet')) + '</label><input class="input" id="pf-wallet" inputmode="numeric" maxlength="10" value="' + esc(p.walletNumber) + '">'
    + '<button class="btn block mt" id="pf-save">' + esc(t('prof.save')) + '</button></div>'

    + '<div class="card"><div class="bold">' + esc(t('prof.prefs')) + '</div>'
    + '<label class="label">' + esc(t('prof.language')) + '</label>'
    + '<div id="pf-lang">' + UI.tabs([{ k: 'en', label: 'English' }, { k: 'bn', label: 'বাংলা' }], p.language) + '</div>'
    + '<label class="label">' + esc(t('prof.theme')) + '</label>'
    + '<div id="pf-theme">' + UI.tabs([{ k: 'light', label: t('prof.light') }, { k: 'dark', label: t('prof.dark') }], p.theme) + '</div>'
    + sw('pf-notif', p.notificationsOn, t('prof.notifications'))
    + sw('pf-hide', p.hideInClub, t('prof.hideClub'))
    + '</div>'

    + (/^https?:\/\//i.test(p.supportLink || '')
      ? '<button class="btn secondary block mb" id="pf-support">' + Icon('message', 18) + esc(t('prof.support')) + '</button>' : '')

    + '<div class="section-title">' + esc(t('prof.history')) + '</div>'
    + '<div class="list" id="pf-tx"></div>'
    + '<button class="btn secondary block hidden" id="pf-more">' + esc(t('prof.more')) + '</button>';

  box.querySelector('#pf-save').onclick = async () => {
    try {
      await api('/api/user/profile/withdraw-info', {
        method: 'PUT',
        body: {
          upiId: box.querySelector('#pf-upi').value.trim(),
          withdrawName: box.querySelector('#pf-name').value.trim(),
          walletNumber: box.querySelector('#pf-wallet').value.trim()
        }
      });
      UI.toast(t('prof.saved'), 'ok');
    } catch (e) {
      UI.toast(e.message, 'bad');
    }
  };

  UI.bindTabs(box.querySelector('#pf-lang'), async (k) => {
    try {
      await api('/api/user/profile/settings', { method: 'PUT', body: { language: k } });
      App.applyLang(k);
      State.home.user.language = k;
      App.render();
    } catch (e) {
      UI.toast(e.message, 'bad');
    }
  });

  UI.bindTabs(box.querySelector('#pf-theme'), async (k) => {
    App.applyTheme(k);
    State.home.user.theme = k;
    try {
      await api('/api/user/profile/settings', { method: 'PUT', body: { theme: k } });
    } catch (e) {
      UI.toast(e.message, 'bad');
    }
  });

  box.querySelector('#pf-notif').onchange = async (e) => {
    try {
      await api('/api/user/profile/settings', { method: 'PUT', body: { notificationsOn: e.target.checked } });
    } catch (err) {
      UI.toast(err.message, 'bad');
    }
  };

  box.querySelector('#pf-hide').onchange = async (e) => {
    try {
      await api('/api/user/profile/settings', { method: 'PUT', body: { hideInClub: e.target.checked } });
    } catch (err) {
      UI.toast(err.message, 'bad');
    }
  };

  const sup = box.querySelector('#pf-support');
  if (sup) sup.onclick = () => UI.openLink(p.supportLink);

  function txRow(x) {
    const credit = x.direction === 'credit';
    return '<div class="item"><div class="mid"><div class="t">' + esc(t('tx.' + x.type)) + '</div>'
      + '<div class="s">' + esc(UI.timeAgo(x.createdAt)) + (x.fee > 0 ? ' · ' + esc(t('dep.fee')) + ' ' + money(x.fee) : '') + '</div></div>'
      + '<div class="r"><div class="t ' + (credit ? 'pos' : 'neg') + '">' + (credit ? '+' : '−') + money(x.amount) + '</div>'
      + UI.badge(x.status) + '</div></div>';
  }

  async function loadTx() {
    const el = box.querySelector('#pf-tx');
    try {
      const r = await api('/api/user/profile/transactions?page=' + page);
      totalPages = r.totalPages;
      if (page === 1 && !r.items.length) {
        el.innerHTML = UI.empty(t('prof.noTx'));
        return;
      }
      el.insertAdjacentHTML('beforeend', r.items.map(txRow).join(''));
      box.querySelector('#pf-more').classList.toggle('hidden', page >= totalPages);
    } catch (e) {
      UI.toast(e.message, 'bad');
    }
  }

  box.querySelector('#pf-more').onclick = () => { page += 1; loadTx(); };
  await loadTx();
};
