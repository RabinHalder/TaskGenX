const express = require('express');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const { isUpiId, isWalletNumber, cleanName } = require('../../utils/validate');
const { monthKey } = require('../../utils/money');

const router = express.Router();

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, code: code, message: message });
}

router.get('/', (req, res) => {
  const u = req.user;
  const levels = Array.from(req.settings.levels).sort((a, b) => a.level - b.level);
  const lv = levels.find((l) => l.level === u.level) || levels[0];
  const usedThisMonth = u.withdrawMonth === monthKey() ? u.withdrawnThisMonth : 0;

  res.json({
    success: true,
    data: {
      telegramId: u.telegramId,
      name: u.fullName,
      username: u.username,
      photoUrl: u.photoUrl,
      balance: u.balance,
      level: u.level,
      levelName: lv ? lv.name : 'Bronze',
      withdrawFeePercent: lv ? lv.withdrawFeePercent : 0,
      monthlyWithdrawLimit: lv ? lv.monthlyWithdrawLimit : 0,
      withdrawnThisMonth: usedThisMonth,
      totalEarned: u.totalEarned,
      totalDeposited: u.totalDeposited,
      totalWithdrawn: u.totalWithdrawn,
      upiId: u.upiId,
      walletNumber: u.walletNumber,
      withdrawName: u.withdrawName,
      language: u.language,
      theme: u.theme,
      notificationsOn: u.notificationsOn,
      hideInClub: u.hideInClub,
      supportLink: req.settings.supportLink
    }
  });
});

router.put('/settings', async (req, res) => {
  try {
    const b = req.body || {};
    const set = {};

    if (b.language !== undefined) {
      if (!['en', 'bn'].includes(b.language)) return fail(res, 400, 'INVALID', 'Invalid language.');
      set.language = b.language;
    }
    if (b.theme !== undefined) {
      if (!['light', 'dark'].includes(b.theme)) return fail(res, 400, 'INVALID', 'Invalid theme.');
      set.theme = b.theme;
    }
    if (b.notificationsOn !== undefined) set.notificationsOn = !!b.notificationsOn;
    if (b.hideInClub !== undefined) set.hideInClub = !!b.hideInClub;

    if (Object.keys(set).length) {
      await User.updateOne({ telegramId: req.user.telegramId }, { $set: set });
    }
    res.json({ success: true, data: set });
  } catch (err) {
    console.error('Profile settings error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.put('/withdraw-info', async (req, res) => {
  try {
    const b = req.body || {};
    const set = {};

    if (b.upiId !== undefined) {
      const v = String(b.upiId).trim();
      if (v && !isUpiId(v)) return fail(res, 400, 'INVALID_UPI', 'Enter a valid UPI ID.');
      set.upiId = v;
    }
    if (b.walletNumber !== undefined) {
      const v = String(b.walletNumber).trim();
      if (v && !isWalletNumber(v)) return fail(res, 400, 'INVALID_WALLET', 'Enter a valid 10-digit wallet number.');
      set.walletNumber = v;
    }
    if (b.withdrawName !== undefined) set.withdrawName = cleanName(b.withdrawName);

    if (Object.keys(set).length) {
      await User.updateOne({ telegramId: req.user.telegramId }, { $set: set });
    }
    res.json({ success: true, data: set });
  } catch (err) {
    console.error('Withdraw info error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const perPage = 20;
    const filter = { userId: req.user.telegramId };
    if (req.query.type) filter.type = String(req.query.type);

    const [items, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        page: page,
        totalPages: Math.max(Math.ceil(total / perPage), 1),
        items: items.map((t) => ({
          id: t._id,
          type: t.type,
          direction: t.direction,
          status: t.status,
          amount: t.amount,
          fee: t.fee,
          netAmount: t.netAmount,
          method: t.method,
          note: t.note,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (err) {
    console.error('Transactions error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

module.exports = router;
