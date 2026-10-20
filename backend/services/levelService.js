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
    notifyUser(userId, '🏆 Level up! You are now ' + (lv ? lv.name : 'Level ' + target) + '.');
    return target;
  }

  return null;
}

module.exports = { checkLevelUp };
