const Transaction = require('../models/Transaction');
const finzo = require('./finzo');
const { applyProviderStatus, settleDeposit, refundWithdrawal } = require('./paymentService');

let running = false;

async function reconcilePayments() {
  if (running) return;
  running = true;

  try {
    const now = Date.now();
    const cutoff = new Date(now - 3 * 60 * 60 * 1000);

    await Transaction.updateMany(
      { type: 'deposit', status: { $in: ['pending', 'processing'] }, createdAt: { $lt: cutoff } },
      { $set: { status: 'failed', providerStatus: 'expired', completedAt: new Date() } }
    );

    const open = await Transaction.find({
      type: { $in: ['deposit', 'withdraw'] },
      status: { $in: ['pending', 'processing'] },
      providerStatus: { $nin: ['awaiting_admin', 'creating'] },
      createdAt: { $gte: cutoff }
    }).limit(50);

    for (const tx of open) {
      let result;
      if (tx.type === 'deposit') result = await finzo.upiPaymentStatus(tx.orderId);
      else if (tx.method === 'upi') result = await finzo.payoutStatus(tx.orderId);
      else result = await finzo.walletPayStatus(tx.orderId);

      if (result.ok) {
        await applyProviderStatus(tx, finzo.pickStatus(result.body));
      } else if (result.httpStatus === 404 && now - tx.createdAt.getTime() > 10 * 60 * 1000) {
        if (tx.type === 'deposit') await settleDeposit(tx.orderId, 'expired');
        else await refundWithdrawal(tx.orderId, 'not_found', 'Order was not found at the payment provider');
      }
    }
  } catch (err) {
    console.error('Reconcile error:', err.message);
  } finally {
    running = false;
  }
}

function startJobs() {
  setTimeout(reconcilePayments, 20000);
  setInterval(reconcilePayments, 60000);
}

module.exports = { startJobs, reconcilePayments };
