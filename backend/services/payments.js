const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");
const finzo = require("./finzo");
const wallet = require("./wallet");
const bot = require("./telegramBot");
const { round2, dateKey, monthKey, fullName, escapeHtml } = require("../utils/helpers");
const { fail } = require("../utils/errors");

const ACTIVE_STATUSES = ["created", "awaiting_approval", "processing", "success"];

// Problems the admin must fix (not the user's fault). The withdrawal waits instead of being refunded.
const HOLD_CODES = new Set([
  "INSUFFICIENT_BALANCE",
  "GATEWAY_AUTH_INVALID",
  "GATEWAY_IP_NOT_ALLOWED",
  "NOT_CONFIGURED",
  "WITHDRAW_METHOD_DISABLED",
]);

function makeOrderId(prefix) {
  return `${prefix}${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function friendlyReason(e) {
  switch (e && e.code) {
    case "PAYOUT_DETAILS_REQUIRED":
      return "Invalid payment details";
    case "WITHDRAW_AMOUNT_RANGE":
    case "AMOUNT_OUT_OF_RANGE":
    case "AMOUNT_RANGE":
      return "Amount is outside the allowed range";
    case "NO_ADD_FUND_AGENT":
      return "No payment channel is available right now";
    default:
      return "Payment was rejected";
  }
}

// Tells admins about a problem, at most once every 10 minutes per kind.
const lastAlert = {};
function alertAdmins(key, text) {
  const now = Date.now();
  if (lastAlert[key] && now - lastAlert[key] < 10 * 60 * 1000) return;
  lastAlert[key] = now;
  bot.notifyAdmins(text);
}

// Money withdrawn today with one method (UPI and Wallet have separate daily limits)
async function dayTotal(tgId, method, key) {
  const r = await Payment.aggregate([
    { $match: { tgId, type: "withdraw", method, status: { $in: ACTIVE_STATUSES }, dayKey: key } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return r[0] ? r[0].total : 0;
}

// How many withdrawals the user made this month (any method)
function monthCount(tgId, key) {
  return Payment.countDocuments({ tgId, type: "withdraw", status: { $in: ACTIVE_STATUSES }, monthKey: key });
}

/* ------------------------------ DEPOSIT ------------------------------ */

async function createDeposit(user, amount, settings) {
  const s = settings.deposit;
  if (!s.enabled) throw fail(400, "Deposits are currently disabled");

  amount = round2(amount);
  const lim = finzo.depositLimits();
  const lo = Math.max(Math.ceil(s.min), lim.min);
  const hi = Math.min(Math.floor(s.max), lim.max);
  // FINZO UPI payments accept whole rupees only
  if (!Number.isInteger(amount) || amount <= 0) throw fail(400, "Enter a valid amount");
  if (amount < lo || amount > hi) throw fail(400, `Deposit must be between ₹${lo} and ₹${hi}`);

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
    finzoOrderId: orderId,
    dayKey: dateKey(new Date(), tz),
    monthKey: monthKey(new Date(), tz),
  });

  try {
    const r = await finzo.createUpiOrder({ orderId, amount });
    payment.status = "pending";
    payment.gatewayRef = r.gatewayRef;
    payment.paymentUrl = r.paymentUrl;
    await payment.save();
  } catch (e) {
    console.error("Deposit create failed:", e.code || "", e.message);
    payment.status = "failed";
    payment.settled = true;
    payment.failureReason = friendlyReason(e);
    payment.gatewayPayload = { code: e.code || "", message: e.message };
    await payment.save();
    if (HOLD_CODES.has(e.code)) {
      alertAdmins(
        "finzo-config",
        `FINZO problem while starting a deposit: <code>${escapeHtml(e.code)}</code>. Please check the FINZO settings and API key.`
      );
    }
    throw fail(502, "Could not start the payment. Please try again.");
  }
  return payment;
}

// Safe to call from the callback AND polling at the same time.
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
  if (payment.lastCheckedAt && Date.now() - new Date(payment.lastCheckedAt).getTime() < 8000) {
    return { ok: true, status: "pending", throttled: true };
  }
  await Payment.updateOne({ _id: payment._id }, { $set: { lastCheckedAt: new Date() } });
  const r = await finzo.checkDeposit(payment.finzoOrderId || payment.orderId);
  return settleDeposit(payment.orderId, r.status, {
    ref: r.ref,
    raw: r.raw,
    reason: "Payment failed or expired",
  });
}

/* ------------------------------ WITHDRAW ------------------------------ */

async function finalizeWithdraw(p) {
  const claimed = await Payment.findOneAndUpdate(
    { _id: p._id, settled: false, status: "processing" },
    { $set: { settled: true, status: "success" } },
    { new: true }
  );
  if (!claimed) return null;
  const user = await User.findByIdAndUpdate(claimed.user, { $inc: { totalWithdrawn: claimed.netAmount } }, { new: true });
  bot.notifyUser(
    user,
    `Withdrawal successful! ₹${claimed.netAmount} was sent to your account.`,
    `উইথড্র সফল! ₹${claimed.netAmount} আপনার অ্যাকাউন্টে পাঠানো হয়েছে।`,
    [bot.openAppButton("Open TaskGenX")],
    true
  );
  return claimed;
}

async function refundWithdraw(p, reason, newStatus = "failed", allowedFrom = ["created", "awaiting_approval", "processing"]) {
  const claimed = await Payment.findOneAndUpdate(
    { _id: p._id, type: "withdraw", settled: false, refunded: false, status: { $in: allowedFrom } },
    { $set: { settled: true, refunded: true, status: newStatus, failureReason: reason || "" } },
    { new: true }
  );
  if (!claimed) return null;

  let user;
  try {
    user = await wallet.credit(claimed.user, claimed.amount, "withdraw_refund", `Refund: ${reason || newStatus}`, claimed.orderId);
  } catch (e) {
    await Payment.updateOne({ _id: claimed._id }, { $set: { settled: false, refunded: false, status: p.status } });
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

function beneficiaryName(user) {
  const clean = String(fullName(user))
    .replace(/[^\p{L}\p{N} .'-]/gu, "")
    .trim()
    .slice(0, 50);
  return clean || "Customer";
}

async function handlePayoutError(p, e) {
  console.error("Payout error:", p.orderId, e.code || "", e.message);

  if (HOLD_CODES.has(e.code)) {
    const held = await Payment.findOneAndUpdate(
      { _id: p._id, settled: false, status: "processing" },
      { $set: { status: "awaiting_approval", failureReason: "", gatewayPayload: { code: e.code, message: e.message } } },
      { new: true }
    );
    if (held) {
      alertAdmins(
        "finzo-hold-" + e.code,
        `A withdrawal could not be sent: <code>${escapeHtml(e.code)}</code>. ` +
          (e.code === "INSUFFICIENT_BALANCE"
            ? "Your FINZO wallet balance is too low. Add money, then approve the request again."
            : "Please check the FINZO settings and API key, then approve the request again.")
      );
      const user = await User.findById(p.user);
      bot.notifyUser(
        user,
        `Your withdrawal of ₹${p.amount} is waiting for approval.`,
        `আপনার ₹${p.amount} উইথড্র অনুমোদনের অপেক্ষায় আছে।`
      );
    }
    return;
  }

  if (e.definite) {
    await refundWithdraw(p, friendlyReason(e));
    return;
  }
  // Uncertain result: stays "processing". The background check resolves it.
}

async function processPayout(paymentId) {
  const p = await Payment.findOneAndUpdate(
    { _id: paymentId, type: "withdraw", settled: false, status: { $in: ["created", "awaiting_approval"] } },
    { $set: { status: "processing", processingAt: new Date() }, $inc: { attempts: 1 } },
    { new: true }
  );
  if (!p) return null;

  // Every attempt gets its own Unique-Order-ID, so an approved retry is never a "duplicate".
  const fid = p.attempts <= 1 ? p.orderId : `${p.orderId}-${p.attempts}`;
  await Payment.updateOne({ _id: p._id }, { $set: { finzoOrderId: fid } });
  p.finzoOrderId = fid;

  try {
    const user = await User.findById(p.user);
    const r =
      p.method === "upi"
        ? await finzo.payoutUpi({ orderId: fid, amount: p.netAmount, upi: p.destination, name: beneficiaryName(user) })
        : await finzo.walletPay({ orderId: fid, amount: p.netAmount, wallet: p.destination, remark: `Withdrawal ${p.orderId}` });

    await Payment.updateOne({ _id: p._id }, { $set: { gatewayRef: r.ref || "", gatewayPayload: r.raw || null } });
    if (r.status === "success") await finalizeWithdraw(p);
    else if (r.status === "failed") await refundWithdraw(p, "Payout failed");
  } catch (e) {
    await handlePayoutError(p, e);
  }
  return Payment.findById(p._id);
}

async function createWithdraw(user, amount, method, settings) {
  const w = settings.withdraw;
  if (!w.enabled) throw fail(400, "Withdrawals are currently disabled");
  if (method !== "upi" && method !== "finzo_wallet") throw fail(400, "Invalid withdraw method");

  // UPI and FINZO Wallet have their own limits in Settings
  const mc = method === "upi" ? w.upi : w.wallet;
  if (!mc || !mc.enabled) {
    throw fail(400, method === "upi" ? "UPI withdrawal is disabled" : "Wallet withdrawal is disabled");
  }

  const destination = method === "upi" ? user.withdrawDetails.upi : user.withdrawDetails.finzoWallet;
  if (!destination) throw fail(400, "Please save your withdraw details in Profile first");
  // FINZO wallets are identified by a 10-digit mobile number
  if (method === "finzo_wallet" && !/^\d{10}$/.test(destination)) {
    throw fail(400, "Invalid FINZO Wallet ID");
  }

  amount = round2(amount);
  const lvl = (settings.levels || [])[(user.level || 1) - 1] ||
    (settings.levels || [])[0] || { withdrawFeePercent: 0, monthlyWithdrawals: 2 };
  const monthlyMax = lvl.monthlyWithdrawals === undefined || lvl.monthlyWithdrawals === null ? 2 : lvl.monthlyWithdrawals;

  // The allowed range is the tighter of our Settings and FINZO's own limit for this method
  const feeRate = Math.min(0.99, Math.max(0, lvl.withdrawFeePercent) / 100);
  const lim = finzo.payoutLimits(method);
  const lo = Math.max(Math.ceil(mc.min), Math.ceil(lim.min / (1 - feeRate)));
  const hi = Math.min(Math.floor(mc.max), Math.floor(lim.max / (1 - feeRate)));
  if (!(amount > 0) || amount < lo || amount > hi) {
    throw fail(400, `Withdraw must be between ₹${lo} and ₹${hi}`);
  }
  if (user.balance < amount) throw fail(400, "Insufficient balance");

  if (method === "finzo_wallet") {
    const exists = await finzo.walletExists(destination);
    if (exists === false) throw fail(400, "Invalid FINZO Wallet ID");
  }

  const tz = settings.app.timezone;
  const dk = dateKey(new Date(), tz);
  const mk = monthKey(new Date(), tz);
  const [day, used] = await Promise.all([dayTotal(user.tgId, method, dk), monthCount(user.tgId, mk)]);

  if (used >= monthlyMax) {
    throw fail(400, `Monthly withdrawal limit reached: ${monthlyMax} per month at your level`);
  }
  if (day + amount > mc.dailyLimit) {
    throw fail(400, `Daily withdraw limit is ₹${mc.dailyLimit}. Remaining today: ₹${Math.max(0, round2(mc.dailyLimit - day))}`);
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
  const res = await processPayout(upd._id);
  if (res && res.status === "awaiting_approval") {
    throw fail(
      409,
      "The payout could not start (FINZO balance low or gateway problem). The request is still waiting. Fix it and approve again."
    );
  }
  return res;
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
  await Payment.updateOne({ _id: p._id }, { $set: { lastCheckedAt: new Date() } });
  let r;
  try {
    r = await finzo.checkPayout(p.finzoOrderId || p.orderId, p.method);
  } catch (e) {
    if (e.orderNotFound) {
      // FINZO has no such order. After 10 minutes we are sure it was never created, so refund.
      const started = new Date(p.processingAt || p.createdAt).getTime();
      if (Date.now() - started > 10 * 60 * 1000) {
        await refundWithdraw(p, "Payout was not created", "failed", ["processing"]);
      }
      return;
    }
    throw e;
  }
  if (r.status === "success") await finalizeWithdraw(p);
  else if (r.status === "failed") await refundWithdraw(p, "Payout failed", "failed", ["processing"]);
}

/* ------------------------------- POLLING ------------------------------- */

// Fallback for missed callbacks. Kept gentle: FINZO allows 120 requests per minute.
async function pollPending() {
  const now = Date.now();
  const sixHours = new Date(now - 6 * 60 * 60 * 1000);
  const stale = new Date(now - 25 * 1000);

  await Payment.updateMany(
    { type: "deposit", status: "pending", settled: false, createdAt: { $lt: sixHours } },
    { $set: { status: "cancelled" } }
  );

  const deposits = await Payment.find({
    type: "deposit",
    status: "pending",
    settled: false,
    createdAt: { $gte: sixHours },
    $or: [{ lastCheckedAt: null }, { lastCheckedAt: { $lt: stale } }],
  })
    .sort({ createdAt: 1 })
    .limit(20);
  for (const d of deposits) {
    try {
      await checkDeposit(d);
    } catch (e) {
      console.error("Deposit poll error:", d.orderId, e.code || "", e.message);
      if (e.status === 429) break;
    }
  }

  const withdrawals = await Payment.find({
    type: "withdraw",
    status: "processing",
    settled: false,
    $or: [{ lastCheckedAt: null }, { lastCheckedAt: { $lt: stale } }],
  })
    .sort({ createdAt: 1 })
    .limit(15);
  for (const w of withdrawals) {
    try {
      await checkWithdraw(w);
    } catch (e) {
      console.error("Withdraw poll error:", w.orderId, e.code || "", e.message);
      if (e.status === 429) break;
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
