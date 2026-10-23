const User = require("../models/User");
const bot = require("./telegramBot");
const { escapeHtml } = require("../utils/helpers");

// Only the fields the app needs (names are English only).
function cleanLevel(L) {
  if (!L) return null;
  return {
    name: L.name,
    minTasks: Number(L.minTasks) || 0,
    minReferrals: Number(L.minReferrals) || 0,
    withdrawFeePercent: L.withdrawFeePercent,
    monthlyWithdrawals: L.monthlyWithdrawals === undefined || L.monthlyWithdrawals === null ? 2 : L.monthlyWithdrawals,
  };
}

// Progress toward the NEXT level: tasks counted since the user entered the current level.
function levelInfo(settings, user) {
  const levels = settings.levels || [];
  const idx = Math.min(Math.max(user.level || 1, 1), levels.length || 1);
  const current = cleanLevel(levels[idx - 1]);
  const next = cleanLevel(levels[idx]);
  return {
    level: idx,
    totalLevels: levels.length,
    current,
    next,
    progress: next
      ? {
          tasks: { have: Math.min(user.levelTasks || 0, next.minTasks), need: next.minTasks },
          referrals: { have: user.referralCount || 0, need: next.minReferrals },
        }
      : null,
  };
}

// Moves the user up one or more levels when the targets of the next level are met.
// Bronze -> Silver uses the Silver targets, Silver -> Gold uses the Gold targets, and so on.
async function syncLevel(user, settings) {
  const levels = settings.levels || [];
  const from = Math.min(Math.max(user.level || 1, 1), levels.length || 1);
  let level = from;
  let pool = user.levelTasks || 0;
  let used = 0;

  while (level < levels.length) {
    const nxt = levels[level];
    const needTasks = Number(nxt.minTasks) || 0;
    const needRefs = Number(nxt.minReferrals) || 0;
    if (pool >= needTasks && (user.referralCount || 0) >= needRefs) {
      pool -= needTasks;
      used += needTasks;
      level++;
    } else {
      break;
    }
  }
  if (level === from) return from;

  // Only one request can win this update (it checks the old level)
  const res = await User.updateOne(
    { _id: user._id, level: user.level || 1 },
    { $set: { level }, $inc: { levelTasks: -used } }
  );
  if (res.modifiedCount === 1) {
    user.level = level;
    user.levelTasks = pool;
    const name = escapeHtml((levels[level - 1] || {}).name || "");
    bot.notifyUser(
      user,
      `Congratulations! You reached level ${level}: <b>${name}</b>.`,
      `অভিনন্দন! আপনি লেভেল ${level} (<b>${name}</b>) এ পৌঁছেছেন।`,
      [bot.openAppButton("Open TaskGenX")]
    );
  }
  return user.level;
}

module.exports = { cleanLevel, levelInfo, syncLevel };
