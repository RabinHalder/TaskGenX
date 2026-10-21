const express = require('express');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const { dayKeyIST, startOfTodayIST, round2 } = require('../../utils/money');

const router = express.Router();

const DAY_MS = 24 * 60 * 60 * 1000;

router.get('/series', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 3), 30);
    const start = new Date(startOfTodayIST().getTime() - (days - 1) * DAY_MS);

    const [txAgg, userAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            type: { $in: ['deposit', 'withdraw'] },
            status: 'success',
            completedAt: { $gte: start }
          }
        },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'Asia/Kolkata' } },
              type: '$type'
            },
            total: { $sum: '$amount' }
          }
        }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const map = {};
    for (let i = 0; i < days; i++) {
      const key = dayKeyIST(new Date(start.getTime() + i * DAY_MS));
      map[key] = { day: key, deposits: 0, withdrawals: 0, newUsers: 0 };
    }

    txAgg.forEach((r) => {
      const row = map[r._id.day];
      if (!row) return;
      if (r._id.type === 'deposit') row.deposits = round2(r.total);
      else row.withdrawals = round2(r.total);
    });

    userAgg.forEach((r) => {
      if (map[r._id]) map[r._id].newUsers = r.count;
    });

    res.json({ success: true, data: Object.keys(map).sort().map((k) => map[k]) });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong.' });
  }
});

module.exports = router;
