window.Views = window.Views || {};

Views.referral = async function (box) {
  const esc = UI.esc;
  const money = UI.money;
  const d = await api('/api/user/referral');

  const linkBlock = d.link
    ? '<div class="linkbox">' + esc(d.link) + '</div>'
      + '<div class="row gap mt"><button class="btn block" id="rf-copy">' + esc(t('common.copy')) + '</button>'
      + '<button class="btn secondary block" id="rf-share">' + esc(t('common.share')) + '</button></div>'
    : '<div class="note">' + esc(t('ref.noLink')) + '</div>'
      + '<div class="bold">' + esc(t('ref.code')) + ': ' + esc(d.referralCode) + '</div>';

  const refList = d.referrals.length
    ? '<div class="list">' + d.referrals.map((r) =>
      '<div class="item"><div class="mid"><div class="t">' + esc(r.name) + '</div>'
      + '<div class="s">' + (r.username ? '@' + esc(r.username) + ' · ' : '') + esc(UI.timeAgo(r.joinedAt)) + '</div></div>'
      + '<div class="r"><span class="badge">' + esc(t('ref.tasksDone', { n: r.tasksCompleted })) + '</span></div></div>'
    ).join('') + '</div>'
    : UI.empty(t('ref.noneRef'));

  const commList = d.commissions.length
    ? '<div class="list">' + d.commissions.map((c) =>
      '<div class="item"><div class="mid"><div class="t">' + esc(c.note) + '</div>'
      + '<div class="s">' + esc(UI.timeAgo(c.time)) + '</div></div>'
      + '<div class="r"><div class="t pos">+' + money(c.amount) + '</div></div></div>'
    ).join('') + '</div>'
    : UI.empty(t('ref.noneComm'));

  box.innerHTML =
    '<div class="h1">👥 ' + esc(t('ref.title')) + '</div>'
    + '<div class="card"><div class="bold mb">' + esc(t('ref.yourLink')) + '</div>' + linkBlock
    + '<div class="small muted mt">' + esc(t('ref.how', { p1: d.level1Percent, p2: d.level2Percent })) + '</div></div>'
    + '<div class="grid2">'
    + '<div class="stat"><div class="v">' + d.level1Count + '</div><div class="k">' + esc(t('ref.l1', { pct: d.level1Percent })) + '</div></div>'
    + '<div class="stat"><div class="v">' + d.level2Count + '</div><div class="k">' + esc(t('ref.l2', { pct: d.level2Percent })) + '</div></div>'
    + '</div>'
    + '<div class="stat"><div class="v">' + money(d.totalEarned) + '</div><div class="k">' + esc(t('ref.earned')) + '</div></div>'
    + '<div class="section-title">' + esc(t('ref.recent')) + '</div>' + refList
    + '<div class="section-title">' + esc(t('ref.commissions')) + '</div>' + commList;

  const copyBtn = box.querySelector('#rf-copy');
  if (copyBtn) copyBtn.onclick = () => UI.copyText(d.link);
  const shareBtn = box.querySelector('#rf-share');
  if (shareBtn) {
    shareBtn.onclick = () => {
      UI.openLink('https://t.me/share/url?url=' + encodeURIComponent(d.link) + '&text=' + encodeURIComponent(t('ref.shareText')));
    };
  }
};
