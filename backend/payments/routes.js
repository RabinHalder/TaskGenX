const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const finzo = require('../services/finzo');
const { sendPayout, applyProviderStatus } = require('../services/paymentService');
const { notifyAdmins } = require('../services/telegram');
const { round2, monthKey, startOfTodayIST } = require('../utils/money');
const { isUpiId, isWalletNumber, cleanName } = require('../utils/validate');

const router = express.Router();

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, code: code, message: message });
}

router.post('/deposit', async (req, res) => {
  try {
    const d = req.settings.deposit;
    if (!d.enabled) return fail(res, 400, 'DEPOSIT_DISABLED', 'Deposits are currently disabled.');

    const amount = Number(req.body.amount);
    if (!Number.isInteger(amount)) return fail(res, 400, 'INVALID_AMOUNT', 'Enter a whole rupee amount.');
    if (amount < d.min || amount > d.max) {
      return fail(res, 400, 'AMOUNT_RANGE', 'Amount must be between ₹' + d.min + ' and ₹' + d.max + '.');
    }

    let fee = d.feeType === 'fixed' ? Number(d.feeValue) : (amount * Number(d.feeValue)) / 100;
    fee = round2(Math.max(fee || 0, 0));
    if (fee >= amount) return fail(res, 400, 'FEE_TOO_HIGH', 'The fee is higher than the amount.');
    const netAmount = round2(amount - fee);

    const _id = new mongoose.Types.ObjectId();
    const orderId = 'DP-' + _id.toString();

    await Transaction.create({
      _id: _id,
      userId: req.user.telegramId,
      type: 'deposit',
      direction: 'credit',
      status: 'pending',
      amount: amount,
      fee: fee,
      netAmount: netAmount,
      orderId: orderId,
      providerStatus: 'creating'
    });

    const result = await finzo.createUpiPayment(orderId, amount);
    const url = result.ok ? finzo.pickPaymentUrl(result.body) : '';

    if (!url) {
      console.error('FINZO deposit create failed:', result.httpStatus, JSON.stringify(result.body));
      await Transaction.updateOne({ _id: _id }, { $set: { status: 'failed', providerStatus: 'create_failed' } });
      if (result.configError) notifyAdmins('⚠️ FINZO_USER_ID / FINZO_API_KEY is missing on the server.');
      return fail(res, 502, 'GATEWAY_ERROR', 'Could not create the payment. Please try again later.');
    }

    await Transaction.updateOne(
      { _id: _id },
      { $set: { providerStatus: 'submitted', meta: { paymentUrl: url } } }
    );

    res.json({
      success: true,
      data: { orderId: orderId, paymentUrl: url, amount: amount, fee: fee, netAmount: netAmount, expiresInMinutes: 30 }
    });
  } catch (err) {
    console.error('Deposit error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.get('/deposit/:orderId', async (req, res) => {
  try {
    const tx = await Transaction.findOne({
      orderId: req.params.orderId,
      userId: req.user.telegramId,
      type: 'deposit'
    });
    if (!tx) return fail(res, 404, 'NOT_FOUND', 'Order not found.');

    if (['pending', 'processing'].includes(tx.status) && tx.providerStatus !== 'creating') {
      const r = await finzo.upiPaymentStatus(tx.orderId);
      if (r.ok) await applyProviderStatus(tx, finzo.pickStatus(r.body));
    }

    const fresh = await Transaction.findById(tx._id);
    res.json({ success: true, data: { status: fresh.status, amount: fresh.amount, netAmount: fresh.netAmount } });
  } catch (err) {
    console.error('Deposit status error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

router.post('/withdraw', async (req, res) => {
  try {
    const user = req.user;
    const settings = req.settings;
    const w = settings.withdraw;

    if (!w.enabled) return fail(res, 400, 'WITHDRAW_DISABLED', 'Withdrawals are currently disabled.');

    const method = String(req.body.method || '');
    const amount = round2(Number(req.body.amount));
    const destination = String(req.body.destination || '').trim();
    const name = cleanName(req.body.name);

    if (method !== 'upi' && method !== 'wallet') return fail(res, 400, 'INVALID_METHOD', 'Choose UPI or Wallet.');
    if (method === 'upi' && !w.upiEnabled) return fail(res, 400, 'METHOD_DISABLED', 'UPI withdrawal is disabled.');
    if (method === 'wallet' && !w.walletEnabled) return fail(res, 400, 'METHOD_DISABLED', 'Wallet withdrawal is disabled.');

    if (!Number.isFinite(amount) || amount <= 0) return fail(res, 400, 'INVALID_AMOUNT', 'Enter a valid amount.');
    if (amount < w.min || amount > w.max) {
      return fail(res, 400, 'AMOUNT_RANGE', 'Amount must be between ₹' + w.min + ' and ₹' + w.max + '.');
    }

    if (method === 'upi') {
      if (!isUpiId(destination)) return fail(res, 400, 'INVALID_UPI', 'Enter a valid UPI ID.');
      if (name.length < 2) return fail(res, 400, 'NAME_REQUIRED', 'Enter the account holder name.');
    } else if (!isWalletNumber(destination)) {
      return fail(res, 400, 'INVALID_WALLET', 'Enter a valid 10-digit wallet number.');
    }

    const levels = Array.from(settings.levels).sort((a, b) => a.level - b.level);
    const lv = levels.find((l) => l.level === user.level) || levels[0];
    const feePercent = lv ? Number(lv.withdrawFeePercent) || 0 : 0;
    const fee = round2((amount * feePercent) / 100);
    const netAmount = round2(amount - fee);

    if (method === 'upi' && (netAmount < 50 || netAmount > 50000)) {
      return fail(res, 400, 'NET_RANGE', 'After the fee, the UPI amount must be between ₹50 and ₹50,000.');
    }
    if (method === 'wallet' && (netAmount < 1 || netAmount > 10000)) {
      return fail(res, 400, 'NET_RANGE', 'After the fee, the wallet amount must be between ₹1 and ₹10,000.');
    }

    const month = monthKey();
    const usedThisMonth = user.withdrawMonth === month ? user.withdrawnThisMonth : 0;
    const monthlyLimit = lv ? Number(lv.monthlyWithdrawLimit) || 0 : 0;
    if (monthlyLimit > 0 && usedThisMonth + amount > monthlyLimit) {
      const left = Math.max(monthlyLimit - usedThisMonth, 0);
      return fail(res, 400, 'MONTHLY_LIMIT', 'Monthly limit reached. You can withdraw ₹' + left + ' more this month.');
    }

    if (Number(w.dailyLimit) > 0) {
      const agg = await Transaction.aggregate([
        {
          $match: {
            userId: user.telegramId,
            type: 'withdraw',
            status: { $in: ['pending', 'processing', 'success'] },
            createdAt: { $gte: startOfTodayIST() }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const todayTotal = agg.length ? agg[0].total : 0;
      if (todayTotal + amount > Number(w.dailyLimit)) {
        const left = Math.max(Number(w.dailyLimit) - todayTotal, 0);
        return fail(res, 400, 'DAILY_LIMIT', 'Daily limit reached. You can withdraw ₹' + left + ' more today.');
      }
    }

    if (user.withdrawMonth !== month) {
      await User.updateOne(
        { telegramId: user.telegramId, withdrawMonth: { $ne: month } },
        { $set: { withdrawMonth: month, withdrawnThisMonth: 0 } }
      );
    }

    const debited = await User.findOneAndUpdate(
      { telegramId: user.telegramId, balance: { $gte: amount } },
      { $inc: { balance: -amount, withdrawnThisMonth: amount } },
      { new: true }
    );
    if (!debited) return fail(res, 400, 'INSUFFICIENT_BALANCE', 'Not enough balance.');

    const _id = new mongoose.Types.ObjectId();
    const orderId = 'PO-' + _id.toString();
    const needsAdmin = !w.autoApprove || (Number(w.adminApprovalAbove) > 0 && amount > Number(w.adminApprovalAbove));

    const tx = await Transaction.create({
      _id: _id,
      userId: user.telegramId,
      type: 'withdraw',
      direction: 'debit',
      status: 'pending',
      amount: amount,
      fee: fee,
      netAmount: netAmount,
      orderId: orderId,
      method: method,
      destination: destination,
      beneficiaryName: method === 'upi' ? name : '',
      providerStatus: needsAdmin ? 'awaiting_admin' : '',
      meta: { month: month, level: lv ? lv.level : 1 }
    });

    if (needsAdmin) {
      notifyAdmins('🔔 New withdrawal request: ₹' + amount + ' (' + method.toUpperCase() + ') from user ' + user.telegramId + '. Please review it in the admin panel.');
      return res.json({
        success: true,
        data: { status: 'pending_approval', amount: amount, fee: fee, netAmount: netAmount, balance: debited.balance }
      });
    }

    await sendPayout(tx);
    const fresh = await Transaction.findById(tx._id);

    if (fresh.status === 'refunded') {
      return fail(res, 400, 'PAYOUT_FAILED', 'The withdrawal could not be completed. Your balance was returned.');
    }

    const afterUser = await User.findOne({ telegramId: user.telegramId }).select('balance');
    res.json({
      success: true,
      data: {
        status: fresh.status === 'success' ? 'success' : 'processing',
        amount: amount,
        fee: fee,
        netAmount: netAmount,
        balance: afterUser ? afterUser.balance : debited.balance
      }
    });
  } catch (err) {
    console.error('Withdraw error:', err);
    fail(res, 500, 'SERVER_ERROR', 'Something went wrong.');
  }
});

module.exports = router;
