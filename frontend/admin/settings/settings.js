window.Views = window.Views || {};

Views['admin.settings'] = async function (box) {
  const esc = UI.esc;
  const s = await api('/api/admin/settings');

  let levels = s.levels.map((l) => ({
    name: l.name,
    requiredTasks: l.requiredTasks,
    requiredReferrals: l.requiredReferrals,
    withdrawFeePercent: l.withdrawFeePercent,
    monthlyWithdrawLimit: l.monthlyWithdrawLimit
  }));

  function lbl(label) { return '<label class="label">' + esc(label) + '</label>'; }
  function fNum(path, label, v) {
    return lbl(label) + '<input class="input" type="number" step="any" data-p="' + path + '" data-t="n" value="' + esc(v) + '">';
  }
  function fTxt(path, label, v) {
    return lbl(label) + '<input class="input" type="text" data-p="' + path + '" data-t="s" value="' + esc(v) + '">';
  }
  function fChk(path, label, v) {
    return '<div class="row between sw-row"><span>' + esc(label) + '</span><label class="switch">'
      + '<input type="checkbox" data-p="' + path + '" data-t="b"' + (v ? ' checked' : '') + '><i></i></label></div>';
  }
  function fSel(path, label, v, options) {
    return lbl(label) + '<select class="input" data-p="' + path + '" data-t="s">'
      + options.map((k) => '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + k + '</option>').join('') + '</select>';
  }
  function sec(title, inner) {
    return '<div class="card"><div class="bold mb">' + esc(title) + '</div>' + inner + '</div>';
  }

  box.innerHTML =
    '<div class="h1">Settings</div>'
    + sec('General',
      fTxt('appName', 'App name', s.appName)
      + fTxt('supportLink', 'Support link (Telegram or web)', s.supportLink)
      + lbl('Task categories (comma separated)')
      + '<input class="input" id="st-cats" value="' + esc(s.taskCategories.join(', ')) + '">'
      + lbl('Extra admin Telegram IDs (comma separated)')
      + '<input class="input" id="st-admins" value="' + esc(s.extraAdmins.join(', ')) + '">')
    + sec('Maintenance',
      fChk('maintenance.enabled', 'Maintenance mode (blocks everyone except admins)', s.maintenance.enabled)
      + fTxt('maintenance.message', 'Message shown to users', s.maintenance.message))
    + sec('Deposit',
      fChk('deposit.enabled', 'Deposits enabled', s.deposit.enabled)
      + fNum('deposit.min', 'Minimum amount (₹)', s.deposit.min)
      + fNum('deposit.max', 'Maximum amount (₹)', s.deposit.max)
      + fSel('deposit.feeType', 'Fee type', s.deposit.feeType, ['percent', 'fixed'])
      + fNum('deposit.feeValue', 'Fee value (% or ₹)', s.deposit.feeValue))
    + sec('Withdraw',
      fChk('withdraw.enabled', 'Withdrawals enabled', s.withdraw.enabled)
      + fChk('withdraw.upiEnabled', 'UPI enabled', s.withdraw.upiEnabled)
      + fChk('withdraw.walletEnabled', 'FINZO Wallet enabled', s.withdraw.walletEnabled)
      + fChk('withdraw.autoApprove', 'Automatic payout (off = admin approves every request)', s.withdraw.autoApprove)
      + fNum('withdraw.min', 'Minimum amount (₹)', s.withdraw.min)
      + fNum('withdraw.max', 'Maximum amount (₹)', s.withdraw.max)
      + fNum('withdraw.dailyLimit', 'Daily limit per user (₹, 0 = no limit)', s.withdraw.dailyLimit)
      + fNum('withdraw.adminApprovalAbove', 'Admin approval above (₹, 0 = off)', s.withdraw.adminApprovalAbove))
    + sec('Referral',
      fNum('referral.level1Percent', 'Level 1 commission (%)', s.referral.level1Percent)
      + fNum('referral.level2Percent', 'Level 2 commission (%)', s.referral.level2Percent))
    + sec('Bonus',
      fNum('bonus.signup', 'Signup bonus (₹, 0 = off)', s.bonus.signup)
      + fNum('bonus.dailyCheckIn', 'Daily check-in bonus (₹, 0 = off)', s.bonus.dailyCheckIn))
    + sec('Club',
      fChk('club.enabled', 'Club enabled', s.club.enabled)
      + fNum('club.maxEntries', 'Entries shown', s.club.maxEntries))
    + '<div class="card"><div class="bold mb">Levels</div><div id="st-levels"></div></div>'
    + '<button class="btn block" id="st-save">Save settings</button>';

  function readLevels() {
    return Array.prototype.map.call(box.querySelectorAll('.lv'), (r) => {
      const g = (k) => r.querySelector('[data-lv="' + k + '"]').value;
      return {
        name: g('name'),
        requiredTasks: Number(g('requiredTasks')),
        requiredReferrals: Number(g('requiredReferrals')),
        withdrawFeePercent: Number(g('withdrawFeePercent')),
        monthlyWithdrawLimit: Number(g('monthlyWithdrawLimit'))
      };
    });
  }

  function renderLevels() {
    box.querySelector('#st-levels').innerHTML = levels.map((l, i) =>
      '<div class="lv"><div class="bold">Level ' + (i + 1) + '</div><div class="grid2">'
      + '<div>' + lbl('Name') + '<input class="input" data-lv="name" value="' + esc(l.name) + '"></div>'
      + '<div>' + lbl('Tasks needed') + '<input class="input" type="number" data-lv="requiredTasks" value="' + esc(l.requiredTasks) + '"></div>'
      + '<div>' + lbl('Referrals needed') + '<input class="input" type="number" data-lv="requiredReferrals" value="' + esc(l.requiredReferrals) + '"></div>'
      + '<div>' + lbl('Withdraw fee %') + '<input class="input" type="number" step="any" data-lv="withdrawFeePercent" value="' + esc(l.withdrawFeePercent) + '"></div>'
      + '<div>' + lbl('Monthly limit ₹ (0 = none)') + '<input class="input" type="number" step="any" data-lv="monthlyWithdrawLimit" value="' + esc(l.monthlyWithdrawLimit) + '"></div>'
      + '</div></div>'
    ).join('')
      + '<div class="row gap"><button class="btn secondary block" id="lv-add">＋ Add level</button>'
      + '<button class="btn secondary block" id="lv-del">− Remove last</button></div>';

    box.querySelector('#lv-add').onclick = () => {
      levels = readLevels();
      levels.push({ name: 'Level ' + (levels.length + 1), requiredTasks: 0, requiredReferrals: 0, withdrawFeePercent: 0, monthlyWithdrawLimit: 0 });
      renderLevels();
    };
    box.querySelector('#lv-del').onclick = () => {
      levels = readLevels();
      if (levels.length > 1) levels.pop();
      renderLevels();
    };
  }

  function collect() {
    const out = {};
    box.querySelectorAll('[data-p]').forEach((el) => {
      const keys = el.dataset.p.split('.');
      let o = out;
      keys.slice(0, -1).forEach((k) => { o[k] = o[k] || {}; o = o[k]; });
      const last = keys[keys.length - 1];
      o[last] = el.dataset.t === 'b' ? el.checked : el.dataset.t === 'n' ? Number(el.value) : el.value;
    });
    out.taskCategories = box.querySelector('#st-cats').value.split(',').map((x) => x.trim()).filter(Boolean);
    out.extraAdmins = box.querySelector('#st-admins').value.split(',').map((x) => Number(x.trim())).filter((n) => n > 0);
    out.levels = readLevels();
    return out;
  }

  renderLevels();

  box.querySelector('#st-save').onclick = async () => {
    const btn = box.querySelector('#st-save');
    btn.disabled = true;
    try {
      await api('/api/admin/settings', { method: 'PUT', body: collect() });
      await App.reloadHome();
      UI.toast('Settings saved', 'ok');
    } catch (e) {
      UI.toast(e.message, 'bad');
    }
    btn.disabled = false;
  };
};
