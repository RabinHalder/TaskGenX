const User = require('../models/User');
const { getSettings } = require('./settings');
const { notifyUser } = require('./telegram');

async function checkLevelUp(userId) {
  const user = await User.findOne({ telegramId: userId });
  if (!user) return null;

  const settings = await getSettings();
  const levels = Array.from(settings.levels).sort((a, b) => a.level - b.level);

  let target = 1;
  for (const lv of levels) {
    if (user.tasksCompleted >= lv.requiredTasks && user.referralsCount >= lv.requiredReferrals) {
      target = lv.level;
    } else {
      break;
    }
  }

  if (target > user.level) {
    await User.updateOne({ telegramId: userId, level: { $lt: target } }, { $set: { level: target } });
    const lv = levels.find((l) => l.level === target);
    const name = lv ? lv.name : 'Level ' + target;
    notifyUser(userId, {
      en: '🏆 Level up!\n\nCongratulations, you are now ' + name + '. Enjoy your new benefits.',
      bn: '🏆 লেভেল আপ!\n\nঅভিনন্দন, আপনি এখন ' + name + ' লেভেলে। নতুন সুবিধা উপভোগ করুন।'
    });
    return target;
  }

  return null;
}

module.exports = { checkLevelUp };
