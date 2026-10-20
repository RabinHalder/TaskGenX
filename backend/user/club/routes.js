const express = require('express');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const { maskUserId, maskUpi } = require('../../utils/money');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const settings = req.settings;
    if (!settings.club.enabled) {
      return res.json({ success: true, data: { enabled: false, items: [] } });
    }

    const kind = String(req.query.type || 'all');
    const types = kind === 'deposit' ? ['deposit'] : kind === 'withdraw' ? ['withdraw'] : ['deposit', 'withdraw'];
    const limit = Math.min(Math.max(Number(settings.club.maxEntries) || 50, 1), 200);

    const txs = await Transaction.find({ type: { $in: types }, status: 'success' })
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const ids = Array.from(new Set(txs.map((t) => t.userId)));
    const users = await User.find({ telegramId: { $in: ids } }).select('telegramId firstName lastName username hideInClub');
    const map = new Map(users.map((u) => [u.telegramId, u]));

    const items = txs.map((t) => {
      const u = map.get(t.userId);
      const hidden = !u || u.hideInClub;
      let destinationMasked = '';
      if (!hidden && t.type === 'withdraw') {
        destinationMasked = t.method === 'upi' ? maskUpi(t.destination) : maskUserId(t.destination);
      }
      return {
        type: t.type,
        name: hidden ? 'Anonymous' : u.fullName,
        userIdMasked: hidden ? '' : maskUserId(t.userId),
        destinationMasked: destinationMasked,
        amount: t.type === 'withdraw' ? t.netAmount : t.amount,
        time: t.completedAt || t.createdAt
      };
    });

    res.json({ success: true, data: { enabled: true, items: items } });
  } catch (err) {
    console.error('Club error:', err);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong.' });
  }
});

module.exports = router;
