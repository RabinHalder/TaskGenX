const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const Submission = require('../../models/Submission');
const { sendPayout, refundWithdrawal } = require('../../services/paymentService');
const { round2 } = require('../../utils/money');

const router = express.Router();

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, code: code, message: message });
}

async function attachUsers(txs) {
  const ids = Array.from(new Set(txs.map((t) => t.userId)));
  const users = await User.find({ telegramId: { $in: ids } }).select('telegramId firstName lastName username');
  const map = new Map(users.map((u) => [u.telegramId, u]));
  return txs.map((t) => {
    const u = map.get(t.userId);
    return {
      id: t._id,
      userId: t.userId,
      userName: u ? u.fullName : 'Unknown',
      username: u ? u.username : '',
      type: t.type,
      status: t.status,
      providerStatus: t.providerStatus,
      amount: t.amount,
      fee: t.fee,
      netAmount: t.netAmount,
      method: t.method,
      destination: t.destination,
      beneficiaryName: t.beneficiaryName,
      orderId: t.orderId,
      note: t.note,
      createdAt: t.createdAt
    };
  });
}

router.get('/stats', async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalUsers, activeToday, newToday, pendingSubmissions, pendingWithdrawals, sums, balanceAgg] =
      await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ lastActiveAt: { $gte: dayAgo } }),
        User.countDocuments({ createdAt: { $gte: dayAgo } }),
        Submission.countDocuments({ status: 'pending' }),
        Transaction.countDocuments({ type: 'withdraw', status: 'pending', providerStatus: 'awaiting_admin' }),
        Transaction.aggregate([
          {
            $match: {
              status: 'success',
              type: { $in: ['deposit', 'withdraw', 'task_reward', 'referral_commission'] }
            }
          },
          {
            $group: {
              _id: '$type',
              amount: { $sum: '$amount' },
              fee: { $sum: '$fee' },
              net: { $sum: '$netAmount' },
              count: { $sum: 1 }
            }
          }
        ]),
        User.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }])
      ]);

    const by = {};
    sums.forEach((s) => {
      by[s._id] = s;
    });
    const g = (type, key) => (by[type] ? by[type][key] : 0);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers,
        activeToday: activeToday,
        newToday: newToday,
        pendingSubmissions: pendingSubmissions,
        pendingWithdrawals: pendingWithdrawals,
        depositTotal: round2(g('deposit', 'amount')),
        depositCount: g('deposit', 'count'),
        withdrawSent: round2(g('withdraw', 'net')),
        withdrawCount: g('withdraw', 'count'),
        appFees: round2(g('deposit', 'fee') + g('withdraw', 'fee')),
        taskRewardsPaid: round2(g('task_reward', 'amount')),
        referralPaid: round2(g('referral_commission', 'amount')),
        usersBalanceTotal: round2(balanceAgg.length ? balanceAgg[0].total : 0)
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.get('/withdrawals', async (req, res) => {
  try {
    const filter = { type: 'withdraw' };
    if (String(req.query.status || 'pending') === 'pending') {
      filter.status = 'pending';
      filter.providerStatus = 'awaiting_admin';
    }
    const txs = await Transaction.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: await attachUsers(txs) });
  } catch (err) {
    console.error('Admin withdrawals error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.post('/withdrawals/:id/approve', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'INVALID_ID', 'Invalid request.');

    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.id, type: 'withdraw', status: 'pending', providerStatus: 'awaiting_admin' },
      { $set: { providerStatus: 'approved' } },
      { new: true }
    );
    if (!tx) return fail(res, 404, 'NOT_FOUND', 'Request not found or already handled.');

    const result = await sendPayout(tx);
    res.json({ success: true, data: { sent: !!result.ok, refunded: !!result.refunded } });
  } catch (err) {
    console.error('Admin approve withdraw error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.post('/withdrawals/:id/reject', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'INVALID_ID', 'Invalid request.');

    const tx = await Transaction.findOne({
      _id: req.params.id,
      type: 'withdraw',
      status: 'pending',
      providerStatus: 'awaiting_admin'
    });
    if (!tx) return fail(res, 404, 'NOT_FOUND', 'Request not found or already handled.');

    const reason = String(req.body.reason || 'Rejected by admin').slice(0, 200);
    const done = await refundWithdrawal(tx.orderId, 'rejected', reason);
    res.json({ success: true, data: { refunded: done } });
  } catch (err) {
    console.error('Admin reject withdraw error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const perPage = 30;
    const filter = {};
    if (['deposit', 'withdraw'].includes(String(req.query.type))) filter.type = String(req.query.type);
    else filter.type = { $in: ['deposit', 'withdraw'] };
    if (req.query.status) filter.status = String(req.query.status);

    const txs = await Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage);
    res.json({ success: true, data: await attachUsers(txs) });
  } catch (err) {
    console.error('Admin transactions error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

module.exports = router;
