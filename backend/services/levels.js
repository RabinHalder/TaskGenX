const User = require("../models/User");
const bot = require("./telegramBot");
const { escapeHtml } = require("../utils/helpers");

// Only the fields the app needs (names are English only).
// minTasks / minReferrals = the mission to complete at this level to reach the next one.
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

// Progress toward the mission of the user's CURRENT level.
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
          tasks: { have: Math.min(user.levelTasks || 0, current.minTasks), need: current.minTasks },
          referrals: { have: Math.min(user.levelReferrals || 0, current.minReferrals), need: current.minReferrals },
        }
      : null,
  };
}

// Moves the user up when the mission of their current level is complete (tasks AND referrals).
// Silver mission (for example 10 tasks + 5 referrals) takes the user from Silver to Gold.
async function syncLevel(user, settings) {
  const levels = settings.levels || [];
  const from = Math.min(Math.max(user.level || 1, 1), levels.length || 1);
  let level = from;
  let poolTasks = user.levelTasks || 0;
  let poolRefs = user.levelReferrals || 0;
  let usedTasks = 0;
  let usedRefs = 0;

  while (level < levels.length) {
    const mission = levels[level - 1];
    const needTasks = Number(mission.minTasks) || 0;
    const needRefs = Number(mission.minReferrals) || 0;
    // A level without any mission never moves the user up on its own
    if (needTasks === 0 && needRefs === 0) break;
    if (poolTasks >= needTasks && poolRefs >= needRefs) {
      poolTasks -= needTasks;
      poolRefs -= needRefs;
      usedTasks += needTasks;
      usedRefs += needRefs;
      level++;
    } else {
      break;
    }
  }
  if (level === from) return from;

  // Only one request can win this update (it checks the old level)
  const res = await User.updateOne(
    { _id: user._id, level: user.level || 1 },
    { $set: { level }, $inc: { levelTasks: -usedTasks, levelReferrals: -usedRefs } }
  );
  if (res.modifiedCount === 1) {
    user.level = level;
    user.levelTasks = poolTasks;
    user.levelReferrals = poolRefs;
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
