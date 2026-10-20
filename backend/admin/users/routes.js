const express = require('express');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const Submission = require('../../models/Submission');
const { creditUser, debitUser } = require('../../services/wallet');
const { notifyUser } = require('../../services/telegram');
const { round2 } = require('../../utils/money');

const router = express.Router();

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, code: code, message: message });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function brief(u) {
  return {
    telegramId: u.telegramId,
    name: u.fullName,
    username: u.username,
    balance: u.balance,
    level: u.level,
    tasksCompleted: u.tasksCompleted,
    referralsCount: u.referralsCount,
    isBanned: u.isBanned,
    createdAt: u.createdAt,
    lastActiveAt: u.lastActiveAt
  };
}

router.get('/', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const perPage = 20;
    const q = String(req.query.q || '').trim();

    let filter = {};
    if (q) {
      if (/^\d+$/.test(q)) {
        filter = { telegramId: Number(q) };
      } else {
        const rx = new RegExp(escapeRegex(q), 'i');
        filter = { $or: [{ firstName: rx }, { lastName: rx }, { username: rx }] };
      }
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: { page: page, totalPages: Math.max(Math.ceil(total / perPage), 1), total: total, items: users.map(brief) }
    });
  } catch (err) {
    console.error('Admin users error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.get('/:telegramId', async (req, res) => {
  try {
    const id = Number(req.params.telegramId);
    const user = await User.findOne({ telegramId: id });
    if (!user) return fail(res, 404, 'NOT_FOUND', 'User not found.');

    const [txs, approved, pending, rejected] = await Promise.all([
      Transaction.find({ userId: id }).sort({ createdAt: -1 }).limit(30),
      Submission.countDocuments({ userId: id, status: 'approved' }),
      Submission.countDocuments({ userId: id, status: 'pending' }),
      Submission.countDocuments({ userId: id, status: 'rejected' })
    ]);

    res.json({
      success: true,
      data: {
        user: Object.assign(brief(user), {
          totalEarned: user.totalEarned,
          totalReferralEarned: user.totalReferralEarned,
          totalDeposited: user.totalDeposited,
          totalWithdrawn: user.totalWithdrawn,
          referredBy: user.referredBy,
          upiId: user.upiId,
          walletNumber: user.walletNumber,
          banReason: user.banReason
        }),
        submissions: { approved: approved, pending: pending, rejected: rejected },
        transactions: txs.map((t) => ({
          type: t.type,
          direction: t.direction,
          status: t.status,
          amount: t.amount,
          fee: t.fee,
          netAmount: t.netAmount,
          note: t.note,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (err) {
    console.error('Admin user detail error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.post('/:telegramId/ban', async (req, res) => {
  try {
    const id = Number(req.params.telegramId);
    const ban = !!req.body.ban;
    const reason = String(req.body.reason || '').slice(0, 200);

    const user = await User.findOneAndUpdate(
      { telegramId: id },
      { $set: { isBanned: ban, banReason: ban ? reason : '' } },
      { new: true }
    );
    if (!user) return fail(res, 404, 'NOT_FOUND', 'User not found.');

    res.json({ success: true, data: { isBanned: user.isBanned } });
  } catch (err) {
    console.error('Admin ban error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.post('/:telegramId/balance', async (req, res) => {
  try {
    const id = Number(req.params.telegramId);
    const amount = round2(Number(req.body.amount));
    const note = String(req.body.note || 'Admin adjustment').slice(0, 200);

    if (!Number.isFinite(amount) || amount === 0) return fail(res, 400, 'INVALID_AMOUNT', 'Enter a valid amount.');

    let user;
    if (amount > 0) {
      user = await creditUser(id, amount, 'admin_adjust', note);
    } else {
      user = await debitUser(id, Math.abs(amount));
      if (user) {
        await Transaction.create({
          userId: id,
          type: 'admin_adjust',
          direction: 'debit',
          status: 'success',
          amount: Math.abs(amount),
          netAmount: Math.abs(amount),
          note: note,
          completedAt: new Date()
        });
      }
    }

    if (!user) return fail(res, 400, 'FAILED', 'User not found or not enough balance.');

    notifyUser(id, (amount > 0 ? '➕ ₹' + amount + ' was added to your balance.' : '➖ ₹' + Math.abs(amount) + ' was deducted from your balance.'));
    res.json({ success: true, data: { balance: user.balance } });
  } catch (err) {
    console.error('Admin balance error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

module.exports = router;
