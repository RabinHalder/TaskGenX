const Task = require('../models/Task');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { creditUser } = require('./wallet');
const { checkLevelUp } = require('./levelService');
const { notifyUser } = require('./telegram');
const { getSettings } = require('./settings');
const { round2 } = require('../utils/money');

async function payReferralCommission(userId, reward) {
  if (!(reward > 0)) return;

  const settings = await getSettings();
  const user = await User.findOne({ telegramId: userId }).select('referredBy referredByLevel2');
  if (!user) return;

  const tiers = [
    { id: user.referredBy, pct: Number(settings.referral.level1Percent) || 0, label: 'Level 1' },
    { id: user.referredByLevel2, pct: Number(settings.referral.level2Percent) || 0, label: 'Level 2' }
  ];

  for (const t of tiers) {
    if (!t.id || t.pct <= 0) continue;
    const amount = round2((reward * t.pct) / 100);
    if (amount <= 0) continue;

    const updated = await creditUser(t.id, amount, 'referral_commission', t.label + ' referral commission', {
      fromUserId: userId
    });
    if (updated) {
      await User.updateOne({ telegramId: t.id }, { $inc: { totalReferralEarned: amount } });
      notifyUser(t.id, '💰 You earned ₹' + amount + ' referral commission (' + t.label + ').');
    }
  }
}

async function approveSubmission(submissionId, adminId) {
  const sub = await Submission.findOneAndUpdate(
    { _id: submissionId, status: 'pending' },
    { $set: { status: 'approved', reviewedBy: adminId, reviewedAt: new Date() } },
    { new: true }
  );
  if (!sub) return null;

  const task = await Task.findById(sub.taskId);
  const reward = round2(task ? task.reward : 0);
  await Submission.updateOne({ _id: sub._id }, { $set: { reward: reward } });

  if (reward > 0) {
    await creditUser(sub.userId, reward, 'task_reward', 'Task: ' + (task ? task.title : ''));
    await User.updateOne({ telegramId: sub.userId }, { $inc: { totalEarned: reward } });
  }
  await User.updateOne({ telegramId: sub.userId }, { $inc: { tasksCompleted: 1 } });

  await payReferralCommission(sub.userId, reward);
  await checkLevelUp(sub.userId);

  notifyUser(sub.userId, '✅ Your task "' + (task ? task.title : '') + '" was approved. +₹' + reward);
  return sub;
}

async function rejectSubmission(submissionId, adminId, reason) {
  const sub = await Submission.findOneAndUpdate(
    { _id: submissionId, status: 'pending' },
    {
      $set: {
        status: 'rejected',
        rejectReason: String(reason || '').slice(0, 300),
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    },
    { new: true }
  );
  if (!sub) return null;

  await Task.updateOne({ _id: sub.taskId, filledCount: { $gt: 0 } }, { $inc: { filledCount: -1 } });

  const task = await Task.findById(sub.taskId);
  notifyUser(
    sub.userId,
    '❌ Your task "' + (task ? task.title : '') + '" was rejected.' + (reason ? '\nReason: ' + reason : '') + '\nYou can submit a new screenshot.'
  );
  return sub;
}

module.exports = { approveSubmission, rejectSubmission };
