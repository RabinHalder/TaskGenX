const express = require('express');
const Setting = require('../../models/Setting');
const { clearSettingsCache } = require('../../services/settings');

const router = express.Router();

function num(v, fallback, min) {
  const n = Number(v);
  const lowest = min === undefined ? 0 : min;
  return Number.isFinite(n) && n >= lowest ? n : fallback;
}

router.get('/', async (req, res) => {
  try {
    const s = await Setting.getSettings();
    res.json({ success: true, data: s });
  } catch (err) {
    console.error('Admin settings get error:', err);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong.' });
  }
});

router.put('/', async (req, res) => {
  try {
    const s = await Setting.getSettings();
    const b = req.body || {};

    if (typeof b.appName === 'string' && b.appName.trim()) s.appName = b.appName.trim().slice(0, 40);
    if (typeof b.supportLink === 'string') s.supportLink = b.supportLink.trim().slice(0, 300);

    if (Array.isArray(b.extraAdmins)) {
      s.extraAdmins = b.extraAdmins.map(Number).filter((n) => Number.isInteger(n) && n > 0);
    }

    if (b.maintenance) {
      s.maintenance.enabled = !!b.maintenance.enabled;
      if (typeof b.maintenance.message === 'string') s.maintenance.message = b.maintenance.message.slice(0, 300);
    }

    if (b.deposit) {
      s.deposit.enabled = !!b.deposit.enabled;
      s.deposit.min = num(b.deposit.min, s.deposit.min, 1);
      s.deposit.max = num(b.deposit.max, s.deposit.max, 1);
      if (['percent', 'fixed'].includes(b.deposit.feeType)) s.deposit.feeType = b.deposit.feeType;
      s.deposit.feeValue = num(b.deposit.feeValue, s.deposit.feeValue, 0);
    }

    if (b.withdraw) {
      s.withdraw.enabled = !!b.withdraw.enabled;
      s.withdraw.upiEnabled = !!b.withdraw.upiEnabled;
      s.withdraw.walletEnabled = !!b.withdraw.walletEnabled;
      s.withdraw.autoApprove = !!b.withdraw.autoApprove;
      s.withdraw.min = num(b.withdraw.min, s.withdraw.min, 1);
      s.withdraw.max = num(b.withdraw.max, s.withdraw.max, 1);
      s.withdraw.dailyLimit = num(b.withdraw.dailyLimit, s.withdraw.dailyLimit, 0);
      s.withdraw.adminApprovalAbove = num(b.withdraw.adminApprovalAbove, s.withdraw.adminApprovalAbove, 0);
    }

    if (b.referral) {
      s.referral.level1Percent = Math.min(num(b.referral.level1Percent, s.referral.level1Percent, 0), 100);
      s.referral.level2Percent = Math.min(num(b.referral.level2Percent, s.referral.level2Percent, 0), 100);
    }

    if (b.bonus) {
      s.bonus.signup = num(b.bonus.signup, s.bonus.signup, 0);
      s.bonus.dailyCheckIn = num(b.bonus.dailyCheckIn, s.bonus.dailyCheckIn, 0);
    }

    if (Array.isArray(b.levels) && b.levels.length > 0) {
      s.levels = b.levels.slice(0, 20).map((l, i) => ({
        level: i + 1,
        name: String(l.name || 'Level ' + (i + 1)).trim().slice(0, 30),
        requiredTasks: Math.floor(num(l.requiredTasks, 0, 0)),
        requiredReferrals: Math.floor(num(l.requiredReferrals, 0, 0)),
        withdrawFeePercent: Math.min(num(l.withdrawFeePercent, 0, 0), 100),
        monthlyWithdrawLimit: num(l.monthlyWithdrawLimit, 0, 0)
      }));
    }

    if (Array.isArray(b.taskCategories)) {
      const cats = Array.from(new Set(b.taskCategories.map((c) => String(c).trim().slice(0, 40)).filter(Boolean))).slice(0, 12);
      if (cats.length > 0) s.taskCategories = cats;
    }

    if (b.club) {
      s.club.enabled = !!b.club.enabled;
      s.club.maxEntries = Math.min(Math.floor(num(b.club.maxEntries, s.club.maxEntries, 1)), 200);
    }

    await s.save();
    clearSettingsCache();
    res.json({ success: true, data: s });
  } catch (err) {
    console.error('Admin settings save error:', err);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong.' });
  }
});

module.exports = router;
