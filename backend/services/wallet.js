const User = require("../models/User");
const Task = require("../models/Task");
const Submission = require("../models/Submission");
const Transaction = require("../models/Transaction");
const { round2, escapeHtml } = require("../utils/helpers");
const { getSettings } = require("./settings");
const { syncLevel } = require("./levels");
const bot = require("./telegramBot");

async function credit(userId, amount, type, note = "", ref = "", inc = {}) {
  amount = round2(amount);
  if (!(amount > 0)) throw new Error("Invalid credit amount");
  const user = await User.findByIdAndUpdate(userId, { $inc: { balance: amount, ...inc } }, { new: true });
  if (!user) throw new Error("User not found");
  await Transaction.create({
    user: user._id,
    tgId: user.tgId,
    type,
    amount,
    balanceAfter: user.balance,
    note,
    ref,
  });
  return user;
}

// Returns null if the balance is not enough.
async function debit(userId, amount, type, note = "", ref = "", inc = {}) {
  amount = round2(amount);
  if (!(amount > 0)) throw new Error("Invalid debit amount");
  const user = await User.findOneAndUpdate(
    { _id: userId, balance: { $gte: amount } },
    { $inc: { balance: -amount, ...inc } },
    { new: true }
  );
  if (!user) return null;
  await Transaction.create({
    user: user._id,
    tgId: user.tgId,
    type,
    amount: -amount,
    balanceAfter: user.balance,
    note,
    ref,
  });
  return user;
}

// Fixed reward to the referrer, paid once per referred user.
// trigger is "join" or "first_task"; it must match the Settings choice.
async function rewardReferral(user, trigger, settings) {
  const r = (settings && settings.referral) || {};
  const amt = round2(r.reward);
  if (!r.enabled || r.payOn !== trigger || !(amt > 0) || !user.referredBy) return null;

  // Atomic: only the first caller gets to pay
  const claimed = await User.findOneAndUpdate(
    { _id: user._id, referralRewarded: { $ne: true } },
    { $set: { referralRewarded: true } }
  );
  if (!claimed) return null;

  const referrer = await User.findOne({ tgId: user.referredBy });
  if (!referrer || referrer.isBanned) return null;

  const updated = await credit(referrer._id, amt, "referral", `Referral reward (${user.tgId})`, String(user.tgId), {
    referralEarnings: amt,
  });
  bot.notifyUser(
    updated,
    `You earned ₹${amt} for inviting a friend.`,
    `বন্ধুকে আমন্ত্রণ জানানোর জন্য আপনি ₹${amt} পেয়েছেন।`,
    [bot.openAppButton("Open TaskGenX")]
  );
  return updated;
}

async function approveSubmission(subId, adminTgId) {
  const sub = await Submission.findOneAndUpdate(
    { _id: subId, status: "pending" },
    { $set: { status: "approved", reviewedBy: adminTgId, reviewedAt: new Date() } },
    { new: true }
  );
  if (!sub) return null;

  const settings = await getSettings();
  let user;
  try {
    user = await credit(sub.user, sub.reward, "task", "Task reward", String(sub._id), {
      totalEarned: sub.reward,
      tasksApproved: 1,
    });
  } catch (e) {
    await Submission.updateOne({ _id: sub._id }, { $set: { status: "pending", reviewedBy: null, reviewedAt: null } });
    throw e;
  }

  try {
    await rewardReferral(user, "first_task", settings);
  } catch (e) {
    console.error("Referral reward failed:", e.message);
  }
  await syncLevel(user, settings);

  const task = await Task.findById(sub.task).select("title");
  const title = escapeHtml((task && task.title.en) || "Task");
  const titleBn = escapeHtml((task && (task.title.bn || task.title.en)) || "টাস্ক");
  bot.notifyUser(
    user,
    `Your task "${title}" was approved. ₹${sub.reward} added to your balance.`,
    `আপনার "${titleBn}" টাস্ক অনুমোদিত হয়েছে। ₹${sub.reward} ব্যালেন্সে যোগ হয়েছে।`,
    [bot.openAppButton("Open TaskGenX")]
  );
  return sub;
}

async function rejectSubmission(subId, adminTgId, reason) {
  const sub = await Submission.findOneAndUpdate(
    { _id: subId, status: "pending" },
    { $set: { status: "rejected", rejectReason: reason, reviewedBy: adminTgId, reviewedAt: new Date() } },
    { new: true }
  );
  if (!sub) return null;

  await Task.updateOne({ _id: sub.task, filled: { $gt: 0 } }, { $inc: { filled: -1 } });

  const [user, task] = await Promise.all([User.findById(sub.user), Task.findById(sub.task).select("title")]);
  const title = escapeHtml((task && task.title.en) || "Task");
  const titleBn = escapeHtml((task && (task.title.bn || task.title.en)) || "টাস্ক");
  const why = escapeHtml(reason);
  bot.notifyUser(
    user,
    `Your proof for "${title}" was rejected.\nReason: ${why}`,
    `"${titleBn}" টাস্কের প্রমাণ বাতিল হয়েছে।\nকারণ: ${why}`,
    [bot.openAppButton("Open TaskGenX")]
  );
  return sub;
}

module.exports = { credit, debit, rewardReferral, approveSubmission, rejectSubmission };
