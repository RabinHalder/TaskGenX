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
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { balance: amount, ...inc } },
    { new: true }
  );
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

async function payReferral(user, reward, settings, ref) {
  const pairs = [
    [user.referredBy, settings.referral.l1Percent, "referral_l1"],
    [user.referredBy2, settings.referral.l2Percent, "referral_l2"],
  ];
  for (const [refTgId, pct, type] of pairs) {
    if (!refTgId) continue;
    const amt = round2((reward * pct) / 100);
    if (!(amt > 0)) continue;
    const referrer = await User.findOne({ tgId: refTgId });
    if (!referrer || referrer.isBanned) continue;
    const updated = await credit(
      referrer._id,
      amt,
      type,
      type === "referral_l1" ? "Level 1 referral commission" : "Level 2 referral commission",
      ref,
      { referralEarnings: amt }
    );
    bot.notifyUser(
      updated,
      `You earned ₹${amt} referral commission.`,
      `আপনি ₹${amt} রেফারেল কমিশন পেয়েছেন।`
    );
  }
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
    await Submission.updateOne(
      { _id: sub._id },
      { $set: { status: "pending", reviewedBy: null, reviewedAt: null } }
    );
    throw e;
  }

  if (settings.referral.enabled) {
    try {
      await payReferral(user, sub.reward, settings, String(sub._id));
    } catch (e) {
      console.error("Referral payout failed:", e.message);
    }
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
    {
      $set: {
        status: "rejected",
        rejectReason: reason,
        reviewedBy: adminTgId,
        reviewedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!sub) return null;

  await Task.updateOne({ _id: sub.task, filled: { $gt: 0 } }, { $inc: { filled: -1 } });

  const [user, task] = await Promise.all([
    User.findById(sub.user),
    Task.findById(sub.task).select("title"),
  ]);
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

module.exports = { credit, debit, approveSubmission, rejectSubmission };
