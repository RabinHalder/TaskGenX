const Transaction = require('../models/Transaction');
const User = require('../models/User');
const finzo = require('./finzo');
const { notifyUser, notifyAdmins } = require('./telegram');

const OPEN = ['pending', 'processing'];

function normalizeStatus(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'success') return 'success';
  if (['failed', 'expired', 'cancelled', 'canceled', 'refunded', 'rejected'].includes(v)) return 'failed';
  if (v === 'processing') return 'processing';
  return 'pending';
}

async function settleDeposit(orderId, rawStatus) {
  const status = normalizeStatus(rawStatus);

  if (status === 'success') {
    const tx = await Transaction.findOneAndUpdate(
      { orderId: orderId, type: 'deposit', status: { $in: OPEN } },
      { $set: { status: 'success', providerStatus: String(rawStatus), completedAt: new Date() } },
      { new: true }
    );
    if (!tx) return false;

    await User.updateOne(
      { telegramId: tx.userId },
      { $inc: { balance: tx.netAmount, totalDeposited: tx.amount } }
    );
    notifyUser(tx.userId, {
      en: '✅ Deposit successful\n\nWe received ₹' + tx.amount + '. ₹' + tx.netAmount + ' has been added to your balance.',
      bn: '✅ ডিপোজিট সফল হয়েছে\n\n₹' + tx.amount + ' পাওয়া গেছে। আপনার ব্যালেন্সে ₹' + tx.netAmount + ' যোগ হয়েছে।'
    });
    return true;
  }

  if (status === 'failed') {
    const tx = await Transaction.findOneAndUpdate(
      { orderId: orderId, type: 'deposit', status: { $in: OPEN } },
      { $set: { status: 'failed', providerStatus: String(rawStatus), completedAt: new Date() } },
      { new: true }
    );
    if (tx) {
      notifyUser(tx.userId, {
        en: '❌ Deposit not completed\n\nYour payment of ₹' + tx.amount + ' was not completed and no money was added. If you were charged, please contact support.',
        bn: '❌ ডিপোজিট সম্পন্ন হয়নি\n\nআপনার ₹' + tx.amount + ' পেমেন্ট সম্পন্ন হয়নি এবং কোনো টাকা যোগ হয়নি। আপনার টাকা কাটা গিয়ে থাকলে অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।'
      });
    }
    return !!tx;
  }

  if (status === 'processing') {
    await Transaction.updateOne(
      { orderId: orderId, type: 'deposit', status: 'pending' },
      { $set: { status: 'processing', providerStatus: String(rawStatus) } }
    );
  }
  return false;
}

async function settleWithdrawal(orderId, rawStatus) {
  const tx = await Transaction.findOneAndUpdate(
    {
      orderId: orderId,
      type: 'withdraw',
      status: { $in: OPEN },
      providerStatus: { $ne: 'awaiting_admin' }
    },
    { $set: { status: 'success', providerStatus: String(rawStatus), completedAt: new Date() } },
    { new: true }
  );
  if (!tx) return false;

  await User.updateOne({ telegramId: tx.userId }, { $inc: { totalWithdrawn: tx.amount } });

  const where = tx.method === 'upi' ? 'UPI' : 'FINZO Wallet';
  notifyUser(tx.userId, {
    en: '✅ Withdrawal sent\n\n₹' + tx.netAmount + ' has been sent to your ' + where + ' account.',
    bn: '✅ উইথড্র পাঠানো হয়েছে\n\nআপনার ' + where + ' অ্যাকাউন্টে ₹' + tx.netAmount + ' পাঠানো হয়েছে।'
  });
  return true;
}

// Gives the money back to the user (used when a payout fails or admin rejects)
async function refundWithdrawal(orderId, rawStatus, reason) {
  const tx = await Transaction.findOneAndUpdate(
    { orderId: orderId, type: 'withdraw', status: { $in: OPEN } },
    {
      $set: {
        status: 'refunded',
        providerStatus: String(rawStatus || ''),
        note: reason || '',
        completedAt: new Date()
      }
    },
    { new: true }
  );
  if (!tx) return false;

  await User.updateOne({ telegramId: tx.userId }, { $inc: { balance: tx.amount } });

  const month = tx.meta && tx.meta.month ? tx.meta.month : '';
  if (month) {
    await User.updateOne({ telegramId: tx.userId, withdrawMonth: month }, { $inc: { withdrawnThisMonth: -tx.amount } });
  }

  notifyUser(tx.userId, {
    en: '↩️ Withdrawal not completed\n\n₹' + tx.amount + ' has been returned to your balance.' + (reason ? '\nReason: ' + reason : ''),
    bn: '↩️ উইথড্র সম্পন্ন হয়নি\n\n₹' + tx.amount + ' আপনার ব্যালেন্সে ফিরিয়ে দেওয়া হয়েছে।' + (reason ? '\nকারণ: ' + reason : '')
  });
  return true;
}

async function applyProviderStatus(tx, rawStatus) {
  if (tx.type === 'deposit') return settleDeposit(tx.orderId, rawStatus);

  if (tx.type === 'withdraw') {
    const st = normalizeStatus(rawStatus);
    if (st === 'success') return settleWithdrawal(tx.orderId, rawStatus);
    if (st === 'failed') return refundWithdrawal(tx.orderId, rawStatus, 'Rejected by the payment provider');
    if (st === 'processing') {
      await Transaction.updateOne(
        { orderId: tx.orderId, status: 'pending' },
        { $set: { status: 'processing', providerStatus: String(rawStatus) } }
      );
    }
  }
  return false;
}

// Sends the payout to FINZO for a withdraw transaction
async function sendPayout(tx) {
  let result;

  if (tx.method === 'upi') {
    result = await finzo.createPayout(tx.orderId, {
      method: 'upi',
      amount: tx.netAmount,
      upi_id: tx.destination,
      name: tx.beneficiaryName
    });
  } else {
    result = await finzo.createWalletPay(tx.orderId, {
      number: tx.destination,
      amount: tx.netAmount,
      remark: 'TaskGenX withdraw'
    });
  }

  if (result.ok) {
    const st = finzo.pickStatus(result.body);
    await Transaction.updateOne(
      { _id: tx._id },
      { $set: { status: 'processing', providerStatus: st || 'submitted' } }
    );
    const norm = normalizeStatus(st);
    if (norm === 'success') await settleWithdrawal(tx.orderId, st);
    if (norm === 'failed') await refundWithdrawal(tx.orderId, st, 'Rejected by the payment provider');
    return { ok: true };
  }

  const code = result.body && result.body.code ? String(result.body.code) : '';
  console.error('FINZO payout error:', result.httpStatus, JSON.stringify(result.body));

  const definiteFail =
    result.configError || (!result.networkError && [400, 401, 403, 404, 405].includes(result.httpStatus));

  if (definiteFail) {
    if (result.configError || code === 'INSUFFICIENT_BALANCE' || result.httpStatus === 401 || result.httpStatus === 403) {
      notifyAdmins(
        '⚠️ A withdrawal payout failed (' + (code || 'auth/config error') + '), order ' + tx.orderId +
          '. Check the FINZO wallet balance, API key and IP whitelist.'
      );
    }
    await refundWithdrawal(tx.orderId, code, 'Payout failed' + (code ? ': ' + code : ''));
    return { ok: false, refunded: true, code: code };
  }

  // Unknown result (timeout / server error): do NOT refund now. The checker job will confirm.
  await Transaction.updateOne({ _id: tx._id }, { $set: { status: 'processing', providerStatus: 'unknown' } });
  return { ok: true, uncertain: true };
}

module.exports = {
  normalizeStatus,
  settleDeposit,
  settleWithdrawal,
  refundWithdrawal,
  applyProviderStatus,
  sendPayout
};
