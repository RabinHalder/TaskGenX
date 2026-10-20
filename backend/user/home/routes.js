const express = require('express');
const User = require('../../models/User');
const { creditUser } = require('../../services/wallet');
const { dayKeyIST, startOfTodayIST } = require('../../utils/money');

const router = express.Router();

router.get('/', (req, res) => {
  const user = req.user;
  const settings = req.settings;

  const levels = Array.from(settings.levels).sort((a, b) => a.level - b.level);
  const current = levels.find((l) => l.level === user.level) || levels[0];
  const next = levels.find((l) => l.level === user.level + 1) || null;

  const checkInAmount = Number(settings.bonus.dailyCheckIn) || 0;
  const lastKey = user.lastCheckIn ? dayKeyIST(user.lastCheckIn) : '';
  const canCheckIn = checkInAmount > 0 && lastKey !== dayKeyIST();

  res.json({
    success: true,
    data: {
      user: {
        telegramId: user.telegramId,
        name: user.fullName,
        username: user.username,
        photoUrl: user.photoUrl,
        balance: user.balance,
        level: user.level,
        levelName: current ? current.name : 'Bronze',
        tasksCompleted: user.tasksCompleted,
        referralsCount: user.referralsCount,
        language: user.language,
        theme: user.theme,
        notificationsOn: user.notificationsOn,
        hideInClub: user.hideInClub,
        isAdmin: req.isAdmin
      },
      checkIn: {
        enabled: checkInAmount > 0,
        amount: checkInAmount,
        canCheckIn: canCheckIn,
        streak: user.checkInStreak
      },
      levelInfo: {
        current: current
          ? {
              level: current.level,
              name: current.name,
              withdrawFeePercent: current.withdrawFeePercent,
              monthlyWithdrawLimit: current.monthlyWithdrawLimit
            }
          : null,
        next: next
          ? {
              level: next.level,
              name: next.name,
              requiredTasks: next.requiredTasks,
              requiredReferrals: next.requiredReferrals
            }
          : null
      },
      app: {
        name: settings.appName,
        supportLink: settings.supportLink,
        taskCategories: settings.taskCategories,
        clubEnabled: settings.club.enabled,
        deposit: {
          enabled: settings.deposit.enabled,
          min: settings.deposit.min,
          max: settings.deposit.max,
          feeType: settings.deposit.feeType,
          feeValue: settings.deposit.feeValue
        },
        withdraw: {
          enabled: settings.withdraw.enabled,
          upiEnabled: settings.withdraw.upiEnabled,
          walletEnabled: settings.withdraw.walletEnabled,
          min: settings.withdraw.min,
          max: settings.withdraw.max
        }
      }
    }
  });
});

router.post('/checkin', async (req, res) => {
  try {
    const amount = Number(req.settings.bonus.dailyCheckIn) || 0;
    if (amount <= 0) {
      return res.status(400).json({ success: false, code: 'CHECKIN_DISABLED', message: 'Daily check-in is not available.' });
    }

    const user = req.user;
    const today = dayKeyIST();
    const yesterday = dayKeyIST(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const lastKey = user.lastCheckIn ? dayKeyIST(user.lastCheckIn) : '';

    if (lastKey === today) {
      return res.status(400).json({ success: false, code: 'ALREADY_CHECKED_IN', message: 'You already checked in today.' });
    }

    const streak = lastKey === yesterday ? user.checkInStreak + 1 : 1;

    const updated = await User.findOneAndUpdate(
      {
        telegramId: user.telegramId,
        $or: [{ lastCheckIn: null }, { lastCheckIn: { $lt: startOfTodayIST() } }]
      },
      { $set: { lastCheckIn: new Date(), checkInStreak: streak } },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ success: false, code: 'ALREADY_CHECKED_IN', message: 'You already checked in today.' });
    }

    const after = await creditUser(user.telegramId, amount, 'checkin_bonus', 'Daily check-in bonus (day ' + streak + ')');

    res.json({ success: true, data: { amount: amount, streak: streak, balance: after ? after.balance : updated.balance } });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong.' });
  }
});

module.exports = router;
