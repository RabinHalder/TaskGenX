window.Views = window.Views || {};

Views.club = async function (box) {
  const esc = UI.esc;
  let type = 'all';

  box.innerHTML =
    '<div class="h1">🏆 ' + esc(t('club.title')) + '</div>'
    + '<div class="muted small mb">' + esc(t('club.sub')) + '</div>'
    + UI.tabs([
      { k: 'all', label: t('club.all') },
      { k: 'deposit', label: t('club.deposits') },
      { k: 'withdraw', label: t('club.withdrawals') }
    ], type)
    + '<div id="club-list">' + UI.loader() + '</div>';

  UI.bindTabs(box, (k) => { type = k; load(); });

  function row(it) {
    const dep = it.type === 'deposit';
    const sub = [it.userIdMasked ? 'ID ' + it.userIdMasked : '', it.destinationMasked || ''].filter(Boolean).join(' · ');
    return '<div class="item"><div class="ico ' + (dep ? 'in' : 'out') + '">' + (dep ? '⬇' : '⬆') + '</div>'
      + '<div class="mid"><div class="t">' + esc(it.name) + '</div>'
      + '<div class="s">' + esc(dep ? t('club.deposited') : t('club.withdrew')) + (sub ? ' · ' + esc(sub) : '') + '</div></div>'
      + '<div class="r"><div class="t ' + (dep ? 'pos' : '') + '">' + UI.money(it.amount) + '</div>'
      + '<div class="s">' + esc(UI.timeAgo(it.time)) + '</div></div></div>';
  }

  async function load() {
    const list = box.querySelector('#club-list');
    list.innerHTML = UI.loader();
    try {
      const data = await api('/api/user/club?type=' + type);
      if (!data.enabled) { list.innerHTML = UI.empty(t('club.off')); return; }
      if (!data.items.length) { list.innerHTML = UI.empty(t('club.none')); return; }
      list.innerHTML = '<div class="list">' + data.items.map(row).join('') + '</div>';
    } catch (e) {
      list.innerHTML = UI.empty(e.message);
    }
  }

  await load();
};
