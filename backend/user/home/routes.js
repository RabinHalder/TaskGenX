const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const user = req.user;
  const settings = req.settings;

  const levels = Array.from(settings.levels).sort((a, b) => a.level - b.level);
  const current = levels.find((l) => l.level === user.level) || levels[0];
  const next = levels.find((l) => l.level === user.level + 1) || null;

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

module.exports = router;
