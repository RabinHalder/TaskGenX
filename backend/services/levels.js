const User = require("../models/User");
const bot = require("./telegramBot");
const { escapeHtml } = require("../utils/helpers");

// Only the fields the app needs (names are English only).
function cleanLevel(L) {
  if (!L) return null;
  return {
    name: L.name,
    minTasks: L.minTasks,
    minReferrals: L.minReferrals,
    withdrawFeePercent: L.withdrawFeePercent,
    monthlyWithdrawals: L.monthlyWithdrawals === undefined || L.monthlyWithdrawals === null ? 2 : L.monthlyWithdrawals,
  };
}

function computeLevel(settings, user) {
  const levels = settings.levels || [];
  let lvl = 1;
  for (let i = 0; i < levels.length; i++) {
    const L = levels[i];
    if ((user.tasksApproved || 0) >= L.minTasks && (user.referralCount || 0) >= L.minReferrals) {
      lvl = i + 1;
    } else {
      break;
    }
  }
  return lvl;
}

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
          tasks: { have: user.tasksApproved || 0, need: next.minTasks },
          referrals: { have: user.referralCount || 0, need: next.minReferrals },
        }
      : null,
  };
}

// Raises the stored level if the user qualifies, and notifies them.
async function syncLevel(user, settings) {
  const target = computeLevel(settings, user);
  if (target <= (user.level || 1)) return user.level || 1;

  const res = await User.updateOne({ _id: user._id, level: { $lt: target } }, { $set: { level: target } });
  if (res.modifiedCount === 1) {
    user.level = target;
    const name = escapeHtml(((settings.levels || [])[target - 1] || {}).name || "");
    bot.notifyUser(
      user,
      `Congratulations! You reached level ${target}: <b>${name}</b>.`,
      `অভিনন্দন! আপনি লেভেল ${target} (<b>${name}</b>) এ পৌঁছেছেন।`,
      [bot.openAppButton("Open TaskGenX")]
    );
  }
  return user.level;
}

module.exports = { cleanLevel, computeLevel, levelInfo, syncLevel };
