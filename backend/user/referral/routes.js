const express = require('express');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const me = req.user;
    const settings = req.settings;

    const botUsername = process.env.BOT_USERNAME || '';
    const shortName = process.env.APP_SHORT_NAME || '';
    let link = '';
    if (botUsername) {
      link = shortName
        ? 'https://t.me/' + botUsername + '/' + shortName + '?startapp=' + me.telegramId
        : 'https://t.me/' + botUsername + '?startapp=' + me.telegramId;
    }

    const [level1Count, level2Count, recent, commissions] = await Promise.all([
      User.countDocuments({ referredBy: me.telegramId }),
      User.countDocuments({ referredByLevel2: me.telegramId }),
      User.find({ referredBy: me.telegramId })
        .sort({ createdAt: -1 })
        .limit(30)
        .select('firstName lastName username createdAt tasksCompleted'),
      Transaction.find({ userId: me.telegramId, type: 'referral_commission' }).sort({ createdAt: -1 }).limit(20)
    ]);

    res.json({
      success: true,
      data: {
        referralCode: String(me.telegramId),
        link: link,
        level1Percent: settings.referral.level1Percent,
        level2Percent: settings.referral.level2Percent,
        level1Count: level1Count,
        level2Count: level2Count,
        totalEarned: me.totalReferralEarned,
        referrals: recent.map((u) => ({
          name: u.fullName,
          username: u.username,
          joinedAt: u.createdAt,
          tasksCompleted: u.tasksCompleted
        })),
        commissions: commissions.map((t) => ({ amount: t.amount, note: t.note, time: t.createdAt }))
      }
    });
  } catch (err) {
    console.error('Referral error:', err);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong.' });
  }
});

module.exports = router;
