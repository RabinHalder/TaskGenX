const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");
const finzo = require("./finzo");
const wallet = require("./wallet");
const bot = require("./telegramBot");
const { round2, dateKey, monthKey, fullName, escapeHtml } = require("../utils/helpers");
const { fail } = require("../utils/errors");

const ACTIVE_STATUSES = ["created", "awaiting_approval", "processing", "success"];

function makeOrderId(prefix) {
  return `${prefix}${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function sumWithdraw(tgId, field, key) {
  const r = await Payment.aggregate([
    { $match: { tgId, type: "withdraw", status: { $in: ACTIVE_STATUSES }, [field]: key } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return r[0] ? r[0].total : 0;
}

/* ------------------------------ DEPOSIT ------------------------------ */

async function createDeposit(user, amount, settings) {
  const s = settings.deposit;
  if (!s.enabled) throw fail(400, "Deposits are currently disabled");
  amount = round2(amount);
  if (!(amount > 0) || amount < s.min || amount > s.max) {
    throw fail(400, `Deposit must be between ₹${s.min} and ₹${s.max}`);
  }

  const recent = await Payment.countDocuments({
    tgId: user.tgId,
    type: "deposit",
    status: "pending",
    createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) },
  });
  if (recent >= 5) throw fail(429, "Too many open deposits. Please wait a few minutes.");

  const fee = round2((amount * s.feePercent) / 100);
  const net = round2(amount - fee);
  if (net <= 0) throw fail(400, "Amount is too small");

  const tz = settings.app.timezone;
  const orderId = makeOrderId("DEP");
  const payment = await Payment.create({
    user: user._id,
    tgId: user.tgId,
    type: "deposit",
    method: "upi",
    amount,
    fee,
    netAmount: net,
    status: "created",
    orderId,
    dayKey: dateKey(new Date(), tz),
    monthKey: monthKey(new Date(), tz),
  });

  try {
    const base = process.env.APP_URL || "";
    const r = await finzo.createUpiOrder({
      orderId,
      amount,
      customerId: String(user.tgId),
      callbackUrl: `${base}/api/payments/finzo/callback`,
      redirectUrl: base,
    });
    payment.status = "pending";
    payment.gatewayRef = r.gatewayRef;
    payment.paymentUrl = r.paymentUrl;
    await payment.save();
  } catch (e) {
    console.error("Deposit create failed:", e.message);
    payment.status = "failed";
    payment.settled = true;
    payment.failureReason = e.message;
    await payment.save();
    throw fail(502, "Could not start the payment. Please try again.");
  }
  return payment;
}

// Idempotent: safe to call from callback AND polling at the same time.
async function settleDeposit(orderId, status, info = {}) {
  const payment = await Payment.findOne({ orderId, type: "deposit" });
  if (!payment) return { ok: false, reason: "not_found" };
  if (payment.settled) return { ok: true, duplicate: true };

  if (status === "failed") {
    await Payment.updateOne(
      { _id: payment._id, settled: false },
      {
        $set: {
          status: "failed",
          settled: true,
          failureReason: info.reason || "Payment failed",
          gatewayPayload: info.raw || null,
        },
      }
    );
    return { ok: true, status: "failed" };
  }
  if (status !== "success") return { ok: true, status: "pending" };

  if (
    info.amount !== undefined &&
    info.amount !== null &&
    !Number.isNaN(Number(info.amount)) &&
    Math.abs(Number(info.amount) - payment.amount) > 0.01
  ) {
    await Payment.updateOne(
      { _id: payment._id, settled: false },
      {
        $set: {
          status: "failed",
          settled: true,
          failureReason: "Amount mismatch",
          gatewayPayload: info.raw || null,
        },
      }
    );
    bot.notifyAdmins(
      `Deposit amount mismatch for order <code>${escapeHtml(orderId)}</code>. Please check manually.`
    );
    return { ok: false, reason: "amount_mismatch" };
  }

  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, settled: false },
    {
      $set: {
        settled: true,
        status: "success",
        gatewayRef: info.ref || payment.gatewayRef,
        gatewayPayload: info.raw || null,
      },
    },
    { new: true }
  );
  if (!claimed) return { ok: true, duplicate: true };

  let user;
  try {
    user = await wallet.credit(claimed.user, claimed.netAmount, "deposit", "UPI deposit", claimed.orderId, {
      totalDeposited: claimed.amount,
    });
  } catch (e) {
    await Payment.updateOne({ _id: claimed._id }, { $set: { settled: false, status: "pending" } });
    throw e;
  }

  bot.notifyUser(
    user,
    `Deposit successful! ₹${claimed.netAmount} added to your balance.`,
    `ডিপোজিট সফল! ₹${claimed.netAmount} আপনার ব্যালেন্সে যোগ হয়েছে।`,
    [bot.openAppButton("Open TaskGenX")],
    true
  );
  return { ok: true, status: "success" };
}

async function checkDeposit(payment) {
  const r = await finzo.checkDeposit(payment.orderId);
  await Payment.updateOne({ _id: payment._id }, { $set: { lastCheckedAt: new Date() } });
  return settleDeposit(payment.orderId, r.status, { ref: r.ref, amount: r.amount, raw: r.raw });
}

/* ------------------------------ WITHDRAW ------------------------------ */

async function finalizeWithdraw(p) {
  const claimed = await Payment.findOneAndUpdate(
    { _id: p._id, settled: false, status: "processing" },
    { $set: { settled: true, status: "success" } },
    { new: true }
  );
  if (!claimed) return null;
  const user = await User.findByIdAndUpdate(
    claimed.user,
    { $inc: { totalWithdrawn: claimed.netAmount } },
    { new: true }
  );
  bot.notifyUser(
    user,
    `Withdrawal successful! ₹${claimed.netAmount} was sent to your account.`,
    `উইথড্র সফল! ₹${claimed.netAmount} আপনার অ্যাকাউন্টে পাঠানো হয়েছে।`,
    [bot.openAppButton("Open TaskGenX")],
    true
  );
  return claimed;
}

async function refundWithdraw(
  p,
  reason,
  newStatus = "failed",
  allowedFrom = ["created", "awaiting_approval", "processing"]
) {
  const claimed = await Payment.findOneAndUpdate(
    { _id: p._id, type: "withdraw", settled: false, refunded: false, status: { $in: allowedFrom } },
    { $set: { settled: true, refunded: true, status: newStatus, failureReason: reason || "" } },
    { new: true }
  );
  if (!claimed) return null;

  let user;
  try {
    user = await wallet.credit(
      claimed.user,
      claimed.amount,
      "withdraw_refund",
      `Refund: ${reason || newStatus}`,
      claimed.orderId
    );
  } catch (e) {
    await Payment.updateOne(
      { _id: claimed._id },
      { $set: { settled: false, refunded: false, status: p.status } }
    );
    throw e;
  }

  const why = escapeHtml(reason || "");
  bot.notifyUser(
    user,
    `Your withdrawal of ₹${claimed.amount} was not completed. The amount was refunded to your balance.${why ? "\nReason: " + why : ""}`,
    `আপনার ₹${claimed.amount} উইথড্র সম্পন্ন হয়নি। টাকা ব্যালেন্সে ফেরত দেওয়া হয়েছে।${why ? "\nকারণ: " + why : ""}`,
    [bot.openAppButton("Open TaskGenX")],
    true
  );
  return claimed;
}

async function processPayout(paymentId) {
  const p = await Payment.findOneAndUpdate(
    { _id: paymentId, type: "withdraw", settled: false, status: { $in: ["created", "awaiting_approval"] } },
    { $set: { status: "processing" } },
    { new: true }
  );
  if (!p) return null;

  try {
    const user = await User.findById(p.user);
    const r =
      p.method === "upi"
        ? await finzo.payoutUpi({
            orderId: p.orderId,
            amount: p.netAmount,
            upi: p.destination,
            name: fullName(user),
          })
        : await finzo.walletPay({ orderId: p.orderId, amount: p.netAmount, wallet: p.destination });

    await Payment.updateOne(
      { _id: p._id },
      { $set: { gatewayRef: r.ref || "", gatewayPayload: r.raw || null } }
    );
    if (r.status === "success") await finalizeWithdraw(p);
    else if (r.status === "failed") await refundWithdraw(p, "Payout failed");
    // otherwise it stays "processing" until callback / polling resolves it
  } catch (e) {
    if (e.definite) {
      await refundWithdraw(p, e.message || "Payout rejected");
    } else {
      console.error("Payout result unknown, left as processing:", p.orderId, e.message);
    }
  }
  return Payment.findById(p._id);
}

async function createWithdraw(user, amount, method, settings) {
  const w = settings.withdraw;
  if (!w.enabled) throw fail(400, "Withdrawals are currently disabled");
  if (method !== "upi" && method !== "finzo_wallet") throw fail(400, "Invalid withdraw method");
  if (method === "upi" && !w.upiEnabled) throw fail(400, "UPI withdrawal is disabled");
  if (method === "finzo_wallet" && !w.walletEnabled) throw fail(400, "Wallet withdrawal is disabled");

  const destination =
    method === "upi" ? user.withdrawDetails.upi : user.withdrawDetails.finzoWallet;
  if (!destination) throw fail(400, "Please save your withdraw details in Profile first");

  amount = round2(amount);
  if (!(amount > 0) || amount < w.min || amount > w.max) {
    throw fail(400, `Withdraw must be between ₹${w.min} and ₹${w.max}`);
  }
  if (user.balance < amount) throw fail(400, "Insufficient balance");

  const lvl = (settings.levels || [])[(user.level || 1) - 1] ||
    (settings.levels || [])[0] || { withdrawFeePercent: 0, monthlyWithdrawLimit: 0 };

  const tz = settings.app.timezone;
  const dk = dateKey(new Date(), tz);
  const mk = monthKey(new Date(), tz);
  const [day, month] = await Promise.all([
    sumWithdraw(user.tgId, "dayKey", dk),
    sumWithdraw(user.tgId, "monthKey", mk),
  ]);
  if (day + amount > w.dailyLimit) {
    throw fail(
      400,
      `Daily withdraw limit is ₹${w.dailyLimit}. Remaining today: ₹${Math.max(0, round2(w.dailyLimit - day))}`
    );
  }
  if (month + amount > lvl.monthlyWithdrawLimit) {
    throw fail(
      400,
      `Your monthly limit is ₹${lvl.monthlyWithdrawLimit}. Remaining this month: ₹${Math.max(0, round2(lvl.monthlyWithdrawLimit - month))}`
    );
  }

  const fee = round2((amount * lvl.withdrawFeePercent) / 100);
  const net = round2(amount - fee);
  if (net <= 0) throw fail(400, "Amount is too small after fees");

  const orderId = makeOrderId("WD");
  const payment = await Payment.create({
    user: user._id,
    tgId: user.tgId,
    type: "withdraw",
    method,
    amount,
    fee,
    netAmount: net,
    status: "created",
    orderId,
    destination,
    dayKey: dk,
    monthKey: mk,
  });

  const debited = await wallet.debit(user._id, amount, "withdraw", `Withdraw via ${method}`, orderId);
  if (!debited) {
    await Payment.deleteOne({ _id: payment._id });
    throw fail(400, "Insufficient balance");
  }

  const needsApproval = !w.autoPayout || (w.approvalEnabled && amount >= w.approvalAbove);
  if (needsApproval) {
    payment.status = "awaiting_approval";
    await payment.save();
    bot.notifyAdmins(
      `New withdrawal request: ₹${amount} from ${escapeHtml(fullName(user))} (<code>${user.tgId}</code>). Please review it in the admin panel.`
    );
    bot.notifyUser(
      debited,
      `Your withdrawal request of ₹${amount} was received and is waiting for approval.`,
      `আপনার ₹${amount} উইথড্র অনুরোধ পাওয়া গেছে, অনুমোদনের অপেক্ষায় আছে।`
    );
    return payment;
  }
  return (await processPayout(payment._id)) || payment;
}

async function approveWithdraw(paymentId, adminTgId) {
  const upd = await Payment.findOneAndUpdate(
    { _id: paymentId, type: "withdraw", status: "awaiting_approval" },
    { $set: { approvedBy: adminTgId, approvedAt: new Date() } },
    { new: true }
  );
  if (!upd) return null;
  return processPayout(upd._id);
}

async function rejectWithdraw(paymentId, reason) {
  const p = await Payment.findOne({ _id: paymentId, type: "withdraw" });
  if (!p) return null;
  return refundWithdraw(p, reason, "rejected", ["awaiting_approval"]);
}

async function cancelWithdraw(p) {
  return refundWithdraw(p, "Cancelled by user", "cancelled", ["awaiting_approval"]);
}

async function checkWithdraw(p) {
  const r = await finzo.checkPayout(p.orderId);
  await Payment.updateOne({ _id: p._id }, { $set: { lastCheckedAt: new Date() } });
  if (r.status === "success") await finalizeWithdraw(p);
  else if (r.status === "failed") await refundWithdraw(p, "Payout failed", "failed", ["processing"]);
}

/* ------------------------------- POLLING ------------------------------- */

async function pollPending() {
  const now = Date.now();
  const sixHours = new Date(now - 6 * 60 * 60 * 1000);

  await Payment.updateMany(
    { type: "deposit", status: "pending", settled: false, createdAt: { $lt: sixHours } },
    { $set: { status: "cancelled" } }
  );

  const deposits = await Payment.find({
    type: "deposit",
    status: "pending",
    settled: false,
    createdAt: { $gte: sixHours },
  }).limit(30);
  for (const d of deposits) {
    try {
      await checkDeposit(d);
    } catch (e) {
      console.error("Deposit poll error:", d.orderId, e.message);
    }
  }

  const withdrawals = await Payment.find({
    type: "withdraw",
    status: "processing",
    settled: false,
  }).limit(30);
  for (const w of withdrawals) {
    try {
      await checkWithdraw(w);
    } catch (e) {
      console.error("Withdraw poll error:", w.orderId, e.message);
    }
  }
}

module.exports = {
  createDeposit,
  settleDeposit,
  checkDeposit,
  createWithdraw,
  processPayout,
  approveWithdraw,
  rejectWithdraw,
  cancelWithdraw,
  finalizeWithdraw,
  refundWithdraw,
  pollPending,
};
