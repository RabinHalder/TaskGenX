window.Views = window.Views || {};

Views.profile = async function (box) {
  const esc = UI.esc;
  const money = UI.money;
  const p = await api('/api/user/profile');
  let page = 1;
  let totalPages = 1;

  function sw(id, on, label, hint, icon, tile) {
    return '<div class="row between sw-row"><div class="row gap grow"><div class="tile sm ' + tile + '">' + Icon(icon, 18) + '</div>'
      + '<div class="grow"><div class="bold">' + esc(label) + '</div>'
      + (hint ? '<div class="small muted">' + esc(hint) + '</div>' : '') + '</div></div>'
      + '<label class="switch"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><i></i></label></div>';
  }

  function faq() {
    let out = '';
    for (let i = 1; i <= 7; i++) {
      out += '<details class="faq"><summary>' + esc(t('faq.q' + i)) + '</summary><p>' + esc(t('faq.a' + i)) + '</p></details>';
    }
    return out;
  }

  box.innerHTML =
    '<div class="card pcard"><div class="pcover"></div>'
    + '<div class="pavatar">' + UI.avatar({ name: p.name, photoUrl: p.photoUrl }, 'lg') + '</div>'
    + '<div class="h2 mt">' + esc(p.name) + '</div>'
    + '<div class="small muted">' + (p.username ? '@' + esc(p.username) + ' · ' : '') + 'ID: ' + esc(p.telegramId) + '</div>'
    + '<div class="mt"><span class="badge ok">' + Icon('star', 11) + ' ' + esc(p.levelName) + '</span></div>'
    + '<div class="bc-amount">' + money(p.balance) + '</div>'
    + '<div class="small muted">' + esc(t('home.balance')) + '</div></div>'

    + '<div class="section-title" style="margin-top:6px">' + esc(t2('prof.account')) + '</div>'
    + '<div class="grid2">'
    + '<div class="stat row gap"><div class="tile sm t-green">' + Icon('trendingUp', 18) + '</div><div><div class="v" style="font-size:16px">' + money(p.totalEarned) + '</div><div class="k">' + esc(t('prof.earned')) + '</div></div></div>'
    + '<div class="stat row gap"><div class="tile sm t-blue">' + Icon('arrowDownLeft', 18) + '</div><div><div class="v" style="font-size:16px">' + money(p.totalDeposited) + '</div><div class="k">' + esc(t('prof.deposited')) + '</div></div></div>'
    + '</div>'
    + '<div class="grid2">'
    + '<div class="stat row gap"><div class="tile sm t-violet">' + Icon('arrowUpRight', 18) + '</div><div><div class="v" style="font-size:16px">' + money(p.totalWithdrawn) + '</div><div class="k">' + esc(t('prof.withdrawn')) + '</div></div></div>'
    + '<div class="stat row gap"><div class="tile sm t-amber">' + Icon('award', 18) + '</div><div><div class="v" style="font-size:16px">' + esc(p.withdrawFeePercent) + '%</div><div class="k">' + esc(t('prof.fee')) + '</div></div></div>'
    + '</div>'
    + '<div class="card small"><span class="muted">' + esc(t('prof.monthly')) + ':</span> <b>'
    + (p.monthlyWithdrawLimit > 0 ? money(p.withdrawnThisMonth) + ' / ' + money(p.monthlyWithdrawLimit) : esc(t('prof.noLimit'))) + '</b></div>'

    + '<div class="card"><div class="row gap"><div class="tile sm t-teal">' + Icon('wallet', 18) + '</div><div class="bold">' + esc(t('prof.details')) + '</div></div>'
    + '<p class="hint mt">' + esc(t('prof.detailsHint')) + '</p>'
    + '<label class="label">' + esc(t('prof.upi')) + '</label><input class="input" id="pf-upi" value="' + esc(p.upiId) + '" placeholder="name@bank">'
    + '<label class="label">' + esc(t('prof.holder')) + '</label><input class="input" id="pf-name" value="' + esc(p.withdrawName) + '">'
    + '<label class="label">' + esc(t('prof.wallet')) + '</label><input class="input" id="pf-wallet" inputmode="numeric" maxlength="10" value="' + esc(p.walletNumber) + '">'
    + '<button class="btn block mt" id="pf-save">' + esc(t('prof.save')) + '</button></div>'

    + '<div class="card"><div class="bold mb">' + esc(t2('prof.preferences')) + '</div>'
    + '<div class="setrow"><div class="tile sm t-blue">' + Icon('globe', 18) + '</div><div class="bold">' + esc(t('prof.language')) + '</div></div>'
    + '<div id="pf-lang">' + UI.tabs([{ k: 'en', label: 'English' }, { k: 'bn', label: 'বাংলা' }], p.language) + '</div>'
    + '<div class="setrow"><div class="tile sm t-violet">' + Icon('moon', 18) + '</div><div class="bold">' + esc(t('prof.theme')) + '</div></div>'
    + '<div id="pf-theme">' + UI.tabs([{ k: 'light', label: t('prof.light') }, { k: 'dark', label: t('prof.dark') }], p.theme) + '</div>'
    + sw('pf-notif', p.notificationsOn, t('prof.notifications'), t('prof.notifHint'), 'bell', 't-amber')
    + sw('pf-hide', p.hideInClub, t('prof.hideClub'), t('prof.hideClubHint'), 'eyeOff', 't-pink')
    + '</div>'

    + '<div class="section-title">' + esc(t('prof.help')) + '</div>'
    + faq()
    + (/^https?:\/\//i.test(p.supportLink || '')
      ? '<button class="btn secondary block mt mb" id="pf-support">' + Icon('message', 18) + esc(t('prof.support')) + '</button>' : '')

    + '<div class="section-title">' + esc(t('prof.history')) + '</div>'
    + '<div class="list" id="pf-tx"></div>'
    + '<button class="btn secondary block hidden" id="pf-more">' + esc(t('prof.more')) + '</button>';

  box.querySelector('#pf-save').onclick = async () => {
    const btn = box.querySelector('#pf-save');
    UI.busy(btn, true);
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
    UI.busy(btn, false);
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
    return '<div class="item"><div class="ico ' + (credit ? 'in' : 'out') + '">' + Icon(credit ? 'arrowDownLeft' : 'arrowUpRight', 18) + '</div>'
      + '<div class="mid"><div class="t">' + esc(t('tx.' + x.type)) + '</div>'
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
        el.outerHTML = UI.emptyState('inbox', t2('es.tx'), '');
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
