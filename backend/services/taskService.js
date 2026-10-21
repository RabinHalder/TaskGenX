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
    { id: user.referredBy, pct: Number(settings.referral.level1Percent) || 0, label: 'Level 1', labelBn: 'লেভেল ১' },
    { id: user.referredByLevel2, pct: Number(settings.referral.level2Percent) || 0, label: 'Level 2', labelBn: 'লেভেল ২' }
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
      notifyUser(t.id, {
        en: '💰 Referral commission\n\nYou earned ₹' + amount + ' (' + t.label + ') from your referral’s completed task.',
        bn: '💰 রেফারেল কমিশন\n\nআপনার রেফারেলের সম্পন্ন টাস্ক থেকে আপনি ₹' + amount + ' (' + t.labelBn + ') কমিশন পেয়েছেন।'
      });
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

  const title = task ? task.title : '';
  notifyUser(sub.userId, {
    en: '✅ Task approved\n\n“' + title + '” was approved. ₹' + reward + ' has been added to your balance.',
    bn: '✅ টাস্ক অনুমোদিত\n\n“' + title + '” অনুমোদিত হয়েছে। আপনার ব্যালেন্সে ₹' + reward + ' যোগ হয়েছে।'
  });
  return sub;
}

async function rejectSubmission(submissionId, adminId, reason) {
  const cleanReason = String(reason || '').slice(0, 300);

  const sub = await Submission.findOneAndUpdate(
    { _id: submissionId, status: 'pending' },
    {
      $set: {
        status: 'rejected',
        rejectReason: cleanReason,
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    },
    { new: true }
  );
  if (!sub) return null;

  await Task.updateOne({ _id: sub.taskId, filledCount: { $gt: 0 } }, { $inc: { filledCount: -1 } });

  const task = await Task.findById(sub.taskId);
  const title = task ? task.title : '';
  notifyUser(sub.userId, {
    en: '❌ Task not approved\n\n“' + title + '” was not approved.' + (cleanReason ? '\nReason: ' + cleanReason : '') + '\n\nYou can submit a new screenshot from the Task tab.',
    bn: '❌ টাস্ক অনুমোদিত হয়নি\n\n“' + title + '” অনুমোদিত হয়নি।' + (cleanReason ? '\nকারণ: ' + cleanReason : '') + '\n\nটাস্ক ট্যাব থেকে আপনি নতুন স্ক্রিনশট জমা দিতে পারবেন।'
  });
  return sub;
}

module.exports = { approveSubmission, rejectSubmission };
